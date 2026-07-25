import uuid
from dataclasses import dataclass, field
from datetime import date


@dataclass
class DailyLog:
    """
    Pure domain entity representing a 24-hour ELD driver log record.
    """
    id: uuid.UUID
    log_date: date
    off_duty_seconds: int = 0
    sleeper_berth_seconds: int = 0
    driving_seconds: int = 0
    on_duty_seconds: int = 0
    grid_intervals: list[str] = field(default_factory=list)

    def validate_totals(self) -> bool:
        total = self.off_duty_seconds + self.sleeper_berth_seconds + self.driving_seconds + self.on_duty_seconds
        return total == 86400
