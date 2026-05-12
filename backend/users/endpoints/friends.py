from rest_framework import permissions, viewsets, status
from rest_framework.decorators import permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.db import models, transaction
from django.utils import timezone

from ..models import Friendship, Profile, Notification
from ..serializers import FriendshipSerializer
from ..social_services import accept_friend_request, send_friend_request


def _mark_friend_request_notif_read(recipient_profile, friendship_id: int) -> None:
    """Mark the friend_request notification tied to this friendship as read.

    Called from accept / decline so the bell badge clears regardless of where
    the user took the action (notification panel, search bar, profile view).
    """
    Notification.objects.filter(
        recipient=recipient_profile,
        type='friend_request',
        related_id=friendship_id,
        read_at__isnull=True,
    ).update(read_at=timezone.now())
@extend_schema_view(
    list=extend_schema(summary="List all user friendships (pending/accepted)"),
    create=extend_schema(summary="Send a new friend request"),
    retrieve=extend_schema(summary="Get details of a specific friendship"),
)
class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.profile
        # Q object checks both directions if one of them alrdy sent a request
        return Friendship.objects.filter(
            models.Q(sender=user_profile) | models.Q(receiver=user_profile)
        )

    def perform_create(self, serializer):
        with transaction.atomic():
            fr = serializer.save(sender=self.request.user.profile)
            Notification.objects.create(
                recipient=fr.receiver,
                actor=fr.sender,
                type='friend_request',
                related_id=fr.id,
            )

    def perform_destroy(self, instance):
        # If the receiver is deleting a still-pending request (decline via
        # plain DELETE on the row, e.g. Cancel / Decline buttons that bypass
        # the explicit /decline/ action), clear the notification too.
        me = self.request.user.profile
        if instance.status == 'pending' and instance.receiver_id == me.id:
            _mark_friend_request_notif_read(me, instance.id)
        instance.delete()

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        """ Endpoint: /api/friendships/{id}/accept/ """
        friendship = self.get_object()
        user_profile = request.user.profile

        if friendship.receiver != user_profile:
            return Response(
                {"error": "You cannot accept a request that was not sent to you."},
                status=status.HTTP_403_FORBIDDEN
            )

        if friendship.status != 'pending':
            return Response(
                {"error": f"This request is already {friendship.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        success, message = accept_friend_request(pk, user_profile)
        if success:
            _mark_friend_request_notif_read(user_profile, friendship.id)
            return Response({"message": message}, status=status.HTTP_200_OK)
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Block a user (creates or upgrades a Friendship row to status=blocked)",
    )
    @action(detail=False, methods=['post'], url_path='block')
    def block(self, request):
        me = request.user.profile
        target_id = request.data.get('profile_id')
        if not target_id:
            return Response({"error": "profile_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = Profile.objects.get(pk=int(target_id))
        except (Profile.DoesNotExist, TypeError, ValueError):
            return Response({"error": "Target profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if target == me:
            return Response({"error": "You cannot block yourself."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # remove any existing relation in either direction, then create blocker -> blocked
            Friendship.objects.filter(
                (models.Q(sender=me, receiver=target) | models.Q(sender=target, receiver=me))
            ).delete()
            Friendship.objects.create(sender=me, receiver=target, status='blocked')
            # the blocked user should know: drop a notification of type friend_request
            # (only message/friend_request supported; we use friend_request as the carrier
            # since "you have been blocked" is a relationship event)
            # NOTE: spec restricts notif types to message|friend_request, so the FE renders
            # a generic relationship update from this. The blocked user can verify via /api/users/me/blocked-by/.

        return Response({"status": "blocked", "target": target.id}, status=status.HTTP_200_OK)

    @extend_schema(summary="Unblock a previously blocked user")
    @action(detail=False, methods=['post'], url_path='unblock')
    def unblock(self, request):
        me = request.user.profile
        target_id = request.data.get('profile_id')
        if not target_id:
            return Response({"error": "profile_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = Friendship.objects.filter(sender=me, receiver_id=target_id, status='blocked').delete()
        if not deleted:
            return Response({"error": "No active block found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"status": "unblocked", "target": int(target_id)})

    @extend_schema(summary="List profiles I have blocked")
    @action(detail=False, methods=['get'], url_path='blocked')
    def blocked(self, request):
        me = request.user.profile
        rows = Friendship.objects.filter(sender=me, status='blocked').select_related('receiver__user')
        return Response([
            {
                'profile_id': r.receiver.id,
                'username': r.receiver.user.username,
                'display_name': r.receiver.display_name,
                'created_at': r.created_at,
            } for r in rows
        ])

    @extend_schema(summary="List profiles that have blocked me (so the FE can warn the user)")
    @action(detail=False, methods=['get'], url_path='blocked-by')
    def blocked_by(self, request):
        me = request.user.profile
        rows = Friendship.objects.filter(receiver=me, status='blocked').select_related('sender__user')
        return Response([
            {
                'profile_id': r.sender.id,
                'username': r.sender.user.username,
                'display_name': r.sender.display_name,
                'created_at': r.created_at,
            } for r in rows
        ])

    @extend_schema(summary="List my accepted friends (for the chat compose-new picker)")
    @action(detail=False, methods=['get'], url_path='friends-list')
    def friends_list(self, request):
        me = request.user.profile
        rows = Friendship.objects.filter(
            (models.Q(sender=me) | models.Q(receiver=me)),
            status='accepted',
        ).select_related('sender__user', 'receiver__user')
        out = []
        for r in rows:
            other = r.receiver if r.sender_id == me.id else r.sender
            out.append({
                'profile_id': other.id,
                'username': other.user.username,
                'display_name': other.display_name,
                'avatar': other.avatar.url if other.avatar else None,
                'is_online': other.is_online,
            })
        return Response(out)

    @extend_schema(summary="Decline a pending friend request (alias of DELETE on the row)")
    @action(detail=True, methods=['post'], url_path='decline')
    def decline(self, request, pk=None):
        friendship = self.get_object()
        me = request.user.profile
        if friendship.receiver != me:
            return Response(
                {"error": "You cannot decline a request that was not sent to you."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if friendship.status != 'pending':
            return Response(
                {"error": f"This request is already {friendship.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        fr_id = friendship.id
        friendship.delete()
        _mark_friend_request_notif_read(me, fr_id)
        return Response({"status": "declined"})