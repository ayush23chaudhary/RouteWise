import time
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    GET /api/v1/health
    Basic service health check returning 200 OK.
    """

    def get(self, request) -> Response:
        return Response(
            {
                "status": "healthy",
                "service": "spotter-ai-backend",
                "timestamp": time.time(),
            },
            status=status.HTTP_200_OK,
        )


class ReadinessCheckView(APIView):
    """
    GET /api/v1/readiness
    Verifies database and Redis cache connectivity latency for k8s/Render readiness probes.
    """

    def get(self, request) -> Response:
        checks: dict[str, Any] = {}
        is_ready = True

        # 1. Database Connectivity Check
        try:
            from django.db import connection

            start = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            db_latency_ms = (time.time() - start) * 1000
            checks["database"] = {"status": "connected", "latency_ms": round(db_latency_ms, 2)}
        except Exception as exc:
            checks["database"] = {"status": "error", "error": str(exc)}
            is_ready = False

        # 2. Redis Cache Connectivity Check
        try:
            from django.core.cache import cache

            start = time.time()
            cache.set("readiness_ping", "pong", timeout=5)
            ping_res = cache.get("readiness_ping")
            cache_latency_ms = (time.time() - start) * 1000
            checks["cache"] = {
                "status": "connected" if ping_res == "pong" else "fallback",
                "latency_ms": round(cache_latency_ms, 2),
            }
        except Exception as exc:
            checks["cache"] = {"status": "degraded", "error": str(exc)}

        http_status = status.HTTP_200_OK if is_ready else status.HTTP_539_SERVICE_UNAVAILABLE if hasattr(status, "HTTP_539_SERVICE_UNAVAILABLE") else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(
            {
                "status": "ready" if is_ready else "not_ready",
                "checks": checks,
            },
            status=http_status,
        )


class LivenessCheckView(APIView):
    """
    GET /api/v1/liveness
    Process liveness probe endpoint.
    """

    def get(self, request) -> Response:
        return Response({"status": "alive"}, status=status.HTTP_200_OK)
