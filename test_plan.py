import requests
import json

payload = {
    "cycle_type": "70h_8d",
    "initial_hours_used": 0,
    "start_time": "2023-10-01T12:00:00Z",
    "driver_id": "34bb2268-bf01-443b-b78b-18a011ed9b31",
    "start_location": {"latitude": 34.0522, "longitude": -118.2437},
    "pickup_location": {"latitude": 39.7392, "longitude": -104.9903},
    "dropoff_location": {"latitude": 40.7128, "longitude": -74.0060}
}
res = requests.post("http://127.0.0.1:8000/api/v1/trips/plan", json=payload)
data = res.json()
print("waypoints:", data.get("waypoints"))
