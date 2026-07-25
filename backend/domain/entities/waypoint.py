import uuid
from dataclasses import dataclass

from domain.value_objects.coordinates import Coordinates


@dataclass
class Waypoint:
    """
    Pure domain entity representing a waypoint location along a route.
    """
    id: uuid.UUID
    sequence: int
    waypoint_type: str  # START, PICKUP, FUEL, REST, DROPOFF
    coordinates: Coordinates
    duration_seconds: int = 0
    address: str = ""

    def __post_init__(self) -> None:
        if self.sequence < 0:
            raise ValueError("Sequence index must be non-negative.")
        if self.duration_seconds < 0:
            raise ValueError("Duration seconds cannot be negative.")
