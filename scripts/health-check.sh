#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
endpoints=(
  "/"
  "/plan"
  "/wiedza"
  "/api/v1/health"
  "/api/ai/prompts"
)
for endpoint in "${endpoints[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL$endpoint")
  echo "$endpoint -> $code"
  if [[ "$code" -lt 200 || "$code" -ge 400 ]]; then
    echo "Health check failed for $endpoint" >&2
    exit 1
  fi
done
