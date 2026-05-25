PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'editor', 'journalist', 'reader')),
  avatar TEXT,
  bio TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id INTEGER,
  color_hex TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON categories(order_index);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lead TEXT NOT NULL,
  content_html TEXT,
  content_md TEXT,
  hero_image_r2_key TEXT,
  category_id INTEGER,
  author_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived')),
  published_at DATETIME,
  scheduled_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER NOT NULL DEFAULT 0,
  reading_minutes INTEGER NOT NULL DEFAULT 1,
  language TEXT NOT NULL DEFAULT 'pl',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at ON articles(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON articles(status, published_at DESC);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  user_id INTEGER,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  parent_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  caption TEXT,
  credit TEXT,
  uploaded_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime ON media(mime);

CREATE TABLE IF NOT EXISTS newsletters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token TEXT,
  confirmed_at DATETIME,
  unsubscribed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_token ON newsletters(token);

CREATE TABLE IF NOT EXISTS obituaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  deceased_name TEXT NOT NULL,
  born DATE,
  died DATE,
  funeral_date DATETIME,
  funeral_place TEXT,
  photo_r2_key TEXT,
  content TEXT,
  published_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  family_contact_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_obituaries_slug ON obituaries(slug);
CREATE INDEX IF NOT EXISTS idx_obituaries_published_at ON obituaries(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_obituaries_deceased_name ON obituaries(deceased_name);

CREATE TABLE IF NOT EXISTS job_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  type TEXT NOT NULL CHECK (type IN ('full', 'part', 'freelance')),
  description TEXT,
  contact TEXT,
  expires_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_job_offers_slug ON job_offers(slug);
CREATE INDEX IF NOT EXISTS idx_job_offers_published ON job_offers(published);
CREATE INDEX IF NOT EXISTS idx_job_offers_expires_at ON job_offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_offers_type ON job_offers(type);

CREATE TABLE IF NOT EXISTS real_estate (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dom', 'mieszkanie', 'dzialka', 'lokal')),
  "transaction" TEXT NOT NULL CHECK ("transaction" IN ('sprzedaz', 'wynajem')),
  price INTEGER,
  area_m2 REAL,
  rooms INTEGER,
  location TEXT,
  photo_r2_keys TEXT,
  description TEXT,
  contact TEXT,
  expires_at DATETIME,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_real_estate_slug ON real_estate(slug);
CREATE INDEX IF NOT EXISTS idx_real_estate_type ON real_estate(type);
CREATE INDEX IF NOT EXISTS idx_real_estate_transaction ON real_estate("transaction");
CREATE INDEX IF NOT EXISTS idx_real_estate_published ON real_estate(published);
CREATE INDEX IF NOT EXISTS idx_real_estate_expires_at ON real_estate(expires_at);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME,
  location TEXT,
  address TEXT,
  description TEXT,
  organizer TEXT,
  category TEXT,
  image_r2_key TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  free INTEGER NOT NULL DEFAULT 1 CHECK (free IN (0, 1)),
  ticket_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published);

CREATE TABLE IF NOT EXISTS weather_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location TEXT NOT NULL,
  temp_c REAL,
  condition TEXT,
  icon TEXT,
  pressure REAL,
  humidity REAL,
  wind_kmh REAL,
  fetched_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache(location);
CREATE INDEX IF NOT EXISTS idx_weather_cache_fetched_at ON weather_cache(fetched_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  diff TEXT,
  ip_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

