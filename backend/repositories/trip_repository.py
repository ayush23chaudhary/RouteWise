import uuid
from typing import Optional

from domain.entities.daily_log import DailyLog as DomainDailyLog
from domain.entities.schedule_event import ScheduleEvent as DomainScheduleEvent
from domain.entities.trip import Trip as DomainTrip
from domain.entities.waypoint import Waypoint as DomainWaypoint
from domain.value_objects.coordinates import Coordinates


class ITripRepository:
    """
    Interface contract for Trip persistence repositories.
    """
    def get_by_id(self, trip_id: uuid.UUID) -> Optional[DomainTrip]:
        raise NotImplementedError

    def save(self, domain_trip: DomainTrip) -> DomainTrip:
        raise NotImplementedError


class InMemoryTripRepository(ITripRepository):
    """
    In-memory implementation of ITripRepository for unit testing.
    """
    def __init__(self) -> None:
        self._store: dict[uuid.UUID, DomainTrip] = {}

    def get_by_id(self, trip_id: uuid.UUID) -> Optional[DomainTrip]:
        return self._store.get(trip_id)

    def save(self, domain_trip: DomainTrip) -> DomainTrip:
        self._store[domain_trip.id] = domain_trip
        return domain_trip


def get_django_trip_repository():
    from django.db import transaction

    from apps.trips.models import (
        DailyLog as DailyLogORM,
    )
    from apps.trips.models import (
        ScheduleEvent as ScheduleEventORM,
    )
    from apps.trips.models import (
        Trip as TripORM,
    )
    from apps.trips.models import (
        Waypoint as WaypointORM,
    )

    class TripRepository(ITripRepository):
        """
        High-performance repository mapping between pure Domain Trip aggregates and Django ORM models.
        Uses bulk creation and atomic transaction boundaries.
        """
        def get_by_id(self, trip_id: uuid.UUID) -> Optional[DomainTrip]:
            try:
                orm_trip = TripORM.objects.prefetch_related("waypoints", "events", "daily_logs").get(id=trip_id)
                return self._to_domain(orm_trip)
            except TripORM.DoesNotExist:
                return None

        @transaction.atomic
        def save(self, domain_trip: DomainTrip) -> DomainTrip:
            # 1. Update or Create Root Trip Aggregate
            orm_trip, created = TripORM.objects.update_or_create(
                id=domain_trip.id,
                defaults={
                    "driver_id": domain_trip.driver_id,
                    "status": domain_trip.status,
                    "start_time": domain_trip.start_time,
                    "total_distance_miles": domain_trip.total_distance_miles,
                    "total_duration_hours": domain_trip.total_duration_hours,
                    "initial_cycle_used_seconds": domain_trip.initial_hos_state.cycle_seconds_used,
                },
            )

            # 2. Bulk Delete Existing Child Records
            WaypointORM.objects.filter(trip=orm_trip).delete()
            ScheduleEventORM.objects.filter(trip=orm_trip).delete()
            DailyLogORM.objects.filter(trip=orm_trip).delete()

            # 3. Optimized Bulk Insertion for Waypoints
            waypoint_objects = [
                WaypointORM(
                    id=wp.id,
                    trip=orm_trip,
                    sequence=wp.sequence,
                    type=wp.waypoint_type,
                    latitude=wp.coordinates.latitude,
                    longitude=wp.coordinates.longitude,
                    duration_seconds=wp.duration_seconds,
                    address=wp.address,
                )
                for wp in domain_trip.waypoints
            ]
            WaypointORM.objects.bulk_create(waypoint_objects, batch_size=500)

            # 4. Optimized Bulk Insertion for Events
            event_objects = [
                ScheduleEventORM(
                    id=ev.id,
                    trip=orm_trip,
                    sequence=ev.sequence,
                    event_type=ev.event_type,
                    duty_status=ev.duty_status,
                    start_time=ev.start_time,
                    end_time=ev.end_time,
                    start_latitude=ev.start_coordinates.latitude,
                    start_longitude=ev.start_coordinates.longitude,
                    end_latitude=ev.end_coordinates.latitude,
                    end_longitude=ev.end_coordinates.longitude,
                    distance_miles=ev.distance_miles,
                    description=ev.description,
                )
                for ev in domain_trip.events
            ]
            ScheduleEventORM.objects.bulk_create(event_objects, batch_size=500)

            # 5. Optimized Bulk Insertion for Daily Logs
            log_objects = [
                DailyLogORM(
                    id=log.id,
                    trip=orm_trip,
                    log_date=log.log_date,
                    off_duty_seconds=log.off_duty_seconds,
                    sleeper_berth_seconds=log.sleeper_berth_seconds,
                    driving_seconds=log.driving_seconds,
                    on_duty_seconds=log.on_duty_seconds,
                    grid_intervals=log.grid_intervals,
                )
                for log in domain_trip.daily_logs
            ]
            DailyLogORM.objects.bulk_create(log_objects, batch_size=500)

            return domain_trip

        def _to_domain(self, orm_trip: TripORM) -> DomainTrip:
            waypoints = [
                DomainWaypoint(
                    id=w.id,
                    sequence=w.sequence,
                    waypoint_type=w.type,
                    coordinates=Coordinates(float(w.latitude), float(w.longitude)),
                    duration_seconds=w.duration_seconds,
                    address=w.address,
                )
                for w in orm_trip.waypoints.all()
            ]

            events = [
                DomainScheduleEvent(
                    id=e.id,
                    sequence=e.sequence,
                    event_type=e.event_type,
                    duty_status=e.duty_status,
                    start_time=e.start_time,
                    end_time=e.end_time,
                    start_coordinates=Coordinates(float(e.start_latitude), float(e.start_longitude)),
                    end_coordinates=Coordinates(float(e.end_latitude), float(e.end_longitude)),
                    distance_miles=float(e.distance_miles),
                    description=e.description,
                )
                for e in orm_trip.events.all()
            ]

            daily_logs = [
                DomainDailyLog(
                    id=l.id,
                    log_date=l.log_date,
                    off_duty_seconds=l.off_duty_seconds,
                    sleeper_berth_seconds=l.sleeper_berth_seconds,
                    driving_seconds=l.driving_seconds,
                    on_duty_seconds=l.on_duty_seconds,
                    grid_intervals=l.grid_intervals,
                )
                for l in orm_trip.daily_logs.all()
            ]

            return DomainTrip(
                id=orm_trip.id,
                driver_id=orm_trip.driver_id,
                start_time=orm_trip.start_time,
                status=orm_trip.status,
                waypoints=waypoints,
                events=events,
                daily_logs=daily_logs,
                total_distance_miles=float(orm_trip.total_distance_miles),
                total_duration_hours=float(orm_trip.total_duration_hours),
            )

    return TripRepository
