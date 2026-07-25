import unittest
import uuid
from datetime import datetime, timezone

from domain.entities.trip import Trip
from domain.entities.waypoint import Waypoint
from domain.services.hos_engine import HOSSchedulingEngine
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState


class TestHOSSchedulingEngine(unittest.TestCase):
    def setUp(self):
        self.engine = HOSSchedulingEngine()
        self.driver_id = uuid.uuid4()
        self.start_time = datetime(2026, 7, 24, 8, 0, 0, tzinfo=timezone.utc)
        self.sf = Coordinates(37.7749, -122.4194)
        self.la = Coordinates(34.0522, -118.2437)
        self.ny = Coordinates(40.7128, -74.0060)

    def _create_trip(self, distance_miles: float, initial_cycle_used: int = 0) -> Trip:
        trip = Trip(
            id=uuid.uuid4(),
            driver_id=self.driver_id,
            start_time=self.start_time,
            initial_hos_state=DriverHOSState(cycle_seconds_used=initial_cycle_used),
            total_distance_miles=distance_miles,
        )
        trip.add_waypoint(Waypoint(uuid.uuid4(), 1, "START", self.sf))
        trip.add_waypoint(Waypoint(uuid.uuid4(), 2, "PICKUP", self.la, duration_seconds=3600))
        trip.add_waypoint(Waypoint(uuid.uuid4(), 3, "DROPOFF", self.ny, duration_seconds=3600))
        return trip

    def test_short_trip_schedule_events(self):
        # 300 mile trip (~6 hours driving) -> Pre-trip, Pickup, Drive, Dropoff
        trip = self._create_trip(distance_miles=300.0)
        scheduled_trip = self.engine.generate_schedule(trip)

        event_types = [e.event_type for e in scheduled_trip.events]
        self.assertIn("PRE_TRIP", event_types)
        self.assertIn("PICKUP", event_types)
        self.assertIn("DRIVE", event_types)
        self.assertIn("DROPOFF", event_types)

    def test_8_hour_driving_break_insertion(self):
        # 450 mile trip (~9 hours driving) -> Requires 30-minute rest break after 8 hours
        trip = self._create_trip(distance_miles=450.0)
        scheduled_trip = self.engine.generate_schedule(trip)

        event_types = [e.event_type for e in scheduled_trip.events]
        self.assertIn("REST_BREAK", event_types)
        break_event = next(e for e in scheduled_trip.events if e.event_type == "REST_BREAK")
        self.assertEqual(break_event.duty_status, "OFF")
        self.assertEqual(break_event.duration_seconds, 1800)

    def test_10_hour_daily_reset_insertion(self):
        # 700 mile trip (~14 hours driving) -> Exceeds 11h driving limit -> Requires 10-hour reset
        trip = self._create_trip(distance_miles=700.0)
        scheduled_trip = self.engine.generate_schedule(trip)

        event_types = [e.event_type for e in scheduled_trip.events]
        self.assertIn("DAILY_RESET", event_types)
        reset_event = next(e for e in scheduled_trip.events if e.event_type == "DAILY_RESET")
        self.assertEqual(reset_event.duty_status, "OFF")
        self.assertEqual(reset_event.duration_seconds, 36000)

    def test_1000_mile_fuel_stop_insertion(self):
        # 1,200 mile trip -> Requires fuel stop after 1,000 miles
        trip = self._create_trip(distance_miles=1200.0)
        scheduled_trip = self.engine.generate_schedule(trip)

        event_types = [e.event_type for e in scheduled_trip.events]
        self.assertIn("FUEL_STOP", event_types)
        fuel_event = next(e for e in scheduled_trip.events if e.event_type == "FUEL_STOP")
        self.assertEqual(fuel_event.duty_status, "ON")
        self.assertEqual(fuel_event.duration_seconds, 1800)

    def test_initial_cycle_exhaustion_34h_restart(self):
        # Initial cycle = 70 hours (252,000s) -> Must trigger 34-hour restart before starting trip
        trip = self._create_trip(distance_miles=100.0, initial_cycle_used=252000)
        scheduled_trip = self.engine.generate_schedule(trip)

        first_event = scheduled_trip.events[0]
        self.assertEqual(first_event.event_type, "RESTART_34H")
        self.assertEqual(first_event.duration_seconds, 122400)

if __name__ == "__main__":
    unittest.main()
