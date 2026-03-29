from django.db import models
import uuid
from django.conf import settings

# Create your models here.
class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE) # not storing the username as a string
    config = models.JSONField(null=True, blank=True) # did it as a json until we decide
    def __str__(self):
        return str(self.id)