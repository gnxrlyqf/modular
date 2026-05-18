from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from users.models import Profile


class Command(BaseCommand):
    help = "Idempotently create the admin1 user (password: password123)."

    def handle(self, *args, **options):
        User = get_user_model()
        username = "admin1"
        email = "admin1@school.com"
        password = "password123"

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_active": True, "is_verified": True},
        )
        if created:
            user.set_password(password)
            user.is_active = True
            user.is_verified = True
            user.save()
            self.stdout.write(f"created {username}")
        else:
            self.stdout.write(f"exists  {username} (skipped)")

        Profile.objects.get_or_create(user=user)
