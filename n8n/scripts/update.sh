#!/usr/bin/env bash
# =============================================================================
# izbica24 Newsroom — update n8n + dependencies (z backupem przed)
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[update] 1/4 — backup przed aktualizacją..."
bash scripts/backup.sh

echo "[update] 2/4 — pull obrazów..."
docker compose pull

echo "[update] 3/4 — restart z nowymi obrazami..."
docker compose up -d

echo "[update] 4/4 — prune starych obrazów..."
docker image prune -af --filter "until=168h"

sleep 5
docker compose ps
echo "[update] gotowe."
