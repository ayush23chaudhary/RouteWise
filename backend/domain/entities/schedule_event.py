import uuid
from dataclasses import dataclass
from datetime import datetime

from domain.value_objects.coordinates import Coordinates


@dataclass
class ScheduleEvent:
    """
    Pure domain entity representing a continuous event along a trip timeline.
    """
    id: uuid.UUID
    sequence: int
    event_type: str  # PRE_TRIP, DRIVE, REST_BREAK, FUEL_STOP, PICKUP, DROPOFF, DAILY_RESET, RESTART_34H
    duty_status: str  # OFF, SB, D, ON
    start_time: datetime
    end_time: datetime
    start_coordinates: Coordinates
    end_coordinates: Coordinates
    distance_miles: float = 0.0
    description: str = ""

    def __post_init__(self) -> None:
        if self.start_time >= self.end_time:
            raise ValueError(f"Event start time ({self.start_time}) must be before end time ({self.end_time}).")
        if self.distance_miles < 0.0:
            raise ValueError("Distance miles cannot be negative.")

    @property
    def duration_seconds(self) -> int:
        return int((self.end_time - self.start_time).total_seconds())
