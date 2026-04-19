from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

@extend_schema(
    description="Delete user account and blacklist all JWT tokens",
    responses={
        200: {"example": {"message": "account deleted"}}
    }
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user

    tokens = OutstandingToken.objects.filter(user=user)
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=t) for t in tokens],
        ignore_conflicts=True
    )

    user.delete()
    return Response({"message": "account deleted"})

