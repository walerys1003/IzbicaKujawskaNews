#!/usr/bin/env bash
# =============================================================================
# izbica24 Newsroom — restore z backupu
# Użycie: bash restore.sh /var/backups/n8n/n8n_20260101_020000.tar.gz
# =============================================================================
set -euo pipefail

ARCH="${1:-}"
if [[ -z "$ARCH" || ! -f "$ARCH" ]]; then
    echo "Użycie: $0 <archive.tar.gz>"
    echo "Dostępne backupy:"
    ls -1t /var/backups/n8n/n8n_*.tar.gz 2>/dev/null | head -10 || echo "  (brak)"
    exit 1
fi

cd "$(dirname "$0")/.."

read -rp "UWAGA: Spowoduje to wyłączenie n8n i nadpisanie danych. Kontynuować? [yes/NO]: " ans
if [[ "$ans" != "yes" ]]; then
    echo "Anulowano."
    exit 0
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "[restore] rozpakowuję..."
tar xzf "$ARCH" -C "$TMP"

SQL_FILE=$(ls "$TMP"/n8n_*.sql | head -1)
DATA_FILE=$(ls "$TMP"/n8n_data_*.tar.gz | head -1)

echo "[restore] zatrzymuję n8n+workers..."
docker compose stop n8n n8n-worker-1 n8n-worker-2

echo "[restore] przywracam postgres..."
docker compose exec -T postgres psql -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2)" \
    -d "$(grep '^POSTGRES_DB=' .env | cut -d= -f2)" \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U "$(grep '^POSTGRES_USER=' .env | cut -d= -f2)" \
    "$(grep '^POSTGRES_DB=' .env | cut -d= -f2)" \
    < "$SQL_FILE"

echo "[restore] przywracam wolumen n8n_data..."
docker run --rm \
    -v "$(docker volume ls -q | grep n8n_data)":/data \
    -v "$(dirname "$DATA_FILE")":/backup:ro \
    alpine:latest \
    sh -c "rm -rf /data/* /data/.[!.]* && tar xzf /backup/$(basename "$DATA_FILE") -C /data"

echo "[restore] startuję n8n..."
docker compose up -d

echo "[restore] gotowe. Sprawdź: docker compose logs -f n8n"
