import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import redirect
from django.utils.http import urlsafe_base64_decode

from django.db import transaction

from rest_framework import status, permissions, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, inline_serializer

from ..models import Profile
from ..services import (
    generate_totp_secret,
    get_totp_uri,
    verify_totp_code,
    send_activation_email
)

User = get_user_model()

# --- ACCOUNT ACTIVATION ---

class ActivateAccountView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Verify Email/Activate Account",
        description="Verifies the uidb64 and token sent via email to activate the user account.",
        parameters=[
            OpenApiParameter(name='uidb64', type=str, location=OpenApiParameter.PATH),
            OpenApiParameter(name='token', type=str, location=OpenApiParameter.PATH),
        ],
        responses={
            200: {"example": {"message": "Account activated!"}}, 
            400: {"example": {"error": "Invalid token"}}
        }
    )
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        frontend_base = (
            os.environ.get('FRONTEND_URL')
            or 'http://localhost:5173'
        ).rstrip('/')

        if user is not None and default_token_generator.check_token(user, token):
            user.is_verified = True
            user.save()
            return redirect(f"{frontend_base}/?verified=1")

        return redirect(f"{frontend_base}/?verified=0")


# --- 2FA SETUP ---

class Enable2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Generate 2FA Secret",
        description="Returns a secret and a provisioning URI for a QR code."
    )
    def post(self, request):
        with transaction.atomic():
            profile = Profile.objects.select_for_update().get(user=request.user)
            if not profile.two_factor_secret:
                profile.two_factor_secret = generate_totp_secret()
                profile.save()

        uri = get_totp_uri(request.user.email, profile.two_factor_secret)
        return Response({
            "secret": profile.two_factor_secret,
            "qr_uri": uri
        })

class Verify2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Verify and Enable 2FA",
        request=inline_serializer(
            name='Verify2FARequest',
            fields={'code': serializers.CharField()}
        ),
        responses={200: {"example": {"message": "2FA Enabled"}}}
    )
    def post(self, request):
        code = request.data.get("code")
        profile = request.user.profile
        
        if verify_totp_code(profile.two_factor_secret, code):
            profile.two_factor_enabled = True
            profile.save()
            return Response({"message": "2FA has been enabled successfully!"}, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)


# --- LOGIN & 2FA ENFORCEMENT ---

class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    @extend_schema(
        summary="Initial Login",
        description="Standard login. Returns JWT tokens OR a 'requires_2fa' flag.",
        responses={
            200: inline_serializer(
                name='LoginResponse',
                fields={
                    'access': serializers.CharField(required=False),
                    'refresh': serializers.CharField(required=False),
                    'requires_2fa': serializers.BooleanField(required=False),
                    'user_id': serializers.IntegerField(required=False),
                }
            )
        }
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            user = User.objects.get(username=request.data.get('username'))
            profile = user.profile
            
            if profile.two_factor_enabled:
                return Response({
                    "requires_2fa": True,
                    "user_id": user.id,
                    "message": "2FA code required."
                }, status=status.HTTP_200_OK)
                
        return response

class Login2FAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    @extend_schema(
        summary="Complete 2FA Login",
        description="Verify the TOTP code from the app and receive JWT tokens.",
        request=inline_serializer(
            name='TwoFactorVerifyRequest',
            fields={
                'user_id': serializers.IntegerField(),
                'code': serializers.CharField(),
            }
        ),
        responses={
            200: inline_serializer(
                name='JWTResponse',
                fields={
                    'access': serializers.CharField(),
                    'refresh': serializers.CharField(),
                }
            ),
            401: OpenApiTypes.OBJECT
        }
    )
    def post(self, request):
        user_id = request.data.get("user_id")
        code = request.data.get("code")
        
        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
        except (User.DoesNotExist, AttributeError):
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

        if verify_totp_code(profile.two_factor_secret, code):
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid 2FA code."}, status=status.HTTP_401_UNAUTHORIZED)