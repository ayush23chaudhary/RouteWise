from abc import ABC, abstractmethod
from domain.value_objects.coordinates import Coordinates

class IRoutingService(ABC):
    """
    Abstract interface for geospatial routing service providers.
    """
    @abstractmethod
    def calculate_route(self, origin: Coordinates, waypoints: list[Coordinates], destination: Coordinates) -> dict:
        """
        Returns geometry coordinates, total distance in miles, and total duration in seconds.
        """
        pass
