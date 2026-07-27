CREATE VIRTUAL TABLE IF NOT EXISTS obituaries_fts USING fts5(
  deceased_name,
  content,
  funeral_place,
  slug UNINDEXED,
  content='obituaries',
  content_rowid='id',
  tokenize='unicode61'
);

INSERT INTO obituaries_fts(rowid, deceased_name, content, funeral_place, slug)
SELECT id, deceased_name, COALESCE(content, ''), COALESCE(funeral_place, ''), slug FROM obituaries
WHERE NOT EXISTS (SELECT 1 FROM obituaries_fts LIMIT 1);

CREATE TRIGGER IF NOT EXISTS trg_obituaries_fts_insert AFTER INSERT ON obituaries BEGIN
  INSERT INTO obituaries_fts(rowid, deceased_name, content, funeral_place, slug)
  VALUES (new.id, new.deceased_name, COALESCE(new.content, ''), COALESCE(new.funeral_place, ''), new.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_obituaries_fts_delete AFTER DELETE ON obituaries BEGIN
  INSERT INTO obituaries_fts(obituaries_fts, rowid, deceased_name, content, funeral_place, slug)
  VALUES('delete', old.id, old.deceased_name, COALESCE(old.content, ''), COALESCE(old.funeral_place, ''), old.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_obituaries_fts_update AFTER UPDATE ON obituaries BEGIN
  INSERT INTO obituaries_fts(obituaries_fts, rowid, deceased_name, content, funeral_place, slug)
  VALUES('delete', old.id, old.deceased_name, COALESCE(old.content, ''), COALESCE(old.funeral_place, ''), old.slug);
  INSERT INTO obituaries_fts(rowid, deceased_name, content, funeral_place, slug)
  VALUES (new.id, new.deceased_name, COALESCE(new.content, ''), COALESCE(new.funeral_place, ''), new.slug);
END;
