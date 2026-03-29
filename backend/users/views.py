from rest_framework import generics
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username
    })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.password_validation import validate_password

# change password
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

# change email
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_email(request):
    user = request.user
    email = request.data.get("email")
    email = email.strip().lower()

    if not email:
        return Response({"error": "email required"}, status=400)

    if User.objects.filter(email=email).exclude(id=user.id).exists():
        return Response({"error": "email already in use"}, status=400)

    user.email = email
    user.save()
    return Response({"message": "email updated"})

# change username
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

# delete account
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user

    # blacklist all tokens
    tokens = OutstandingToken.objects.filter(user=user)
    BlacklistedToken.objects.bulk_create([BlacklistedToken(token=t) for t in tokens], ignore_conflicts=True)

    user.delete()

    return Response({"message": "account deleted"})

# logout
from rest_framework_simplejwt.tokens import RefreshToken
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


from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from .serializers import ProfileSerializer


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_profile(request):

    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(ProfileSerializer(profile).data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)