-- ════════════════════════════════════════════════════════════════════════════
-- FAZA 1 / D3 — Brakujące wyzwalacze indeksów pełnotekstowych
--
-- Skrypt `npm run db:verify` wykrył, że TRZY z siedmiu indeksów FTS5 nie
-- mają ani jednego wyzwalacza:
--
--     comments_fts   — 0 wyzwalaczy (powinny być 3)
--     events_fts     — 0 wyzwalaczy
--     solectwa_fts   — 0 wyzwalaczy
--
-- Znaczenie praktyczne: tabela wirtualna istnieje i wyszukiwarka o nią pyta,
-- ale nikt do niej nigdy nic nie wpisał. Wyszukiwanie w komentarzach,
-- wydarzeniach i materiałach sołeckich zwracało zawsze zero wyników —
-- i wyglądało to nie na awarię, lecz na „brak takich treści”. Redakcja
-- nie miała powodu tego zgłaszać, bo odpowiedź była poprawna składniowo.
--
-- Uwaga o kolejności i o `SQLITE_LOCKED`
-- ─────────────────────────────────────────────────────────────────────────
-- Migracja 0047 potknęła się o to, że wyzwalacz zapisujący do tabeli FTS5
-- z treścią zewnętrzną (`content='articles'`) czyta tabelę źródłową,
-- a przy `DROP TABLE` jest ona już zablokowana. Te trzy indeksy są
-- BEZ `content=`, czyli mają własną kopię treści — nie sięgają do tabeli
-- źródłowej, więc problem tu nie występuje. Zapisujemy do nich pełne
-- wartości kolumn, nie tylko `rowid`.
--
-- W `comments_fts` i `events_fts` `rowid` przypinamy do klucza głównego
-- tabeli źródłowej. Bez tego usunięcie wiersza nie miałoby jak trafić
-- do właściwego wpisu indeksu i indeks rósłby o osierocone rekordy.
-- `solectwa` ma klucz główny tekstowy (`slug`), więc tam korzystamy
-- z pomocniczej kolumny `slug UNINDEXED` i usuwamy po dopasowaniu treści.
-- ════════════════════════════════════════════════════════════════════════════

-- ── comments_fts ────────────────────────────────────────────────────────────
-- Kolumny: author_name, body, status UNINDEXED, article_id UNINDEXED
-- Tabela `comments` ma kolumnę treści `content`, nie `body` — nazwy się
-- różnią, co jest kolejnym powodem, dla którego ręcznie pisany wyzwalacz
-- byłby łatwy do pomylenia.

DROP TRIGGER IF EXISTS trg_comments_fts_insert;
DROP TRIGGER IF EXISTS trg_comments_fts_delete;
DROP TRIGGER IF EXISTS trg_comments_fts_update;

CREATE TRIGGER trg_comments_fts_insert AFTER INSERT ON comments BEGIN
  INSERT INTO comments_fts(rowid, author_name, body, status, article_id)
  VALUES (NEW.id, COALESCE(NEW.author_name, ''), NEW.content, NEW.status, NEW.article_id);
END;

CREATE TRIGGER trg_comments_fts_delete AFTER DELETE ON comments BEGIN
  DELETE FROM comments_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER trg_comments_fts_update AFTER UPDATE ON comments BEGIN
  DELETE FROM comments_fts WHERE rowid = OLD.id;
  INSERT INTO comments_fts(rowid, author_name, body, status, article_id)
  VALUES (NEW.id, COALESCE(NEW.author_name, ''), NEW.content, NEW.status, NEW.article_id);
END;

-- ── events_fts ──────────────────────────────────────────────────────────────
-- Kolumny: title, description, location_name, location_solectwo, category UNINDEXED
-- Tabela `events` nie ma kolumny `location_solectwo` — ma `location`
-- i `address`. Sołectwo nie jest osobnym polem, więc zostawiamy je puste;
-- wypełni się po dodaniu kolumny w przyszłej migracji. Wstawienie tu
-- `NEW.location` w oba pola dawałoby podwójne trafienia i zawyżało
-- ocenę trafności wyniku.

DROP TRIGGER IF EXISTS trg_events_fts_insert;
DROP TRIGGER IF EXISTS trg_events_fts_delete;
DROP TRIGGER IF EXISTS trg_events_fts_update;

CREATE TRIGGER trg_events_fts_insert AFTER INSERT ON events BEGIN
  INSERT INTO events_fts(rowid, title, description, location_name, location_solectwo, category)
  VALUES (NEW.id, NEW.title, COALESCE(NEW.description, ''), COALESCE(NEW.location, ''), '', COALESCE(NEW.category, ''));
END;

CREATE TRIGGER trg_events_fts_delete AFTER DELETE ON events BEGIN
  DELETE FROM events_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER trg_events_fts_update AFTER UPDATE ON events BEGIN
  DELETE FROM events_fts WHERE rowid = OLD.id;
  INSERT INTO events_fts(rowid, title, description, location_name, location_solectwo, category)
  VALUES (NEW.id, NEW.title, COALESCE(NEW.description, ''), COALESCE(NEW.location, ''), '', COALESCE(NEW.category, ''));
END;

-- ── solectwa_fts ────────────────────────────────────────────────────────────
-- Kolumny: solectwo, title, excerpt, body, slug UNINDEXED
-- Tabela `solectwa` to słownik 34 miejscowości (slug, name, soltys,
-- news_count) — nie ma `excerpt` ani `body`. Indeksujemy to, co jest:
-- nazwę i sołtysa, żeby zapytanie „kto jest sołtysem Pasieki” trafiało.
-- `rowid` nie da się przypiąć do klucza tekstowego, więc usuwamy
-- po kolumnie `slug`.

DROP TRIGGER IF EXISTS trg_solectwa_fts_insert;
DROP TRIGGER IF EXISTS trg_solectwa_fts_delete;
DROP TRIGGER IF EXISTS trg_solectwa_fts_update;

CREATE TRIGGER trg_solectwa_fts_insert AFTER INSERT ON solectwa BEGIN
  INSERT INTO solectwa_fts(solectwo, title, excerpt, body, slug)
  VALUES (NEW.name, NEW.name, COALESCE(NEW.soltys, ''), COALESCE('Sołtys: ' || NEW.soltys, ''), NEW.slug);
END;

CREATE TRIGGER trg_solectwa_fts_delete AFTER DELETE ON solectwa BEGIN
  DELETE FROM solectwa_fts WHERE slug = OLD.slug;
END;

CREATE TRIGGER trg_solectwa_fts_update AFTER UPDATE ON solectwa BEGIN
  DELETE FROM solectwa_fts WHERE slug = OLD.slug;
  INSERT INTO solectwa_fts(solectwo, title, excerpt, body, slug)
  VALUES (NEW.name, NEW.name, COALESCE(NEW.soltys, ''), COALESCE('Sołtys: ' || NEW.soltys, ''), NEW.slug);
END;

-- ── Wypełnienie indeksów danymi już istniejącymi ────────────────────────────
-- Wyzwalacze działają tylko na przyszłe zmiany. Wiersze wstawione przed
-- tą migracją nie znalazłyby się w indeksie nigdy — dlatego przepisujemy
-- je jednorazowo.

DELETE FROM comments_fts;
INSERT INTO comments_fts(rowid, author_name, body, status, article_id)
SELECT id, COALESCE(author_name, ''), content, status, article_id FROM comments;

DELETE FROM events_fts;
INSERT INTO events_fts(rowid, title, description, location_name, location_solectwo, category)
SELECT id, title, COALESCE(description, ''), COALESCE(location, ''), '', COALESCE(category, '') FROM events;

DELETE FROM solectwa_fts;
INSERT INTO solectwa_fts(solectwo, title, excerpt, body, slug)
SELECT name, name, COALESCE(soltys, ''), COALESCE('Sołtys: ' || soltys, ''), slug FROM solectwa;
