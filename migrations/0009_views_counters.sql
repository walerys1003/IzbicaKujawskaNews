CREATE VIEW IF NOT EXISTS top10_articles_view AS
SELECT id, slug, title, lead, hero_image_r2_key, category_id, author_id, published_at, view_count, reading_minutes
FROM articles
WHERE status = 'published'
ORDER BY view_count DESC, published_at DESC
LIMIT 10;

CREATE VIEW IF NOT EXISTS latest_articles_view AS
SELECT id, slug, title, lead, hero_image_r2_key, category_id, author_id, published_at, view_count, reading_minutes
FROM articles
WHERE status = 'published'
ORDER BY published_at DESC, id DESC
LIMIT 50;

CREATE VIEW IF NOT EXISTS articles_by_category_view AS
SELECT
  c.id AS category_id,
  c.slug AS category_slug,
  c.name AS category_name,
  COUNT(a.id) AS article_count,
  MAX(a.published_at) AS latest_published_at,
  COALESCE(SUM(a.view_count), 0) AS total_views
FROM categories c
LEFT JOIN articles a
  ON a.category_id = c.id
 AND a.status = 'published'
GROUP BY c.id, c.slug, c.name;
