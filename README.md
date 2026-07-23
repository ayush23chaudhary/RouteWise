# Spotter AI - Full Stack Logistics Planning Application (Backend)

Enterprise-grade Python 3.12 / Django 5 / DRF logistics planning backend designed using Clean Architecture, Domain-Driven Design (DDD), and strict separation of concerns.

## Architecture Overview

```
backend/
├── config/                 # Environment-specific Django settings (local, test, prod)
├── core/                   # RFC 7807 Exception handler, correlation middleware, pagination
├── domain/                 # Pure Python DDD domain models (Entities, Value Objects, Interfaces)
├── apps/
│   ├── common/             # Base models with UUIDs, timestamps, and soft deletes
│   ├── drivers/            # Driver profile ORM models & selectors
│   ├── trips/              # Trip, Waypoint, ScheduleEvent, DailyLog ORM models
│   └── api/                # REST API v1 routing & serializers
├── repositories/           # Repositories mapping ORM models to domain entities
└── services/               # Orchestrator and external service interfaces
```

## Quick Start (Local Setup)

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up --build
```
The API will be live at `http://localhost:8000/api/v1/trips/plan`.

### Option 2: Local Virtual Environment
```bash
python -m venv venv
source venv/bin/activate
pip install -e .
python backend/manage.py migrate
python backend/manage.py runserver
```

## Running Tests & Quality Checks

```bash
# Run pytest suite
pytest

# Code Formatting & Linting
ruff check .
black --check .
mypy backend
```

## API Endpoint Reference

### `POST /api/v1/trips/plan`
**Request Payload:**
```json
{
  "driver_id": "8f8b8a53-43d9-48bb-bb11-37ea920b7a8c",
  "start_time": "2026-07-24T08:00:00Z",
  "start_location": { "latitude": 37.7749, "longitude": -122.4194 },
  "pickup_location": { "latitude": 34.0522, "longitude": -118.2437 },
  "dropoff_location": { "latitude": 40.7128, "longitude": -74.0060 },
  "cycle_type": "70h_8d",
  "initial_hours_used": 10.5
}
```

**Response (201 Created): RFC 7807 / Standard JSON Schema.**
