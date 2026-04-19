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
    UserDeleteAccountView,
    UserSearchListView,
    FriendshipViewSet,
    ProfileViewSet
)

# 1. Router for ViewSets
router = DefaultRouter()
router.register(r'friendships', FriendshipViewSet, basename='friendship')
router.register(r'profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    # --- Authentication ---
    path('register/', UserRegisterView.as_view(), name='register'),
    path('activate/<uidb64>/<token>/', UserActivateView.as_view(), name='activate_account'),
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
    path('delete/', UserDeleteAccountView.as_view(), name='delete_account'),

    # --- Search ---
    path('search/', UserSearchListView.as_view(), name='user_search'),

    # --- Router Includes ---
    path('social/', include(router.urls)),
]