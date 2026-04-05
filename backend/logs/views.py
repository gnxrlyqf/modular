from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from .models import Log
from .serializers import LogSerializer


@extend_schema(
    description="Send logs from frontend or retrieve user logs",
    request=LogSerializer,
    responses=LogSerializer,
)
class LogListCreateView(generics.ListCreateAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Log.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            source="frontend"
        )