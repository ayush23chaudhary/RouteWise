#!/usr/bin/env bash
# Render Production Build Script for RouteWise Backend
set -o errexit

echo "=== Installing Backend Python Dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Collecting Static Files ==="
python manage.py collectstatic --no-input

echo "=== Running Database Migrations ==="
python manage.py migrate --no-input

echo "=== Backend Production Build Completed Successfully ==="
