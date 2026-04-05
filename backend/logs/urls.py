from django.urls import path
from .views import LogListCreateView

urlpatterns = [
    path("", LogListCreateView.as_view(), name="logs"),
]