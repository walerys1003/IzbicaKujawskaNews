PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS search_saved_queries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  filters_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_saved_queries_user_id ON search_saved_queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscribers_status ON push_subscribers(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_messages_status ON push_messages(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_push_messages_kind ON push_messages(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_preferences_user_id ON push_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_created_at ON analytics_pageviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_article_slug ON analytics_pageviews(article_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_rollup_date ON analytics_daily_rollup(date DESC);
