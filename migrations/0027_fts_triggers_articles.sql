CREATE TRIGGER IF NOT EXISTS trg_articles_fts_insert
AFTER INSERT ON articles
FOR EACH ROW
BEGIN
  INSERT INTO articles_fts(rowid, title, lede, body, category, slug)
  VALUES (NEW.id, NEW.title, NEW.lede, COALESCE(NEW.body_html, ''), CAST(NEW.category_id AS TEXT), NEW.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_delete
AFTER DELETE ON articles
FOR EACH ROW
BEGIN
  DELETE FROM articles_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_update
AFTER UPDATE OF title, lede, body_html, category_id, slug ON articles
FOR EACH ROW
BEGIN
  DELETE FROM articles_fts WHERE rowid = OLD.id;
  INSERT INTO articles_fts(rowid, title, lede, body, category, slug)
  VALUES (NEW.id, NEW.title, NEW.lede, COALESCE(NEW.body_html, ''), CAST(NEW.category_id AS TEXT), NEW.slug);
END;
