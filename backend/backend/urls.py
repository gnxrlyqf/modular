from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # -------------------------
    # 1. MANAGEMENT & ADMIN
    # -------------------------
    path('admin/', admin.site.urls),
    path('monitoring/', include('django_prometheus.urls')),  # Relocated by Imbo

    # -------------------------
    # 2. AUTHENTICATION (JWT)
    # -------------------------
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # -------------------------
    # 3. CORE API ENDPOINTS
    # -------------------------
    path('api/users/', include('users.urls')),
    path('api/logs/', include('logs.urls')),
    path('api/', include('projects.api_urls')), # Handles /api/projects/ and /api/search/
    
    # -------------------------
    # 4. DOCUMENTATION & SCHEMA
    # -------------------------
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),

    # -------------------------
    # 5. LEGACY / HTML ROUTES
    # -------------------------
    path('', include('projects.urls')), 
]