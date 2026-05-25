#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-staging}"
DB_NAME="${D1_DATABASE_NAME:-izbica24}"
for file in $(find migrations -maxdepth 1 -name '*.sql' | sort); do
  echo "Applying $file to $DB_NAME ($TARGET)"
  npx wrangler d1 execute "$DB_NAME" --file "$file" --remote
done
