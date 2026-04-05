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