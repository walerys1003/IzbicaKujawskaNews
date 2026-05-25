CREATE TABLE IF NOT EXISTS search_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL,
  synonym TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(term, synonym)
);

INSERT OR IGNORE INTO search_synonyms(term, synonym, weight) VALUES
  ('urząd', 'um', 1.0),
  ('um', 'urząd', 1.0),
  ('sołectwo', 'wioska', 0.8),
  ('wioska', 'sołectwo', 0.8),
  ('burmistrz', 'urzad miasta', 0.7),
  ('rolnictwo', 'gospodarstwo', 0.9);

CREATE TABLE IF NOT EXISTS search_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'global',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(normalized_query, created_at DESC);
