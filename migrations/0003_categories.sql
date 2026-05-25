PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b1d2a',
  parent_slug TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_slug) REFERENCES categories(slug) ON DELETE SET NULL
);
