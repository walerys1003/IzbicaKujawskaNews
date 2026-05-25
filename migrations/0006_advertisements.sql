PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS advertisements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER,
  type TEXT NOT NULL CHECK (type IN ('nekrolog', 'praca', 'nieruchomosc')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  expiry DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);
