from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.tokens import RefreshToken

@extend_schema(
    description="Logout user by blacklisting refresh token",
    request={
        "application/json": {
            "example": {
                "refresh": "jwt_refresh_token_here"
            }
        }
    },
    responses={
        200: {"example": {"message": "logged out"}},
        400: {"example": {"error": "refresh token required"}}
    }
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"error": "refresh token required"}, status=400)

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response({"message": "logged out"})
    except Exception:
        return Response({"error": "invalid or expired token"}, status=400)

