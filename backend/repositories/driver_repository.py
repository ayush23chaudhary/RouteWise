import uuid
from apps.drivers.models import Driver as DriverORM

class DriverRepository:
    """
    Repository providing encapsulated data access for Driver models.
    """
    def get_by_id(self, driver_id: uuid.UUID) -> DriverORM | None:
        try:
            return DriverORM.objects.get(id=driver_id)
        except DriverORM.DoesNotExist:
            return None

    def save(self, driver: DriverORM) -> DriverORM:
        driver.save()
        return driver
