from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Friendship
from .social_services import accept_friend_request

class SocialViewSet(viewsets.GenericViewSet):
    """
    API for managing friendships and social interactions.
    """
    queryset = Friendship.objects.all()

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        """
        POST /api/social/{id}/accept/
        Accepts a friend request and awards XP.
        """
        friendship = accept_friend_request(pk)
        return Response({"status": "Friendship accepted! XP awarded."}, status=status.HTTP_200_OK)