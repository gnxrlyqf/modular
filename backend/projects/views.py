from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from .models import Project
from .serializers import ProjectSerializer


# -------------------------
# LIST + CREATE PROJECTS
# -------------------------
@extend_schema(
    description="List all projects of the authenticated user, or create a new project.",
    request=ProjectSerializer,
    responses=ProjectSerializer,
)
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# -------------------------
# PROJECT DETAIL (GET / PUT / DELETE)
# -------------------------
@extend_schema(
    description="Retrieve, update, or delete a specific project owned by the authenticated user.",
    request=ProjectSerializer,
    responses=ProjectSerializer,
)
class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


# -------------------------
# INDEX (HTML VIEW - not API)
# -------------------------
def index(request):
    return render(request, 'projects/index.html')


from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
# -------------------------
# CUSTOM PAGINATION
# -------------------------
class ProjectSearchPagination(PageNumberPagination):
    page_size = 9 # Forces exactly 9 items per page
    page_query_param = 'page'

# -------------------------
# PROJECT SEARCH & LIST VIEW
# -------------------------
@extend_schema(
    summary="Search and Filter Projects",
    description="Allows Youssef to search by project name/ID and sort by creation date. Returns 9 items per page.",
    parameters=[
        OpenApiParameter(
            name='search',
            description='Search by ID or project name',
            required=False,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name='ordering',
            description='Sort results. Use "-created_at" for newest first or "created_at" for oldest.',
            required=False,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            enum=['created_at', '-created_at', 'updated_at', '-updated_at', 'id', '-id']
        ),
        OpenApiParameter(
            name='page',
            description='Page number (N = 9 * page_number)',
            required=False,
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={200: ProjectSerializer(many=True)}
)
class UserProjectSearchView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    pagination_class = ProjectSearchPagination
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]

    search_fields = ['id', 'name']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        # This is the crucial part: it restricts the search to ONLY their projects
        return Project.objects.filter(user=self.request.user)