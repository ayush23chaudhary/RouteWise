import uuid
from datetime import datetime, timezone

from domain.entities.trip import Trip as DomainTrip
from domain.entities.waypoint import Waypoint as DomainWaypoint
from domain.interfaces.routing import IRoutingService
from domain.interfaces.scheduler import ISchedulingEngine
from domain.interfaces.validator import IValidationEngine
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.driver_hos_state import DriverHOSState
from repositories.driver_repository import IDriverRepository
from repositories.trip_repository import ITripRepository


class TripService:
    """
    Application Service orchestrating the complete trip creation workflow:
    Input validation -> Route calculation -> Domain aggregate initialization -> Persistence.
    """

    def __init__(
        self,
        trip_repo: ITripRepository,
        driver_repo: IDriverRepository,
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
        """Orchestrates full trip creation lifecycle."""
        origin = Coordinates(latitude=origin_coords[0], longitude=origin_coords[1])
        pickup = Coordinates(latitude=pickup_coords[0], longitude=pickup_coords[1])
        dropoff = Coordinates(latitude=dropoff_coords[0], longitude=dropoff_coords[1])

        if initial_cycle_used_seconds < 0 or initial_cycle_used_seconds > 252000:
            raise ValueError(
                "Initial cycle used seconds must be between 0 and 252,000 seconds (70 hours)."
            )

        trip_id = uuid.uuid4()
        hos_state = DriverHOSState(cycle_seconds_used=initial_cycle_used_seconds)

        trip = DomainTrip(
            id=trip_id,
            driver_id=driver_id,
            start_time=start_time if start_time.tzinfo else start_time.replace(tzinfo=timezone.utc),
            initial_hos_state=hos_state,
        )

        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=1,
                waypoint_type="START",
                coordinates=origin,
                duration_seconds=0,
            )
        )
        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=2,
                waypoint_type="PICKUP",
                coordinates=pickup,
                duration_seconds=3600,
            )
        )
        trip.add_waypoint(
            DomainWaypoint(
                id=uuid.uuid4(),
                sequence=3,
                waypoint_type="DROPOFF",
                coordinates=dropoff,
                duration_seconds=3600,
            )
        )

        route_info = self.routing_service.calculate_route(
            origin=origin,
            waypoints=[pickup],
            destination=dropoff,
        )
        trip.total_distance_miles = route_info.get("distance_miles", 0.0)
        trip.total_duration_hours = route_info.get("duration_seconds", 0) / 3600.0

        planned_trip = self.scheduling_engine.generate_schedule(trip)
        val_result = self.validation_engine.validate_trip(planned_trip)

        if not val_result.is_compliant:
            raise ValueError(f"Trip compliance validation failed: {val_result.violations}")

        return self.trip_repo.save(planned_trip)
