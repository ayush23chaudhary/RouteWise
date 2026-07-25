from django.db import models

from apps.common.models import TimeStampedModel


class Driver(TimeStampedModel):
    """
    ORM Model representing a commercial truck driver profile.
    """
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    license_number = models.CharField(max_length=30, unique=True, db_index=True)
    cycle_type = models.CharField(max_length=20, default="70h_8d")

    class Meta:
        db_table = "drivers"
        verbose_name = "Driver"
        verbose_name_plural = "Drivers"

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.license_number})"
