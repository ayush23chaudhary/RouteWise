from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.api.v1.serializers.trip import TripPlanRequestSerializer, TripPlanResponseSerializer
from services.trip_service import TripService
from services.routing_service import GeospatialRoutingService
from services.scheduling_service import HOSSchedulingService
from services.validation_service import ComplianceValidationService
from repositories.trip_repository import TripRepository
from repositories.driver_repository import DriverRepository
from apps.drivers.models import Driver

class TripPlanView(APIView):
    """
    POST /api/v1/trips/plan
    Endpoint requesting automated trip calculation, route generation, HOS breaks, and ELD logs.
    """
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_validate_or_fail = True
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Ensure driver exists or create default driver profile
        driver_repo = DriverRepository()
        driver = driver_repo.get_by_id(data["driver_id"])
        if not driver:
            driver = Driver.objects.create(
                id=data["driver_id"],
                first_name="Default",
                last_name="Driver",
                license_number=f"DL-{str(data['driver_id'])[:8]}",
            )

        # Wire Service dependencies
        trip_service = TripService(
            trip_repo=TripRepository(),
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
