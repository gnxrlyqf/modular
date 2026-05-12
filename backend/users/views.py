from rest_framework.views import APIView
from rest_framework import permissions

# --- 1. MODULAR IMPORTS ---
from .endpoints.twofa import (
    ActivateAccountView, 
    Enable2FAView, 
    Verify2FAView, 
    LoginView, 
    Login2FAVerifyView
)
from .endpoints.users_view import UserSearchView, UpdateBioView
from .endpoints.change_email import change_email
from .endpoints.change_password import ChangePasswordView, RequestPasswordResetView, PasswordResetConfirmJSONView
from .endpoints.change_username import change_username
from .endpoints.delete_account import delete_account
from .endpoints.friends import FriendshipViewSet
from .endpoints.logout import logout
from .endpoints.me import me
from .endpoints.profile import me_profile, ProfileViewSet
from .endpoints.oauth import social_auth_callback
from .endpoints.register import RegisterView, ResendVerificationView
from .endpoints.messages import MessageViewSet
from .endpoints.notifications import NotificationViewSet
from .endpoints.public_profile import public_profile
from .endpoints.dashboard import DashboardTokenView
from .endpoints.heartbeat import heartbeat
from .endpoints.admin import (
    AdminCheckView,
    AdminUserListView,
    AdminUserDeleteView,
    AdminUserLogsView,
    AdminAllLogsView,
)

# --- 2. AUTHENTICATION & REGISTRATION ---

class UserRegisterView(RegisterView):
    pass

class UserResendVerificationView(ResendVerificationView):
    pass

class UserActivateView(ActivateAccountView):
    pass

class UserLoginView(LoginView):
    pass

class UserLogin2FAVerifyView(Login2FAVerifyView):
    pass

class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return logout(request._request)

class UserOAuthCallbackView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return social_auth_callback(request._request)

# --- 3. PROFILE & ACCOUNT SETTINGS ---

class MeBasicView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return me(request._request)

class MeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return me_profile(request._request)
    def patch(self, request):
        return me_profile(request._request)

class UserUpdateBioView(UpdateBioView):
    permission_classes = [permissions.IsAuthenticated]

class UserChangeEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def put(self, request):
        return change_email(request._request)

class UserChangeUsernameView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return change_username(request._request)

class UserChangePasswordView(ChangePasswordView):
    pass

class UserRequestPasswordResetView(RequestPasswordResetView):
    pass

class UserPasswordResetConfirmView(PasswordResetConfirmJSONView):
    pass

class UserDeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def delete(self, request):
        return delete_account(request._request)

# --- 4. 2FA CONFIGURATION ---

class UserEnable2FAView(Enable2FAView):
    pass

class UserVerify2FAView(Verify2FAView):
    pass

# --- 5. SEARCH & SOCIAL ---

class UserSearchListView(UserSearchView):
    pass

class UserPublicProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, username):
        return public_profile(request._request, username)

# Note: FriendshipViewSet, ProfileViewSet, MessageViewSet, NotificationViewSet
# should be used directly in your urls.py with a DRF Router.

# --- 6. ADMIN ---

class UserAdminCheckView(AdminCheckView):
    pass

class UserAdminListView(AdminUserListView):
    pass

class UserAdminDeleteView(AdminUserDeleteView):
    pass

class UserAdminLogsView(AdminUserLogsView):
    pass

class UserAdminAllLogsView(AdminAllLogsView):
    pass

# --- 7. ANALYTICS DASHBOARD ---

class UserDashboardTokenView(DashboardTokenView):
    pass

class UserHeartbeatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return heartbeat(request._request)