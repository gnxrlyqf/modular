from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

User = get_user_model()

@extend_schema(
    description="Update user email address",
    request={
        "application/json": {
            "example": {
                "email": "new@mail.com"
            }
        }
    },
    responses={
        200: {"example": {"message": "email updated"}},
        400: {"example": {"error": "email already in use"}}
    }
)
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_email(request):
    user = request.user
    email = request.data.get("email")

    if not email:
        return Response({"error": "email required"}, status=400)

    email = email.strip().lower()

    if User.objects.filter(email=email).exclude(id=user.id).exists():
        return Response({"error": "email already in use"}, status=400)

    user.email = email
    user.is_verified = False
    user.save()
    from ..services import send_activation_email
    send_activation_email(user, request)
    return Response({"message": "email updated"})

