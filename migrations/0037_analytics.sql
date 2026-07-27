PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  path TEXT NOT NULL,
  article_slug TEXT,
  category_slug TEXT,
  author_name TEXT,
  referrer TEXT NOT NULL DEFAULT 'direct',
  country TEXT NOT NULL DEFAULT 'PL',
  browser TEXT NOT NULL DEFAULT 'Other',
  device TEXT NOT NULL DEFAULT 'desktop',
  title TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  path TEXT NOT NULL,
  article_slug TEXT,
  category_slug TEXT,
  event_name TEXT NOT NULL,
  event_value TEXT,
  referrer TEXT NOT NULL DEFAULT 'direct',
  country TEXT NOT NULL DEFAULT 'PL',
  browser TEXT NOT NULL DEFAULT 'Other',
  device TEXT NOT NULL DEFAULT 'desktop',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  landing_path TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'PL',
  browser TEXT NOT NULL DEFAULT 'Other',
  device TEXT NOT NULL DEFAULT 'desktop',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME
);

CREATE TABLE IF NOT EXISTS analytics_daily_rollup (
  date TEXT PRIMARY KEY,
  pageviews INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  unique_articles INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
