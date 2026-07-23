FROM python:3.12-slim as base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

COPY pyproject.toml /app/
RUN pip install --upgrade pip && pip install django djangorestframework psycopg[binary] redis celery openrouteservice gunicorn structlog django-cors-headers ruff black mypy pytest pytest-django pytest-cov

COPY backend/ /app/backend/
WORKDIR /app/backend

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
