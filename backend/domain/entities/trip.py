from dataclasses import dataclass, field
from datetime import datetime
import uuid
from domain.entities.waypoint import Waypoint
from domain.entities.schedule_event import ScheduleEvent
from domain.entities.daily_log import DailyLog
from domain.value_objects.driver_hos_state import DriverHOSState

@dataclass
class Trip:
    """
    Pure Domain Aggregate Root representing a Trip.
    Encapsulates waypoints, schedule events, daily logs, and status transitions.
    """
    id: uuid.UUID
    driver_id: uuid.UUID
    start_time: datetime
    status: str = "DRAFT"  # DRAFT, PLANNED, ACTIVE, COMPLETED, CANCELLED
    waypoints: list[Waypoint] = field(default_factory=list)
    events: list[ScheduleEvent] = field(default_factory=list)
    daily_logs: list[DailyLog] = field(default_factory=list)
    initial_hos_state: DriverHOSState = field(default_factory=DriverHOSState)
    total_distance_miles: float = 0.0
    total_duration_hours: float = 0.0

    def add_waypoint(self, waypoint: Waypoint) -> None:
        self.waypoints.append(waypoint)
        self.waypoints.sort(key=lambda w: w.sequence)

    def mark_planned(self) -> None:
        if not self.waypoints:
            raise ValueError("Cannot mark trip PLANNED without waypoints.")
        self.status = "PLANNED"

    def mark_active(self) -> None:
        if self.status != "PLANNED":
            raise ValueError("Trip must be PLANNED before moving to ACTIVE.")
        self.status = "ACTIVE"
