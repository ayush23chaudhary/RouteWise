import unittest
import uuid
from datetime import datetime, timedelta, timezone
from domain.entities.trip import Trip
from domain.entities.waypoint import Waypoint
from domain.entities.schedule_event import ScheduleEvent
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState
from domain.services.validation_engine import ComplianceValidationEngine
from domain.services.hos_engine import HOSSchedulingEngine

class TestComplianceValidationEngine(unittest.TestCase):
    def setUp(self):
        self.validator = ComplianceValidationEngine()
        self.scheduler = HOSSchedulingEngine()
        self.coords_sf = Coordinates(37.7749, -122.4194)
        self.coords_la = Coordinates(34.0522, -118.2437)
        self.start_time = datetime(2026, 7, 24, 8, 0, 0, tzinfo=timezone.utc)

    def test_compliant_trip_validation_passes(self):
        trip = Trip(
            id=uuid.uuid4(),
            driver_id=uuid.uuid4(),
            start_time=self.start_time,
            total_distance_miles=400.0,
        )
        trip.add_waypoint(Waypoint(uuid.uuid4(), 1, "START", self.coords_sf))
        trip.add_waypoint(Waypoint(uuid.uuid4(), 2, "PICKUP", self.coords_sf, duration_seconds=3600))
        trip.add_waypoint(Waypoint(uuid.uuid4(), 3, "DROPOFF", self.coords_la, duration_seconds=3600))

        scheduled_trip = self.scheduler.generate_schedule(trip)

        val_result = self.validator.validate_trip(scheduled_trip)
        self.assertTrue(val_result.is_compliant)
        self.assertEqual(len(val_result.violations), 0)

    def test_11h_driving_violation_detection(self):
        trip = Trip(id=uuid.uuid4(), driver_id=uuid.uuid4(), start_time=self.start_time)
        t1 = self.start_time
        t2 = t1 + timedelta(hours=12)  # 12 hours driving (Exceeds 11h limit)

        trip.events = [
            ScheduleEvent(
                id=uuid.uuid4(),
                sequence=1,
                event_type="DRIVE",
                duty_status="D",
                start_time=t1,
                end_time=t2,
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_la,
                distance_miles=600.0,
            )
        ]

        val_result = self.validator.validate_trip(trip)
        self.assertFalse(val_result.is_compliant)
        self.assertTrue(any("11-Hour Driving Limit Exceeded" in v for v in val_result.violations))

    def test_8h_break_violation_detection(self):
        trip = Trip(id=uuid.uuid4(), driver_id=uuid.uuid4(), start_time=self.start_time)
        t1 = self.start_time
        t2 = t1 + timedelta(hours=9)

        trip.events = [
            ScheduleEvent(
                id=uuid.uuid4(),
                sequence=1,
                event_type="DRIVE",
                duty_status="D",
                start_time=t1,
                end_time=t2,
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_la,
                distance_miles=450.0,
            )
        ]

        val_result = self.validator.validate_trip(trip)
        self.assertFalse(val_result.is_compliant)
        self.assertTrue(any("8-Hour Rest Break Rule Exceeded" in v for v in val_result.violations))

    def test_contiguity_gap_violation_detection(self):
        trip = Trip(id=uuid.uuid4(), driver_id=uuid.uuid4(), start_time=self.start_time)
        t1 = self.start_time
        t2 = t1 + timedelta(hours=2)
        t_gap = t2 + timedelta(minutes=15)
        t3 = t_gap + timedelta(hours=2)

        trip.events = [
            ScheduleEvent(
                id=uuid.uuid4(),
                sequence=1,
                event_type="PRE_TRIP",
                duty_status="ON",
                start_time=t1,
                end_time=t2,
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_sf,
            ),
            ScheduleEvent(
                id=uuid.uuid4(),
                sequence=2,
                event_type="DRIVE",
                duty_status="D",
                start_time=t_gap,
                end_time=t3,
                start_coordinates=self.coords_sf,
                end_coordinates=self.coords_la,
                distance_miles=100.0,
            ),
        ]

        val_result = self.validator.validate_trip(trip)
        self.assertFalse(val_result.is_compliant)
        self.assertTrue(any("Timeline contiguity gap/overlap" in v for v in val_result.violations))

if __name__ == "__main__":
    unittest.main()
