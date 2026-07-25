from domain.entities.trip import Trip
from domain.interfaces.scheduler import ISchedulingEngine
from domain.services.hos_engine import HOSSchedulingEngine


class HOSSchedulingService(ISchedulingEngine):
    """
    Application Service wrapper delegating schedule calculations to the pure domain HOSSchedulingEngine.
    """
    def __init__(self) -> None:
        self.engine = HOSSchedulingEngine()

    def generate_schedule(self, trip: Trip) -> Trip:
        return self.engine.generate_schedule(trip)
