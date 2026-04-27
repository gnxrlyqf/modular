from django.conf import settings
from rest_framework.permissions import BasePermission


def is_admin_user(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    admin_list = getattr(settings, 'ADMIN_USERNAMES', []) or []
    return user.username in admin_list


class IsAdminUserCustom(BasePermission):
    """Permission: user authenticated AND username in ADMIN_USERNAMES env list."""
    message = "Admin privileges required."

    def has_permission(self, request, view):
        return is_admin_user(request.user)
