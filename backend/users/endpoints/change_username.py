from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

User = get_user_model()


@extend_schema(
    description="Update username",
    request={
        "application/json": {
            "example": {
                "username": "new_name"
            }
        }
    },
    responses={
        200: {"example": {"message": "username updated"}},
        400: {"example": {"error": "username already taken"}}
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_username(request):
    user = request.user
    username = request.data.get("username")

    if not username or not username.strip():
        return Response({"error": "invalid username"}, status=400)

    username = username.strip()

    if User.objects.filter(username=username).exclude(id=user.id).exists():
        return Response({"error": "username already taken"}, status=400)

    user.username = username
    user.save()
    return Response({"message": "username updated"})
