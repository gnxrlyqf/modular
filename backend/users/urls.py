from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegisterView,
    UserActivateView,
    UserLoginView,
    UserLogin2FAVerifyView,
    UserLogoutView,
    UserOAuthCallbackView,
    MeBasicView,
    MeProfileView,
    UserUpdateBioView,
    UserChangeEmailView,
    UserChangeUsernameView,
    UserChangePasswordView,
    UserRequestPasswordResetView,
    UserPasswordResetConfirmView,
    UserDeleteAccountView,
    UserEnable2FAView,
    UserVerify2FAView,
    UserSearchListView,
    UserPublicProfileView,
    FriendshipViewSet,
    ProfileViewSet,
    MessageViewSet,
    NotificationViewSet,
    UserAdminCheckView,
    UserAdminListView,
    UserAdminDeleteView,
    UserAdminLogsView,
    UserAdminAllLogsView,
    UserResendVerificationView,
    UserDashboardTokenView,
)

# 1. Router for ViewSets
router = DefaultRouter()
router.register(r'friendships', FriendshipViewSet, basename='friendship')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    # --- Authentication ---
    path('register/', UserRegisterView.as_view(), name='register'),
    path('activate/<uidb64>/<token>/', UserActivateView.as_view(), name='activate_account'),
    path('resend-verification/', UserResendVerificationView.as_view(), name='resend_verification'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('login/2fa-verify/', UserLogin2FAVerifyView.as_view(), name='2fa_login_verify'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('social-auth/', UserOAuthCallbackView.as_view(), name='social_auth_callback'),

    # --- Current User Data (Me) ---
    path('me/', MeBasicView.as_view(), name='me_basic'),
    path('profile/me/', MeProfileView.as_view(), name='me_profile'),
    path('profile/update-bio/', UserUpdateBioView.as_view(), name='update_bio'),

    # --- Account Settings ---
    path('change-email/', UserChangeEmailView.as_view(), name='change_email'),
    path('change-username/', UserChangeUsernameView.as_view(), name='change_username'),
    path('change-password/', UserChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', UserRequestPasswordResetView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', UserPasswordResetConfirmView.as_view(), name='password_reset_confirm_json'),
    path('delete/', UserDeleteAccountView.as_view(), name='delete_account'),

    # --- 2FA Management ---
    path('2fa/enable/', UserEnable2FAView.as_view(), name='enable_2fa'),
    path('2fa/verify/', UserVerify2FAView.as_view(), name='verify_2fa'),

    # --- Analytics dashboard (Metabase signed embed) ---
    path('dashboard-token/', UserDashboardTokenView.as_view(), name='dashboard_token'),

    # --- Search ---
    path('search/', UserSearchListView.as_view(), name='user_search'),

    # --- Public profile (other users) ---
    path('profile/<str:username>/', UserPublicProfileView.as_view(), name='public_profile'),

    # --- Admin (env-driven) ---
    path('admin/check/', UserAdminCheckView.as_view(), name='admin_check'),
    path('admin/users/', UserAdminListView.as_view(), name='admin_users_list'),
    path('admin/users/<int:user_id>/', UserAdminDeleteView.as_view(), name='admin_user_delete'),
    path('admin/users/<int:user_id>/logs/', UserAdminLogsView.as_view(), name='admin_user_logs'),
    path('admin/logs/', UserAdminAllLogsView.as_view(), name='admin_all_logs'),

    # --- Router Includes ---
    path('social/', include(router.urls)),
]