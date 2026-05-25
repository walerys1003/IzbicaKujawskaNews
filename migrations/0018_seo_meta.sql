PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS seo_meta (
  page_path TEXT PRIMARY KEY,
  meta_title TEXT,
  meta_desc TEXT,
  og_image TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
