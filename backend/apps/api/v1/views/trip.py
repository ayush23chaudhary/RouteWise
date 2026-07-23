import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.api.v1.serializers.trip import (
    TripPlanRequestSerializer,
    TripPlanResponseSerializer,
    TripStatusUpdateSerializer,
    ScheduleEventResponseSerializer,
    DailyLogResponseSerializer,
    ComplianceReportResponseSerializer,
)
from services.trip_service import TripService
from services.routing_service import GeospatialRoutingService
from services.scheduling_service import HOSSchedulingService
from services.validation_service import ComplianceValidationService
from repositories.trip_repository import get_django_trip_repository
from repositories.driver_repository import get_django_driver_repository
from apps.drivers.models import Driver
from apps.trips.models import Trip as TripORM

class TripPlanView(APIView):
    """
    POST /api/v1/trips/plan
    Request automated trip calculation, route generation, HOS breaks, and ELD logs.
    """
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        DriverRepo = get_django_driver_repository()
        TripRepo = get_django_trip_repository()
        driver_repo = DriverRepo()

        driver = driver_repo.get_by_id(data["driver_id"])
        if not driver:
            driver = Driver.objects.create(
                id=data["driver_id"],
                first_name="Default",
                last_name="Driver",
                license_number=f"DL-{str(data['driver_id'])[:8]}",
            )

        trip_service = TripService(
            trip_repo=TripRepo(),
            driver_repo=driver_repo,
            routing_service=GeospatialRoutingService(),
            scheduling_engine=HOSSchedulingService(),
            validation_engine=ComplianceValidationService(),
        )

        planned_trip = trip_service.plan_trip(
            driver_id=driver.id,
            start_time=data["start_time"],
            origin_coords=(data["start_location"]["latitude"], data["start_location"]["longitude"]),
            pickup_coords=(data["pickup_location"]["latitude"], data["pickup_location"]["longitude"]),
            dropoff_coords=(data["dropoff_location"]["latitude"], data["dropoff_location"]["longitude"]),
            initial_cycle_used_seconds=int(data.get("initial_hours_used", 0.0) * 3600),
        )

        response_serializer = TripPlanResponseSerializer(planned_trip)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TripDetailView(APIView):
    """
    GET /api/v1/trips/{id}
    Retrieve full details for a specific trip.
    """
    def get(self, request, trip_id):
        TripRepo = get_django_trip_repository()
        repo = TripRepo()
        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TripPlanResponseSerializer(domain_trip)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripTimelineView(APIView):
    """
    GET /api/v1/trips/{id}/timeline
    Retrieve ordered timeline events array for a trip.
    """
    def get(self, request, trip_id):
        TripRepo = get_django_trip_repository()
        repo = TripRepo()
        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ScheduleEventResponseSerializer(domain_trip.events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripLogsView(APIView):
    """
    GET /api/v1/trips/{id}/logs
    Retrieve 24-hour ELD log page records for a trip.
    """
    def get(self, request, trip_id):
        TripRepo = get_django_trip_repository()
        repo = TripRepo()
        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DailyLogResponseSerializer(domain_trip.daily_logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripComplianceView(APIView):
    """
    GET /api/v1/trips/{id}/compliance
    Retrieve independent compliance validation report for a trip.
    """
    def get(self, request, trip_id):
        TripRepo = get_django_trip_repository()
        repo = TripRepo()
        domain_trip = repo.get_by_id(trip_id)
        if not domain_trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        validator = ComplianceValidationService()
        val_result = validator.validate_trip(domain_trip)

        serializer = ComplianceReportResponseSerializer(val_result)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripStatusUpdateView(APIView):
    """
    PATCH /api/v1/trips/{id}/status
    Update lifecycle status of a trip.
    """
    def patch(self, request, trip_id):
        serializer = TripStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        TripRepo = get_django_trip_repository()
        repo = TripRepo()
        domain_trip = repo.get_by_id(trip_id)

        if not domain_trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        domain_trip.status = new_status
        repo.save(domain_trip)

        return Response({"trip_id": str(domain_trip.id), "status": domain_trip.status}, status=status.HTTP_200_OK)
