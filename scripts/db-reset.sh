#!/usr/bin/env bash
set -euo pipefail
DB_NAME="${D1_DB_NAME:-izbica24-dev}"
if [[ "${D1_REMOTE:-0}" == "1" ]]; then
  REMOTE_FLAG=--remote
else
  REMOTE_FLAG=--local
fi
rm -rf .wrangler/state/v3/d1 .wrangler/state/d1 .wrangler/tmp 2>/dev/null || true
for file in migrations/0001_initial_schema.sql migrations/0002_core_schema.sql migrations/0003_seed_categories.sql migrations/0004_seed_admin.sql migrations/0005_fts_articles.sql migrations/0006_fts_obituaries.sql migrations/0007_views_counters.sql migrations/0008_triggers_updated_at.sql migrations/0009_seed_demo_articles.sql migrations/0010_enum_checks.sql migrations/0011_soft_delete.sql migrations/0012_archived_at.sql migrations/0013_search_indexes.sql; do
  echo "Applying $file"
  wrangler d1 execute "$DB_NAME" $REMOTE_FLAG --file "$file"
done
echo "Reset complete for $DB_NAME"
