import datetime as dt
from datetime import date
from django.shortcuts import render, get_object_or_404
from django.db.models import Sum, Case, When, IntegerField, Value, Count, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Project, ProjectVote
from .serializers import ProjectSerializer


def _net_votes_annotation():
    return Coalesce(
        Sum(Case(
            When(votes__vote=1, then=Value(1)),
            When(votes__vote=-1, then=Value(-1)),
            default=Value(0),
            output_field=IntegerField(),
        )),
        Value(0),
        output_field=IntegerField(),
    )


# ─── List + Create ────────────────────────────────────────────────────────────

@extend_schema(
    description="List all projects of the authenticated user, or create a new project.",
    request=ProjectSerializer,
    responses=ProjectSerializer,
)
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).prefetch_related('votes')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── Detail ───────────────────────────────────────────────────────────────────

@extend_schema(
    description="Retrieve, update, or delete a specific project owned by the authenticated user.",
    request=ProjectSerializer,
    responses=ProjectSerializer,
)
class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).prefetch_related('votes')


# ─── Vote ─────────────────────────────────────────────────────────────────────

class ProjectVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        vote_value = request.data.get('vote')
        if vote_value not in (1, -1, 0):
            return Response({'error': 'vote must be 1, -1, or 0'}, status=400)

        if vote_value == 0:
            ProjectVote.objects.filter(user=request.user, project=project).delete()
        else:
            ProjectVote.objects.update_or_create(
                user=request.user, project=project,
                defaults={'vote': vote_value},
            )

        project_qs = Project.objects.prefetch_related('votes').get(pk=pk)
        serializer = ProjectSerializer(project_qs, context={'request': request})
        return Response(serializer.data)


# ─── Pagination ───────────────────────────────────────────────────────────────

class ProjectSearchPagination(PageNumberPagination):
    page_size = 9
    page_query_param = 'page'


# ─── User search ──────────────────────────────────────────────────────────────

@extend_schema(
    summary="Search and Filter Projects",
    description="Search by project name/ID and sort by creation date. Returns 9 items per page.",
    parameters=[
        OpenApiParameter(name='search', required=False, type=OpenApiTypes.STR, location=OpenApiParameter.QUERY),
        OpenApiParameter(name='ordering', required=False, type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         enum=['created_at', '-created_at', 'updated_at', '-updated_at', 'name', '-name']),
        OpenApiParameter(name='page', required=False, type=OpenApiTypes.INT, location=OpenApiParameter.QUERY),
    ],
    responses={200: ProjectSerializer(many=True)},
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
        return Project.objects.filter(user=self.request.user).prefetch_related('votes')


# ─── Community ────────────────────────────────────────────────────────────────

@extend_schema(
    summary="List all community projects ordered by upvotes",
    description="Lists every project across all users. Paginated, supports search and ordering. Default: most upvoted first.",
)
class CommunityProjectSearchView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    pagination_class = ProjectSearchPagination
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['id', 'name']
    ordering_fields = ['created_at', 'updated_at', 'name', 'net_votes']
    ordering = ['-net_votes']

    def get_queryset(self):
        return Project.objects.annotate(
            net_votes=_net_votes_annotation()
        ).prefetch_related('votes').all()


# ─── Weekly leaderboard ───────────────────────────────────────────────────────

class WeeklyLeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()
        week_start = today - dt.timedelta(days=today.weekday())
        week_start_dt = timezone.make_aware(dt.datetime.combine(week_start, dt.time.min))

        projects = (
            Project.objects
            .annotate(
                weekly_upvotes=Count(
                    'votes',
                    filter=Q(votes__vote=1, votes__created_at__gte=week_start_dt),
                )
            )
            .filter(weekly_upvotes__gt=0)
            .select_related('user')
            .order_by('-weekly_upvotes')[:10]
        )

        data = [
            {
                'id': str(p.id),
                'name': p.name,
                'username': p.user.username,
                'weekly_upvotes': p.weekly_upvotes,
            }
            for p in projects
        ]
        return Response(data)


# ─── Share ────────────────────────────────────────────────────────────────────

class ProjectShareView(APIView):
    """
    Increment share_count and record today in shared_days (no duplicates per day).
    Only the project owner can trigger this.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(Project, pk=pk, user=request.user)
        today = date.today().isoformat()

        analytics = project.analytics or {}
        sharing = analytics.get('sharing', {})
        sharing['share_count'] = sharing.get('share_count', 0) + 1
        shared_days = sharing.get('shared_days', [])
        if today not in shared_days:
            shared_days.append(today)
        sharing['shared_days'] = shared_days
        analytics['sharing'] = sharing

        project.analytics = analytics
        project.save(update_fields=['analytics'])

        project_qs = Project.objects.prefetch_related('votes').get(pk=pk)
        serializer = ProjectSerializer(project_qs, context={'request': request})
        return Response(serializer.data)


# ─── HTML index (legacy) ──────────────────────────────────────────────────────

def index(request):
    return render(request, 'projects/index.html')
