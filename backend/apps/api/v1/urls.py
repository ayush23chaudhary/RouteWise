from django.urls import path
from apps.api.v1.views.trip import (
    TripPlanView,
    TripDetailView,
    TripTimelineView,
    TripLogsView,
    TripComplianceView,
    TripStatusUpdateView,
)

urlpatterns = [
    path("trips/plan", TripPlanView.as_view(), name="trip-plan"),
    path("trips/<uuid:trip_id>", TripDetailView.as_view(), name="trip-detail"),
    path("trips/<uuid:trip_id>/timeline", TripTimelineView.as_view(), name="trip-timeline"),
    path("trips/<uuid:trip_id>/logs", TripLogsView.as_view(), name="trip-logs"),
    path("trips/<uuid:trip_id>/compliance", TripComplianceView.as_view(), name="trip-compliance"),
    path("trips/<uuid:trip_id>/status", TripStatusUpdateView.as_view(), name="trip-status-update"),
]
