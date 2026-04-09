from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from rest_framework.pagination import PageNumberPagination
from .models import Log
from .serializers import LogSerializer

class LogPagination(PageNumberPagination):
    page_size = 9 # Keep it consistent with Youssef's N~N+9 requirement
    page_query_param = 'page'

@extend_schema(
    description="Send logs from frontend or retrieve user logs",
    request=LogSerializer,
    responses=LogSerializer,
)
class LogListCreateView(generics.ListCreateAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LogPagination

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['message', 'level']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Log.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            source="frontend"
        )