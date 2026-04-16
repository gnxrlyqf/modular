from .file_logger import write_log


def create_log(user, message, level="info", context=None, source="backend"):
    write_log(
        user=user.username if user else None,
        message=message,
        level=level,
        context=context,
        source=source,
    )