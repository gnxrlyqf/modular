from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
]
from django.urls import path, include

urlpatterns += [
    path('api/', include('users.urls')),
]