ALTER TABLE articles ADD COLUMN archived_at DATETIME;
ALTER TABLE obituaries ADD COLUMN archived_at DATETIME;
ALTER TABLE job_offers ADD COLUMN archived_at DATETIME;
ALTER TABLE real_estate ADD COLUMN archived_at DATETIME;
ALTER TABLE events ADD COLUMN archived_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_articles_archived_at ON articles(archived_at);
CREATE INDEX IF NOT EXISTS idx_obituaries_archived_at ON obituaries(archived_at);
CREATE INDEX IF NOT EXISTS idx_job_offers_archived_at ON job_offers(archived_at);
CREATE INDEX IF NOT EXISTS idx_real_estate_archived_at ON real_estate(archived_at);
CREATE INDEX IF NOT EXISTS idx_events_archived_at ON events(archived_at);
