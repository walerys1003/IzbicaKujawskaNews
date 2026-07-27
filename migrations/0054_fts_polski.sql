-- =====================================================================
-- 0054 — D5: indeks wyszukiwania ze składaniem polskich liter
--
-- PLIK GENEROWANY: node scripts/d5-generuj-migracje-fts.mjs
--
-- POWÓD ISTNIENIA TEJ MIGRACJI (zmierzone na działającej bazie):
--
--   Istniejący articles_fts używa tokenize='unicode61', bez składania
--   diakrytyków. Wynik:
--     MATCH 'izbica' → 0 wyników   (w tekstach występuje „w Izbicy”)
--     MATCH 'gminy'  → 0 wyników   (w tekstach występuje „gmina”)
--
--   Wbudowana opcja 'remove_diacritics 2' NIE rozwiązuje sprawy do
--   końca, bo nie składa litery „ł” (U+0142 to osobna litera, nie „l”
--   z diakrytykiem). Zmierzone:
--     MATCH 'sadlno' → 0 wyników,  MATCH 'sadłno' → 1 wynik
--     MATCH 'blenna' → 0 wyników,  MATCH 'błenna' → 1 wynik
--
--   Cztery z 34 sołectw gminy (Sadłno, Błenna, Bartłomiejowice,
--   Świętosławice) byłyby więc nieosiągalne dla każdego, kto pisze
--   bez polskiej klawiatury — czyli dla większości ruchu z telefonu.
--
-- ROZWIĄZANIE: osobna tabela indeksu, do której trafia tekst już
-- złożony do ASCII. Zapytania składane są tą samą funkcją w kodzie
-- (foldPolish w src/lib/search/normalize-pl.ts), więc obie strony
-- przechodzą identyczną transformację.
--
-- Stary articles_fts NIE jest usuwany — jego wyzwalacze i dane
-- zostają nietknięte, żeby ewentualny kod jeszcze z niego czytający
-- nie przestał działać w trakcie wdrożenia.
-- =====================================================================

DROP TRIGGER IF EXISTS trg_articles_szukaj_ai;
DROP TRIGGER IF EXISTS trg_articles_szukaj_ad;
DROP TRIGGER IF EXISTS trg_articles_szukaj_au;
DROP TABLE IF EXISTS articles_szukaj;

-- Tabela zewnętrzna (bez content=), bo przechowujemy tekst PRZETWORZONY,
-- a nie wskaźnik do kolumn tabeli articles. Przy content= FTS5 czytałby
-- oryginalne wartości z „ł” i całe składanie byłoby bez efektu.
CREATE VIRTUAL TABLE articles_szukaj USING fts5(
  title,
  lead,
  tresc,
  rowid_articles UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);

-- Wypełnienie z istniejących artykułów. Tylko te nieusunięte —
-- artykuł w koszu nie powinien wracać w wynikach wyszukiwania.
INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
SELECT
  a.id,
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.content_md, a.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  a.id
FROM articles a
WHERE a.deleted_at IS NULL;

-- Wyzwalacze utrzymujące indeks. Muszą działać w bazie, nie w kodzie:
-- import treści, migracja i ręczna korekta redaktora przez konsolę d1
-- omijają warstwę aplikacji, a indeks musi pozostać zgodny z danymi.
CREATE TRIGGER trg_articles_szukaj_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
  VALUES (new.id, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.content_md, new.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), new.id);
END;

CREATE TRIGGER trg_articles_szukaj_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_szukaj (articles_szukaj, rowid, title, lead, tresc, rowid_articles)
  VALUES ('delete', old.id, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.content_md, old.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), old.id);
END;

-- UPDATE = delete + insert. FTS5 nie obsługuje UPDATE wprost na tabeli
-- zewnętrznej; pominięcie części usuwającej zostawia w indeksie stary
-- tekst obok nowego i artykuł wraca w wynikach po słowach, których
-- już nie zawiera — także po tych usuniętych sprostowaniem.
CREATE TRIGGER trg_articles_szukaj_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_szukaj (articles_szukaj, rowid, title, lead, tresc, rowid_articles)
  VALUES ('delete', old.id, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(old.content_md, old.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), old.id);
  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
  VALUES (new.id, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.content_md, new.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'), new.id);
END;

-- Dziennik zapytań — do raportu „czego szukają mieszkańcy, a czego nie
-- znajdują”. Zapytania bez wyników wskazują treść, której brakuje
-- na portalu; to najtańsze źródło tematów dla redakcji.
CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_raw TEXT NOT NULL,
  query_normalized TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  -- Świadomie BEZ adresu IP i identyfikatora użytkownika. Historia
  -- wyszukiwań powiązana z osobą to dane wrażliwe (ktoś szuka
  -- „zasiłek”, „komornik”, „nekrolog” konkretnego nazwiska), a do
  -- ustalenia braków w treści potrzebna jest tylko sama fraza.
);

CREATE INDEX IF NOT EXISTS idx_search_queries_norm ON search_queries(query_normalized);
CREATE INDEX IF NOT EXISTS idx_search_queries_zero ON search_queries(result_count) WHERE result_count = 0;
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);
