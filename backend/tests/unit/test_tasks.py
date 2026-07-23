import unittest
import uuid
from apps.trips.tasks import generate_trip_schedule_async, audit_trip_compliance_async

try:
    import django
    HAS_DJANGO = True
except ImportError:
    HAS_DJANGO = False

@unittest.skipUnless(HAS_DJANGO, "Django not installed in local environment")
class TestBackgroundTasks(unittest.TestCase):
    def test_async_schedule_generation_missing_trip(self):
        fake_id = str(uuid.uuid4())
        res = generate_trip_schedule_async(fake_id)
        self.assertEqual(res["status"], "FAILED")
        self.assertEqual(res["reason"], "Trip not found")

    def test_async_compliance_audit_missing_trip(self):
        fake_id = str(uuid.uuid4())
        res = audit_trip_compliance_async(fake_id)
        self.assertEqual(res["status"], "FAILED")
        self.assertEqual(res["reason"], "Trip not found")

if __name__ == "__main__":
    unittest.main()
