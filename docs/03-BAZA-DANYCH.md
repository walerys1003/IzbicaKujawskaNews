# 03 — BAZA DANYCH — audyt szczegółowy i plan wdrożenia

**Projekt:** izbica24.pl — portal informacyjny gminy Izbica Kujawska
**Data audytu:** 2026-07-27
**Stan realizacji: 8 %**
**Dokument nadrzędny:** [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md)

---

## SPIS TREŚCI

- [CZĘŚĆ A — Co JEST zrobione](#część-a--co-jest-zrobione)
- [CZĘŚĆ B — Co BRAKUJE (literalnie)](#część-b--co-brakuje-literalnie)
- [CZĘŚĆ C — Etapy prac D1–D9](#część-c--etapy-prac-d1d9)
- [CZĘŚĆ D — Docelowy model danych](#część-d--docelowy-model-danych)

---

## CZĘŚĆ A — CO JEST ZROBIONE

### A1. Pliki migracji — 51 plików, 1 191 linii SQL

Fizycznie istnieją w `/home/user/webapp/migrations/`:

| Zakres | Pliki | Zawartość |
|---|---|---|
| 0001–0013 | 26 (z kolizjami) | schemat rdzeniowy: users, articles, categories, comments, media |
| 0014–0031 | 18 | subscriptions, admin_logs, rate_limits, redirects, seo_meta, breaking_news, indeksy, 8× FTS5, push, analytics |
| 0056–0059 | 4 | media_assets, media_uses, videos, audios |
| 0066–0067 | 2 | error_log, backups |

**Statystyki treści migracji:**

| Metryka | Wartość |
|---|---|
| Instrukcji `CREATE TABLE` | 52 |
| Unikalnych nazw tabel | **46** |
| Tabel zdefiniowanych **wielokrotnie** | **6** ⚠️ |
| `CREATE INDEX` | 127 |
| `CREATE TRIGGER` | 30 |
| Plików z FTS5 | 8 |

### A2. Lista 46 tabel zaprojektowanych

```
admin_logs                analytics_daily_rollup    analytics_events
analytics_pageviews       analytics_sessions        advertisements
article_tags              article_versions          articles
audios                    audit_log                 backups
breaking_news             categories                comments
embeddings                error_log                 events
investments               job_offers                media
media_assets              media_uses                newsletter_subscribers
newsletters               obituaries                polls
push_messages             push_preferences          push_subscribers
rag_documents             rate_limits                real_estate
redirects                 search_analytics          search_saved_queries
search_synonyms           seo_meta                  settings
solectwa                  subscriptions             tags
user_activity             users                     videos
weather_cache
```

### A3. Warstwa modeli TypeScript — 17 plików, 1 832 LOC

`src/db/models/`: `_shared.ts`, `articles.ts`, `article-tags.ts`, `audit-log.ts`, `categories.ts`, `comments.ts`, `events.ts`, `index.ts`, `job-offers.ts`, `media.ts`, `newsletters.ts`, `obituaries.ts`, `real-estate.ts`, `settings.ts`, `tags.ts`, `users.ts`, `weather-cache.ts`

Wspólny toolkit w `_shared.ts`: `DbContext`, `PaginationInput`, `PaginationResult`, `buildWhere()`, `compactRecord()`, `toSqlBoolean()`.

Przykład interfejsu (`articles.ts`):

```typescript
export interface ArticleRow {
  id: number; slug: string; title: string; lead: string
  content_html: string | null; content_md: string | null
  hero_image_r2_key: string | null; category_id: number | null; author_id: number | null
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  published_at: string | null; scheduled_at: string | null
  created_at: string; updated_at: string
  view_count: number; reading_minutes: number; language: string
  deleted_at: string | null; archived_at: string | null
}
```

### A4. Warstwa wyszukiwania — `src/lib/search/` (7 plików)

`fts-articles.ts`, `fts-ogloszenia.ts`, `global-search.ts`, `highlight.ts`, `polish-stemmer.ts`, `search-analytics.ts`, `spell-suggest.ts` — kod przygotowany pod FTS5, w tym stemmer dla języka polskiego.

### A5. Warstwa backupu — `src/lib/backup/` (7 plików)

`d1-export.ts`, `d1-import.ts`, `encrypt.ts`, `kv-dump.ts`, `r2-snapshot.ts`, `restore.ts`, `schedule.ts`

### A6. Realnie działające dane — `src/v4/content-db.ts`

**To jest jedyne miejsce, z którego portal faktycznie czyta dane.** 1 371 LOC, dane statyczne w TypeScript:

| Zasób | Liczba |
|---|---|
| Artykuły (`ARTICLES_V4`) | **58** |
| Autorzy (`AUTHORS`) | 4 |
| Galerie (`GALLERIES`) | 3 |
| Zasoby media (`MEDIA_LIBRARY`) | 24 |

Rozkład artykułów po kategoriach:
```json
{"wiadomosci":7,"samorzad":5,"kujawianka":4,"historia":3,"kultura":4,
 "na-sygnale":7,"ludzie":3,"przeglad-mediow":7,"zycie-codzienne":8,
 "multimedia":7,"ogloszenia":3}
```

Funkcje zapytań (18): `byCategory`, `bySolectwo`, `bySubcategory`, `byTag`, `byThirdLevel`, `byType`, `featured`, `findArticleV4`, `findGallery`, `incidents`, `latest`, `mostRead`, `relatedArticles`, `searchV4`, `tickerItems`.

---

## CZĘŚĆ B — CO BRAKUJE (LITERALNIE)

### ⛔ B1. NIE ISTNIEJE ŻADNA BAZA DANYCH — brak bindingu D1

**To jest błąd blokujący cały backend.**

```bash
$ grep -c "d1_databases" wrangler.jsonc
0
```

Aktualna zawartość `wrangler.jsonc`:

```jsonc
{
  "name": "izbica24-portal",
  "compatibility_date": "2025-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [ /* 15 wpisów — wszystkie z ID "replace-*-kv" */ ],
  "triggers": { "crons": ["*/10 * * * *", "0 * * * *"] }
}
```

**Konsekwencje:**
1. `c.env.DB` jest `undefined` w każdym handlerze
2. 51 migracji nie ma do czego być zaaplikowanych — `wrangler d1 migrations apply` nie ma celu
3. 17 plików modeli / 1 832 LOC **nigdy nie zostało wykonanych ani raz** — to kod nieprzetestowany w 100 %
4. Wszystkie 127 indeksów i 30 triggerów istnieje wyłącznie jako tekst w plikach
5. Endpointy API zwracają `{"total":0,"items":[],"fallback":true}` — potwierdzone testem HTTP

**Test dowodowy:**
```bash
$ curl -s http://localhost:3000/api/v1/media/list
{"total":0,"items":[],"fallback":true}
```

### ⛔ B2. KOLIZJA SCHEMATÓW — tabela `articles` zdefiniowana DWA RAZY, niekompatybilnie

**To jest najgroźniejszy błąd w całej bazie — groźniejszy niż brak bindingu, bo jest ukryty.**

6 tabel ma po dwie różne definicje:

| Tabela | Plik 1 | Plik 2 |
|---|---|---|
| `articles` | `0002_articles.sql` | `0002_core_schema.sql` |
| `categories` | `0003_categories.sql` | `0002_core_schema.sql` |
| `comments` | `0004_comments.sql` | `0002_core_schema.sql` |
| `users` | `0001_users.sql` | `0002_core_schema.sql` |
| `events` | `0007_events.sql` | inny plik |
| `media_assets` | `0011_media_assets.sql` | `0056_media_assets.sql` |

**Porównanie dwóch wersji `articles`:**

`migrations/0002_articles.sql`:
```sql
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lede TEXT NOT NULL,              -- ← "lede"
  body_md TEXT NOT NULL,           -- ← "body_md"
  author_id INTEGER,
  category_slug TEXT NOT NULL,     -- ← slug tekstowy
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),   -- ← tylko 2 stany
  published_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE RESTRICT
);
```

`migrations/0002_core_schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lead TEXT NOT NULL,              -- ← "lead"
  content_html TEXT,               -- ← content_html
  content_md TEXT,                 -- ← content_md
  hero_image_r2_key TEXT,          -- ← brakuje w wersji 1
  category_id INTEGER,             -- ← klucz liczbowy
  author_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','scheduled','published','archived')), -- 5 stanów
  published_at DATETIME,
  scheduled_at DATETIME,           -- ← brakuje w wersji 1
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER NOT NULL DEFAULT 0,       -- ← brakuje w wersji 1
  reading_minutes INTEGER NOT NULL DEFAULT 1,  -- ← brakuje w wersji 1
  language TEXT NOT NULL DEFAULT 'pl',         -- ← brakuje w wersji 1
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Dlaczego to jest bomba z opóźnionym zapłonem:**

Oba pliki używają `CREATE TABLE IF NOT EXISTS`. Wrangler aplikuje migracje w **kolejności alfabetycznej nazw plików**. Ponieważ `"0002_articles.sql" < "0002_core_schema.sql"` alfabetycznie (`a` < `c`), **pierwsza wygra wersja UBOŻSZA**, a druga zostanie **cicho pominięta bez żadnego błędu**.

Efekt: baza dostanie tabelę z kolumnami `lede`, `body_md`, `category_slug`, a cały kod (17 modeli + `ArticleRow`) oczekuje `lead`, `content_html`, `content_md`, `category_id`, `view_count`, `reading_minutes`, `hero_image_r2_key`, `scheduled_at`. **Każde zapytanie SELECT/INSERT wywali się runtime'owo z `no such column`** — i to nie na etapie migracji, ale przy pierwszym żądaniu użytkownika na produkcji.

Dodatkowo: `CHECK (status IN ('draft','published'))` z wersji 1 **odrzuci** każdy zapis ze statusem `review`, `scheduled` lub `archived` — a cały workflow redakcyjny opiera się na tych statusach.

**Wymagane działanie:** wersję `0002_articles.sql`, `0001_users.sql`, `0003_categories.sql`, `0004_comments.sql`, `0011_media_assets.sql` **usunąć całkowicie**. `0002_core_schema.sql` jest wersją zgodną z modelami i zostaje jako kanoniczna.

### ⛔ B3. 13 kolizji numeracji migracji

```
2× 0001    2× 0002    2× 0003    2× 0004    2× 0005
2× 0006    2× 0007    2× 0008    2× 0009    3× 0010
2× 0011    2× 0012    2× 0013
```

Szczegółowo:

| Nr | Plik A | Plik B | Plik C |
|---|---|---|---|
| 0001 | `initial_schema` | `users` | — |
| 0002 | `articles` | `core_schema` | — |
| 0003 | `categories` | `seed_categories` | — |
| 0004 | `comments` | `seed_admin` | — |
| 0005 | `fts_articles` | `newsletter_subs` | — |
| 0006 | `advertisements` | `fts_obituaries` | — |
| 0007 | `events` | `views_counters` | — |
| 0008 | `solectwa` | `triggers_updated_at` | — |
| 0009 | `investments` | `seed_demo_articles` | — |
| **0010** | `enum_checks` | `polls` | `rag_embeddings` |
| 0011 | `media_assets` | `soft_delete` | — |
| 0012 | `archived_at` | `user_activity` | — |
| 0013 | `articles_versions` | `search_indexes` | — |

Wrangler wymaga unikalnych prefiksów numerycznych. Przy takich duplikatach kolejność aplikacji jest niedeterministyczna względem intencji autora (rozstrzyga alfabet drugiej części nazwy), co daje np. `0005_fts_articles` **przed** stworzeniem tabeli `articles` z `0002_core_schema` — jeżeli kolejność wypadnie niekorzystnie, FTS5 wskaże na nieistniejącą tabelę.

### ⛔ B4. Luki w numeracji: 0032–0055, 0060–0065

Brakuje 30 numerów. Nie jest to błąd techniczny (wrangler toleruje luki), ale sygnalizuje, że pliki były generowane niesystematycznie i mogą brakować migracje, do których odwołuje się kod. Wymaga weryfikacji: czy `0056_media_assets.sql` nie zakłada istnienia czegoś z `0040`.

### ⛔ B5. Podwójna warstwa danych — `content-db.ts` vs `repo.ts`

| Plik | LOC | Artykułów | Importowany przez |
|---|---|---|---|
| `src/v4/content-db.ts` | 1 371 | **58** | `Layout.tsx`, `pages/Home.tsx`, `pages/Misc.tsx`, `router.tsx` |
| `src/v4/repo.ts` | 256 | 43 | **NIKT — plik osierocony** |

Dwa niezależne, rozjeżdżające się zbiory danych. `repo.ts` należy usunąć, bo już raz spowodował błąd: poprawka mega-menu została wprowadzona do `repo.ts`, co nie dało żadnego efektu, bo żywy kod czyta z `content-db.ts`.

### ⛔ B6. Brak seedu — 58 artykułów nie da się przenieść do bazy

Migracja `0009_seed_demo_articles.sql` istnieje, ale zawiera dane demonstracyjne, nie prawdziwe 58 artykułów z `content-db.ts`. Nie istnieje żaden skrypt konwersji `ARTICLES_V4[] → INSERT INTO articles`.

Trudność: `content-db.ts` przechowuje treść jako tablicę `ContentBlock[]` (union: `paragraph | heading | list | quote | image | gallery | video | audio | embed | file | table | info`), a tabela `articles` ma pojedyncze pola `content_html` / `content_md`. Potrzebny jest serializator bloków — albo osobna tabela `article_blocks`.

### ⛔ B7. FTS5 — 8 migracji, zero weryfikacji

Migracje: `0005_fts_articles`, `0006_fts_obituaries`, `0021_fts_articles` (duplikat!), `0022_fts_comments`, `0023_fts_ogloszenia`, `0024_fts_events`, `0025_fts_solectwa`, `0026_fts_pages`, `0027_fts_triggers_articles`, `0028_fts_synonyms`.

Problemy:
- `fts_articles` występuje **dwukrotnie** (0005 i 0021) — druga próba stworzenia tej samej tabeli wirtualnej
- Cloudflare D1 obsługuje FTS5, ale **nie obsługuje wszystkich tokenizerów** — wymaga sprawdzenia, czy użyty tokenizer jest dostępny
- `polish-stemmer.ts` w kodzie sugeruje własne stemowanie w TS, co dubluje logikę FTS
- Zero testów, czy zapytanie `MATCH` w ogóle zwraca wyniki

### ⛔ B8. Brak strategii migracji na produkcję

- Baza produkcyjna nie została utworzona (`wrangler d1 create` nigdy nie uruchomiono)
- Brak `database_id` do wpisania w `wrangler.jsonc`
- Brak środowiska staging
- Brak procedury rollbacku — żadna migracja nie ma pliku `.down.sql`

### ⛔ B9. Backup — kod bez harmonogramu i bez celu

`src/lib/backup/` ma 7 plików, w tym `schedule.ts`, ale:
- Brak bindingu R2 `R2_BACKUPS_DB` (patrz `05-INTEGRACJE.md`)
- Crony w `wrangler.jsonc` (`*/10 * * * *`, `0 * * * *`) nie mają handlera `scheduled()` w `src/index.tsx`
- `encrypt.ts` wymaga klucza, którego nigdzie nie ma jako sekretu
- Zero wykonanego backupu

### ⛔ B10. Brak kontroli integralności i wydajności

- Brak `PRAGMA foreign_keys = ON` — D1 domyślnie **wyłącza** klucze obce; bez tego wszystkie `FOREIGN KEY` z 52 definicji tabel są dekoracją
- 127 indeksów zdefiniowanych bez analizy planów zapytań (`EXPLAIN QUERY PLAN`) — część może być nieużywana, część potrzebnych może brakować
- Brak limitu rozmiaru: D1 free ma 500 MB/bazę, 5 GB total; brak oszacowania wzrostu (artykuły + analytics_pageviews rosną najszybciej)
- `analytics_pageviews` bez partycjonowania/rotacji zapełni bazę w kilka miesięcy

---

## CZĘŚĆ C — ETAPY PRAC D1–D9

### ETAP D1 — Sanityzacja migracji *(2–3 dni)* 🔴 BLOKUJĄCY

**Zadania:**
1. Usunąć 5 plików kolidujących ze schematem kanonicznym:
   - `0001_users.sql`, `0002_articles.sql`, `0003_categories.sql`, `0004_comments.sql`, `0011_media_assets.sql`
2. Ustalić `0002_core_schema.sql` jako jedyne źródło schematu rdzenia
3. Usunąć duplikat `0021_fts_articles.sql` (zostawić `0005`)
4. Przenumerować wszystkie 45 pozostałych plików na ciągły zakres `0001`–`0045` bez luk
5. Dla każdej migracji utworzyć plik `.down.sql`
6. Uruchomić lintowanie SQL — sprawdzić, że każda tabela referowana przez FK istnieje wcześniej
7. Dodać `PRAGMA foreign_keys = ON;` na początku pierwszej migracji

**Kryterium odbioru:** `ls migrations/*.sql | cut -d_ -f1 | uniq -d` zwraca pustkę; `grep -c "CREATE TABLE" ` = liczba unikalnych tabel.

### ETAP D2 — Utworzenie bazy i bindingu *(1 dzień)* 🔴 BLOKUJĄCY

```bash
npx wrangler d1 create izbica24-production
# skopiować database_id do wrangler.jsonc
```

Wpis w `wrangler.jsonc`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "izbica24-production",
    "database_id": "<ID_Z_POPRZEDNIEJ_KOMENDY>"
  }
]
```

Aktualizacja `ecosystem.config.cjs`:
```javascript
args: 'wrangler pages dev dist --d1=izbica24-production --local --ip 0.0.0.0 --port 3000'
```

Skrypty w `package.json`:
```json
"db:migrate:local": "wrangler d1 migrations apply izbica24-production --local",
"db:migrate:prod":  "wrangler d1 migrations apply izbica24-production",
"db:seed":          "wrangler d1 execute izbica24-production --local --file=./seed.sql",
"db:reset":         "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed"
```

**Kryterium odbioru:** `npm run db:migrate:local` przechodzi 45/45 migracji bez błędu; `wrangler d1 execute izbica24-production --local --command="SELECT name FROM sqlite_master WHERE type='table'"` listuje 46 tabel.

### ETAP D3 — Weryfikacja schematu względem modeli *(2 dni)*

1. Dla każdego z 17 plików modeli porównać kolumny w interfejsach TS z rzeczywistymi kolumnami w bazie
2. Napisać skrypt weryfikacyjny generujący raport różnic
3. Naprawić rozjazdy (kod ↔ SQL)
4. Sprawdzić poprawność wszystkich 30 triggerów (`updated_at`, soft delete, FTS sync)

**Kryterium odbioru:** skrypt `npm run db:verify` raportuje 0 rozjazdów.

### ETAP D4 — Seed danych produkcyjnych *(3–4 dni)*

1. Napisać konwerter `scripts/content-db-to-sql.ts`: `ARTICLES_V4[]` → `INSERT`-y
2. Zaprojektować serializację `ContentBlock[]`:
   - **Opcja A (rekomendowana):** dodatkowa tabela `article_blocks(article_id, position, type, payload_json)` — zachowuje strukturę bloków, umożliwia edycję blokową w panelu
   - Opcja B: `content_json TEXT` w `articles` — prostsza, ale traci możliwość zapytań po blokach
3. Wygenerować seed dla: 58 artykułów, 4 autorów, 3 galerii, 24 zasobów media, 11 kategorii, 67 podkategorii, 34 sołectw
4. Przepiąć `src/v4/content-db.ts` z danych statycznych na zapytania D1 — z zachowaniem sygnatur 18 funkcji (`byCategory`, `latest`, itd.), aby front-end nie wymagał zmian
5. Usunąć `src/v4/repo.ts`

**Kryterium odbioru:** portal renderuje wszystkie 88 tras z danych D1; `content-db.ts` nie zawiera literałów artykułów.

### ETAP D5 — FTS5 i wyszukiwanie *(2–3 dni)*

1. Zweryfikować, że D1 przyjmuje użyte tokenizery FTS5
2. Zbudować indeks z 58 artykułów, przetestować `MATCH` na polskich zapytaniach z odmianą
3. Rozstrzygnąć duplikację: FTS5 vs `polish-stemmer.ts` — jedna warstwa stemowania
4. Podłączyć `global-search.ts` do `/api/search` i strony `/szukaj`
5. Przetestować `highlight.ts` i `spell-suggest.ts`

**Kryterium odbioru:** zapytanie „pożar stodoły" zwraca artykuł `pozary/pozar-stodoly-bierzyn`; zapytanie „pożarów" (odmiana) również.

### ETAP D6 — Integralność, indeksy, wydajność *(2 dni)*

1. Włączyć `PRAGMA foreign_keys = ON` i przetestować kaskady
2. `EXPLAIN QUERY PLAN` dla 20 najczęstszych zapytań; usunąć nieużywane z 127 indeksów, dodać brakujące
3. Ustawić rotację `analytics_pageviews` (agregacja do `analytics_daily_rollup`, usuwanie surowych > 90 dni)
4. Oszacować wzrost bazy: rozmiar/artykuł × 500 artykułów/rok + analytics

**Kryterium odbioru:** żadne zapytanie listowe nie wykonuje pełnego skanu tabeli; udokumentowana prognoza rozmiaru na 3 lata.

### ETAP D7 — Backup i odtwarzanie *(2 dni)*

1. Utworzyć bucket R2 `izbica24-backups-db` + binding `R2_BACKUPS_DB`
2. Dodać handler `scheduled()` w `src/index.tsx` obsługujący crony
3. Podłączyć `d1-export.ts` → `encrypt.ts` → `r2-snapshot.ts`
4. Ustawić sekret klucza szyfrowania: `wrangler pages secret put BACKUP_ENCRYPTION_KEY`
5. **Przeprowadzić realny test odtworzenia** — backup bez zweryfikowanego restore nie jest backupem
6. Retencja: 7 dziennych / 4 tygodniowe / 12 miesięcznych

**Kryterium odbioru:** wykonany backup, pobrany, odszyfrowany i odtworzony do pustej bazy lokalnej z pełną zgodnością liczby rekordów.

### ETAP D8 — Środowiska i deploy bazy *(1–2 dni)*

1. Utworzyć bazę `izbica24-staging`
2. Konfiguracja per-environment w `wrangler.jsonc`
3. Procedura: migracja na staging → testy → migracja na produkcję
4. Bramka: zakaz `db:migrate:prod` bez zielonego przejścia na staging

**Kryterium odbioru:** udokumentowana i przetestowana ścieżka staging → prod.

### ETAP D9 — Wersjonowanie treści i audyt *(2 dni)*

1. Uruchomić `article_versions` — zapis snapshotu przy każdej edycji
2. Uruchomić `audit_log` / `admin_logs` — kto, co, kiedy
3. Uruchomić `soft_delete` + `archived_at` (migracje `0011_soft_delete`, `0012_archived_at`)
4. Widok „historia zmian artykułu" + przywracanie wersji w panelu

**Kryterium odbioru:** edycja artykułu tworzy wpis w `article_versions`; możliwy powrót do wersji poprzedniej.

---

### Podsumowanie harmonogramu bazy danych

| Etap | Zakres | Czas | Priorytet |
|---|---|---|---|
| D1 | Sanityzacja 51 migracji | 2–3 dni | 🔴 blokujący |
| D2 | Utworzenie D1 + binding | 1 dzień | 🔴 blokujący |
| D3 | Weryfikacja schemat ↔ modele | 2 dni | 🔴 wysoki |
| D4 | Seed 58 artykułów + przepięcie warstwy | 3–4 dni | 🔴 wysoki |
| D5 | FTS5 + wyszukiwanie PL | 2–3 dni | 🟠 średni |
| D6 | Integralność, indeksy, wydajność | 2 dni | 🟠 średni |
| D7 | Backup + zweryfikowany restore | 2 dni | 🔴 wysoki |
| D8 | Staging → produkcja | 1–2 dni | 🟠 średni |
| D9 | Wersjonowanie + audyt | 2 dni | 🟡 niski |
| **RAZEM** | | **17–21 dni** | |

---

## CZĘŚĆ D — DOCELOWY MODEL DANYCH

### Rdzeń redakcyjny
```
users ──┬── articles ──┬── article_blocks (NOWA)
        │              ├── article_tags ── tags
        │              ├── article_versions
        │              ├── seo_meta
        │              └── comments
        ├── audit_log
        └── user_activity

categories (11 kat. / 67 podkat. / 3 poziomy)
solectwa (34)
```

### Media
```
media_assets ──┬── media_uses ── articles
               ├── videos
               └── audios
galleries → gallery_images (do zaprojektowania)
```

### Treści lokalne
```
ogloszenia · obituaries · job_offers · real_estate
events · investments · polls · advertisements · breaking_news
```

### Dystrybucja
```
newsletter_subscribers ── newsletters ── subscriptions
push_subscribers ── push_preferences ── push_messages
```

### Operacyjne
```
analytics_events · analytics_pageviews · analytics_sessions · analytics_daily_rollup
search_analytics · search_saved_queries · search_synonyms
rate_limits · redirects · settings · error_log · backups · admin_logs
weather_cache
```

### AI / RAG
```
rag_documents ── embeddings   (patrz 06-AI.md)
```

---

## POWIĄZANE DOKUMENTY

- [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md) — podsumowanie i ustalenia krytyczne K1–K11
- [`02-BACKEND.md`](./02-BACKEND.md) — trasy zapisu korzystające z tej bazy
- [`04-API.md`](./04-API.md) — kontrakty endpointów
- [`05-INTEGRACJE.md`](./05-INTEGRACJE.md) — R2, KV, backup
- [`07-ROADMAP.md`](./07-ROADMAP.md) — kolejność wykonania wszystkich etapów
