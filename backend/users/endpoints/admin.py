from django.contrib.auth import get_user_model

from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from logs.models import Log
from logs.serializers import LogSerializer

from ..permissions import IsAdminUserCustom, is_admin_user
from ..serializers import UserSearchSerializer

User = get_user_model()


class AdminCheckView(APIView):
    """GET /api/users/admin/check/ — returns {is_admin: bool}. Auth required."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"is_admin": is_admin_user(request.user)})


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSearchSerializer
    permission_classes = [IsAdminUserCustom]

    @extend_schema(summary="List all users (admin only)")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AdminUserDeleteView(APIView):
    permission_classes = [IsAdminUserCustom]

    @extend_schema(summary="Delete a user by id (admin only)")
    def delete(self, request, user_id):
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if target == request.user:
            return Response(
                {"detail": "Cannot delete yourself via admin endpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserLogsView(generics.ListAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAdminUserCustom]

    @extend_schema(summary="List logs for any user (admin only)")
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Log.objects.filter(user_id=user_id).order_by('-created_at')


class AdminAllLogsView(generics.ListAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAdminUserCustom]
    queryset = Log.objects.all().order_by('-created_at')

    @extend_schema(summary="List all logs (admin only)")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
