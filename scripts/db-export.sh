#!/usr/bin/env bash
set -euo pipefail
DB_NAME="${D1_DB_NAME:?Set D1_DB_NAME}"
OUT_FILE="${1:-d1-export.json}"
TABLES=(users categories tags articles article_tags comments media newsletters obituaries job_offers real_estate events weather_cache audit_log settings)
TMP_DIR=$(mktemp -d)
printf '{
' > "$OUT_FILE"
for i in "${!TABLES[@]}"; do
  table="${TABLES[$i]}"
  wrangler d1 execute "$DB_NAME" --remote --command "SELECT * FROM ${table};" --json > "$TMP_DIR/${table}.json"
  printf '  "%s": ' "$table" >> "$OUT_FILE"
  cat "$TMP_DIR/${table}.json" >> "$OUT_FILE"
  if [[ $i -lt $((${#TABLES[@]} - 1)) ]]; then
    printf ',
' >> "$OUT_FILE"
  else
    printf '
' >> "$OUT_FILE"
  fi
done
printf '}
' >> "$OUT_FILE"
rm -rf "$TMP_DIR"
echo "Exported to $OUT_FILE"
