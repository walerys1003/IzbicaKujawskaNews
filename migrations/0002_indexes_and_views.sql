-- SANDBOX C — task C7-C10: Performance views + denormalized aggregates

-- ============================================================
-- VIEW: published_articles_view (heavy-read view)
-- ============================================================
CREATE VIEW IF NOT EXISTS published_articles_view AS
SELECT
  a.id,
  a.slug,
  a.title,
  a.lede,
  a.hero_image,
  a.author_display,
  a.reading_minutes,
  a.published_at,
  a.view_count,
  a.share_count,
  a.comment_count,
  c.slug AS category_slug,
  c.title AS category_title,
  c.color AS category_color
FROM articles a
JOIN categories c ON a.category_id = c.id
WHERE a.status = 'published'
ORDER BY a.published_at DESC;

-- ============================================================
-- VIEW: active_alerts_view
-- ============================================================
CREATE VIEW IF NOT EXISTS active_alerts_view AS
SELECT * FROM alerts
WHERE is_active = 1
  AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
ORDER BY
  CASE status
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'warn' THEN 3
    ELSE 4
  END,
  starts_at DESC;

-- ============================================================
-- VIEW: top_week (top czytane ostatnie 7 dni)
-- ============================================================
CREATE VIEW IF NOT EXISTS top_week_view AS
SELECT * FROM published_articles_view
WHERE published_at > datetime('now', '-7 days')
ORDER BY view_count DESC
LIMIT 10;

-- ============================================================
-- TRIGGER: update updated_at on articles
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_articles_updated_at
AFTER UPDATE ON articles
FOR EACH ROW
BEGIN
  UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================
-- TRIGGER: increment tag usage_count
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_tag_increment
AFTER INSERT ON article_tags
FOR EACH ROW
BEGIN
  UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tag_decrement
AFTER DELETE ON article_tags
FOR EACH ROW
BEGIN
  UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
END;

-- ============================================================
-- TRIGGER: increment article.comment_count when comment approved
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_comment_count_inc
AFTER UPDATE OF status ON comments
FOR EACH ROW
WHEN NEW.status = 'approved' AND OLD.status <> 'approved'
BEGIN
  UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_comment_count_dec
AFTER UPDATE OF status ON comments
FOR EACH ROW
WHEN OLD.status = 'approved' AND NEW.status <> 'approved'
BEGIN
  UPDATE articles SET comment_count = comment_count - 1 WHERE id = NEW.article_id;
END;
