from django.db import models
from apps.common.models import TimeStampedModel
from apps.drivers.models import Driver

class Trip(TimeStampedModel):
    """
    ORM Model representing a Trip aggregate root in the database.
    """
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PLANNED", "Planned"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    driver = models.ForeignKey(Driver, on_delete=models.RESTRICT, related_name="trips")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT", db_index=True)
    start_time = models.DateTimeField(db_index=True)
    total_distance_miles = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_duration_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    initial_cycle_used_seconds = models.IntegerField(default=0)

    class Meta:
        db_table = "trips"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["driver", "status"]),
        ]

    def __str__(self) -> str:
        return f"Trip {self.id} [{self.status}] - Driver {self.driver_id}"


class Waypoint(models.Model):
    """
    ORM Model representing a waypoint stop along a trip.
    """
    TYPE_CHOICES = [
        ("START", "Start Location"),
        ("PICKUP", "Pickup Location"),
        ("FUEL", "Fuel Stop"),
        ("REST", "Rest Stop"),
        ("DROPOFF", "Dropoff Location"),
    ]

    id = models.UUIDField(primary_key=True, default=None, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="waypoints")
    sequence = models.IntegerField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    duration_seconds = models.IntegerField(default=0)
    address = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "waypoints"
        ordering = ["sequence"]
        unique_together = ("trip", "sequence")


class ScheduleEvent(models.Model):
    """
    ORM Model representing a temporal event on a trip timeline.
    """
    DUTY_STATUS_CHOICES = [
        ("OFF", "Off Duty"),
        ("SB", "Sleeper Berth"),
        ("D", "Driving"),
        ("ON", "On Duty Not Driving"),
    ]

    id = models.UUIDField(primary_key=True, default=None, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="events")
    sequence = models.IntegerField()
    event_type = models.CharField(max_length=30)
    duty_status = models.CharField(max_length=10, choices=DUTY_STATUS_CHOICES)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField(db_index=True)
    start_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    start_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    end_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    end_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    distance_miles = models.DecimalField(max_digits=7, decimal_places=2, default=0.00)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "schedule_events"
        ordering = ["sequence"]
        indexes = [
            models.Index(fields=["trip", "start_time", "end_time"]),
        ]


class DailyLog(models.Model):
    """
    ORM Model representing a 24-hour ELD log grid record.
    """
    id = models.UUIDField(primary_key=True, default=None, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="daily_logs")
    log_date = models.DateField(db_index=True)
    off_duty_seconds = models.IntegerField(default=0)
    sleeper_berth_seconds = models.IntegerField(default=0)
    driving_seconds = models.IntegerField(default=0)
    on_duty_seconds = models.IntegerField(default=0)
    grid_intervals = models.JSONField(default=list)

    class Meta:
        db_table = "daily_logs"
        ordering = ["log_date"]
        unique_together = ("trip", "log_date")
