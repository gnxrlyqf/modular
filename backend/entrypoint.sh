#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Seeding admin user..."
python manage.py seed_admin

exec "$@"
