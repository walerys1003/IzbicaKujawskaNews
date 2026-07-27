# 04 — API — audyt szczegółowy i plan wdrożenia

**Projekt:** izbica24.pl — portal informacyjny gminy Izbica Kujawska
**Data audytu:** 2026-07-27
**Stan realizacji: 25 %**
**Dokument nadrzędny:** [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md)

---

## SPIS TREŚCI

- [CZĘŚĆ A — Co JEST zrobione](#część-a--co-jest-zrobione)
- [CZĘŚĆ B — Co BRAKUJE (literalnie)](#część-b--co-brakuje-literalnie)
- [CZĘŚĆ C — Etapy prac A1–A10](#część-c--etapy-prac-a1a10)
- [CZĘŚĆ D — Docelowa mapa API](#część-d--docelowa-mapa-api)

---

## CZĘŚĆ A — CO JEST ZROBIONE

### A1. Statystyki

| Metryka | Wartość |
|---|---|
| Plików tras (`src/routes/` + `src/api/`) | **68** |
| Rejestracji tras zapisu (`.post/.put/.patch/.delete`) | **73** |
| Rejestracji `.post(` | 66 |
| Rejestracji `.delete(` | 44 |
| Rejestracji `.put(` | 25 |
| Zamontowanych routerów w `src/index.tsx` | 7 (`/api/*`) |
| Endpointów odpowiadających 200 (test na żywo) | **8 z 19 sprawdzonych** |

### A2. Router główny `src/api/v1.ts` (346 LOC) — DZIAŁA

Jedyny plik API, który realnie odpowiada. 16 tras:

| Metoda | Ścieżka | Linia | Status |
|---|---|---|---|
| GET | `/api/v1/health` | 86 | ✅ 200 |
| GET | `/api/v1/articles` | 96 | ✅ 200 |
| GET | `/api/v1/articles/:slug` | 126 | ✅ 200 |
| GET | `/api/v1/categories` | 134 | ✅ 200 |
| GET | `/api/v1/categories/:slug` | 146 | ✅ 200 |
| GET | `/api/v1/alerts` | 164 | ✅ 200 |
| GET | `/api/v1/roads` | 178 | ✅ 200 |
| GET | `/api/v1/weather` | 191 | ⚠️ 200 (dane pozorne) |
| GET | `/api/v1/fuel` | 208 | ⚠️ 200 (dane pozorne) |
| GET | `/api/v1/rag/search` | 306 | ⚠️ 200 |
| GET | `/api/v1/events` | 320 | ✅ 200 |
| GET | `/api/v1/duty` | 337 | ✅ 200 |
| POST | `/api/v1/incoming` | 221 | ⚠️ bez zapisu |
| POST | `/api/v1/articles/:slug/comments` | 243 | ⚠️ bez zapisu |
| POST | `/api/v1/comments` | 270 | ⚠️ walidacja OK, zapisu brak |
| POST | `/api/v1/articles/:slug/share` | 297 | ⚠️ bez zapisu |

Ten plik importuje 17 podrouterów z `src/routes/v1/`: media-upload, media-list, media-delete, media-tag, media-search, media-bulk, video-upload, video-list, video-detail, audio-upload, podcast-feed, multimedia-recent, galleries-public, gallery-create, gallery-add-image, gallery-reorder, gallery-publish.

### A3. Endpointy potwierdzone testem HTTP na żywo

```
200  GET /api/health
200  GET /api/stats
200  GET /api/v1/health
200  GET /api/v1/media/list
200  GET /api/v1/media/search
200  GET /api/v1/multimedia/recent
200  GET /api/newsroom
200  GET /api/search
```

### A4. Napisany kod modułów (nieaktywny, ale istnieje)

**Uwierzytelnianie — `src/routes/auth/` (18 plików):**
`login.ts`, `logout.ts`, `register.ts`, `refresh.ts`, `reset-password.ts`, `change-password.ts`, `verify-email.ts`, `magic-link.ts`, `profile.ts`, `sessions.ts`, `delete-account.ts`, `api-keys.ts`, `2fa-enable.ts`, `2fa-verify.ts`, `social-google.ts`, `social-facebook.ts`, `helpers/password-utils.ts`, `middleware/{rate-limit,require-auth,require-role}.ts`

Kod ma sensowną strukturę — np. `login.ts:9` ma `rateLimit(5, 60_000)` i walidator JSON, `api-keys.ts:16` ma `requireRole(['author','editor','admin'])`.

**RAG — `src/routes/rag.ts`:** 16 tras POST/DELETE (`/ingest/article`, `/ingest/bulk`, `/search`, `/ask`, `/summarize-cluster`, `/timeline/:topic`, `/compare`, `/translate-context`, `/qa-archive`, `/recommend/:userId`, `/auto-categorize`, `/find-duplicates`, `/expand-stub`, `/fact-check`, `/reindex`, `/document/:slug`)

**Push — `src/routes/push/index.ts`:** 9 tras zapisu (`/subscribe`, `/unsubscribe`, `/send-broadcast`, `/send-segment`, `/send-test`, `/preferences`, `/breaking`, `/schedule`, `DELETE /subscribers/:id`)

**Analytics — `src/routes/analytics/index.ts`:** 6 tras (`/pageview`, `/event`, `/session-start`, `/session-end`, `/export.csv`, `/flush-buffer`)

**Search — `src/routes/search/index.ts`:** `/log`, `/saved`, `DELETE /saved/:id`

**Newsletter — `src/routes/newsletter/index.ts`:** `/subscribe`, `/confirm`, `/unsubscribe`

**Admin backup — `src/routes/admin/`:** `/backups`, `/backups/restore`, `/backups/verify`, `logs.ts`, `errors.ts`, `slow-queries.ts`

**AI — `src/routes/ai-newsroom.ts`** (`POST /:action`, 25 akcji) i **`src/routes/ai.ts`** (`POST /prompt/:id` z walidatorami)

### A5. Middleware globalne — `src/index.tsx`

```
74: app.use('*', securityHeaders)
75: app.use('/api/*', corsHeaders)
76: app.use('*', responsePerformanceMiddleware)
```

---

## CZĘŚĆ B — CO BRAKUJE (LITERALNIE)

### ⛔ B1. Cały moduł uwierzytelniania NIE JEST ZAMONTOWANY

**Test dowodowy:**
```bash
$ curl -X POST http://localhost:3000/api/auth/login \
    -H 'content-type: application/json' -d '{"email":"a@b.pl","password":"x"}'
404
```

18 plików w `src/routes/auth/` — logowanie, rejestracja, 2FA, klucze API, sesje, OAuth Google/Facebook — **nie ma ani jednego `app.route()` w `src/index.tsx`, który by je montował**. Weryfikacja:

```bash
$ grep -n "routes/auth" src/index.tsx
# (brak wyników)
```

**Konsekwencje:**
- Nie da się zalogować do systemu — nie istnieje żadna trasa logowania
- `requireAuth` / `requireRole` nie są używane nigdzie w aktywnych trasach
- Panel `/admin` jest otwarty dla wszystkich (patrz `02-BACKEND.md`, ustalenie B2 — auth „fail-open")
- Kod 18 plików to ~1 200 LOC nigdy nie wykonanego, nieprzetestowanego kodu

**To jest podstawowa luka bezpieczeństwa i blokada funkcjonalna nr 1 dla API.**

### ⛔ B2. Rozjazd: kod zamontowany vs kod nieistniejący pod ścieżką

Test 19 ścieżek dał 11 odpowiedzi 404 dla endpointów, które **mają pliki w repozytorium**:

| Ścieżka | Kod | Plik istnieje? |
|---|---|---|
| `/api/v1/healthz` | 404 | `routes/v1/health.ts` — zamontowany pod inną ścieżką |
| `/api/v1/metrics` | 404 | `routes/v1/metrics.ts` — zamontowany na `/` nie `/api/v1` |
| `/api/v1/version` | 404 | `routes/v1/version.ts` — j.w. |
| `/api/v1/video/list` | 404 | `routes/v1/video-list.ts` — zły prefiks montowania |
| `/api/v1/podcast/feed` | 404 | `routes/v1/podcast-feed.ts` |
| `/api/v1/galleries` | 404 | `routes/v1/galleries-public.tsx` |
| `/api/ai` | 404 | `routes/ai.ts` zamontowany, ale bez trasy `GET /` |
| `/api/rag` | 404 | `routes/rag.ts` — brak `GET /` (tylko POST) |
| `/api/v1/newsletter` | 404 | zamontowany, brak `GET /` |
| `/api/push` | 404 | zamontowany, brak `GET /` |
| `/api/v1/gdpr` | 404 | zamontowany, brak `GET /` |

Przyczyna dwojaka:
1. **Niespójność prefiksów** — `metrics`/`version`/`health` są montowane przez `app.route('/', ...)` w liniach 181–183, a nie pod `/api/v1`
2. **Brak tras indeksowych** — routery mają tylko POST, więc `GET` na korzeń zwraca 404 zamiast listy dostępnych operacji

### ⛔ B3. Odpowiedzi z pustymi danymi i flagą `fallback`

```bash
$ curl -s /api/v1/media/list
{"total":0,"items":[],"fallback":true}

$ curl -s /api/v1/multimedia/recent
{"items":[],"fallback":true}
```

Flaga `fallback: true` to sygnał, że handler nie mógł sięgnąć do bazy i zwrócił pustkę. Ponieważ brak bindingu D1 (patrz `03-BAZA-DANYCH.md`, B1), **każdy endpoint czytający z bazy zwraca pustkę zamiast błędu 503** — czyli API kłamie: raportuje sukces przy braku źródła danych.

### ⛔ B4. Błędy 500 i wycieki komunikatów wewnętrznych

```bash
$ curl -X POST /api/v1/newsletter/subscribe -d '{"email":"a@b.pl"}'
500  →  <!DOCTYPE html><html lang="pl">...

$ curl -X POST /api/rag/search -d '{"query":"pozar"}'
400  →  {"error":"search_failed","detail":"Cannot read properties of undefined (reading 'prepare')"}
```

Dwa poważne problemy:

1. **Endpoint API zwraca HTML** — błąd 500 w `/api/v1/newsletter/subscribe` przechodzi przez globalny renderer JSX i zwraca stronę HTML. Klient API oczekujący JSON dostaje `<!DOCTYPE html>`. Powód: `app.use(renderer)` w linii 88 działa również dla tras API przy błędzie.
2. **Wyciek szczegółów implementacji** — `"Cannot read properties of undefined (reading 'prepare')"` ujawnia, że `env.DB` jest `undefined` i że używany jest `.prepare()`. Takie komunikaty nie mogą trafiać do klienta na produkcji.

### ⛔ B5. Brak endpointów CRUD dla treści — 0 tras zapisu artykułu

Nie istnieje **żadna** trasa umożliwiająca utworzenie, edycję ani publikację artykułu:

```bash
$ curl -X POST /api/v1/articles -d '{"title":"test"}'  →  404
$ curl -X PUT  /api/v1/articles/1 -d '{"title":"t"}'   →  404
```

**Brakująca lista minimalna (~48 endpointów):**

**Artykuły (12):**
```
POST   /api/v1/articles                    utworzenie szkicu
GET    /api/v1/articles/:id                pobranie do edycji (z blokami)
PUT    /api/v1/articles/:id                zapis całości
PATCH  /api/v1/articles/:id                zapis częściowy (autosave)
DELETE /api/v1/articles/:id                soft delete
POST   /api/v1/articles/:id/publish        publikacja
POST   /api/v1/articles/:id/unpublish      wycofanie
POST   /api/v1/articles/:id/schedule       zaplanowanie publikacji
POST   /api/v1/articles/:id/duplicate      duplikat
GET    /api/v1/articles/:id/versions       historia wersji
POST   /api/v1/articles/:id/restore/:vid   przywrócenie wersji
POST   /api/v1/articles/:id/blocks         zapis bloków treści
```

**Media (8):**
```
POST   /api/v1/media/upload                (istnieje kod, wymaga R2)
DELETE /api/v1/media/:key                  (istnieje kod)
PUT    /api/v1/media/:id                   metadane, alt text
POST   /api/v1/media/:id/variants          generowanie webp/avif
GET    /api/v1/media                       lista z filtrowaniem
POST   /api/v1/media/bulk                  operacje masowe
POST   /api/v1/media/:id/crop              kadrowanie
GET    /api/v1/media/:id/usage             gdzie użyte
```

**Galerie (6):** create, add-image, reorder, publish, delete, update — kod istnieje, brak R2 + D1

**Wideo / audio (8):** upload, transcode-callback, captions, thumbnail, list, detail, delete, podcast feed

**Ogłoszenia / nekrologi / praca / nieruchomości (8):** CRUD ×4 typy

**Komentarze — moderacja (6):**
```
GET    /api/v1/comments/pending
POST   /api/v1/comments/:id/approve
POST   /api/v1/comments/:id/reject
POST   /api/v1/comments/:id/spam
DELETE /api/v1/comments/:id
POST   /api/v1/comments/bulk-moderate
```

**Użytkownicy / role (6):** lista, create, update, delete, zmiana roli, reset hasła przez admina

**Taksonomia (4):** kategorie CRUD, tagi CRUD, sołectwa update, kolejność

### ⛔ B6. Brak jednolitego kontraktu odpowiedzi

Obecnie występują co najmniej 4 różne kształty odpowiedzi:

```json
{"total":0,"items":[],"fallback":true}
{"items":[],"fallback":true}
{"error":"missing_fields","required":["articleSlug"]}
{"error":"search_failed","detail":"..."}
```
…plus HTML przy 500.

Brak: standardu koperty (envelope), standardu paginacji, standardu kodów błędów, standardu identyfikatora żądania (`request_id`) do korelacji z logami.

### ⛔ B7. Walidacja niekompletna i nieujednolicona

- `src/lib/validators/` ma **tylko 3 pliki**: `article.ts`, `comment.ts`, `newsletter.ts` — dla ~48 potrzebnych endpointów
- Część tras używa `validator('json', ...)` z Hono (moduł `auth`, `rag`, `ai`), część nie waliduje nic (`analytics`, `newsletter`)
- `validateArticle()` sprawdza tylko: `title >= 8`, `lede >= 20`, `body` niepuste, `body >= 80` znaków — brak walidacji: kategoria z listy dopuszczalnych, slug unikalny, rozmiar/typ pliku, XSS w HTML, limit długości pól
- Brak schematów współdzielonych między frontendem i backendem (np. Zod)

### ⛔ B8. Brak rate limitingu w praktyce

- `src/lib/kv/rate-limit-store.ts` istnieje
- `RATE_LIMIT_KV` ma binding, ale ID = `"replace-rate-limit-kv"` (placeholder — nie działa)
- `rateLimit(5, 60_000)` użyty tylko w `auth/login.ts`, który **nie jest zamontowany**
- Efekt: **zero ochrony** na endpointach publicznych `POST /api/v1/comments`, `/incoming`, `/analytics/pageview` — otwarte na zalewanie

### ⛔ B9. Brak autoryzacji na poziomie endpointu

- `middleware/require-auth.ts` i `require-role.ts` istnieją, ale nie są nakładane na żadną aktywną trasę
- `/api/push/send-broadcast` — wysyłka powiadomień do wszystkich — **bez żadnej ochrony**
- `/api/admin/backups/restore` — odtworzenie bazy — **bez żadnej ochrony**
- `/api/analytics/export.csv` — eksport danych — **bez żadnej ochrony**
- `/api/rag/reindex` — kosztowna operacja AI — **bez żadnej ochrony**

To najpoważniejsze ryzyko API: gdyby projekt trafił dziś na produkcję, dowolna osoba mogłaby odtworzyć bazę z backupu lub rozesłać powiadomienia push.

### ⛔ B10. Brak wersjonowania i dokumentacji

- Dwa równoległe prefiksy: `/api/*` i `/api/v1/*` bez zasady, co gdzie należy
- Brak specyfikacji OpenAPI / Swagger
- `docs/API.md` ma 2 778 znaków — opisuje kilka endpointów, nieaktualne
- Brak kolekcji do testowania (Postman / Bruno / plik `.http`)
- Brak nagłówków deprecacji, brak polityki zmian łamiących zgodność

### ⛔ B11. Brak testów API

- Zero testów integracyjnych
- Brak frameworka testowego w `package.json`
- Skrypt `"test": "curl http://localhost:3000"` — to nie jest test
- Cała weryfikacja API w tym audycie została wykonana ręcznie przez `curl`

### ⛔ B12. Brak obserwowalności

- `error_log` i `backups` mają migracje (`0066`, `0067`), ale nie ma handlera zapisującego błędy
- Brak `request_id` w odpowiedziach
- `/api/stats` zwraca dane (459 chunków), ale nie ma metryk per-endpoint: liczba żądań, p95 latencji, wskaźnik błędów
- `slow-queries.ts` istnieje, ale bez D1 nie ma czego mierzyć

---

## CZĘŚĆ C — ETAPY PRAC A1–A10

### ETAP A1 — Uporządkowanie montowania i przestrzeni nazw *(2 dni)* 🔴 BLOKUJĄCY

1. Zbudować pojedynczy plik kompozycji `src/api/index.ts` montujący **wszystkie** routery pod jednym prefiksem `/api/v1`
2. Zamontować brakujące moduły: `auth` (18 plików), poprawnie `health`/`metrics`/`version`, `podcast-feed`, `galleries-public`, `video-list`
3. Wyeliminować podwójny prefiks `/api/*` vs `/api/v1/*` — jedna zasada
4. Dodać do każdego routera trasę `GET /` zwracającą listę dostępnych operacji (samodokumentacja)
5. Wyłączyć renderer JSX dla ścieżek `/api/*` — błędy muszą zwracać JSON, nie HTML

**Kryterium odbioru:** skrypt testujący 60 ścieżek nie zwraca żadnego nieoczekiwanego 404; żadna odpowiedź z `/api/*` nie zawiera `<!DOCTYPE html>`.

### ETAP A2 — Uwierzytelnianie i autoryzacja *(4–5 dni)* 🔴 BLOKUJĄCY

1. Zamontować `/api/v1/auth/*` — login, logout, register, refresh, reset-password, verify-email
2. Wdrożyć JWT: sekret przez `wrangler pages secret put JWT_SECRET`, tokeny access (15 min) + refresh (30 dni)
3. Sesje w `SESSION_KV` (wymaga realnego ID KV — patrz `05-INTEGRACJE.md`)
4. Nałożyć `requireAuth` + `requireRole` na **każdą** trasę zapisu
5. Zlikwidować fail-open w `src/routes/admin.tsx` — brak sekretu musi oznaczać odmowę, nie przyznanie roli admin
6. Model 6 ról: `admin`, `editor`, `author`, `moderator`, `contributor`, `viewer`
7. 2FA (TOTP) dla ról `admin` i `editor`
8. Klucze API dla integracji zewnętrznych (`api-keys.ts`) z zakresami uprawnień

**Kryterium odbioru:** `POST /api/v1/auth/login` zwraca token; każda trasa zapisu bez tokena zwraca 401; z tokenem o niewystarczającej roli — 403.

### ETAP A3 — Jednolity kontrakt odpowiedzi i błędów *(2 dni)*

Standard koperty:
```json
// Sukces (element)
{ "ok": true, "data": { }, "meta": { "request_id": "req_..." } }

// Sukces (lista)
{ "ok": true, "data": [ ],
  "meta": { "page": 1, "per_page": 12, "total": 58, "total_pages": 5,
            "request_id": "req_..." } }

// Błąd
{ "ok": false,
  "error": { "code": "VALIDATION_FAILED",
             "message": "Nieprawidłowe dane wejściowe",
             "fields": { "title": "Minimum 8 znaków" } },
  "meta": { "request_id": "req_..." } }
```

Katalog kodów błędów: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`, `AI_PROVIDER_ERROR`, `STORAGE_ERROR`.

Zasada: **usunąć flagę `fallback: true`** — brak bazy to `503 SERVICE_UNAVAILABLE`, nie pusta lista z sukcesem.

**Kryterium odbioru:** middleware `errorHandler` przechwytuje każdy wyjątek; żaden komunikat wewnętrzny (np. „reading 'prepare'") nie trafia do klienta; każda odpowiedź ma `request_id`.

### ETAP A4 — CRUD artykułów i treści *(6–8 dni)* 🔴 BLOKUJĄCY

1. 12 endpointów artykułów (lista w B5)
2. Obsługa bloków `ContentBlock[]` — zapis do `article_blocks`
3. Workflow statusów: `draft → review → scheduled → published → archived` z kontrolą przejść wg roli
4. Autosave co 30 s przez `PATCH`
5. Blokada współbieżnej edycji (`If-Match` / ETag lub pole `locked_by`)
6. `article_versions` przy każdym zapisie
7. CRUD dla: ogłoszeń, nekrologów, ofert pracy, nieruchomości, wydarzeń, sondaży, breaking news

**Kryterium odbioru:** artykuł utworzony przez API pojawia się na froncie po publikacji; historia zmian dostępna; nieuprawniony użytkownik nie może opublikować.

### ETAP A5 — Media, galerie, wideo, audio *(4–5 dni)*

1. Utworzyć buckety R2 (patrz `05-INTEGRACJE.md`) i podłączyć istniejący kod uploadu
2. Walidacja: typ MIME, rozmiar (limit np. 20 MB obraz / 500 MB wideo), skanowanie nazw plików
3. Upload wieloczęściowy dla plików > 100 MB (limit żądania w Workers)
4. Generowanie wariantów webp/avif po uploadzie (obecnie ręczne — PIL w sandboxie)
5. Detekcja duplikatów (`duplicate-detect.ts`)
6. Alt text przez AI (`alt-text-ai.ts` → patrz `06-AI.md`)
7. Galerie: create → add-image → reorder → publish
8. Podcast RSS z realnych plików audio

**Kryterium odbioru:** wgranie zdjęcia w panelu daje plik w R2, wiersz w `media_assets`, warianty webp/avif i podgląd w bibliotece.

### ETAP A6 — Moderacja komentarzy *(2 dni)*

1. 6 endpointów moderacji (lista w B5)
2. Podłączenie `profanity-filter.ts` i `spam-detector.ts`
3. Kolejka moderacji w panelu z akcjami masowymi
4. Anonimizacja IP (`ip-anonymize.ts`) — wymóg RODO
5. Moderacja wspierana AI (`comments-moderator` — istniejący prompt)

**Kryterium odbioru:** komentarz publiczny trafia do kolejki; po zatwierdzeniu widoczny na froncie; spam odrzucany automatycznie.

### ETAP A7 — Rate limiting, CORS, bezpieczeństwo *(2 dni)*

1. Realne ID dla `RATE_LIMIT_KV`
2. Limity per endpoint: login 5/min, komentarz 3/10 min, upload 20/godz., AI 10/min, publiczne GET 120/min
3. Limit per IP + per użytkownik + per klucz API
4. Nagłówki `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
5. CORS: zamknąć na listę domen (obecnie `corsHeaders` bez ograniczeń)
6. Turnstile / captcha na formularzach publicznych (`CAPTCHA_KV`)
7. Limit rozmiaru ciała żądania
8. Sanityzacja HTML w treści artykułu (zapobieganie XSS)

**Kryterium odbioru:** 6. żądanie logowania w ciągu minuty zwraca 429 z `Retry-After`; żądanie z nieautoryzowanej domeny odrzucone przez CORS.

### ETAP A8 — Dokumentacja OpenAPI *(2–3 dni)*

1. Wdrożyć `@hono/zod-openapi` — schematy Zod jako jedno źródło walidacji **i** dokumentacji
2. Wygenerować `openapi.json`
3. Udostępnić Swagger UI pod `/api/docs` (dostęp tylko dla zalogowanych)
4. Przepisać `docs/API.md` na wygenerowaną referencję
5. Kolekcja `.http` / Bruno do testów ręcznych

**Kryterium odbioru:** `/api/docs` pokazuje wszystkie endpointy z przykładami; schematy Zod używane w runtime do walidacji.

### ETAP A9 — Testy API *(3–4 dni)*

1. Dodać Vitest + `@cloudflare/vitest-pool-workers`
2. Testy integracyjne: dla każdego endpointu przypadek pozytywny, negatywny (walidacja), autoryzacyjny (401/403)
3. Testy smoke po deployu (30 kluczowych ścieżek)
4. Progi pokrycia: minimum 70 % dla tras zapisu
5. CI: GitHub Actions uruchamiające testy przy każdym PR

**Kryterium odbioru:** `npm test` uruchamia pełny zestaw; CI blokuje merge przy niepowodzeniu.

### ETAP A10 — Obserwowalność *(2 dni)*

1. Middleware logujące do `error_log`: ścieżka, metoda, status, czas, `request_id`, użytkownik
2. Metryki per endpoint: liczba żądań, p50/p95/p99, wskaźnik błędów
3. Panel `/admin/errors` i `/admin/slow-queries` na realnych danych
4. Alerty przy wskaźniku błędów > 1 % (webhook / e-mail)
5. Śledzenie kosztów zewnętrznych wywołań (AI, e-mail) per żądanie

**Kryterium odbioru:** błąd 500 tworzy wiersz w `error_log` z `request_id` pozwalającym odtworzyć przebieg żądania.

---

### Podsumowanie harmonogramu API

| Etap | Zakres | Czas | Priorytet |
|---|---|---|---|
| A1 | Montowanie i przestrzeń nazw | 2 dni | 🔴 blokujący |
| A2 | Auth + autoryzacja + role | 4–5 dni | 🔴 blokujący |
| A3 | Kontrakt odpowiedzi i błędów | 2 dni | 🔴 wysoki |
| A4 | CRUD artykułów i treści | 6–8 dni | 🔴 blokujący |
| A5 | Media / galerie / wideo / audio | 4–5 dni | 🔴 wysoki |
| A6 | Moderacja komentarzy | 2 dni | 🟠 średni |
| A7 | Rate limiting / CORS / bezpieczeństwo | 2 dni | 🔴 wysoki |
| A8 | OpenAPI + dokumentacja | 2–3 dni | 🟠 średni |
| A9 | Testy API + CI | 3–4 dni | 🟠 średni |
| A10 | Obserwowalność | 2 dni | 🟡 niski |
| **RAZEM** | | **29–35 dni** | |

---

## CZĘŚĆ D — DOCELOWA MAPA API

```
/api/v1
├── /auth               login · logout · register · refresh · reset · verify
│                       · magic · profile · sessions · 2fa · api-keys · oauth
├── /articles           CRUD · publish · schedule · versions · blocks · duplicate
├── /categories         CRUD · reorder
├── /tags               CRUD · merge
├── /solectwa           read · update (34 sołectwa)
├── /media              upload · list · search · delete · tag · bulk · variants
├── /galleries          create · add-image · reorder · publish · delete
├── /video              upload · list · detail · captions · thumbnail
├── /audio              upload · podcast-feed · transcribe
├── /comments           create · moderate · approve · reject · spam · bulk
├── /ogloszenia         CRUD (7 podkategorii)
├── /obituaries         CRUD
├── /jobs               CRUD
├── /real-estate        CRUD
├── /events             CRUD · calendar
├── /polls              CRUD · vote · results
├── /breaking           create · activate · deactivate
├── /newsletter         subscribe · confirm · unsubscribe · campaigns · send
├── /push               subscribe · preferences · broadcast · segment · breaking
├── /search             query · suggest · log · saved · analytics
├── /ai                 generate · improve · proofread · seo · translate (→ 06-AI.md)
├── /rag                ingest · search · ask · fact-check · reindex
├── /analytics          pageview · event · session · report · export
├── /users              CRUD · roles · permissions
├── /settings           get · update (per klucz)
├── /gdpr               export-data · delete-request · consent
├── /health             health · ready · live
├── /metrics            prometheus / json
└── /docs               OpenAPI + Swagger UI
```

---

## POWIĄZANE DOKUMENTY

- [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md) — podsumowanie, ustalenia K1–K11
- [`02-BACKEND.md`](./02-BACKEND.md) — logika biznesowa za endpointami
- [`03-BAZA-DANYCH.md`](./03-BAZA-DANYCH.md) — schemat, do którego API zapisuje
- [`05-INTEGRACJE.md`](./05-INTEGRACJE.md) — R2, KV, e-mail, push
- [`06-AI.md`](./06-AI.md) — endpointy AI dla edytora artykułów
- [`07-ROADMAP.md`](./07-ROADMAP.md) — kolejność wykonania
