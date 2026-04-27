import logging

from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from drf_spectacular.utils import extend_schema
from rest_framework.pagination import PageNumberPagination
from .models import Log
from .serializers import LogSerializer
from .file_logger import write_log

frontend_logger = logging.getLogger('frontend')


class LogPagination(PageNumberPagination):
    page_size = 9
    page_query_param = 'page'


_LEVEL_TO_LOGGER = {
    'debug': logging.DEBUG,
    'info': logging.INFO,
    'warning': logging.WARNING,
    'error': logging.ERROR,
    'action': logging.INFO,
}


@extend_schema(
    description="Send logs from frontend or retrieve user logs",
    request=LogSerializer,
    responses=LogSerializer,
)
class LogListCreateView(generics.ListCreateAPIView):
    serializer_class = LogSerializer
    pagination_class = LogPagination
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'logs'

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['message', 'level']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Log.objects.none()
        return Log.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        level = serializer.validated_data.get('level', 'info')
        message = serializer.validated_data.get('message', '') or ''
        context = serializer.validated_data.get('context')

        log_entry = Log.objects.create(
            user=user,
            level=level,
            message=message,
            context=context,
            source='frontend',
        )

        frontend_logger.log(
            _LEVEL_TO_LOGGER.get(level, logging.INFO),
            "[frontend] user=%s level=%s msg=%s ctx=%s",
            user.username if user else 'anon',
            level,
            message,
            context,
        )

        try:
            write_log(
                user=user.username if user else None,
                level=level,
                message=message,
                context=context,
                source='frontend',
            )
        except OSError:
            pass

        out = self.get_serializer(log_entry)
        return Response(out.data, status=status.HTTP_201_CREATED)
