from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

ONLINE_THRESHOLD = timedelta(seconds=60)

class User(AbstractUser):
    is_verified = models.BooleanField(default=False)

def get_default_synth_settings():
    """Returns the default UI and audio configuration for the synth."""
    return {
        "theme": "dark",
        "cable_colors": ["#00ff00", "#ff00ff"],
        "sample_rate": 44100,
        "show_grid": True
    }

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(blank=True)
    display_name = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    xp = models.PositiveBigIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)

    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)

    last_seen = models.DateTimeField(null=True, blank=True)

    @property
    def is_online(self) -> bool:
        if self.last_seen is None:
            return False
        return (timezone.now() - self.last_seen) < ONLINE_THRESHOLD

    def_settings = models.JSONField(
        default=get_default_synth_settings,
        help_text="Custom UI and Synth preferences stored as JSON."
    )

    friends = models.ManyToManyField(
        'self', 
        through='Friendship', 
        symmetrical=False, 
        related_name='related_to'
    )

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

def send_verification_email(user, request):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    link = f"http://localhost:8000/api/auth/verify-email/{uid}/{token}/"

    send_mail(
        "Verify your account",
        f"Click to verify: {link}",
        "noreply@app.com",
        [user.email],
        fail_silently=False,
    )

# Friends
class Friendship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    )

    sender = models.ForeignKey(Profile, related_name='sent_friend_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(Profile, related_name='received_friend_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents a user from sending multiple requests to the same person
        unique_together = ('sender', 'receiver')
        verbose_name = "Friendship"
        verbose_name_plural = "Friendships"

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.status})"

def is_blocked_between(profile_a, profile_b):
    """True if either profile has blocked the other."""
    return Friendship.objects.filter(
        models.Q(sender=profile_a, receiver=profile_b, status='blocked') |
        models.Q(sender=profile_b, receiver=profile_a, status='blocked')
    ).exists()


class Message(models.Model):
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['sender', 'receiver', 'created_at']),
        ]


class Notification(models.Model):
    TYPE_CHOICES = (
        ('message', 'Message'),
        ('friend_request', 'Friend Request'),
    )

    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='+')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    related_id = models.IntegerField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
        ]


# Oauth
class SocialAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='social_auth')
    provider = models.CharField(max_length=20)
    provider_id = models.CharField(max_length=255)

    class Meta:
        unique_together = ('provider', 'provider_id')
