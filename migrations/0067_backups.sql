CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored_at TEXT,
  verified_at TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
