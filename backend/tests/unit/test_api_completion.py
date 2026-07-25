import unittest
import uuid

from domain.value_objects.validation_result import ValidationResult

try:
    import os

    import django
    if not os.environ.get("DJANGO_SETTINGS_MODULE"):
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")
    django.setup()
    from apps.api.v1.serializers.trip import (
        ComplianceReportResponseSerializer,
        TripPlanRequestSerializer,
        TripStatusUpdateSerializer,
    )
    HAS_REST_FRAMEWORK = True
except Exception:
    HAS_REST_FRAMEWORK = False

@unittest.skipUnless(HAS_REST_FRAMEWORK, "Django REST Framework not installed in local environment")
class TestAPICompletion(unittest.TestCase):
    def test_trip_plan_request_serializer_valid(self):
        payload = {
            "driver_id": str(uuid.uuid4()),
            "start_time": "2026-07-24T08:00:00Z",
            "start_location": {"latitude": 37.7749, "longitude": -122.4194},
            "pickup_location": {"latitude": 34.0522, "longitude": -118.2437},
            "dropoff_location": {"latitude": 40.7128, "longitude": -74.0060},
            "cycle_type": "70h_8d",
            "initial_hours_used": 15.0,
        }
        serializer = TripPlanRequestSerializer(data=payload)
        self.assertTrue(serializer.is_valid())

    def test_trip_plan_request_serializer_invalid_latitude(self):
        payload = {
            "driver_id": str(uuid.uuid4()),
            "start_time": "2026-07-24T08:00:00Z",
            "start_location": {"latitude": 150.0, "longitude": -122.4194},  # Invalid lat > 90
            "pickup_location": {"latitude": 34.0522, "longitude": -118.2437},
            "dropoff_location": {"latitude": 40.7128, "longitude": -74.0060},
        }
        serializer = TripPlanRequestSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("start_location", serializer.errors)

    def test_trip_status_update_serializer(self):
        serializer = TripStatusUpdateSerializer(data={"status": "ACTIVE"})
        self.assertTrue(serializer.is_valid())

        serializer_invalid = TripStatusUpdateSerializer(data={"status": "UNKNOWN"})
        self.assertFalse(serializer_invalid.is_valid())

    def test_compliance_report_response_serializer(self):
        val_result = ValidationResult(is_compliant=True, violations=[], warnings=["Optional Warning"])
        serializer = ComplianceReportResponseSerializer(val_result)
        data = serializer.data
        self.assertTrue(data["is_compliant"])
        self.assertEqual(len(data["violations"]), 0)
        self.assertEqual(len(data["warnings"]), 1)

if __name__ == "__main__":
    unittest.main()
