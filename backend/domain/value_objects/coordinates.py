from dataclasses import dataclass

@dataclass(frozen=True)
class Coordinates:
    """
    Immutable value object representing geographic latitude and longitude.
    """
    latitude: float
    longitude: float

    def __post_init__(self) -> None:
        if not (-90.0 <= self.latitude <= 90.0):
            raise ValueError(f"Latitude {self.latitude} must be between -90.0 and 90.0 degrees.")
        if not (-180.0 <= self.longitude <= 180.0):
            raise ValueError(f"Longitude {self.longitude} must be between -180.0 and 180.0 degrees.")
