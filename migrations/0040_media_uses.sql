CREATE TABLE IF NOT EXISTS media_uses (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  article_id TEXT,
  page_id TEXT,
  usage_type TEXT NOT NULL DEFAULT 'article',
  slot_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_uses_asset ON media_uses(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_uses_article ON media_uses(article_id);
CREATE INDEX IF NOT EXISTS idx_media_uses_page ON media_uses(page_id);
