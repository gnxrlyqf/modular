from django.contrib.auth import get_user_model

from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.decorators import  permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..services import update_user_xp
from ..serializers import UserSearchSerializer
from ..models import Profile 

from rest_framework.pagination import PageNumberPagination

User = get_user_model()

class UserPagination(PageNumberPagination):
    page_size = 9 # N~N+9 optimization
    page_query_param = 'page'

class UserSearchView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

class UpdateBioView(APIView):
    def post(self, request):
        profile = request.user.profile
        profile.bio = request.data.get('bio')
        profile.save()

        # HERE IS THE UPDATE:
        # We call the service and pass the profile + XP amount
        leveled_up = update_user_xp(profile, amount=50)

        return Response({
            "message": "Bio updated!",
            "xp": profile.xp,
            "level": profile.level,
            "leveled_up": leveled_up
        })
