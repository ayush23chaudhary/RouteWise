import unittest
import uuid
from datetime import datetime, timezone

from repositories.driver_repository import InMemoryDriverRepository
from repositories.trip_repository import InMemoryTripRepository
from services.routing_service import GeospatialRoutingService
from services.scheduling_service import HOSSchedulingService
from services.trip_service import TripService
from services.validation_service import ComplianceValidationService


class TestTripCreationWorkflow(unittest.TestCase):
    def setUp(self):
        self.trip_repo = InMemoryTripRepository()
        self.driver_repo = InMemoryDriverRepository()
        self.routing_service = GeospatialRoutingService(api_key="")
        self.scheduling_engine = HOSSchedulingService()
        self.validation_engine = ComplianceValidationService()

        self.trip_service = TripService(
            trip_repo=self.trip_repo,
            driver_repo=self.driver_repo,
            routing_service=self.routing_service,
            scheduling_engine=self.scheduling_engine,
            validation_engine=self.validation_engine,
        )

    def test_plan_trip_orchestration_success(self):
        driver_id = uuid.uuid4()
        start_time = datetime.now(timezone.utc)
        origin_coords = (37.7749, -122.4194)
        pickup_coords = (34.0522, -118.2437)
        dropoff_coords = (40.7128, -74.0060)

        trip = self.trip_service.plan_trip(
            driver_id=driver_id,
            start_time=start_time,
            origin_coords=origin_coords,
            pickup_coords=pickup_coords,
            dropoff_coords=dropoff_coords,
            initial_cycle_used_seconds=36000,
        )

        self.assertIsNotNone(trip.id)
        self.assertEqual(trip.driver_id, driver_id)
        self.assertEqual(trip.status, "PLANNED")
        self.assertEqual(len(trip.waypoints), 3)
        self.assertEqual(trip.waypoints[0].waypoint_type, "START")
        self.assertEqual(trip.waypoints[1].waypoint_type, "PICKUP")
        self.assertEqual(trip.waypoints[1].duration_seconds, 3600)
        self.assertEqual(trip.waypoints[2].waypoint_type, "DROPOFF")
        self.assertEqual(trip.waypoints[2].duration_seconds, 3600)
        self.assertGreater(trip.total_distance_miles, 0.0)

    def test_plan_trip_invalid_coordinates(self):
        driver_id = uuid.uuid4()
        start_time = datetime.now(timezone.utc)

        with self.assertRaises(ValueError):
            self.trip_service.plan_trip(
                driver_id=driver_id,
                start_time=start_time,
                origin_coords=(99.0, -122.4194),
                pickup_coords=(34.0522, -118.2437),
                dropoff_coords=(40.7128, -74.0060),
            )

    def test_plan_trip_invalid_initial_cycle(self):
        driver_id = uuid.uuid4()
        start_time = datetime.now(timezone.utc)

        with self.assertRaises(ValueError):
            self.trip_service.plan_trip(
                driver_id=driver_id,
                start_time=start_time,
                origin_coords=(37.7749, -122.4194),
                pickup_coords=(34.0522, -118.2437),
                dropoff_coords=(40.7128, -74.0060),
                initial_cycle_used_seconds=-500,
            )

if __name__ == "__main__":
    unittest.main()
