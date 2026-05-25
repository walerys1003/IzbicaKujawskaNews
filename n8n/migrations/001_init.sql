-- =============================================================================
-- izbica24 Newsroom — Postgres init (oprócz domyślnej bazy n8n)
-- Uruchamiane automatycznie przez docker-entrypoint-initdb.d
-- =============================================================================

-- Cache scrapingu (deduplikacja na poziomie n8n przed wysłaniem do WP)
CREATE TABLE IF NOT EXISTS scrape_cache (
    id           BIGSERIAL PRIMARY KEY,
    source       VARCHAR(64)  NOT NULL,
    external_id  VARCHAR(255) NOT NULL,
    url          TEXT,
    title_hash   CHAR(64)     NOT NULL,
    content_hash CHAR(64),
    payload      JSONB,
    sent_to_wp   BOOLEAN      NOT NULL DEFAULT FALSE,
    wp_post_id   BIGINT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (source, external_id)
);
CREATE INDEX IF NOT EXISTS idx_scrape_cache_title_hash ON scrape_cache (title_hash);
CREATE INDEX IF NOT EXISTS idx_scrape_cache_created  ON scrape_cache (created_at DESC);

-- Rate-limit per source (zapobiega banowi z platform jak Facebook/Instagram)
CREATE TABLE IF NOT EXISTS source_rate_limits (
    source         VARCHAR(64) PRIMARY KEY,
    last_call_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    call_count_5m  INTEGER     NOT NULL DEFAULT 0,
    call_count_1h  INTEGER     NOT NULL DEFAULT 0,
    backoff_until  TIMESTAMPTZ
);

-- Cost log (zsynchronizowany z wp_iz24_cost_runs przez REST)
CREATE TABLE IF NOT EXISTS cost_log (
    id             BIGSERIAL PRIMARY KEY,
    workflow_id    VARCHAR(128),
    execution_id   VARCHAR(128),
    service        VARCHAR(64) NOT NULL,
    prompt_slug    VARCHAR(128),
    tokens_in      INTEGER,
    tokens_out     INTEGER,
    cost_usd       NUMERIC(10,6),
    latency_ms     INTEGER,
    success        BOOLEAN     NOT NULL DEFAULT TRUE,
    error          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cost_log_created ON cost_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_log_service ON cost_log (service);

-- Source configs (zarządzane z UI n8n via "Source" node)
CREATE TABLE IF NOT EXISTS sources (
    slug         VARCHAR(64) PRIMARY KEY,
    name         VARCHAR(255),
    type         VARCHAR(32),         -- rss, facebook, instagram, scrape_html, form, manual
    config       JSONB,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    poll_every_s INTEGER     NOT NULL DEFAULT 900,
    last_polled  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
