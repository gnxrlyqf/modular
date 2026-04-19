from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import generics, filters, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import Profile 
from .serializers import RegisterSerializer, ProfileSerializer, UserSearchSerializer

User = get_user_model()


# -------------------------
# REGISTER
# -------------------------
@extend_schema(
    description="Register a new user account",
    request=RegisterSerializer,
    responses=RegisterSerializer,
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # We save the user as is_active=False so they can't log in yet
        user = serializer.save(is_active=False)
        send_activation_email(user, self.request)


# -------------------------
# CURRENT USER
# -------------------------
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


# -------------------------
# CHANGE PASSWORD
# -------------------------
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


# -------------------------
# CHANGE EMAIL
# -------------------------
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
    user.save()
    return Response({"message": "email updated"})


# -------------------------
# CHANGE USERNAME
# -------------------------
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


# -------------------------
# DELETE ACCOUNT
# -------------------------
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


# -------------------------
# LOGOUT
# -------------------------
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


# -------------------------
# PROFILE (GET / PATCH)
# -------------------------
@extend_schema(
    description="Get or update user profile",
    request=ProfileSerializer,
    responses=ProfileSerializer,
)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_profile(request):

    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(ProfileSerializer(profile).data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

from rest_framework.pagination import PageNumberPagination

User = get_user_model()

class UserPagination(PageNumberPagination):
    page_size = 9 # N~N+9 optimization
    page_query_param = 'page'

class UserSearchView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

from rest_framework.views import APIView
from rest_framework.response import Response
from .services import update_user_xp

class UpdateBioView(APIView):
    def post(self, request):
        profile = request.user.profile
        profile.bio = request.data.get('bio')
        profile.save()

        # HERE IS THE UPDATE:
        # We call the service and pass the profile + XP amount
        leveled_up = update_user_xp(profile, amount=50)

        return Response({
            "message": "Bio updated!",
            "xp": profile.xp,
            "level": profile.level,
            "leveled_up": leveled_up
        })

from rest_framework import viewsets, permissions
from .services import update_user_xp
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Update User Profile",
        description="Updates profile bio/avatar and awards bonus XP.",
        responses={200: ProfileSerializer}
    )
    def perform_update(self, serializer):
        """
        This method runs right before the data is saved to the database.
        """
        profile = serializer.save()
        leveled_up = update_user_xp(profile, amount=25)


from .models import Friendship, Profile
from .serializers import FriendshipSerializer
from .social_services import accept_friend_request, send_friend_request
@extend_schema_view(
    list=extend_schema(summary="List all user friendships (pending/accepted)"),
    create=extend_schema(summary="Send a new friend request"),
    retrieve=extend_schema(summary="Get details of a specific friendship"),
)
class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.Profile
        # Q object checks both directions if one of them alrdy sent a request
        return Friendship.objects.filter(
            models.Q(sender=user_profile) | models.Q(receiver=user_profile)
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user.profile)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        """ Endpoint: /api/friendships/{id}/accept/ """
        friendship = self.get_object()
        user_profile = request.user.profile

        if friendship.receiver != user_profile:
            return Response(
                {"error": "You cannot accept a request that was not sent to you."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if friendship.status != 'pending':
            return Response(
                {"error": f"This request is already {friendship.status}."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        success, message = accept_friend_request(pk, user_profile)
        if success:
            return Response({"message": message}, status=status.HTTP_200_OK)
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .services import OAuthService


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
    
    tokens = get_tokens_for_user(user) 
    return Response(tokens)



from rest_framework import status, permissions
from django.contrib.auth.forms import PasswordResetForm

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


from django.utils.http import urlsafe_base64_decode
from drf_spectacular.utils import extend_schema, OpenApiParameter

class ActivateAccountView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Verify Email/Activate Account",
        description="Verifies the uidb64 and token sent via email to activate the user account.",
        parameters=[
            OpenApiParameter(name='uidb64', type=str, location=OpenApiParameter.PATH),
            OpenApiParameter(name='token', type=str, location=OpenApiParameter.PATH),
        ],
        responses={200: {"example": {"message": "Account activated!"}}, 
                   400: {"example": {"error": "Invalid token"}}}
    )
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({"message": "Account activated successfully! You can now log in."}, status=status.HTTP_200_OK)
        
        return Response({"error": "Activation link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)