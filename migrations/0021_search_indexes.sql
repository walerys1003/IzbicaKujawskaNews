CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
CREATE INDEX IF NOT EXISTS idx_articles_category_status_published ON articles(category_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_status ON articles(author_id, status);
CREATE INDEX IF NOT EXISTS idx_obituaries_name_funeral_date ON obituaries(deceased_name, funeral_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_offers_company_published ON job_offers(company, published, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_estate_location_published ON real_estate(location, published, price DESC);
CREATE INDEX IF NOT EXISTS idx_events_category_start_published ON events(category, start_at, published);
CREATE INDEX IF NOT EXISTS idx_newsletters_email_status ON newsletters(email, status);
CREATE INDEX IF NOT EXISTS idx_weather_cache_location_fetched ON weather_cache(location, fetched_at DESC);
