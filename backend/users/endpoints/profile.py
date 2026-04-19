from rest_framework import permissions,viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from ..models import Profile 
from ..serializers import ProfileSerializer
from ..services import update_user_xp

@extend_schema(
    description="Get or update user profile",
    request=ProfileSerializer,
    responses=ProfileSerializer,
)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_profile(request):

    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(ProfileSerializer(profile).data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Update User Profile",
        description="Updates profile bio/avatar and awards bonus XP.",
        responses={200: ProfileSerializer}
    )
    def perform_update(self, serializer):
        """This method runs right before the data is saved to the database."""
        profile = serializer.save()
        leveled_up = update_user_xp(profile, amount=25)

