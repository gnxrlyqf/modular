"""Seed script: create test users with predictable + randomized friendships.

Usage:
    python manage.py shell < create_test_users.py
    # or:
    python create_test_users.py

The admin user listed in ADMIN_USERNAMES (env, default 'admin1') is also seeded
with the shared test password — this matches the .env.example default so the
admin login works out of the box.
"""
import os
import random
import sys

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402

from users.models import Friendship, Profile  # noqa: E402

User = get_user_model()

DEFAULT_PASSWORD = "password123"

# Admin user — matches ADMIN_USERNAMES env (default 'admin1' in .env.example).
ADMIN_USERS = [
    {"username": name, "email": f"{name}@school.com"}
    for name in (getattr(settings, 'ADMIN_USERNAMES', None) or ['admin1'])
]

USERS = ADMIN_USERS + [
    {"username": "test1", "email": "test1@school.com"},
    {"username": "test2", "email": "test2@school.com"},
    {"username": "test3", "email": "test3@school.com"},
    {"username": "test4", "email": "test4@school.com"},
    {"username": "test5", "email": "test5@school.com"},
    {"username": "test6", "email": "test6@school.com"},
    {"username": "test7", "email": "test7@school.com"},
    {"username": "test8", "email": "test8@school.com"},
]

# Predefined friendships: (sender_username, receiver_username, status)
PREDEFINED = [
    ("test1", "test2", "accepted"),
    ("test1", "test3", "accepted"),
    ("test2", "test3", "accepted"),
    ("test1", "test4", "pending"),
    ("test5", "test1", "pending"),
    ("test4", "test6", "accepted"),
]


def ensure_user(data):
    user, created = User.objects.get_or_create(
        username=data['username'],
        defaults={'email': data['email'], 'is_active': True, 'is_verified': True},
    )
    if created:
        user.set_password(DEFAULT_PASSWORD)
        user.is_active = True
        user.is_verified = True
        user.save()
        print(f"created {user.username}")
    else:
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
        print(f"exists  {user.username}")
    Profile.objects.get_or_create(user=user)
    return user


def ensure_friendship(sender_user, receiver_user, status):
    sender = sender_user.profile
    receiver = receiver_user.profile
    existing = Friendship.objects.filter(
        sender__in=[sender, receiver],
        receiver__in=[sender, receiver],
    ).first()
    if existing:
        if existing.status != status:
            existing.status = status
            existing.save(update_fields=['status'])
            print(f"updated {sender_user.username} -> {receiver_user.username} ({status})")
        else:
            print(f"keep    {sender_user.username} -> {receiver_user.username} ({status})")
        return existing
    fr = Friendship.objects.create(sender=sender, receiver=receiver, status=status)
    print(f"link    {sender_user.username} -> {receiver_user.username} ({status})")
    return fr


def add_random_friendships(users, count=5, seed=42):
    rng = random.Random(seed)
    pool = list(users)
    added = 0
    attempts = 0
    while added < count and attempts < count * 10:
        attempts += 1
        a, b = rng.sample(pool, 2)
        if Friendship.objects.filter(
            sender__in=[a.profile, b.profile],
            receiver__in=[a.profile, b.profile],
        ).exists():
            continue
        status = rng.choice(['pending', 'accepted'])
        ensure_friendship(a, b, status)
        added += 1


def run():
    users = [ensure_user(d) for d in USERS]
    by_name = {u.username: u for u in users}

    for sender_name, receiver_name, status in PREDEFINED:
        s = by_name.get(sender_name)
        r = by_name.get(receiver_name)
        if s and r:
            ensure_friendship(s, r, status)

    add_random_friendships(users, count=4)

    admin_names = getattr(settings, 'ADMIN_USERNAMES', None) or []
    print("\nsummary:")
    print(f"  users:       {User.objects.count()}")
    print(f"  friendships: {Friendship.objects.count()} "
          f"(pending={Friendship.objects.filter(status='pending').count()}, "
          f"accepted={Friendship.objects.filter(status='accepted').count()})")
    print(f"  admins:      {admin_names or '(none — set ADMIN_USERNAMES env)'}")
    print(f"  password:    {DEFAULT_PASSWORD}  (applies to all seeded users)")


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:  # pragma: no cover
        print(f"error: {exc}", file=sys.stderr)
        raise
