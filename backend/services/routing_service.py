import json
import logging
import math
import time
import urllib.error
import urllib.request
from typing import Any, Optional

from core.cache import RouteCacheManager, build_route_cache_key
from domain.interfaces.routing import IRoutingService
from domain.value_objects.coordinates import Coordinates

logger = logging.getLogger("services.routing")


class GeospatialRoutingService(IRoutingService):
    """
    Production-grade geospatial routing service integrating with OpenRouteService (ORS)
    for Heavy Goods Vehicles (HGV / Driving-Truck). Includes Redis route caching,
    exponential backoff retries, GeoJSON response mapping, and Haversine network fallback.
    """

    METERS_TO_MILES = 0.000621371
    DEFAULT_AVG_TRUCK_SPEED_MPH = 55.0

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.openrouteservice.org",
        max_retries: int = 3,
        backoff_factor: float = 0.5,
    ) -> None:
        if api_key is None:
            try:
                from django.conf import settings
                api_key = getattr(settings, "OPENROUTE_SERVICE_API_KEY", "")
            except Exception:
                api_key = ""
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.cache_manager = RouteCacheManager()


    def calculate_route(
        self,
        origin: Coordinates,
        waypoints: list[Coordinates],
        destination: Coordinates,
    ) -> dict[str, Any]:
        """
        Calculates optimal HGV driving route between origin, optional intermediate waypoints, and destination.
        Checks Redis cache first. On miss, calls ORS API or Haversine fallback and populates cache.
        """
        all_coords = [origin] + waypoints + [destination]
        cache_key = build_route_cache_key(all_coords)

        cached_route = self.cache_manager.get(cache_key)
        if cached_route:
            return cached_route

        if self.api_key:
            try:
                route_res = self._fetch_openrouteservice(all_coords)
                self.cache_manager.set(cache_key, route_res)
                return route_res
            except Exception as exc:
                logger.warning(
                    f"OpenRouteService call failed ({exc}). Falling back to Haversine road estimation."
                )

        route_res = self._calculate_haversine_fallback(all_coords)
        self.cache_manager.set(cache_key, route_res)
        return route_res

    def _fetch_openrouteservice(self, coordinates: list[Coordinates]) -> dict[str, Any]:
        """Calls ORS POST /v2/directions/driving-hgv API."""
        url = f"{self.base_url}/v2/directions/driving-hgv/geojson"
        headers = {
            "Content-Type": "application/json",
            "Authorization": self.api_key,
            "User-Agent": "Spotter-AI-Logistics/1.0",
        }
        payload = {
            "coordinates": [[c.longitude, c.latitude] for c in coordinates],
            "instructions": False,
            "preference": "recommended",
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        last_exception = None
        for attempt in range(self.max_retries):
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    if response.status == 200:
                        body = json.loads(response.read().decode("utf-8"))
                        return self._parse_ors_response(body)
            except urllib.error.HTTPError as http_err:
                last_exception = http_err
                if http_err.code in (429, 500, 502, 503, 504):
                    sleep_time = self.backoff_factor * (2**attempt)
                    logger.info(
                        f"Retrying ORS API call in {sleep_time:.2f}s (Attempt {attempt + 1}/{self.max_retries})"
                    )
                    time.sleep(sleep_time)
                else:
                    break
            except urllib.error.URLError as url_err:
                last_exception = url_err
                sleep_time = self.backoff_factor * (2**attempt)
                time.sleep(sleep_time)

        raise RuntimeError(f"ORS API request failed after {self.max_retries} attempts: {last_exception}")

    def _parse_ors_response(self, response_body: dict[str, Any]) -> dict[str, Any]:
        """Maps ORS GeoJSON response structure into standard route dictionary format."""
        features = response_body.get("features", [])
        if not features:
            raise ValueError("Invalid ORS response: Missing features array.")

        feature = features[0]
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [])
        summary = feature.get("properties", {}).get("summary", {})

        distance_meters = summary.get("distance", 0.0)
        duration_seconds = summary.get("duration", 0.0)

        return {
            "coordinates": coords,
            "distance_miles": round(distance_meters * self.METERS_TO_MILES, 2),
            "duration_seconds": int(duration_seconds),
            "is_fallback": False,
        }

    def _calculate_haversine_fallback(self, coordinates: list[Coordinates]) -> dict[str, Any]:
        """
        Mathematical fallback calculating route metrics using Haversine distance
        multiplied by a 1.25x road circuity factor for truck highway routing.
        """
        total_distance_miles = 0.0
        route_coords = []

        for i in range(len(coordinates) - 1):
            c1, c2 = coordinates[i], coordinates[i + 1]
            dist_mi = self._haversine_distance(c1.latitude, c1.longitude, c2.latitude, c2.longitude)
            road_dist_mi = dist_mi * 1.25
            total_distance_miles += road_dist_mi
            route_coords.append([c1.longitude, c1.latitude])

        route_coords.append([coordinates[-1].longitude, coordinates[-1].latitude])
        duration_hours = total_distance_miles / self.DEFAULT_AVG_TRUCK_SPEED_MPH
        duration_seconds = int(duration_hours * 3600)

        return {
            "coordinates": route_coords,
            "distance_miles": round(total_distance_miles, 2),
            "duration_seconds": duration_seconds,
            "is_fallback": True,
        }

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates Great Circle distance between two coordinates in miles."""
        r = 3958.8  # Earth radius in miles
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c
