import uuid
from datetime import datetime
from domain.entities.trip import Trip as DomainTrip
from domain.entities.waypoint import Waypoint as DomainWaypoint
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState
from domain.interfaces.routing import IRoutingService
from domain.interfaces.scheduler import ISchedulingEngine
from domain.interfaces.validator import IValidationEngine
from repositories.trip_repository import TripRepository
from repositories.driver_repository import DriverRepository

class TripService:
    """
    Application Service orchestrating the complete trip planning workflow.
    """
    def __init__(
        self,
        trip_repo: TripRepository,
        driver_repo: DriverRepository,
        routing_service: IRoutingService,
        scheduling_engine: ISchedulingEngine,
        validation_engine: IValidationEngine,
    ) -> None:
        self.trip_repo = trip_repo
        self.driver_repo = driver_repo
        self.routing_service = routing_service
        self.scheduling_engine = scheduling_engine
        self.validation_engine = validation_engine

    def plan_trip(
        self,
        driver_id: uuid.UUID,
        start_time: datetime,
        origin_coords: tuple[float, float],
        pickup_coords: tuple[float, float],
        dropoff_coords: tuple[float, float],
        initial_cycle_used_seconds: int = 0,
    ) -> DomainTrip:
        trip_id = uuid.uuid4()
        hos_state = DriverHOSState(cycle_seconds_used=initial_cycle_used_seconds)

        trip = DomainTrip(
            id=trip_id,
            driver_id=driver_id,
            start_time=start_time,
            initial_hos_state=hos_state,
        )

        # Populate Waypoints
        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=1,
                waypoint_type="START",
                coordinates=Coordinates(*origin_coords),
            )
        )
        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=2,
                waypoint_type="PICKUP",
                coordinates=Coordinates(*pickup_coords),
                duration_seconds=3600,
            )
        )
        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=3,
                waypoint_type="DROPOFF",
                coordinates=Coordinates(*dropoff_coords),
                duration_seconds=3600,
            )
        )

        # 1. Fetch Route metrics
        route_info = self.routing_service.calculate_route(
            origin=Coordinates(*origin_coords),
            waypoints=[Coordinates(*pickup_coords)],
            destination=Coordinates(*dropoff_coords),
        )
        trip.total_distance_miles = route_info.get("distance_miles", 0.0)
        trip.total_duration_hours = route_info.get("duration_seconds", 0) / 3600.0

        # 2. Generate Schedule
        planned_trip = self.scheduling_engine.generate_schedule(trip)

        # 3. Validate Compliance
        val_result = self.validation_engine.validate_trip(planned_trip)
        if not val_result.is_compliant:
            raise ValueError(f"Trip schedule compliance failure: {val_result.violations}")

        # 4. Save to Repository
        saved_trip = self.trip_repo.save(planned_trip)
        return saved_trip
