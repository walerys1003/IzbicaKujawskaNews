CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  title,
  lead,
  content_md,
  content_html,
  slug UNINDEXED,
  content='articles',
  content_rowid='id',
  tokenize='unicode61'
);

INSERT INTO articles_fts(rowid, title, lead, content_md, content_html, slug)
SELECT id, title, lead, COALESCE(content_md, ''), COALESCE(content_html, ''), slug FROM articles
WHERE NOT EXISTS (SELECT 1 FROM articles_fts LIMIT 1);

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_insert AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, lead, content_md, content_html, slug)
  VALUES (new.id, new.title, new.lead, COALESCE(new.content_md, ''), COALESCE(new.content_html, ''), new.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_delete AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, lead, content_md, content_html, slug)
  VALUES('delete', old.id, old.title, old.lead, COALESCE(old.content_md, ''), COALESCE(old.content_html, ''), old.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_update AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, lead, content_md, content_html, slug)
  VALUES('delete', old.id, old.title, old.lead, COALESCE(old.content_md, ''), COALESCE(old.content_html, ''), old.slug);
  INSERT INTO articles_fts(rowid, title, lead, content_md, content_html, slug)
  VALUES (new.id, new.title, new.lead, COALESCE(new.content_md, ''), COALESCE(new.content_html, ''), new.slug);
END;
