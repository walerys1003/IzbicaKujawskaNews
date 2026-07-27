-- =====================================================================
-- 0053 — seed 34 sołectw gminy Izbica Kujawska + kolumny dla mapy (I10)
--
-- PLIK GENEROWANY. Nie edytuj ręcznie.
-- Źródło nazw: src/v4/taxonomy.ts (stała SOLECTWA).
-- Ponowne wygenerowanie:
--   node scripts/d4-generuj-seed-solectw.mjs > migrations/0053_seed_solectwa.sql
--
-- Pola `soltys`, `latitude` i `longitude` są celowo NULL — patrz komentarz
-- w skrypcie generującym. Nie wypełniaj ich danymi przybliżonymi.
-- =====================================================================

-- Kolumny pod mapę sołectw (etap I10) oraz opis miejscowości.
ALTER TABLE solectwa ADD COLUMN latitude REAL;
ALTER TABLE solectwa ADD COLUMN longitude REAL;
ALTER TABLE solectwa ADD COLUMN population INTEGER;
ALTER TABLE solectwa ADD COLUMN area_ha REAL;
ALTER TABLE solectwa ADD COLUMN description TEXT;
ALTER TABLE solectwa ADD COLUMN updated_at DATETIME;

-- INSERT OR IGNORE, bo migracja może zostać uruchomiona na bazie,
-- w której redakcja już dopisała sołectwo ręcznie — nadpisanie
-- skasowałoby wtedy wpisane nazwisko sołtysa.
INSERT OR IGNORE INTO solectwa (slug, name, soltys, news_count, latitude, longitude) VALUES
  ('sadlno', 'Sadłno', NULL, 12, NULL, NULL),
  ('bierzyn', 'Bierzyn', NULL, 8, NULL, NULL),
  ('pasieka', 'Pasieka', NULL, 15, NULL, NULL),
  ('wietrzychowice', 'Wietrzychowice', NULL, 23, NULL, NULL),
  ('modzerowo', 'Modzerowo', NULL, 9, NULL, NULL),
  ('sarnowo', 'Sarnowo', NULL, 11, NULL, NULL),
  ('mchowek', 'Mchówek', NULL, 7, NULL, NULL),
  ('swiszewy', 'Świszewy', NULL, 10, NULL, NULL),
  ('swietoslawice', 'Świętosławice', NULL, 5, NULL, NULL),
  ('blenna', 'Błenna', NULL, 14, NULL, NULL),
  ('lubomin', 'Lubomin', NULL, 6, NULL, NULL),
  ('grochowiska', 'Grochowiska', NULL, 8, NULL, NULL),
  ('kazimierowo', 'Kazimierowo', NULL, 5, NULL, NULL),
  ('dlugie', 'Długie', NULL, 7, NULL, NULL),
  ('komorowo', 'Komorowo', NULL, 4, NULL, NULL),
  ('naczachowo', 'Naczachowo', NULL, 9, NULL, NULL),
  ('jozefowo', 'Józefowo', NULL, 6, NULL, NULL),
  ('cieszyno', 'Cieszyno', NULL, 4, NULL, NULL),
  ('krzeszyn', 'Krzeszyn', NULL, 3, NULL, NULL),
  ('rzezno', 'Rzeźno', NULL, 5, NULL, NULL),
  ('bartlomiejowice', 'Bartłomiejowice', NULL, 4, NULL, NULL),
  ('orle', 'Orle', NULL, 6, NULL, NULL),
  ('smarliny', 'Smarliny', NULL, 3, NULL, NULL),
  ('popowo', 'Popowo', NULL, 5, NULL, NULL),
  ('szczerkowo', 'Szczerkowo', NULL, 4, NULL, NULL),
  ('zagrodnica', 'Zagrodnica', NULL, 11, NULL, NULL),
  ('augustowo', 'Augustowo', NULL, 5, NULL, NULL),
  ('tymien', 'Tymień', NULL, 4, NULL, NULL),
  ('skarbanowo', 'Skarbanowo', NULL, 3, NULL, NULL),
  ('wiszczelice', 'Wiszczelice', NULL, 6, NULL, NULL),
  ('konary', 'Konary', NULL, 4, NULL, NULL),
  ('helenowo', 'Helenowo', NULL, 2, NULL, NULL),
  ('debianki', 'Dębianki', NULL, 2, NULL, NULL),
  ('wolka-komorowska', 'Wólka Komorowska', NULL, 3, NULL, NULL);

CREATE INDEX IF NOT EXISTS idx_solectwa_name ON solectwa(name);

-- Wygenerowano 34 sołectw.
