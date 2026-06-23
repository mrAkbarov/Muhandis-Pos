#!/bin/sh
set -e

echo "Migratsiya..."
uv run python manage.py migrate --noinput

if [ "${SEED_DEMO:-0}" = "1" ]; then
  echo "Demo ma'lumot (seed_pos_demo)..."
  uv run python manage.py seed_pos_demo || true
fi

exec "$@"
