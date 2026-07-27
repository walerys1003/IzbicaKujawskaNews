-- 0052 — FAZA 2 / A5 + I11
-- Dopelnienie warstwy mediow: dedupe po tresci, warianty, metadane licencyjne,
-- galerie z kolejnoscia, upload wieloczesciowy, podcast.
--
-- Powod istnienia kolumn licencyjnych: I11 wymaga zastapienia 51 obrazow
-- zewnetrznych wlasnymi zasobami. Bez pol author/license/source nie da sie
-- udowodnic, ze zasob wolno opublikowac — a to jest ryzyko prawne, nie kosmetyka.

-- ---------------------------------------------------------------- media_assets
ALTER TABLE media_assets ADD COLUMN content_hash TEXT;
ALTER TABLE media_assets ADD COLUMN title TEXT;
ALTER TABLE media_assets ADD COLUMN caption TEXT;
ALTER TABLE media_assets ADD COLUMN credit TEXT;
ALTER TABLE media_assets ADD COLUMN author TEXT;
ALTER TABLE media_assets ADD COLUMN license TEXT;
ALTER TABLE media_assets ADD COLUMN license_url TEXT;
ALTER TABLE media_assets ADD COLUMN source TEXT;
ALTER TABLE media_assets ADD COLUMN source_url TEXT;
ALTER TABLE media_assets ADD COLUMN variants_json TEXT;
ALTER TABLE media_assets ADD COLUMN focal_x REAL;
ALTER TABLE media_assets ADD COLUMN focal_y REAL;
ALTER TABLE media_assets ADD COLUMN duration_seconds REAL;
ALTER TABLE media_assets ADD COLUMN status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE media_assets ADD COLUMN updated_at TEXT;
ALTER TABLE media_assets ADD COLUMN deleted_at TEXT;

-- content_hash to SHA-256 bajtow po usunieciu EXIF. phash lapie wizualne
-- podobienstwo, content_hash lapie identycznosc bajtowa — dwa rozne pytania.
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_content_hash
  ON media_assets(content_hash) WHERE content_hash IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_license ON media_assets(license);

-- ---------------------------------------------------------- upload wieloczesc.
-- Cloudflare Workers ma limit rozmiaru zadania. Plik > 100 MB musi przyjsc
-- w czesciach, a stan sesji musi przetrwac miedzy zadaniami — stad tabela.
CREATE TABLE IF NOT EXISTS media_upload_sessions (
  id TEXT PRIMARY KEY,
  upload_id TEXT,
  asset_key TEXT NOT NULL,
  bucket TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  total_size INTEGER NOT NULL DEFAULT 0,
  received_size INTEGER NOT NULL DEFAULT 0,
  part_count INTEGER NOT NULL DEFAULT 0,
  parts_json TEXT NOT NULL DEFAULT '[]',
  kind TEXT NOT NULL DEFAULT 'image',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'completed', 'aborted', 'expired')),
  uploader_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  expires_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON media_upload_sessions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_uploader ON media_upload_sessions(uploader_id, created_at DESC);

-- ------------------------------------------------------------------- galerie
CREATE TABLE IF NOT EXISTS galleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_media_id TEXT,
  category_slug TEXT,
  event_date TEXT,
  photographer TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  item_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_galleries_status ON galleries(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_galleries_category ON galleries(category_slug, published_at DESC);

CREATE TABLE IF NOT EXISTS gallery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  caption TEXT,
  credit TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (gallery_id, position)
);
CREATE INDEX IF NOT EXISTS idx_gallery_items_gallery ON gallery_items(gallery_id, position);
CREATE INDEX IF NOT EXISTS idx_gallery_items_media ON gallery_items(media_id);

-- item_count utrzymywany przez wyzwalacze, nie przez kod aplikacji.
-- Inkrementacja w kodzie rozjezdza sie przy kazdym usunieciu obok sciezki API.
CREATE TRIGGER IF NOT EXISTS trg_gallery_items_ai AFTER INSERT ON gallery_items
BEGIN
  UPDATE galleries SET item_count = (SELECT COUNT(*) FROM gallery_items WHERE gallery_id = NEW.gallery_id)
  WHERE id = NEW.gallery_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_gallery_items_ad AFTER DELETE ON gallery_items
BEGIN
  UPDATE galleries SET item_count = (SELECT COUNT(*) FROM gallery_items WHERE gallery_id = OLD.gallery_id)
  WHERE id = OLD.gallery_id;
END;

-- ------------------------------------------------------------------- podcast
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  media_id TEXT,
  audio_url TEXT,
  audio_size INTEGER,
  audio_mime TEXT NOT NULL DEFAULT 'audio/mpeg',
  duration_seconds INTEGER,
  season INTEGER NOT NULL DEFAULT 1,
  episode_number INTEGER,
  explicit INTEGER NOT NULL DEFAULT 0,
  transcript_text TEXT,
  article_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_podcast_status ON podcast_episodes(status, published_at DESC);
