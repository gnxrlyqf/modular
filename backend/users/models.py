from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

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

    def_settings = models.JSONField(
        default=get_default_synth_settings,
        help_text="Custom UI and Synth preferences stored as JSON."
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

class Friendship(models.Model):
    """
    Tracks the relationship between two users.
    
    Statuses:
        PENDING: Request sent, waiting for response.
        ACCEPTED: Users are now friends.
        BLOCKED: One user has blocked the other.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    )

    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_friend_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_friend_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents a user from sending multiple requests to the same person
        unique_together = ('from_user', 'to_user')
        verbose_name = "Friendship"
        verbose_name_plural = "Friendships"

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"