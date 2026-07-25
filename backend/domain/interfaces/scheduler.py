from abc import ABC, abstractmethod

from domain.entities.trip import Trip


class ISchedulingEngine(ABC):
    """
    Abstract interface for the core HOS Scheduling Engine.
    """
    @abstractmethod
    def generate_schedule(self, trip: Trip) -> Trip:
        """
        Calculates timeline events, rest breaks, fuel stops, and returns populated Trip aggregate.
        """
        pass
