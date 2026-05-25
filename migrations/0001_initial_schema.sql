-- SANDBOX C — task C1-C6: D1 initial schema for izbica24.pl
-- Production-ready SQL for Cloudflare D1 (SQLite dialect)

-- ============================================================
-- USERS — autoryzacja (komentatorzy, redaktorzy)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'commenter', 'author', 'editor', 'admin')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- CATEGORIES — kategorie i podkategorie
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#1a1a1a',
  parent_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ============================================================
-- ARTICLES — główna tabela artykułów
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  lede TEXT NOT NULL,
  body_html TEXT NOT NULL,
  hero_image TEXT,
  hero_caption TEXT,
  author_id INTEGER,
  author_display TEXT NOT NULL,        -- denormalized for performance
  reading_minutes INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  source TEXT,                          -- 'manual', 'n8n-rss', 'n8n-fb', 'ai-rewrite'
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  published_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);

-- ============================================================
-- TAGS + ARTICLE_TAGS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);

-- ============================================================
-- COMMENTS — z moderacją
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  user_id INTEGER,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,            -- hashowane SHA-256 dla GDPR
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_hash TEXT,                          -- hashowany IP do anti-spam
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderated_at DATETIME,
  moderator_id INTEGER,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- ============================================================
-- NEWSLETTER subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced')),
  confirmation_token TEXT,
  confirmation_sent_at DATETIME,
  confirmed_at DATETIME,
  unsubscribed_at DATETIME,
  source TEXT DEFAULT 'web',             -- 'web', 'incoming', 'admin'
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  ip_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

-- ============================================================
-- ALERTS — utrudnienia/awarie (real-time updated)
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('prad', 'woda', 'cieplo', 'internet', 'droga', 'pogoda', 'inne')),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warn', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,                           -- 'Energa', 'ZGK', 'MEC', 'manual'
  affected_areas TEXT,                   -- comma-separated sołectwa
  starts_at DATETIME,
  ends_at DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, kind);
CREATE INDEX IF NOT EXISTS idx_alerts_starts ON alerts(starts_at DESC);

-- ============================================================
-- EVENTS — kalendarz wydarzeń
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                         -- 'kultura', 'sport', 'samorzad', 'spoleczne'
  starts_at DATETIME NOT NULL,
  ends_at DATETIME,
  location_name TEXT,
  location_solectwo TEXT,
  organizer TEXT,
  contact_phone TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  external_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- ============================================================
-- INCOMING_QUEUE — kolejka z n8n
-- ============================================================
CREATE TABLE IF NOT EXISTS incoming_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,                  -- 'rss-pomorska', 'fb-page', 'umig-bip', etc.
  external_id TEXT,                      -- unique ID from source
  payload_json TEXT NOT NULL,            -- raw JSON from n8n
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'rejected', 'error')),
  hash_dedup TEXT,                       -- SHA-256 for deduplication
  error_msg TEXT,
  article_id INTEGER,                    -- once published
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_queue_status ON incoming_queue(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_dedup ON incoming_queue(hash_dedup);

-- ============================================================
-- API_TOKENS — autoryzacja n8n / external services
-- ============================================================
CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- 'n8n-prod', 'mobile-app', 'admin-cli'
  token_hash TEXT UNIQUE NOT NULL,       -- SHA-256(token)
  scopes TEXT NOT NULL,                  -- comma: 'incoming:write', 'articles:read'
  is_active INTEGER NOT NULL DEFAULT 1,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  last_used_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON api_tokens(token_hash) WHERE is_active = 1;
