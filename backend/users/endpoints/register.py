from django.contrib.auth import get_user_model

from rest_framework import generics, permissions
from rest_framework.decorators import permission_classes
from rest_framework.throttling import ScopedRateThrottle

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
        # We save the user as is_active=False so they can't log in yet
        user = serializer.save(is_active=False)
        send_activation_email(user, self.request)

