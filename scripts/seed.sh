#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${D1_DATABASE_NAME:-izbica24}"
SEED_FILE="${1:-seed.sql}"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "Seed file not found: $SEED_FILE" >&2
  exit 1
fi

npx wrangler d1 execute "$DB_NAME" --file "$SEED_FILE" --remote
