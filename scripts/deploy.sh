#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
shift || true
CONFIG="wrangler-staging.jsonc"
BRANCH="staging"
if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "production" ]]; then
  CONFIG="wrangler-prod.jsonc"
  BRANCH="main"
fi

npm run build
npx wrangler pages deploy dist --config "$CONFIG" --project-name "izbica24-portal" --branch "$BRANCH" "$@"
