from domain.entities.trip import Trip
from domain.interfaces.validator import IValidationEngine
from domain.services.validation_engine import ComplianceValidationEngine
from domain.value_objects.validation_result import ValidationResult


class ComplianceValidationService(IValidationEngine):
    """
    Application Service wrapper delegating compliance validation to ComplianceValidationEngine.
    """
    def __init__(self) -> None:
        self.engine = ComplianceValidationEngine()

    def validate_trip(self, trip: Trip) -> ValidationResult:
        return self.engine.validate_trip(trip)
