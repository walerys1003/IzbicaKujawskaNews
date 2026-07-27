-- 0056_naprawa_wyzwalaczy_szukaj.sql
--
-- BLAD KRYTYCZNY — naprawa wyzwalaczy indeksu wyszukiwania.
--
-- ─────────────────────────────────────────────────────────────────────
-- OBJAW
-- ─────────────────────────────────────────────────────────────────────
-- Kazde `UPDATE articles ...` i `DELETE FROM articles ...` konczy sie
-- bledem "SQL logic error: SQLITE_ERROR". W praktyce znaczy to, ze w
-- portalu NIE DA SIE:
--   * zapisac zmiany w artykule (poprawki, sprostowania, aktualizacje),
--   * zmienic statusu (szkic → publikacja, publikacja → kosz),
--   * usunac artykulu,
--   * podbic licznika odslon (view_count to tez UPDATE).
-- Dodawanie nowych artykulow dziala, wiec blad nie ujawnia sie przy
-- pierwszym zetknieciu z panelem — dopiero przy pierwszej EDYCJI.
--
-- Blad byl obecny od migracji 0054_fts_polski.sql i nie zostal wykryty
-- wczesniej, bo dotychczasowe testy sprawdzaly odczyt (kody HTTP 200
-- na stronach) oraz wyszukiwanie, a nie zapis.
--
-- ─────────────────────────────────────────────────────────────────────
-- PRZYCZYNA
-- ─────────────────────────────────────────────────────────────────────
-- Wyzwalacze trg_articles_szukaj_ad i trg_articles_szukaj_au usuwaly
-- stary wiersz z indeksu skladnia specjalna FTS5:
--
--   INSERT INTO articles_szukaj (articles_szukaj, rowid, ...)
--   VALUES ('delete', old.id, ...);
--
-- Ta skladnia ("delete command") jest w FTS5 dozwolona WYLACZNIE dla
-- tabel z zawartoscia zewnetrzna (content='tabela') albo bezzawartosciowych
-- (content=''). Dla nich FTS5 nie przechowuje tekstu, wiec przy usuwaniu
-- trzeba mu podac wartosci, ktore byly indeksowane — inaczej nie wie, ktore
-- tokeny odjac.
--
-- articles_szukaj jest natomiast ZWYCZAJNA tabela FTS5 — i celowo, co
-- 0054 uzasadnia: przechowuje tekst PRZETWORZONY (bez polskich znakow
-- diakrytycznych), a nie wskaznik do kolumn articles. Przy content=
-- FTS5 czytalby oryginalne "ł" i cale skladanie nie mialoby efektu.
-- Zwyczajna tabela FTS5 trzyma jednak swoj tekst sama, wiec komendy
-- 'delete' NIE OBSLUGUJE — zglasza SQLITE_ERROR. Wiersz usuwa sie z niej
-- zwyklym `DELETE FROM`.
--
-- Innymi slowy: 0054 poprawnie wybrala typ tabeli i poprawnie uzasadnila
-- ten wybor, ale zostawila wyzwalacze w wersji przeznaczonej dla tabeli
-- innego typu. To jedna niespojnosc, nie blad koncepcyjny.
--
-- Weryfikacja przed napisaniem tej migracji (konsola d1, tryb --local):
--   INSERT INTO articles_szukaj (articles_szukaj, rowid, ...) VALUES ('delete', ...)
--                                                            → SQLITE_ERROR
--   DELETE FROM articles_szukaj WHERE rowid = ...              → OK
--   to samo polecenie na articles_fts (content='articles')     → OK
-- Trzeci test dowodzi, ze problemem nie jest wersja SQLite w D1, tylko
-- typ konkretnej tabeli.
--
-- ─────────────────────────────────────────────────────────────────────
-- POPRAWKA
-- ─────────────────────────────────────────────────────────────────────
-- Zamiana komendy 'delete' na `DELETE FROM articles_szukaj WHERE rowid`.
-- Efekt jest ten sam (wiersz znika z indeksu), a przy okazji wyzwalacze
-- robia sie kilkadziesiat razy krotsze: nie trzeba powtarzac 18-krotnie
-- zagniezdzonego replace() dla starych wartosci, bo do usuniecia wiersza
-- wystarczy jego rowid.
--
-- Wyzwalacz INSERT (trg_articles_szukaj_ai) jest POPRAWNY i zostaje bez
-- zmian — nie uzywal komendy 'delete'. Odtwarzamy go mimo to, zeby cala
-- definicja indeksu byla w jednym miejscu i zeby kolejnosc DROP/CREATE
-- nie zalezala od stanu bazy.
--
-- articles_fts (stary indeks, content='articles') pozostaje NIETKNIETY —
-- tam komenda 'delete' jest wlasciwa i dziala, co potwierdzil test.
--
-- Po podmianie wyzwalaczy indeks jest przebudowywany od zera. Jest to
-- konieczne, bo dotad kazda proba UPDATE/DELETE konczyla sie bledem i
-- byla wycofywana — indeks moze wiec zawierac wiersze artykulow, ktore
-- w miedzyczasie zmienily tresc innymi sciezkami (import, seed).

DROP TRIGGER IF EXISTS trg_articles_szukaj_ai;
DROP TRIGGER IF EXISTS trg_articles_szukaj_ad;
DROP TRIGGER IF EXISTS trg_articles_szukaj_au;

-- ── INSERT: bez zmian merytorycznych wobec 0054 ─────────────────────
CREATE TRIGGER trg_articles_szukaj_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
  VALUES (
    new.id,
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.content_md, new.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    new.id
  );
END;

-- ── DELETE: zwykly DELETE FROM zamiast komendy 'delete' ─────────────
CREATE TRIGGER trg_articles_szukaj_ad AFTER DELETE ON articles BEGIN
  DELETE FROM articles_szukaj WHERE rowid = old.id;
END;

-- ── UPDATE: usun stary wiersz, wstaw nowy ───────────────────────────
-- Czesc usuwajaca jest niezbedna. Bez niej w indeksie zostaje stary
-- tekst obok nowego i artykul wraca w wynikach po slowach, ktorych
-- juz nie zawiera — takze po tych usunietych sprostowaniem.
CREATE TRIGGER trg_articles_szukaj_au AFTER UPDATE ON articles BEGIN
  DELETE FROM articles_szukaj WHERE rowid = old.id;
  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
  VALUES (
    new.id,
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(new.content_md, new.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
    new.id
  );
END;

-- ── Przebudowa indeksu ──────────────────────────────────────────────
-- Wyzwalacze sa juz aktywne, ale nie zadzialaja na dane wstawione
-- wczesniej. Czyscimy indeks i wypelniamy go ponownie z tabeli articles.
-- Tylko artykuly nieusuniete — artykul w koszu nie powinien wracac
-- w wynikach wyszukiwania.
DELETE FROM articles_szukaj;

INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)
SELECT
  a.id,
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.title, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.lead, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(COALESCE(a.content_md, a.content_html, '')), 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'), 'Ą', 'a'), 'Ć', 'c'), 'Ę', 'e'), 'Ł', 'l'), 'Ń', 'n'), 'Ó', 'o'), 'Ś', 's'), 'Ź', 'z'), 'Ż', 'z'),
  a.id
FROM articles a
WHERE a.deleted_at IS NULL;

-- ── Sprzatanie po diagnostyce ───────────────────────────────────────
-- Wiersz '__tmp_test__' powstal przy ustalaniu, ktora operacja zawodzi
-- (INSERT przeszedl, UPDATE i DELETE nie — wiec nie dal sie usunac).
-- Teraz, po naprawie wyzwalaczy, usuwa sie normalnie.
DELETE FROM articles WHERE slug = '__tmp_test__';
