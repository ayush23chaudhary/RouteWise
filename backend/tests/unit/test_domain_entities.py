import unittest
import uuid
from datetime import datetime, timezone
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState
from domain.entities.waypoint import Waypoint
from domain.entities.trip import Trip

class TestDomainEntities(unittest.TestCase):
    def test_coordinates_valid(self):
        coords = Coordinates(latitude=37.7749, longitude=-122.4194)
        self.assertEqual(coords.latitude, 37.7749)
        self.assertEqual(coords.longitude, -122.4194)

    def test_coordinates_invalid_latitude(self):
        with self.assertRaises(ValueError):
            Coordinates(latitude=95.0, longitude=0.0)

    def test_driver_hos_state_validation(self):
        state = DriverHOSState(driving_seconds_used=3600, cycle_seconds_used=36000)
        self.assertEqual(state.driving_seconds_used, 3600)
        with self.assertRaises(ValueError):
            DriverHOSState(driving_seconds_used=50000)

    def test_trip_aggregate_add_waypoint(self):
        trip_id = uuid.uuid4()
        driver_id = uuid.uuid4()
        trip = Trip(id=trip_id, driver_id=driver_id, start_time=datetime.now(timezone.utc))
        
        wp = Waypoint(
            id=uuid.uuid4(),
            sequence=1,
            waypoint_type="START",
            coordinates=Coordinates(37.7749, -122.4194),
        )
        trip.add_waypoint(wp)
        self.assertEqual(len(trip.waypoints), 1)
        self.assertEqual(trip.waypoints[0].sequence, 1)

if __name__ == "__main__":
    unittest.main()
