from django.urls import path
from .views import (
    RegisterView, me, change_email, 
    change_password, change_username, 
    delete_account, logout, me_profile,
    UserSearchView
)

urlpatterns = [
    # This will be: /api/users/
    path('register/', RegisterView.as_view()), 
    
    # This will be: /api/users/me/
    path('me/', me),

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
]