#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy
fi

exec "$@"
