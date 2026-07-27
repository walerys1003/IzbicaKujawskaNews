/**
 * Etap D5 — generator migracji indeksu wyszukiwania z polskim składaniem liter.
 *
 * Wyrażenie składające polskie litery w SQLite to zagnieżdżony łańcuch
 * 18 wywołań replace() — 371 znaków na jedną kolumnę. Ręcznie przepisane
 * cztery razy (title, lead, treść, w trzech wyzwalaczach) gwarantuje
 * pominięcie jednej litery w jednym miejscu. Taki błąd nie objawia się
 * jako awaria: indeks po prostu nie znajduje słów z tą literą, i to
 * wyłącznie w rekordach zapisanych po tej migracji. Dlatego wyrażenie
 * jest generowane z jednej listy par.
 *
 * Uruchomienie:
 *   node scripts/d5-generuj-migracje-fts.mjs > migrations/0054_fts_polski.sql
 */

/** Ta sama lista, co w src/lib/search/normalize-pl.ts (LITERY). */
const PARY = [
  ['ą', 'a'],
  ['ć', 'c'],
  ['ę', 'e'],
  ['ł', 'l'],
  ['ń', 'n'],
  ['ó', 'o'],
  ['ś', 's'],
  ['ź', 'z'],
  ['ż', 'z'],
  ['Ą', 'a'],
  ['Ć', 'c'],
  ['Ę', 'e'],
  ['Ł', 'l'],
  ['Ń', 'n'],
  ['Ó', 'o'],
  ['Ś', 's'],
  ['Ź', 'z'],
  ['Ż', 'z'],
]

const fold = (wyrazenie) =>
  PARY.reduce((acc, [z, na]) => `replace(${acc}, '${z}', '${na}')`, `lower(${wyrazenie})`)

const kol = (prefiks) => ({
  title: fold(`COALESCE(${prefiks}.title, '')`),
  lead: fold(`COALESCE(${prefiks}.lead, '')`),
  tresc: fold(`COALESCE(${prefiks}.content_md, ${prefiks}.content_html, '')`),
})

const N = kol('new')
const O = kol('old')
const A = kol('a')

const l = []
l.push('-- =====================================================================')
l.push('-- 0054 — D5: indeks wyszukiwania ze składaniem polskich liter')
l.push('--')
l.push('-- PLIK GENEROWANY: node scripts/d5-generuj-migracje-fts.mjs')
l.push('--')
l.push('-- POWÓD ISTNIENIA TEJ MIGRACJI (zmierzone na działającej bazie):')
l.push('--')
l.push("--   Istniejący articles_fts używa tokenize='unicode61', bez składania")
l.push('--   diakrytyków. Wynik:')
l.push("--     MATCH 'izbica' → 0 wyników   (w tekstach występuje „w Izbicy”)")
l.push("--     MATCH 'gminy'  → 0 wyników   (w tekstach występuje „gmina”)")
l.push('--')
l.push("--   Wbudowana opcja 'remove_diacritics 2' NIE rozwiązuje sprawy do")
l.push('--   końca, bo nie składa litery „ł” (U+0142 to osobna litera, nie „l”')
l.push('--   z diakrytykiem). Zmierzone:')
l.push("--     MATCH 'sadlno' → 0 wyników,  MATCH 'sadłno' → 1 wynik")
l.push("--     MATCH 'blenna' → 0 wyników,  MATCH 'błenna' → 1 wynik")
l.push('--')
l.push('--   Cztery z 34 sołectw gminy (Sadłno, Błenna, Bartłomiejowice,')
l.push('--   Świętosławice) byłyby więc nieosiągalne dla każdego, kto pisze')
l.push('--   bez polskiej klawiatury — czyli dla większości ruchu z telefonu.')
l.push('--')
l.push('-- ROZWIĄZANIE: osobna tabela indeksu, do której trafia tekst już')
l.push('-- złożony do ASCII. Zapytania składane są tą samą funkcją w kodzie')
l.push('-- (foldPolish w src/lib/search/normalize-pl.ts), więc obie strony')
l.push('-- przechodzą identyczną transformację.')
l.push('--')
l.push('-- Stary articles_fts NIE jest usuwany — jego wyzwalacze i dane')
l.push('-- zostają nietknięte, żeby ewentualny kod jeszcze z niego czytający')
l.push('-- nie przestał działać w trakcie wdrożenia.')
l.push('-- =====================================================================')
l.push('')
l.push('DROP TRIGGER IF EXISTS trg_articles_szukaj_ai;')
l.push('DROP TRIGGER IF EXISTS trg_articles_szukaj_ad;')
l.push('DROP TRIGGER IF EXISTS trg_articles_szukaj_au;')
l.push('DROP TABLE IF EXISTS articles_szukaj;')
l.push('')
l.push('-- Tabela zewnętrzna (bez content=), bo przechowujemy tekst PRZETWORZONY,')
l.push('-- a nie wskaźnik do kolumn tabeli articles. Przy content= FTS5 czytałby')
l.push('-- oryginalne wartości z „ł” i całe składanie byłoby bez efektu.')
l.push('CREATE VIRTUAL TABLE articles_szukaj USING fts5(')
l.push('  title,')
l.push('  lead,')
l.push('  tresc,')
l.push('  rowid_articles UNINDEXED,')
l.push("  tokenize='unicode61 remove_diacritics 2'")
l.push(');')
l.push('')
l.push('-- Wypełnienie z istniejących artykułów. Tylko te nieusunięte —')
l.push('-- artykuł w koszu nie powinien wracać w wynikach wyszukiwania.')
l.push('INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)')
l.push('SELECT')
l.push('  a.id,')
l.push(`  ${A.title},`)
l.push(`  ${A.lead},`)
l.push(`  ${A.tresc},`)
l.push('  a.id')
l.push('FROM articles a')
l.push('WHERE a.deleted_at IS NULL;')
l.push('')
l.push('-- Wyzwalacze utrzymujące indeks. Muszą działać w bazie, nie w kodzie:')
l.push('-- import treści, migracja i ręczna korekta redaktora przez konsolę d1')
l.push('-- omijają warstwę aplikacji, a indeks musi pozostać zgodny z danymi.')
l.push('CREATE TRIGGER trg_articles_szukaj_ai AFTER INSERT ON articles BEGIN')
l.push('  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)')
l.push(`  VALUES (new.id, ${N.title}, ${N.lead}, ${N.tresc}, new.id);`)
l.push('END;')
l.push('')
l.push('CREATE TRIGGER trg_articles_szukaj_ad AFTER DELETE ON articles BEGIN')
l.push("  INSERT INTO articles_szukaj (articles_szukaj, rowid, title, lead, tresc, rowid_articles)")
l.push(`  VALUES ('delete', old.id, ${O.title}, ${O.lead}, ${O.tresc}, old.id);`)
l.push('END;')
l.push('')
l.push('-- UPDATE = delete + insert. FTS5 nie obsługuje UPDATE wprost na tabeli')
l.push('-- zewnętrznej; pominięcie części usuwającej zostawia w indeksie stary')
l.push('-- tekst obok nowego i artykuł wraca w wynikach po słowach, których')
l.push('-- już nie zawiera — także po tych usuniętych sprostowaniem.')
l.push('CREATE TRIGGER trg_articles_szukaj_au AFTER UPDATE ON articles BEGIN')
l.push("  INSERT INTO articles_szukaj (articles_szukaj, rowid, title, lead, tresc, rowid_articles)")
l.push(`  VALUES ('delete', old.id, ${O.title}, ${O.lead}, ${O.tresc}, old.id);`)
l.push('  INSERT INTO articles_szukaj (rowid, title, lead, tresc, rowid_articles)')
l.push(`  VALUES (new.id, ${N.title}, ${N.lead}, ${N.tresc}, new.id);`)
l.push('END;')
l.push('')
l.push('-- Dziennik zapytań — do raportu „czego szukają mieszkańcy, a czego nie')
l.push('-- znajdują”. Zapytania bez wyników wskazują treść, której brakuje')
l.push('-- na portalu; to najtańsze źródło tematów dla redakcji.')
l.push('CREATE TABLE IF NOT EXISTS search_queries (')
l.push('  id INTEGER PRIMARY KEY AUTOINCREMENT,')
l.push('  query_raw TEXT NOT NULL,')
l.push('  query_normalized TEXT NOT NULL,')
l.push('  result_count INTEGER NOT NULL,')
l.push('  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
l.push('  -- Świadomie BEZ adresu IP i identyfikatora użytkownika. Historia')
l.push('  -- wyszukiwań powiązana z osobą to dane wrażliwe (ktoś szuka')
l.push('  -- „zasiłek”, „komornik”, „nekrolog” konkretnego nazwiska), a do')
l.push('  -- ustalenia braków w treści potrzebna jest tylko sama fraza.')
l.push(');')
l.push('')
l.push('CREATE INDEX IF NOT EXISTS idx_search_queries_norm ON search_queries(query_normalized);')
l.push('CREATE INDEX IF NOT EXISTS idx_search_queries_zero ON search_queries(result_count) WHERE result_count = 0;')
l.push('CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at DESC);')

process.stdout.write(l.join('\n') + '\n')
process.stderr.write('OK — wygenerowano migracje 0054 (indeks FTS z polskim skladaniem liter)\n')
