from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class DriverHOSState:
    """
    Immutable value object representing initial or instantaneous driver HOS hours.
    """
    driving_seconds_used: int = 0
    duty_seconds_used: int = 0
    cycle_seconds_used: int = 0
    cycle_type: str = "70h_8d"
    last_reset_timestamp: Optional[datetime] = None

    def __post_init__(self) -> None:
        if self.driving_seconds_used < 0 or self.driving_seconds_used > 39600:
            raise ValueError("Driving seconds used must be between 0 and 39600 (11 hours).")
        if self.duty_seconds_used < 0 or self.duty_seconds_used > 50400:
            raise ValueError("Duty seconds used must be between 0 and 50400 (14 hours).")
        if self.cycle_seconds_used < 0 or self.cycle_seconds_used > 252000:
            raise ValueError("Cycle seconds used must be between 0 and 252000 (70 hours).")
