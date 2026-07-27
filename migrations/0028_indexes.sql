-- Indeksy wydajnościowe dla tabel pomocniczych.
-- UWAGA: indeksy dla users/articles/categories/comments/events/media są już
-- zdefiniowane w 0002_core_schema.sql (schemat kanoniczny). Ten plik dodaje
-- wyłącznie indeksy dla tabel utworzonych w migracjach 0006-0027.
PRAGMA foreign_keys = ON;

-- newsletter_subscribers (0006)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_opt_in_at ON newsletter_subscribers(opt_in_at DESC);

-- advertisements (0007)
CREATE INDEX IF NOT EXISTS idx_advertisements_owner_id ON advertisements(owner_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_type_status ON advertisements(type, status);
CREATE INDEX IF NOT EXISTS idx_advertisements_expiry ON advertisements(expiry);

-- solectwa (0010)
CREATE INDEX IF NOT EXISTS idx_solectwa_name ON solectwa(name);

-- investments (0012)
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_deadline ON investments(deadline);

-- user_activity (0019)
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_target ON user_activity(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp DESC);

-- article_versions (0020)
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_edited_by ON article_versions(edited_by);

-- subscriptions (0022)
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category_slug ON subscriptions(category_slug);

-- admin_logs (0023)
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- rate_limits (0024)
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start DESC);

-- redirects (0025)
CREATE INDEX IF NOT EXISTS idx_redirects_new_path ON redirects(new_path);

-- breaking_news (0027)
CREATE INDEX IF NOT EXISTS idx_breaking_news_priority ON breaking_news(priority DESC);
CREATE INDEX IF NOT EXISTS idx_breaking_news_active_until ON breaking_news(active_until);
