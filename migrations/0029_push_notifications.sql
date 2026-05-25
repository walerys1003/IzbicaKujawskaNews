PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS push_subscribers (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]',
  segments_json TEXT NOT NULL DEFAULT '[]',
  locale TEXT NOT NULL DEFAULT 'pl-PL',
  device TEXT NOT NULL DEFAULT 'desktop',
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]',
  breaking_only INTEGER NOT NULL DEFAULT 0,
  quiet_hours_from TEXT,
  quiet_hours_to TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_messages (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  segment TEXT,
  category_slug TEXT,
  scheduled_for DATETIME,
  sent_at DATETIME,
  status TEXT NOT NULL DEFAULT 'queued',
  delivered INTEGER NOT NULL DEFAULT 0,
  opened INTEGER NOT NULL DEFAULT 0,
  clicked INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
