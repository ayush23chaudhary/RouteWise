from django.urls import path
from apps.api.v1.views.trip import TripPlanView

urlpatterns = [
    path("trips/plan", TripPlanView.as_view(), name="trip-plan"),
]
