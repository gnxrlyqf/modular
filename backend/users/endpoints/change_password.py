from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.forms import PasswordResetForm

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


from drf_spectacular.utils import extend_schema, OpenApiTypes


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

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {
            "email": {"type": "string", "format": "email"}
        }}},
        responses={200: OpenApiTypes.OBJECT},
        description="Send a password reset link to the console/email."
    )
    def post(self, request):
        form = PasswordResetForm(request.data)
        if form.is_valid():
            form.save(
                request=request,
                use_https=False, 
                email_template_name='registration/password_reset_email.html',
                subject_template_name='registration/password_reset_subject.txt'
            )
            return Response({"message": "If this email exists, a reset link has been sent."}, status=status.HTTP_200_OK)
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

