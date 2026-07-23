import unittest
from domain.value_objects.coordinates import Coordinates
from services.routing_service import GeospatialRoutingService

class TestRoutingService(unittest.TestCase):
    def test_haversine_fallback_calculation(self):
        service = GeospatialRoutingService(api_key="")  # No API key triggers fallback
        origin = Coordinates(latitude=37.7749, longitude=-122.4194)  # San Francisco
        pickup = Coordinates(latitude=34.0522, longitude=-118.2437)  # Los Angeles
        dropoff = Coordinates(latitude=40.7128, longitude=-74.0060)  # New York

        result = service.calculate_route(origin, [pickup], dropoff)

        self.assertIn("coordinates", result)
        self.assertIn("distance_miles", result)
        self.assertIn("duration_seconds", result)
        self.assertEqual(len(result["coordinates"]), 3)
        self.assertGreater(result["distance_miles"], 2500.0)  # SF -> LA -> NY distance > 2500 mi
        self.assertGreater(result["duration_seconds"], 0)

    def test_haversine_distance_computation(self):
        sf = Coordinates(37.7749, -122.4194)
        la = Coordinates(34.0522, -118.2437)
        dist = GeospatialRoutingService._haversine_distance(sf.latitude, sf.longitude, la.latitude, la.longitude)
        # Direct flight distance SF -> LA is ~347 miles
        self.assertTrue(340.0 < dist < 360.0)

    def test_ors_response_parsing(self):
        service = GeospatialRoutingService()
        mock_body = {
            "features": [
                {
                    "geometry": {
                        "coordinates": [[-122.4194, 37.7749], [-118.2437, 34.0522]]
                    },
                    "properties": {
                        "summary": {
                            "distance": 600000.0,  # 600,000 meters = ~372.8 miles
                            "duration": 21600.0,   # 6 hours
                        }
                    }
                }
            ]
        }

        parsed = service._parse_ors_response(mock_body)
        self.assertEqual(parsed["distance_miles"], 372.82)
        self.assertEqual(parsed["duration_seconds"], 21600)
        self.assertEqual(len(parsed["coordinates"]), 2)

if __name__ == "__main__":
    unittest.main()
