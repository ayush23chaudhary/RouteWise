import unittest

try:
    import os
    import django
    if not os.environ.get("DJANGO_SETTINGS_MODULE"):
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")
    django.setup()
    from rest_framework.test import APIRequestFactory
    from apps.api.v1.views.health import HealthCheckView, LivenessCheckView
    HAS_DRF = True
except Exception:
    HAS_DRF = False


@unittest.skipUnless(HAS_DRF, "Django REST Framework not installed in local environment")
class TestHealthViews(unittest.TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_health_check_view(self):
        request = self.factory.get("/api/v1/health")
        view = HealthCheckView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "healthy")

    def test_liveness_check_view(self):
        request = self.factory.get("/api/v1/liveness")
        view = LivenessCheckView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "alive")


if __name__ == "__main__":
    unittest.main()
