import unittest

from core.cache import build_route_cache_key
from domain.value_objects.coordinates import Coordinates
from services.routing_service import GeospatialRoutingService


class TestCachingLayer(unittest.TestCase):
    def test_route_cache_key_generation_deterministic(self):
        coords_1 = [Coordinates(37.7749, -122.4194), Coordinates(34.0522, -118.2437)]
        coords_2 = [Coordinates(37.7749, -122.4194), Coordinates(34.0522, -118.2437)]

        key1 = build_route_cache_key(coords_1)
        key2 = build_route_cache_key(coords_2)

        self.assertTrue(key1.startswith("route_cache:"))
        self.assertEqual(key1, key2)

    def test_route_cache_key_generation_different_inputs(self):
        coords_1 = [Coordinates(37.7749, -122.4194), Coordinates(34.0522, -118.2437)]
        coords_differ = [Coordinates(37.7749, -122.4194), Coordinates(40.7128, -74.0060)]

        key1 = build_route_cache_key(coords_1)
        key2 = build_route_cache_key(coords_differ)

        self.assertNotEqual(key1, key2)

    def test_routing_service_uses_cache(self):
        service = GeospatialRoutingService(api_key="")
        origin = Coordinates(37.7749, -122.4194)
        destination = Coordinates(34.0522, -118.2437)

        # First call populates cache
        res1 = service.calculate_route(origin, [], destination)

        # Second call hits cache
        res2 = service.calculate_route(origin, [], destination)

        self.assertEqual(res1["distance_miles"], res2["distance_miles"])
        self.assertEqual(res1["duration_seconds"], res2["duration_seconds"])

if __name__ == "__main__":
    unittest.main()
