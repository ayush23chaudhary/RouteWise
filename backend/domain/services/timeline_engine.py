import uuid
from datetime import datetime
from typing import List, Dict, Optional
from domain.entities.schedule_event import ScheduleEvent
from domain.value_objects.coordinates import Coordinates

class TimelineEngine:
    """
    Pure Domain Timeline Engine enforcing strict temporal contiguity, non-overlapping intervals,
    and ordinal event sequence indexing across a trip timeline.
    """
    def __init__(self, events: Optional[List[ScheduleEvent]] = None) -> None:
        self._events: List[ScheduleEvent] = []
        if events:
            for ev in events:
                self.append_event(ev)

    @property
    def events(self) -> List[ScheduleEvent]:
        """Returns read-only copy of ordered timeline events."""
        return list(self._events)

    def append_event(
        self,
        event_type: str,
        duty_status: str,
        start_time: datetime,
        end_time: datetime,
        start_coordinates: Coordinates,
        end_coordinates: Coordinates,
        distance_miles: float = 0.0,
        description: str = "",
    ) -> ScheduleEvent:
        """
        Appends a new event to the continuous timeline.
        Enforces:
        1. Monotonic start_time < end_time
        2. Strict contiguity with previous event (start_time == last_event.end_time)
        3. No temporal overlaps
        """
        if start_time >= end_time:
            raise ValueError(f"Invalid event interval: start_time ({start_time}) must be before end_time ({end_time}).")

        if self._events:
            last_event = self._events[-1]
            if start_time < last_event.end_time:
                raise ValueError(
                    f"Overlapping event detected: New event start_time ({start_time}) overlaps "
                    f"with previous event end_time ({last_event.end_time})."
                )
            if start_time > last_event.end_time:
                raise ValueError(
                    f"Gap detected in continuous timeline: New event start_time ({start_time}) "
                    f"does not match previous event end_time ({last_event.end_time})."
                )

        sequence_index = len(self._events) + 1
        new_event = ScheduleEvent(
            id=uuid.uuid4(),
            sequence=sequence_index,
            event_type=event_type,
            duty_status=duty_status,
            start_time=start_time,
            end_time=end_time,
            start_coordinates=start_coordinates,
            end_coordinates=end_coordinates,
            distance_miles=distance_miles,
            description=description,
        )

        self._events.append(new_event)
        return new_event

    def get_last_event(self) -> Optional[ScheduleEvent]:
        """Returns the most recent event on the timeline."""
        return self._events[-1] if self._events else None

    def calculate_duty_totals(self) -> Dict[str, int]:
        """
        Calculates cumulative duration in seconds for each duty status (OFF, SB, D, ON).
        """
        totals = {"OFF": 0, "SB": 0, "D": 0, "ON": 0}
        for ev in self._events:
            if ev.duty_status in totals:
                totals[ev.duty_status] += ev.duration_seconds
        return totals

    def calculate_total_distance_miles(self) -> float:
        """Calculates total physical distance covered across all events."""
        return sum(ev.distance_miles for ev in self._events)

    def validate_contiguity(self) -> bool:
        """
        Validates that all events in the timeline are strictly contiguous without gaps or overlaps.
        """
        if not self._events:
            return True

        for i in range(len(self._events) - 1):
            curr = self._events[i]
            nxt = self._events[i + 1]
            if curr.end_time != nxt.start_time:
                return False
        return True
