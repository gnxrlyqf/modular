"""Global DRF exception handler — emits structured error envelopes.

Envelope shape:
    {"error": {"code": "<CODE>", "message": "<msg>", "details": {<field>: [...] }}}
"""
import logging

from rest_framework.views import exception_handler as drf_default_handler
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework import status as drf_status
from django.http import Http404
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied

logger = logging.getLogger(__name__)


_CODE_BY_STATUS = {
    400: "INVALID_INPUT",
    401: "UNAUTHENTICATED",
    403: "PERMISSION_DENIED",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    415: "UNSUPPORTED_MEDIA_TYPE",
    429: "RATE_LIMITED",
    500: "SERVER_ERROR",
}


def _flatten_details(detail):
    """DRF detail can be dict / list / str / ErrorDetail. Normalize to dict-or-list-or-str."""
    if isinstance(detail, dict):
        return {k: _flatten_details(v) for k, v in detail.items()}
    if isinstance(detail, list):
        return [_flatten_details(v) for v in detail]
    return str(detail)


def _summary_message(detail):
    if isinstance(detail, dict):
        for v in detail.values():
            msg = _summary_message(v)
            if msg:
                return msg
        return ""
    if isinstance(detail, list):
        for v in detail:
            msg = _summary_message(v)
            if msg:
                return msg
        return ""
    return str(detail)


def custom_exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = NotFound()
    if isinstance(exc, DjangoPermissionDenied):
        exc = PermissionDenied()

    response = drf_default_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception in view %s", context.get("view"))
        return Response(
            {
                "error": {
                    "code": "SERVER_ERROR",
                    "message": "Internal server error.",
                    "details": {},
                }
            },
            status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    status_code = response.status_code
    detail = response.data
    flat = _flatten_details(detail)

    if isinstance(exc, ValidationError):
        code = "INVALID_INPUT"
        if isinstance(flat, dict):
            details = flat
            message = _summary_message(flat) or "Validation failed."
        else:
            details = {"non_field_errors": flat if isinstance(flat, list) else [flat]}
            message = _summary_message(flat) or "Validation failed."
    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        code = "UNAUTHENTICATED"
        message = _summary_message(flat) or "Authentication required."
        details = {}
    elif isinstance(exc, PermissionDenied):
        code = "PERMISSION_DENIED"
        message = _summary_message(flat) or "Permission denied."
        details = {}
    elif isinstance(exc, NotFound):
        code = "NOT_FOUND"
        message = _summary_message(flat) or "Resource not found."
        details = {}
    elif isinstance(exc, MethodNotAllowed):
        code = "METHOD_NOT_ALLOWED"
        message = _summary_message(flat) or "Method not allowed."
        details = {}
    elif isinstance(exc, Throttled):
        code = "RATE_LIMITED"
        wait = getattr(exc, "wait", None)
        message = _summary_message(flat) or "Too many requests."
        details = {"retry_after": wait} if wait is not None else {}
    else:
        code = _CODE_BY_STATUS.get(status_code, "ERROR")
        message = _summary_message(flat) or "Request failed."
        details = flat if isinstance(flat, dict) else {"detail": flat}

    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    return response
