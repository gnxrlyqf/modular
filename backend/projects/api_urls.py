from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, ProjectVoteView
from .views import UserProjectSearchView, CommunityProjectSearchView

urlpatterns = [
    path('projects/', ProjectListCreateView.as_view()),
    path('projects/<uuid:pk>/', ProjectDetailView.as_view()),
    path('projects/<uuid:pk>/vote/', ProjectVoteView.as_view()),
    path('search/', UserProjectSearchView.as_view()),
    path('community/', CommunityProjectSearchView.as_view()),
]
