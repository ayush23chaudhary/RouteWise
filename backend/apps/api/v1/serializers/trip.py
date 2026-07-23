from rest_framework import serializers

class LocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90.0, max_value=90.0)
    longitude = serializers.FloatField(min_value=-180.0, max_value=180.0)

class TripPlanRequestSerializer(serializers.Serializer):
    driver_id = serializers.UUIDField()
    start_time = serializers.DateTimeField()
    start_location = LocationSerializer()
    pickup_location = LocationSerializer()
    dropoff_location = LocationSerializer()
    cycle_type = serializers.ChoiceField(choices=["70h_8d"], default="70h_8d")
    initial_hours_used = serializers.FloatField(min_value=0.0, max_value=70.0, default=0.0)

class TripStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"])

class WaypointResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    sequence = serializers.IntegerField()
    type = serializers.CharField(source="waypoint_type")
    latitude = serializers.FloatField(source="coordinates.latitude")
    longitude = serializers.FloatField(source="coordinates.longitude")
    duration_seconds = serializers.IntegerField()
    address = serializers.CharField()

class ScheduleEventResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    sequence = serializers.IntegerField()
    event_type = serializers.CharField()
    duty_status = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    distance_miles = serializers.FloatField()
    description = serializers.CharField()

class DailyLogResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    log_date = serializers.DateField()
    off_duty_seconds = serializers.IntegerField()
    sleeper_berth_seconds = serializers.IntegerField()
    driving_seconds = serializers.IntegerField()
    on_duty_seconds = serializers.IntegerField()
    grid_intervals = serializers.ListField(child=serializers.CharField())

class ComplianceReportResponseSerializer(serializers.Serializer):
    is_compliant = serializers.BooleanField()
    violations = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())

class TripPlanResponseSerializer(serializers.Serializer):
    trip_id = serializers.UUIDField(source="id")
    status = serializers.CharField()
    metrics = serializers.SerializerMethodField()
    waypoints = WaypointResponseSerializer(many=True)
    events = ScheduleEventResponseSerializer(many=True)
    daily_logs = DailyLogResponseSerializer(many=True)

    def get_metrics(self, obj) -> dict:
        return {
            "total_distance_miles": obj.total_distance_miles,
            "total_duration_hours": obj.total_duration_hours,
        }
