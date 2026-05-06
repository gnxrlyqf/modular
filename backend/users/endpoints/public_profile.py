from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from ..models import Profile, Friendship
from ..serializers import PublicProfileSerializer

User = get_user_model()


@extend_schema(
    summary="Public profile for another user (display_name, bio, avatar, projects)",
    responses=PublicProfileSerializer,
)
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def public_profile(request, username: str):
    try:
        target = Profile.objects.select_related('user').get(user__username=username)
    except Profile.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    me = request.user.profile

    # blocker (target) blocked viewer (me) -> hide entirely
    if Friendship.objects.filter(sender=target, receiver=me, status='blocked').exists():
        return Response(
            {"error": "You have been blocked by this user.", "blocked": True},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(PublicProfileSerializer(target, context={'request': request}).data)
