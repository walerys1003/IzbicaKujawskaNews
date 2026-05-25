CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  asset_key TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  phash TEXT,
  uploader_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_assets_kind_created ON media_assets(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploader_created ON media_assets(uploader_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_alt ON media_assets(alt);
