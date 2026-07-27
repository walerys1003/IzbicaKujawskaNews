CREATE TABLE IF NOT EXISTS error_log (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_level ON error_log(level);
