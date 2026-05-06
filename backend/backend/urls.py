from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.contrib.auth import views as auth_views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from users.endpoints.token import SafeTokenRefreshView
from users.endpoints.notifications import NotificationViewSet

notif_router = DefaultRouter()
notif_router.register(r'notifications', NotificationViewSet, basename='notification')

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
    path('api/token/refresh/', SafeTokenRefreshView.as_view(), name='token_refresh'),

    # -------------------------
    # 3. CORE API ENDPOINTS
    # -------------------------
    path('api/users/', include('users.urls')),
    path('api/logs/', include('logs.urls')),
    path('api/', include('projects.api_urls')), # Handles /api/projects/ and /api/search/
    path('api/', include(notif_router.urls)), # /api/notifications/ flat list
    
    # -------------------------
    # 4. DOCUMENTATION & SCHEMA
    # -------------------------
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),

    # -------------------------
    # 5. LEGACY / HTML ROUTES
    # -------------------------
    path('', include('projects.urls')),

    # Password Reset
    path('api/password-reset-confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(),
        name='password_reset_confirm'),
]

# Serve user-uploaded media (avatars, etc.) in DEBUG.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
