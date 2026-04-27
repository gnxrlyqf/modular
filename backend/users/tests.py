"""Tests for users app: registration, login, 2FA, profile, friendships, throttling, admin."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import Friendship, Profile

User = get_user_model()


def _bearer_client(user):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return client


# ─── registration ─────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_register_creates_inactive_user(api_client, disable_throttling):
    resp = api_client.post(
        '/api/users/register/',
        {"username": "alice", "password": "GoodPass!234"},
        format='json',
    )
    assert resp.status_code == 201, resp.content
    user = User.objects.get(username='alice')
    assert user.is_active is False


@pytest.mark.django_db
def test_register_password_too_short_returns_envelope(api_client, disable_throttling):
    resp = api_client.post(
        '/api/users/register/',
        {"username": "bob", "password": "short"},
        format='json',
    )
    assert resp.status_code == 400
    body = resp.json()
    assert body.get('error', {}).get('code') == 'INVALID_INPUT'
    assert 'password' in body['error']['details']


@pytest.mark.django_db
def test_register_duplicate_username_rejected(api_client, make_user, disable_throttling):
    make_user(username='charlie')
    resp = api_client.post(
        '/api/users/register/',
        {"username": "charlie", "password": "GoodPass!234"},
        format='json',
    )
    assert resp.status_code == 400
    assert resp.json()['error']['code'] == 'INVALID_INPUT'


# ─── login + 2FA ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_login_success_returns_jwt_pair(api_client, make_user, user_password, disable_throttling):
    make_user(username='dave', is_active=True)
    resp = api_client.post(
        '/api/users/login/',
        {"username": "dave", "password": user_password},
        format='json',
    )
    assert resp.status_code == 200
    data = resp.json()
    assert 'access' in data and 'refresh' in data


@pytest.mark.django_db
def test_login_inactive_user_rejected(api_client, make_user, user_password, disable_throttling):
    make_user(username='eve', is_active=False)
    resp = api_client.post(
        '/api/users/login/',
        {"username": "eve", "password": user_password},
        format='json',
    )
    assert resp.status_code in (400, 401)


@pytest.mark.django_db
def test_login_2fa_required_when_enabled(api_client, make_user, user_password, disable_throttling):
    user = make_user(username='frank', is_active=True)
    profile = user.profile
    profile.two_factor_enabled = True
    profile.two_factor_secret = "ABCDEFGHIJKLMNOP"
    profile.save()

    resp = api_client.post(
        '/api/users/login/',
        {"username": "frank", "password": user_password},
        format='json',
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get('requires_2fa') is True
    assert data.get('user_id') == user.id


# ─── profile ──────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_profile_auto_created_via_signal(make_user):
    user = make_user(username='gina')
    assert Profile.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_me_endpoint_returns_username(auth_client):
    resp = auth_client.get('/api/users/me/')
    assert resp.status_code == 200
    assert resp.json()['username'] == auth_client.user.username


@pytest.mark.django_db
def test_change_password_requires_old_password(auth_client, disable_throttling):
    resp = auth_client.post(
        '/api/users/change-password/',
        {"old_password": "wrongOld", "new_password": "AnotherStrong!234"},
        format='json',
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_change_password_works_with_correct_old_password(auth_client, user_password, disable_throttling):
    resp = auth_client.post(
        '/api/users/change-password/',
        {"old_password": user_password, "new_password": "AnotherStrong!234"},
        format='json',
    )
    assert resp.status_code == 200


# ─── friendships ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_friend_request_create_and_accept(make_user, disable_throttling):
    sender = make_user(username='heidi', is_active=True)
    receiver = make_user(username='ivan', is_active=True)

    sender_client = _bearer_client(sender)
    receiver_client = _bearer_client(receiver)

    resp = sender_client.post(
        '/api/users/social/friendships/',
        {"receiver": receiver.profile.id},
        format='json',
    )
    assert resp.status_code == 201, resp.content
    fid = resp.json()['id']

    resp = receiver_client.post(f'/api/users/social/friendships/{fid}/accept/')
    assert resp.status_code == 200
    assert Friendship.objects.get(id=fid).status == 'accepted'


@pytest.mark.django_db
def test_friend_request_self_rejected(auth_client, disable_throttling):
    resp = auth_client.post(
        '/api/users/social/friendships/',
        {"receiver": auth_client.user.profile.id},
        format='json',
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_friend_request_duplicate_rejected(make_user, disable_throttling):
    sender = make_user(username='judy', is_active=True)
    receiver = make_user(username='kim', is_active=True)
    Friendship.objects.create(sender=sender.profile, receiver=receiver.profile)

    client = _bearer_client(sender)
    resp = client.post(
        '/api/users/social/friendships/',
        {"receiver": receiver.profile.id},
        format='json',
    )
    assert resp.status_code == 400


# ─── throttling ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_login_throttle_enforced(api_client):
    from django.core.cache import cache
    from rest_framework.throttling import SimpleRateThrottle

    original = SimpleRateThrottle.THROTTLE_RATES.get('login')
    SimpleRateThrottle.THROTTLE_RATES['login'] = '2/min'
    cache.clear()
    try:
        api_client.post('/api/users/login/', {"username": "x", "password": "y"}, format='json')
        api_client.post('/api/users/login/', {"username": "x", "password": "y"}, format='json')
        resp = api_client.post('/api/users/login/', {"username": "x", "password": "y"}, format='json')
        assert resp.status_code == 429, resp.content
        assert resp.json()['error']['code'] == 'RATE_LIMITED'
    finally:
        if original is None:
            SimpleRateThrottle.THROTTLE_RATES.pop('login', None)
        else:
            SimpleRateThrottle.THROTTLE_RATES['login'] = original
        cache.clear()


# ─── admin ────────────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_admin_check_returns_false_for_non_admin(auth_client, settings, disable_throttling):
    settings.ADMIN_USERNAMES = ['someoneelse']
    resp = auth_client.get('/api/users/admin/check/')
    assert resp.status_code == 200
    assert resp.json()['is_admin'] is False


@pytest.mark.django_db
def test_admin_users_list_blocks_non_admin(auth_client, settings, disable_throttling):
    settings.ADMIN_USERNAMES = []
    resp = auth_client.get('/api/users/admin/users/')
    assert resp.status_code == 403
    assert resp.json()['error']['code'] == 'PERMISSION_DENIED'


@pytest.mark.django_db
def test_admin_users_list_allowed_for_admin(make_user, settings, disable_throttling):
    admin = make_user(username='theboss', is_active=True)
    settings.ADMIN_USERNAMES = [admin.username]
    client = _bearer_client(admin)
    resp = client.get('/api/users/admin/users/')
    assert resp.status_code == 200
