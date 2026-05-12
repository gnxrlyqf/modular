from django.db import models, transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from ..models import Message, Notification, Profile, Friendship, is_blocked_between
from ..serializers import MessageSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List messages with another user (chat thread)",
        parameters=[OpenApiParameter(name='with', description='Other profile id', required=True, type=int)],
    ),
    create=extend_schema(summary="Send a message to another user"),
)
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        me = self.request.user.profile
        other_id = self.request.query_params.get('with')
        qs = Message.objects.filter(
            models.Q(sender=me) | models.Q(receiver=me)
        )
        if other_id:
            try:
                other_id = int(other_id)
                qs = qs.filter(
                    (models.Q(sender=me, receiver_id=other_id) | models.Q(sender_id=other_id, receiver=me))
                )
            except (TypeError, ValueError):
                return Message.objects.none()
        return qs.order_by('created_at')

    def list(self, request, *args, **kwargs):
        other_id = request.query_params.get('with')
        if not other_id:
            return Response({"error": "Query param 'with' (profile id) is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            other = Profile.objects.get(pk=int(other_id))
        except (Profile.DoesNotExist, TypeError, ValueError):
            return Response({"error": "Other profile not found."}, status=status.HTTP_404_NOT_FOUND)

        me = request.user.profile
        if is_blocked_between(me, other):
            blocked_by_other = Friendship.objects.filter(sender=other, receiver=me, status='blocked').exists()
            return Response({
                "error": "Conversation unavailable due to a block.",
                "blocked_by_other": blocked_by_other,
                "blocked_by_me": Friendship.objects.filter(sender=me, receiver=other, status='blocked').exists(),
            }, status=status.HTTP_403_FORBIDDEN)

        # mark unread incoming as read
        Message.objects.filter(sender=other, receiver=me, read_at__isnull=True).update(read_at=timezone.now())
        Notification.objects.filter(recipient=me, actor=other, type='message', read_at__isnull=True).update(read_at=timezone.now())

        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        me = self.request.user.profile
        receiver = serializer.validated_data.get('receiver')
        if receiver == me:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You cannot message yourself.")
        if is_blocked_between(me, receiver):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Cannot send: a block exists between you.")
        if not Friendship.objects.filter(
            (models.Q(sender=me, receiver=receiver) | models.Q(sender=receiver, receiver=me)),
            status='accepted',
        ).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only message accepted friends.")

        with transaction.atomic():
            msg = serializer.save(sender=me)
            # Dedup: if the receiver's most recent notification is already a
            # message-type from the same actor, keep that row but flip it back
            # to unread (and re-point related_id at the latest message). This
            # prevents the notification feed from filling with one row per
            # message during a chat burst.
            last = (
                Notification.objects
                .filter(recipient=receiver)
                .order_by('-created_at')
                .first()
            )
            if last is not None and last.type == 'message' and last.actor_id == me.id:
                # Refresh created_at too so the notification rises to the top of
                # the panel after a new message.  .update() bypasses auto_now_add.
                Notification.objects.filter(pk=last.pk).update(
                    read_at=None,
                    related_id=msg.id,
                    created_at=timezone.now(),
                )
            else:
                Notification.objects.create(
                    recipient=receiver,
                    actor=me,
                    type='message',
                    related_id=msg.id,
                )

    @extend_schema(summary="List recent chat threads (one entry per friend)")
    @action(detail=False, methods=['get'], url_path='threads')
    def threads(self, request):
        me = request.user.profile
        msgs = Message.objects.filter(models.Q(sender=me) | models.Q(receiver=me)).order_by('-created_at')

        seen = set()
        threads = []
        for m in msgs:
            other = m.receiver if m.sender_id == me.id else m.sender
            if other.id in seen:
                continue
            seen.add(other.id)
            unread = Message.objects.filter(sender=other, receiver=me, read_at__isnull=True).count()
            threads.append({
                'profile_id': other.id,
                'username': other.user.username,
                'display_name': other.display_name,
                'avatar': other.avatar.url if other.avatar else None,
                'last_message': m.content[:120],
                'last_at': m.created_at,
                'unread': unread,
            })
        return Response(threads)
