from .models import Log

def create_log(user, message, level="info", context=None, source="backend"):
    Log.objects.create(
        user=user,
        message=message,
        level=level,
        context=context,
        source=source
    )