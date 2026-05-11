from django.contrib.auth import get_user_model

from rest_framework import generics, permissions, status
from rest_framework.decorators import permission_classes
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

from ..serializers import RegisterSerializer
from ..services import send_activation_email

User = get_user_model()

@extend_schema(
    description="Register a new user account",
    request=RegisterSerializer,
    responses=RegisterSerializer,
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def perform_create(self, serializer):
        user = serializer.save()
        send_activation_email(user, self.request)


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)
        send_activation_email(user, request)
        return Response({"message": "Verification email sent."}, status=status.HTTP_200_OK)

