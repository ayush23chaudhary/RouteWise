import pytest
import uuid
from datetime import datetime, timezone
from rest_framework.test import APIClient
from apps.drivers.models import Driver

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def sample_driver(db):
    return Driver.objects.create(
        id=uuid.uuid4(),
        first_name="Test",
        last_name="Driver",
        license_number="DL-TEST-12345",
    )

@pytest.fixture
def sample_trip_payload(sample_driver):
    return {
        "driver_id": str(sample_driver.id),
        "start_time": "2026-07-24T08:00:00Z",
        "start_location": {"latitude": 37.7749, "longitude": -122.4194},
        "pickup_location": {"latitude": 34.0522, "longitude": -118.2437},
        "dropoff_location": {"latitude": 40.7128, "longitude": -74.0060},
        "cycle_type": "70h_8d",
        "initial_hours_used": 10.5,
    }
