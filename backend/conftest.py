import os

import pytest
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')


@pytest.fixture
def user_password():
    return "TestPass!234"


@pytest.fixture
def make_user(db, user_password):
    User = get_user_model()
    counter = {"n": 0}

    def _make(username=None, email=None, is_active=True, **extra):
        counter["n"] += 1
        n = counter["n"]
        username = username or f"user{n}"
        email = email or f"{username}@example.com"
        user = User.objects.create_user(
            username=username,
            email=email,
            password=user_password,
            is_active=is_active,
            **extra,
        )
        return user

    return _make


@pytest.fixture
def user(make_user):
    return make_user()


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def auth_client(api_client, user, user_password):
    """Authenticated APIClient for `user` (JWT)."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    api_client.user = user
    return api_client


@pytest.fixture
def disable_throttling(settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        'DEFAULT_THROTTLE_CLASSES': (),
    }
