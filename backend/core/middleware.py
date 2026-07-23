import uuid
import time
import logging
from typing import Callable
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("api.requests")

class CorrelationIdMiddleware:
    """
    Middleware that assigns a unique Correlation-ID (X-Correlation-ID) to every incoming HTTP request.
    """
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.correlation_id = correlation_id # type: ignore[attr-defined]

        response = self.get_response(request)
        response["X-Correlation-ID"] = correlation_id
        return response


class RequestLoggingMiddleware:
    """
    Middleware that logs execution latency and HTTP metrics per request.
    """
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        start_time = time.time()
        response = self.get_response(request)
        duration_ms = (time.time() - start_time) * 1000

        correlation_id = getattr(request, "correlation_id", "UNKNOWN")
        logger.info(
            f"HTTP {request.method} {request.path} -> Status {response.status_code} "
            f"[{duration_ms:.2f}ms] [CorrelationID: {correlation_id}]"
        )
        return response
