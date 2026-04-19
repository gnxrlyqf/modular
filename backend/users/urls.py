from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, me, change_email, 
    change_password, change_username, 
    delete_account, logout, me_profile,
    social_auth_callback,
    UserSearchView, FriendshipViewSet,
    ChangePasswordView, RequestPasswordResetView,
    ActivateAccountView
)

urlpatterns = [
    # Account
    path('register/', RegisterView.as_view()), 
    path('me/', me),

    # Email Verification
    path('activate/<uidb64>/<token>/', ActivateAccountView.as_view(), name='activate_account'),

    # Settings endpoints
    path('change-password/', change_password),
    path('change-email/', change_email),
    path('change-username/', change_username),
    
    # Account actions
    path('delete/', delete_account),
    path('logout/', logout),
    
    # Profile
    path('profile/me/', me_profile),

    # Search
    path('search/', UserSearchView.as_view(), name='user-search'),

    # Password change
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', RequestPasswordResetView.as_view(), name='password_reset_request'),
]

social_router = DefaultRouter()
social_router.register(r'friendships', FriendshipViewSet, basename='friendship')
urlpatterns += [
    path('social/', include(social_router.urls)),
    path('social-auth/', social_auth_callback, name='social_auth_callback'),
]
