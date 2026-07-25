import pytest
from rest_framework import status


@pytest.mark.django_db
def test_plan_trip_api_success(api_client, sample_trip_payload):
    response = api_client.post("/api/v1/trips/plan", sample_trip_payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "trip_id" in data
    assert data["status"] == "PLANNED"
    assert "waypoints" in data
    assert len(data["waypoints"]) == 3

@pytest.mark.django_db
def test_plan_trip_api_invalid_coordinates(api_client, sample_trip_payload):
    sample_trip_payload["start_location"]["latitude"] = 999.0
    response = api_client.post("/api/v1/trips/plan", sample_trip_payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "invalid_params" in data
