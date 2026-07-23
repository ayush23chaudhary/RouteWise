import logging
import uuid
from typing import Any

from config.celery import app

logger = logging.getLogger("apps.trips.tasks")


@app.task(name="trips.generate_trip_schedule_async")
def generate_trip_schedule_async(trip_id_str: str) -> dict[str, Any]:
    """Asynchronous Celery task for long-running trip schedule calculations."""
    logger.info(f"Starting asynchronous schedule generation for trip {trip_id_str}")
    try:
        from repositories.trip_repository import get_django_trip_repository
        from services.scheduling_service import HOSSchedulingService

        trip_repo_cls = get_django_trip_repository()
        repo = trip_repo_cls()
        trip_id = uuid.UUID(trip_id_str)

        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            logger.error(f"Trip {trip_id_str} not found for async scheduling.")
            return {"status": "FAILED", "reason": "Trip not found"}

        scheduler = HOSSchedulingService()
        scheduled_trip = scheduler.generate_schedule(domain_trip)
        repo.save(scheduled_trip)

        logger.info(f"Successfully generated async schedule for trip {trip_id_str}")
        return {"status": "SUCCESS", "trip_id": trip_id_str}
    except Exception as exc:
        logger.exception(f"Error executing async scheduling for trip {trip_id_str}: {exc}")
        return {"status": "FAILED", "reason": str(exc)}


@app.task(name="trips.audit_trip_compliance_async")
def audit_trip_compliance_async(trip_id_str: str) -> dict[str, Any]:
    """Asynchronous Celery task for compliance audit validation reports."""
    logger.info(f"Starting asynchronous compliance audit for trip {trip_id_str}")
    try:
        from repositories.trip_repository import get_django_trip_repository
        from services.validation_service import ComplianceValidationService

        trip_repo_cls = get_django_trip_repository()
        repo = trip_repo_cls()
        trip_id = uuid.UUID(trip_id_str)

        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            return {"status": "FAILED", "reason": "Trip not found"}

        validator = ComplianceValidationService()
        val_result = validator.validate_trip(domain_trip)

        return {
            "status": "SUCCESS",
            "trip_id": trip_id_str,
            "is_compliant": val_result.is_compliant,
            "violations_count": len(val_result.violations),
        }
    except Exception as exc:
        logger.exception(f"Error executing async compliance audit for trip {trip_id_str}: {exc}")
        return {"status": "FAILED", "reason": str(exc)}
