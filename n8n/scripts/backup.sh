#!/usr/bin/env bash
# =============================================================================
# izbica24 Newsroom — backup n8n DB + volumes (uruchamiane przez cron daily)
# Trzyma 14 ostatnich backupów lokalnie, 30 ostatnich na S3 (opcjonalne).
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/n8n}"
KEEP_DAYS="${KEEP_DAYS:-14}"
S3_BUCKET="${S3_BUCKET:-}"            # opcjonalne (np. s3://izbica24-backups)
S3_PREFIX="${S3_PREFIX:-n8n}"

cd "$(dirname "$0")/.."

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
ARCH="$BACKUP_DIR/n8n_${TS}.tar.gz"

echo "[backup] dump postgres..."
docker compose exec -T postgres pg_dump -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2)" \
    "$(grep '^POSTGRES_DB=' .env | cut -d= -f2)" \
    > "$BACKUP_DIR/n8n_${TS}.sql"

echo "[backup] dump volumes (n8n_data)..."
docker run --rm \
    -v "$(docker volume ls -q | grep n8n_data)":/data:ro \
    -v "$BACKUP_DIR":/backup \
    alpine:latest \
    tar czf "/backup/n8n_data_${TS}.tar.gz" -C /data .

echo "[backup] łączę w pojedyncze archiwum..."
tar czf "$ARCH" \
    -C "$BACKUP_DIR" \
    "n8n_${TS}.sql" \
    "n8n_data_${TS}.tar.gz"
rm "$BACKUP_DIR/n8n_${TS}.sql" "$BACKUP_DIR/n8n_data_${TS}.tar.gz"

echo "[backup] gotowe: $ARCH ($(du -h "$ARCH" | cut -f1))"

# Opcjonalny upload do S3
if [[ -n "$S3_BUCKET" ]] && command -v aws >/dev/null; then
    echo "[backup] uploadu do $S3_BUCKET/$S3_PREFIX/..."
    aws s3 cp "$ARCH" "$S3_BUCKET/$S3_PREFIX/" --storage-class STANDARD_IA
fi

# Rotacja lokalna
find "$BACKUP_DIR" -name 'n8n_*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[backup] retention: usunięto starsze niż $KEEP_DAYS dni."
