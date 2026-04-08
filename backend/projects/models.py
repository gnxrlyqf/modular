from django.db import models
import uuid
from django.conf import settings

# Create your models here.
class Project(models.Model):
    name = models.CharField(max_length=255)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE) # not storing the username as a string
    config = models.JSONField(null=True, blank=True) # did it as a json until we decide
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return str(self.id)