import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle


from drf_spectacular.utils import extend_schema, OpenApiTypes


User = get_user_model()


@extend_schema(
    description="Change current user's password",
    request={
        "application/json": {
            "example": {
                "old_password": "old123",
                "new_password": "newStrongPass123"
            }
        }
    },
    responses={
        200: {"example": {"message": "password updated"}},
        400: {"example": {"error": "wrong password"}}
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old = request.data.get("old_password")
    new = request.data.get("new_password")

    if not user.check_password(old):
        return Response({"error": "wrong password"}, status=400)

    try:
        validate_password(new, user)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

    user.set_password(new)
    user.save()
    return Response({"message": "password updated"})



# 1. CHANGE PASSWORD
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {
            "old_password": {"type": "string"},
            "new_password": {"type": "string"}
        }}},
        responses={200: OpenApiTypes.OBJECT},
        description="Change password for authenticated users."
    )
    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response({"error": "Old password incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

# 2. FORGOT PASSWORD REQUEST
class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {
            "email": {"type": "string", "format": "email"}
        }}},
        responses={200: OpenApiTypes.OBJECT},
        description="Send a password reset link pointing to the SPA confirmation page."
    )
    def post(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            return Response(
                {"email": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Always respond 200 so we don't leak which emails are registered.
        users = list(User.objects.filter(email__iexact=email, is_active=True))
        for user in users:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = (
                os.environ.get('FRONTEND_URL')
                or request.headers.get('Referer')
                or 'http://localhost:5173'
            )
            origin = frontend_url.rstrip('/').split('/password-reset')[0]
            link = f"{origin}/password-reset/{uid}/{token}/"
            send_mail(
                subject="Reset your Trandandan password",
                message=(
                    f"Hello {user.username},\n\n"
                    f"Click the link below to reset your password:\n{link}\n\n"
                    "If you did not request this, ignore this email."
                ),
                from_email='noreply@transcendence.com',
                recipient_list=[user.email],
                fail_silently=True,
            )

        return Response(
            {"message": "If this email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


# 3. PASSWORD RESET CONFIRM (JSON, SPA-friendly)
class PasswordResetConfirmJSONView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {
            "uid": {"type": "string"},
            "token": {"type": "string"},
            "new_password": {"type": "string"},
        }}},
        responses={200: OpenApiTypes.OBJECT},
        description="Confirm a password reset link and set a new password.",
    )
    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not (uid and token and new_password):
            return Response(
                {"detail": "uid, token and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_pk = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {"new_password": list(getattr(e, 'messages', [str(e)]))},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset."}, status=status.HTTP_200_OK)

