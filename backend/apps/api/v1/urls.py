from django.urls import path

from apps.api.v1.views.health import HealthCheckView, LivenessCheckView, ReadinessCheckView
from apps.api.v1.views.trip import (
    TripComplianceView,
    TripDetailView,
    TripLogsView,
    TripPlanView,
    TripStatusUpdateView,
    TripTimelineView,
)

urlpatterns = [
    path("health", HealthCheckView.as_view(), name="health"),
    path("health/", HealthCheckView.as_view()),
    path("readiness", ReadinessCheckView.as_view(), name="readiness"),
    path("readiness/", ReadinessCheckView.as_view()),
    path("liveness", LivenessCheckView.as_view(), name="liveness"),
    path("liveness/", LivenessCheckView.as_view()),
    path("trips/plan", TripPlanView.as_view(), name="trip-plan"),
    path("trips/plan/", TripPlanView.as_view()),
    path("trips/<uuid:trip_id>", TripDetailView.as_view(), name="trip-detail"),
    path("trips/<uuid:trip_id>/", TripDetailView.as_view()),
    path("trips/<uuid:trip_id>/timeline", TripTimelineView.as_view(), name="trip-timeline"),
    path("trips/<uuid:trip_id>/timeline/", TripTimelineView.as_view()),
    path("trips/<uuid:trip_id>/logs", TripLogsView.as_view(), name="trip-logs"),
    path("trips/<uuid:trip_id>/logs/", TripLogsView.as_view()),
    path("trips/<uuid:trip_id>/compliance", TripComplianceView.as_view(), name="trip-compliance"),
    path("trips/<uuid:trip_id>/compliance/", TripComplianceView.as_view()),
    path("trips/<uuid:trip_id>/status", TripStatusUpdateView.as_view(), name="trip-status-update"),
    path("trips/<uuid:trip_id>/status/", TripStatusUpdateView.as_view()),
]
