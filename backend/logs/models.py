from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Log(models.Model):
    LEVELS = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("debug", "Debug"),
        ("action", "Action"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="logs")
    level = models.CharField(max_length=10, choices=LEVELS, default="info")
    message = models.TextField()
    context = models.JSONField(null=True, blank=True)

    source = models.CharField(
        max_length=20,
        default="frontend"
    )  # frontend OR backend

    created_at = models.DateTimeField(auto_now_add=True)