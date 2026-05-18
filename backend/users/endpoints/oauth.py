from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..services import OAuthService

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def social_auth_callback(request):
    provider = request.data.get('provider')
    access_token = request.data.get('access_token')
    code = request.data.get('code')

    if provider == '42':
        if not access_token and code:
            access_token = OAuthService.exchange_code_for_42_token(code)
            if not access_token:
                return Response({"error": "42 code exchange failed"}, status=400)
        user_data = OAuthService.get_42_data(access_token)
    elif provider == 'google':
        user_data = OAuthService.get_google_data(access_token)
    elif provider == 'facebook':
        user_data = OAuthService.get_facebook_data(access_token)
    else:
        return Response({"error": "Unsupported provider"}, status=400)

    if not user_data:
        return Response({"error": f"Failed to fetch data from {provider}"}, status=400)

    user = OAuthService.get_or_create_social_user(provider, user_data)

    if user.profile.two_factor_enabled:
        return Response({
            "requires_2fa": True,
            "user_id": user.id,
            "message": "2FA code required.",
        })

    tokens = get_tokens_for_user(user)
    return Response(tokens)


