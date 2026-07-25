import uuid
from typing import Optional


class IDriverRepository:
    """
    Interface contract for Driver model persistence.
    """
    def get_by_id(self, driver_id: uuid.UUID) -> Optional[object]:
        raise NotImplementedError


class InMemoryDriverRepository(IDriverRepository):
    """
    In-memory implementation of IDriverRepository for unit tests.
    """
    def __init__(self) -> None:
        self._store: dict[uuid.UUID, object] = {}

    def get_by_id(self, driver_id: uuid.UUID) -> Optional[object]:
        return self._store.get(driver_id)

    def save(self, driver_id: uuid.UUID, driver_obj: object) -> object:
        self._store[driver_id] = driver_obj
        return driver_obj


def get_django_driver_repository():
    from apps.drivers.models import Driver as DriverORM

    class DriverRepository(IDriverRepository):
        def get_by_id(self, driver_id: uuid.UUID) -> Optional[DriverORM]:
            try:
                return DriverORM.objects.get(id=driver_id)
            except DriverORM.DoesNotExist:
                return None

        def save(self, driver: DriverORM) -> DriverORM:
            driver.save()
            return driver

    return DriverRepository
