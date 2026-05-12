from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from ..models import Notification
from ..serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(summary="Flat list of all notifications for the current user"),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user.profile).order_by('-created_at')

    @extend_schema(summary="Mark all notifications as read")
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user.profile, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"status": "ok"})

    @extend_schema(summary="Mark a single notification as read")
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        try:
            n = Notification.objects.get(pk=pk, recipient=request.user.profile)
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if n.read_at is None:
            n.read_at = timezone.now()
            n.save(update_fields=['read_at'])
        return Response(NotificationSerializer(n).data)

    @extend_schema(summary="Unread notification count (split by type)")
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        qs = Notification.objects.filter(recipient=request.user.profile, read_at__isnull=True)
        messages = qs.filter(type='message').count()
        other = qs.exclude(type='message').count()
        return Response({"messages": messages, "notifications": other})
