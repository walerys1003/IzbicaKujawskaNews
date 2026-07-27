CREATE TABLE IF NOT EXISTS audios (
  id TEXT PRIMARY KEY,
  asset_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  waveform_json TEXT,
  transcript_text TEXT,
  podcast_slug TEXT,
  uploader_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audios_created ON audios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audios_podcast ON audios(podcast_slug, created_at DESC);
