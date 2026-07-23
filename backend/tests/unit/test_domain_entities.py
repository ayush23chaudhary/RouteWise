import pytest
import uuid
from datetime import datetime, timezone
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState
from domain.entities.waypoint import Waypoint
from domain.entities.trip import Trip

def test_coordinates_valid():
    coords = Coordinates(latitude=37.7749, longitude=-122.4194)
    assert coords.latitude == 37.7749
    assert coords.longitude == -122.4194

def test_coordinates_invalid_latitude():
    with pytest.raises(ValueError):
        Coordinates(latitude=95.0, longitude=0.0)

def test_driver_hos_state_validation():
    state = DriverHOSState(driving_seconds_used=3600, cycle_seconds_used=36000)
    assert state.driving_seconds_used == 3600
    with pytest.raises(ValueError):
        DriverHOSState(driving_seconds_used=50000)

def test_trip_aggregate_add_waypoint():
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
    assert len(trip.waypoints) == 1
    assert trip.waypoints[0].sequence == 1
