from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

@extend_schema(
    description="Get authenticated user basic info",
    responses={
        200: {
            "example": {
                "id": 1,
                "username": "king"
            }
        }
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username
    })
