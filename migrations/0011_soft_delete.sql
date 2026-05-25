ALTER TABLE articles ADD COLUMN deleted_at DATETIME;
ALTER TABLE tags ADD COLUMN deleted_at DATETIME;
ALTER TABLE comments ADD COLUMN deleted_at DATETIME;
ALTER TABLE media ADD COLUMN deleted_at DATETIME;
ALTER TABLE newsletters ADD COLUMN deleted_at DATETIME;
ALTER TABLE obituaries ADD COLUMN deleted_at DATETIME;
ALTER TABLE job_offers ADD COLUMN deleted_at DATETIME;
ALTER TABLE real_estate ADD COLUMN deleted_at DATETIME;
ALTER TABLE events ADD COLUMN deleted_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON media(deleted_at);
CREATE INDEX IF NOT EXISTS idx_newsletters_deleted_at ON newsletters(deleted_at);
