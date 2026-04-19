from rest_framework import permissions, viewsets, status
from rest_framework.decorators import permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from ..models import Friendship, Profile
from ..serializers import FriendshipSerializer
from ..social_services import accept_friend_request, send_friend_request
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
        serializer.save(sender=self.request.user.profile)

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
            return Response({"message": message}, status=status.HTTP_200_OK)
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)