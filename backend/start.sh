#!/bin/sh
set -e

echo "=== TutorFlow backend startup ==="

echo "[1/3] Checking Alembic version state..."
python /app/check_and_stamp.py

echo "[2/3] Running database migrations..."
alembic upgrade head

echo "[3/3] Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
