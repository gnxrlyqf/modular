from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def heartbeat(request):
    profile = request.user.profile
    profile.last_seen = timezone.now()
    profile.save(update_fields=['last_seen'])
    return Response({'ok': True})
