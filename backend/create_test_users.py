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
from datetime import datetime, timedelta, timezone

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402

from projects.models import Project, ProjectVote  # noqa: E402
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


def _ts(days_ago: int, hour: int = 10) -> str:
    """ISO timestamp for N days ago at given UTC hour."""
    dt = datetime.now(tz=timezone.utc) - timedelta(days=days_ago)
    return dt.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


def _date_str(days_ago: int) -> str:
    dt = datetime.now(tz=timezone.utc) - timedelta(days=days_ago)
    return dt.strftime('%Y-%m-%d')


def _make_analytics(days_ago: int, hour: int, duration: int, modules: dict, share_count: int) -> dict:
    """Build a realistic analytics blob that Metabase SQL can query."""
    opened = _ts(days_ago, hour)
    closed_dt = datetime.fromisoformat(opened) + timedelta(seconds=duration)
    closed = closed_dt.isoformat()
    # shared_days: one entry per share spaced ~7 days apart
    shared_days = [_date_str(days_ago + i * 7) for i in range(share_count)]
    return {
        "session": {
            "opened_at": opened,
            "closed_at": closed,
            "session_duration": duration,
            "idle_time": duration // 8,
        },
        "modules": modules,
        "sharing": {
            "share_count": share_count,
            "shared_days": shared_days,
        },
    }


DEFAULT_CONFIG = {"camera": {}, "modules": [], "cables": []}

# (owner, name, created_days_ago, updated_days_ago, hour, session_duration_s, modules, share_count)
# Spread over 90 days; keep several recent to build a streak.
PROJECTS = [
    ("test1", "Acid Bassline",    62, 1,  14, 2700,
     {"oscillators": 2, "filters": 2, "effects": 1, "envelopes": 1, "outputs": 1}, 3),
    ("test1", "Ambient Pad",      45, 2,  21, 1800,
     {"oscillators": 1, "filters": 1, "lfos": 2, "effects": 2, "outputs": 1}, 1),
    ("test1", "Dark Arp",         20, 0,  16, 3300,
     {"oscillators": 3, "filters": 1, "envelopes": 2, "gains": 1, "outputs": 1}, 2),
    ("test2", "Glitch Sequencer", 55, 3,   9, 4200,
     {"oscillators": 2, "modulators": 3, "effects": 2, "outputs": 1}, 4),
    ("test2", "Noise Drone",      30, 4,  23, 900,
     {"oscillators": 1, "gains": 2, "effects": 1, "outputs": 1}, 0),
    ("test3", "Lo-Fi Beat",       80, 5,  11, 2100,
     {"oscillators": 2, "filters": 1, "envelopes": 1, "outputs": 1}, 2),
    ("test3", "Rain Machine",     15, 0,  18, 1500,
     {"oscillators": 1, "lfos": 1, "gains": 1, "outputs": 1}, 1),
    ("test4", "FM Lead",          70, 6,  13, 3600,
     {"oscillators": 4, "envelopes": 2, "filters": 1, "outputs": 1}, 5),
    ("test5", "Drone Patch",      40, 2,  20, 5400,
     {"oscillators": 2, "lfos": 3, "gains": 2, "effects": 1, "outputs": 1}, 2),
    ("test6", "Techno Stab",      25, 1,  15, 1200,
     {"oscillators": 2, "filters": 2, "envelopes": 1, "outputs": 1}, 3),
    ("test7", "Wobble Bass",      88, 7,  10, 2400,
     {"oscillators": 1, "filters": 3, "lfos": 2, "outputs": 1}, 1),
    ("test7", "Karplus Bass",     10, 0,  17, 3000,
     {"oscillators": 2, "filters": 1, "modulators": 1, "outputs": 1}, 0),
    ("test8", "Pad Swells",       50, 3,  12, 1800,
     {"oscillators": 2, "lfos": 2, "filters": 1, "effects": 1, "outputs": 1}, 2),
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


def ensure_project(owner, name, created_days_ago, updated_days_ago, hour, duration, modules, share_count):
    analytics = _make_analytics(updated_days_ago, hour, duration, modules, share_count)
    created_ts = datetime.now(tz=timezone.utc) - timedelta(days=created_days_ago)
    updated_ts = datetime.now(tz=timezone.utc) - timedelta(days=updated_days_ago)

    proj, created = Project.objects.get_or_create(
        user=owner,
        name=name,
        defaults={'config': DEFAULT_CONFIG, 'analytics': analytics},
    )
    if not created:
        proj.analytics = analytics
        proj.save(update_fields=['analytics'])

    # Force created_at / updated_at — auto_now(_add) fields require update()
    Project.objects.filter(pk=proj.pk).update(
        created_at=created_ts,
        updated_at=updated_ts,
    )
    proj.refresh_from_db()
    print(f"{'project ' if created else 'projkeep'} {owner.username}/{name} "
          f"(created -{created_days_ago}d, updated -{updated_days_ago}d)")
    return proj


def add_random_votes(projects, voters, seed=42):
    rng = random.Random(seed)
    for proj in projects:
        # pick random subset of voters (excluding owner)
        eligible = [u for u in voters if u.id != proj.user_id]
        k = rng.randint(1, min(len(eligible), 6))
        for voter in rng.sample(eligible, k):
            vote = rng.choice([1, 1, 1, -1])  # bias upvotes
            ProjectVote.objects.update_or_create(
                user=voter, project=proj, defaults={'vote': vote},
            )
    print(f"votes   {ProjectVote.objects.count()} total "
          f"(up={ProjectVote.objects.filter(vote=1).count()}, "
          f"down={ProjectVote.objects.filter(vote=-1).count()})")


def run():
    users = [ensure_user(d) for d in USERS]
    by_name = {u.username: u for u in users}

    for sender_name, receiver_name, status in PREDEFINED:
        s = by_name.get(sender_name)
        r = by_name.get(receiver_name)
        if s and r:
            ensure_friendship(s, r, status)

    add_random_friendships(users, count=4)

    projects = []
    for owner_name, proj_name, created_ago, updated_ago, hour, duration, modules, shares in PROJECTS:
        owner = by_name.get(owner_name)
        if owner:
            projects.append(ensure_project(owner, proj_name, created_ago, updated_ago, hour, duration, modules, shares))

    add_random_votes(projects, users)

    admin_names = getattr(settings, 'ADMIN_USERNAMES', None) or []
    print("\nsummary:")
    print(f"  users:       {User.objects.count()}")
    print(f"  projects:    {Project.objects.count()}")
    print(f"  votes:       {ProjectVote.objects.count()}")
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
