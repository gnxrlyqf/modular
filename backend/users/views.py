from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema

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