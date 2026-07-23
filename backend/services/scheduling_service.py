from domain.interfaces.scheduler import ISchedulingEngine
from domain.entities.trip import Trip

class HOSSchedulingService(ISchedulingEngine):
    """
    Service wrapper for the HOS Scheduling Engine.
    Extensible stub ready for plugging in Phase 2 algorithmic scheduling.
    """
    def generate_schedule(self, trip: Trip) -> Trip:
        # Stub foundation: transition trip status and return aggregate
        trip.mark_planned()
        return trip
