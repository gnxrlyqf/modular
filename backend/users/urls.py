from django.urls import path
from .views import (RegisterView, me, change_email, change_password, change_username, delete_account, logout)

urlpatterns = [
    path('', RegisterView.as_view()),
    path('me/', me),

    path('change-password/', change_password),
    path('change-email/', change_email),
    path('change-username/', change_username),
    path('delete/', delete_account),
    path('logout/', logout),
]

from django.urls import path
from .views import me_profile

urlpatterns += [
    path('profile/me/', me_profile),
    #path('avatar/', upload_avatar),
]