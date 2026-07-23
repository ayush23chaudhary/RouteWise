import os
from typing import Any

try:
    from celery import Celery
    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False

if HAS_CELERY:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
    app = Celery("spotter_ai")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()
else:
    class CeleryFallbackStub:
        def task(self, *args: Any, **kwargs: Any) -> Any:
            def decorator(func: Any) -> Any:
                func.delay = func
                return func
            return decorator
    app = CeleryFallbackStub()  # type: ignore[assignment]
