from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to produce consistent error format:
    {"status": "error", "error": {"code": "...", "message": "...", "details": {...}}}
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    error_code = _get_error_code(exc, response)

    error_body = {
        "code": error_code,
        "message": _get_message(exc),
    }

    if isinstance(exc, ValidationError):
        error_body["code"] = "VALIDATION_ERROR"
        error_body["message"] = "Invalid input."
        error_body["details"] = response.data

    response.data = {
        "status": "error",
        "error": error_body,
    }

    return response


def _get_error_code(exc, response):
    status_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        429: "THROTTLED",
    }
    return status_map.get(response.status_code, "ERROR")


def _get_message(exc):
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            return detail[0] if detail else "An error occurred."
    return "An error occurred."
