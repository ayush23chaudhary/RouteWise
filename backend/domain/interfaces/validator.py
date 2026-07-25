from abc import ABC, abstractmethod

from domain.entities.trip import Trip
from domain.value_objects.validation_result import ValidationResult


class IValidationEngine(ABC):
    """
    Abstract interface for independent compliance validation engine.
    """
    @abstractmethod
    def validate_trip(self, trip: Trip) -> ValidationResult:
        """
        Validates timeline compliance against FMCSA Part 395 rules.
        """
        pass
