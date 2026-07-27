CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  asset_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  stream_url TEXT,
  thumbnail_url TEXT,
  captions_url TEXT,
  uploader_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_uploader ON videos(uploader_id, created_at DESC);
