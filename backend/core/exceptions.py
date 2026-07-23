import uuid
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """RFC 7807 Problem Details compliant exception handler for REST APIs."""
    response = exception_handler(exc, context)

    if response is not None:
        correlation_id = getattr(context.get("request"), "correlation_id", str(uuid.uuid4()))

        problem_details = {
            "type": "https://api.spotter-ai.com/errors/" + exc.__class__.__name__.lower(),
            "title": response.status_text,
            "status": response.status_code,
            "detail": str(exc),
            "instance": context.get("request").path if context.get("request") else "",
            "correlation_id": correlation_id,
            "invalid_params": response.data if isinstance(response.data, (dict, list)) else [],
        }
        response.data = problem_details
    else:
        request = context.get("request")
        correlation_id = (
            getattr(request, "correlation_id", str(uuid.uuid4())) if request else str(uuid.uuid4())
        )

        problem_details = {
            "type": "https://api.spotter-ai.com/errors/internal-server-error",
            "title": "Internal Server Error",
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "detail": "An unexpected system error occurred. Please contact support with the correlation ID.",
            "instance": request.path if request else "",
            "correlation_id": correlation_id,
        }
        return Response(problem_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
