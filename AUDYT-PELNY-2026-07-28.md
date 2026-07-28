# 🔍 AUDYT PEŁNY — izbica24.pl (stan na 2026-07-28)

> **Metodologia**: każdy wynik w tym dokumencie pochodzi z **pomiaru na żywym systemie**
> (uruchomiony serwer `wrangler pages dev` + lokalna baza D1), nie z samego istnienia plików.
> Wykonano: pełny build, kontrolę typów, 168 testów, sondowanie ~50 tras HTTP,
> zapytania SQL do bazy. To odpowiedź na wadę poprzedniego audytu (TODO-590-AUDYT.md),
> w którym „✅ DONE" oznaczało tylko „plik istnieje" — 33 takie pliki okazały się martwym kodem.

---

## 📊 PODSUMOWANIE — PROCENT WDROŻENIA WG OBSZARÓW

| Obszar | Wdrożenie | Ocena |
|---|---:|---|
| **1. Frontend (portal publiczny v4)** | **85%** | 🟢 dobry |
| **2. Backend (logika serwerowa)** | **70%** | 🟡 zaawansowany |
| **3. Baza danych (D1)** | **80%** | 🟢 dobry (schemat 95%, dane realne 0%) |
| **4. API (REST v1 + pozostałe)** | **65%** | 🟡 częściowy |
| **5. Panel redakcyjny (admin)** | **70%** | 🟡 zaawansowany |
| **6. Autoryzacja i bezpieczeństwo** | **75%** | 🟢 dobry |
| **7. Wyszukiwarka** | **45%** | 🟠 działa na mockach |
| **8. Integracje zewnętrzne** | **40%** | 🟠 częściowe |
| **9. AI (newsroom, prompty, RAG)** | **35%** | 🟠 kod gotowy, brak kluczy i danych |
| **10. Media (upload, R2, galerie)** | **55%** | 🟠 lokalnie działa, prod niegotowy |
| **11. Powiadomienia (push, e-mail, newsletter)** | **45%** | 🟠 kod gotowy, brak konfiguracji |
| **12. Testy i jakość kodu** | **60%** | 🟡 testy OK, 134 błędy typów |
| **13. CI/CD** | **15%** | 🔴 brak workflowów |
| **14. Wdrożenie produkcyjne (Cloudflare)** | **0%** | 🔴 nie wdrożono |
| **15. n8n / automatyzacje treści** | **30%** | 🟠 definicje gotowe, nie uruchomione |
| **16. Wtyczka WordPress (izbica24-newsroom)** | **50%** | 🟠 kod + zip, nie testowana na WP |
| | | |
| **CAŁOŚĆ PROJEKTU (średnia ważona)** | **≈ 58–62%** | 🟡 |

**Interpretacja ogólna**: rdzeń portalu (frontend + baza + panel + auth) jest w stanie
zaawansowanym i realnie działa na D1. Do produkcji brakuje przede wszystkim:
wdrożenia na Cloudflare (0%), konfiguracji usług zewnętrznych (klucze AI, e-mail,
VAPID, KV/R2 w chmurze), przepięcia wyszukiwarki i RAG z mocków na D1 oraz realnych treści.

---

## 🧪 POMIARY BAZOWE (dowody)

| Pomiar | Wynik | Data pomiaru |
|---|---|---|
| Build produkcyjny (`vite build`) | ✅ sukces, 350 modułów, `dist/_worker.js` = **981 kB**, 3.9 s | 2026-07-28 |
| Kontrola typów (`tsc --noEmit`) | ⚠️ **134 błędy TS** (historycznie: 374 → 284 → 226 → 144 → 136 → 134) | 2026-07-28 |
| Testy (`vitest run`) | ✅ **29 plików / 168 testów — wszystkie zaliczone** (23.5 s) | 2026-07-28 |
| Serwer lokalny | ✅ `pm2` + `wrangler pages dev dist --d1 --local`, port 3000, HTTP 200 | 2026-07-28 |
| Baza D1 (lokalna) | ✅ **110 tabel**, 58 migracji zastosowanych, 30 artykułów, 22 kategorie, 4 użytkowników, 1 komentarz | 2026-07-28 |
| Kod źródłowy | 321 plików w `src/`, ~45 500 linii | 2026-07-28 |
| Sitemap | 45 adresów; **próba 5 losowych adresów artykułów → wszystkie 200** (po naprawie z 2026-07-28: wcześniej 21/30 było 404) | 2026-07-28 |

---

## 1️⃣ FRONTEND — portal publiczny v4 — **85%**

### ✅ Co jest (zmierzone — HTTP 200 na żywym serwerze)
- **Strona główna** `/` — pełne 16 sekcji szaty v4 (styl TVN24), parytet 1:1 z mockupem zweryfikowany element po elemencie
- **12 kategorii głównych**: `/wiadomosci`, `/na-sygnale`, `/samorzad`, `/kujawianka`, `/kultura`, `/historia`, `/ludzie`, `/zycie-codzienne`, `/przeglad-mediow`, `/multimedia`, `/ogloszenia` — 200
- **67 podkategorii** (`/wiadomosci/inwestycje` itd.) + 3. poziom (`/kultura/parafie/*`) — 200
- **Strony artykułów** — 200, treść czytana z **D1** (moduł `content-source.ts`, migawka na żądanie)
- **34 sołectwa**: `/solectwa` + `/solectwa/:slug` (np. `/solectwa/augustynowo`, `/solectwa/blenna` — 200)
- **Strony informacyjne** (wszystkie 200): `/kontakt`, `/redakcja`, `/regulamin`, `/polityka-prywatnosci`, `/rodo`, `/faq`, `/o-nas`, `/reklama`, `/mapa`, `/pogoda`
- **Wyszukiwanie UI**: `/szukaj?q=` — 200; **tagi**: `/tag/:slug` — 200
- **SEO**: `/sitemap.xml` (45 adresów, czyta z D1), `/rss.xml` (z D1), canonical + JSON-LD w rendererze, `/robots.txt`
- **404** — poprawna strona błędu
- **Dostępność (WCAG 2.1 AA)**: `<main>`, skip-link, kontrast, widoczny fokus — wdrożone i zmierzone
- **Wydajność**: krytyczny CSS inline, fonty z `font-display`, obrazy webp/avif (60 wariantów), lazy-loading
- **Mega-menu**: 67 podkategorii × 4 karty artykułów z rotacją
- **Pogoda**: pasek + karta SSR na stronie głównej (realne dane Open-Meteo)
- **Ciemny motyw**, baner zgody cookies, Service Worker `/sw.js` (push)

### ❌ Czego brakuje (15%)
- Sekcje strony głównej (hero, Na sygnale, Kujawianka, statystyki, ogłoszenia) nadal częściowo zasilane **danymi demo z TS** (`content-db.ts`, `data-site.ts`, `data-kujawianka.ts`) — tylko artykuły idą z D1
- Brak stron: `/dolacz`, `/telefony` (ważne telefony), `/linki`, `/pomoc`, `/sponsorzy`, `/mapa-strony` (HTML)
- Komentarze publiczne: komponent jest, ale pełny cykl (dodanie → moderacja → wyświetlenie) niedomknięty na froncie
- Sondy/ankiety (tabele w D1 są — brak UI)
- Brak realnych zdjęć (grafiki demo/wygenerowane)

---

## 2️⃣ BACKEND — logika serwerowa (Hono + Workers) — **70%**

### ✅ Co jest (zmierzone)
- **Hono 4 + JSX SSR** na Cloudflare Pages Functions; build przechodzi, worker 981 kB (limit 10 MB — OK)
- **Middleware (podpięte globalnie, zweryfikowane w `index.tsx`)**: request-id, security headers (CSP), CORS dla `/api/*`, limit ciała żądania, logger, pomiar wydajności, obsługa błędów z kopertą `{ok, error, requestId}`
- **Warstwa treści D1** (`v4/content-source.ts`) — jedyne źródło tłumaczące wiersze D1 na model artykułu; portal, API, sitemap, RSS i JSON-LD czytają z bazy
- **Moderacja**: filtr wulgaryzmów, detektor spamu (testy jednostkowe zaliczone)
- **Prywatność**: anonimizacja IP (naprawione 2 realne wycieki), PII-scrubber, zgoda cookies
- **Kopie zapasowe**: eksport/import D1, snapshot R2, szyfrowanie, trasy `/admin/backup-*` (zamontowane)
- **Monitoring**: health-check (200), error-tracker, logger, metryki, slow-query — moduły podpięte
- **Cron**: 2 harmonogramy w `wrangler.jsonc` (`*/10` i co godzinę) + trasa `/api/v1/cron`
- **Walidacja**: Zod — schematy artykułów, komentarzy, mediów, newslettera (testy zaliczone)

### ❌ Czego brakuje (30%)
- **134 błędy typów TS** — kompilacja Vite przechodzi, ale kontrola typów nie jest czysta (głównie testy i starsze moduły)
- Część modułów `lib/` nie ma potwierdzonego wykonania w żywych trasach (ryzyko martwego kodu jak przy usuniętych 33 plikach): `backup/schedule`, `monitoring/anomaly-detect`, `monitoring/uptime-pinger`, `media/video-transcode`, `media/audio-transcribe` (transkodowanie wideo w Workerze jest zresztą **niewykonalne** — limit CPU)
- Workflow publikacji (szkic → recenzja → publikacja) — model ról jest, przepływ redakcyjny niedomknięty
- Brak kolejki zadań (Queues) — cron to jedyny mechanizm asynchroniczny

---

## 3️⃣ BAZA DANYCH (Cloudflare D1) — **80%**

### ✅ Co jest (zmierzone SQL-em)
- **58 migracji** zastosowanych bez błędów; **110 tabel** w lokalnej bazie
- Pokrycie domen: artykuły + wersje + bloki treści, użytkownicy + role + sesje + 2FA, komentarze + moderacja, kategorie (22 w bazie), sołectwa (z seedem), newsletter + zgody, ogłoszenia, nekrologi, wydarzenia, inwestycje, sondy, media (assets/uses/videos/audios), push, analityka, logi błędów, audyt administracyjny, rate-limits, przekierowania, SEO-meta, breaking news, kopie zapasowe, ai_usage, RAG (`rag_documents`, `embeddings`)
- **FTS5** (pełnotekstowe): artykuły, komentarze, ogłoszenia, wydarzenia, sołectwa, strony, nekrologi + **polska normalizacja** + synonimy; wyzwalacze UPDATE/DELETE naprawione (błąd krytyczny usunięty 2026-07)
- Wyzwalacze `updated_at`, indeksy, CHECK-i enum, miękkie usuwanie (`deleted_at`), archiwizacja
- **Dane demo**: 30 artykułów z pełną treścią blokową (naprawione „artykuły bez treści"), 4 konta, seedy kategorii i sołectw

### ❌ Czego brakuje (20%)
- **Produkcyjna baza D1 nie istnieje** — w `wrangler.jsonc` brak realnego `database_id` (praca wyłącznie na `--local`)
- Tabele RAG **puste** — zero embeddingów w bazie
- Brak realnych treści (wszystko demo)
- Część tabel bez żadnego kodu, który by do nich pisał (np. `ab_tests`, `subscriptions` — schemat wyprzedza implementację)

---

## 4️⃣ API — **65%**

### ✅ Trasy DZIAŁAJĄCE (zmierzone kodami HTTP)
| Trasa | Kod | Uwagi |
|---|---|---|
| `GET /api/v1/health` | 200 | health-check z bazą |
| `GET /api/v1/articles` | 200 | **czyta z D1**, koperta `{ok,data}` |
| `GET /api/v1/categories` | 200 | z D1 |
| `GET /api/v1/pogoda` | 200 | realne dane Open-Meteo |
| `GET /api/search?q=` | 200 | ⚠️ działa, ale **na mocku** (patrz §7) |
| `GET /api/search/autocomplete` | 200 | ⚠️ mock |
| `GET /api/v1/podcast/feed.xml` | 200 | RSS podcastu |
| `POST /api/v1/auth/login` | 401 przy złych danych, poprawna koperta błędu | pełny auth działa |
| `GET /api/v1/newsletter/subscribers` | **401 bez logowania** | ✅ luka wycieku e-maili załatana (wcześniej 200!) |
| `GET /api/v1/comments` | 401 | wymaga auth |
| `GET /api/ai/*`, `/api/rag/*` | 401 | ✅ zamknięte (wcześniej otwarte — luka) |
| `POST /api/v1/media/upload` | 400 bez pliku | trasa żyje, waliduje |
| `GET /admin`, `/admin/articles` | 302 → login | panel chroniony |
| `GET /admin/login` | 200 | |

### ❌ Trasy MARTWE lub błędne (zmierzone 404/503)
| Trasa | Kod | Problem |
|---|---|---|
| `GET /api/v1/version` | **404** | moduł istnieje, montowany na `/` nie `/api/v1` — niespójność |
| `GET /api/v1/metrics` | **404** | j.w. |
| `GET /api/v1/media` | **404** | listing pod `/api/v1/media/list`, brak aliasu |
| `GET /api/v1/galleries` | **404** | router zamontowany, ale ścieżka bazowa nie odpowiada |
| `GET /api/v1/videos` | **404** | j.w. (jest `/videos/list`) |
| `GET /api/newsroom/status` | **404** | router newsroom zamontowany, brak trasy statusu |
| `GET /api/push/vapid-public-key` | **503** | brak skonfigurowanych kluczy VAPID |
| `POST /api/v1/newsletter/subscribe` | **503** `email_not_configured` | brak dostawcy e-mail |

### Ocena
Uwierzytelnianie (16 pod-tras: login, rejestracja, refresh, magic-link, reset, 2FA, sesje,
klucze API, social Google/FB), artykuły, komentarze z moderacją, media, galerie, wideo,
audio, cron, pogoda, mapa — **kod jest i większość działa**, ale: niespójne ścieżki montowania
(version/metrics), brak dokumentacji OpenAPI, brak wersjonowania odpowiedzi w części tras,
social-login bez skonfigurowanych kluczy OAuth (martwy w praktyce).

---

## 5️⃣ PANEL REDAKCYJNY `/admin` — **70%**

### ✅ Co jest
- Logowanie (sesje w D1 — tabela `user_sessions`), przekierowanie 302 dla niezalogowanych — **zmierzone**
- Dashboard z kartami statystyk **czytającymi z D1** (`c.env.DB.prepare` — zweryfikowane w kodzie)
- Moduły: artykuły (lista/nowy/edycja), media, ogłoszenia, komentarze (moderacja z zapisem `moderated_by` — naprawione), użytkownicy, ustawienia, logi, błędy, wolne zapytania, kopie zapasowe (lista/utwórz/przywróć/pobierz/weryfikuj)
- Zapis artykułu z panelu **trafia do D1 i jest widoczny na portalu** (wspólne źródło `content-source`)
- Rozliczalność: tabela audytu decyzji moderacyjnych

### ❌ Czego brakuje (30%)
- Edytor blokowy treści — podstawowy (brak drag&drop, embedów, wstawiania galerii z poziomu edytora)
- Workflow redakcyjny (szkic → recenzja → publikacja) — statusy są w bazie, brak UI przejść i uprawnień per przejście
- Panel newslettera — lista jest, brak kompozera i realnej wysyłki (503)
- Panel AI (generowanie leadów, tytułów z promptów) — trasy AI chronione, brak UI w panelu
- Zarządzanie sondami, wydarzeniami, inwestycjami — tabele są, UI szczątkowe lub brak
- Statystyki odwiedzin (analityka własna) — buffer KV nieskonfigurowany

---

## 6️⃣ AUTORYZACJA I BEZPIECZEŃSTWO — **75%**

### ✅ Co jest (w większości potwierdzone testami/pomiarem)
- JWT z kontrolą kształtu tokenu i `alg` (naprawiony błąd odrzucający **każdy** poprawny token)
- Role i uprawnienia (`require-permission`, m.in. nowe `newsletter:read`), 2FA TOTP, magic-link, reset hasła, klucze API, sesje z możliwością unieważnienia
- **Załatane realne luki** (udokumentowane w git): wyciek pełnej listy e-maili subskrybentów (200→401), otwarte trasy AI/RAG/newsroom, 2 wycieki IP (anonimizacja), CSP
- Nagłówki bezpieczeństwa + testy, sanityzacja HTML, Turnstile (kod middleware), rate-limit (moduł + tabela), hash haseł (Web Crypto), sól IP w `.dev.vars`
- `.gitignore` obejmuje `.env`/`.dev.vars`

### ❌ Czego brakuje (25%)
- Turnstile i rate-limit **bez produkcyjnej konfiguracji** (KV placeholdery `replace-*`) — w praktyce nieaktywne
- Social login (Google/FB) bez kluczy OAuth — martwy
- Brak skanowania zależności w CI, brak testów penetracyjnych, brak nagłówka HSTS-preload potwierdzonego na produkcji (bo brak produkcji)
- 134 błędy typów = obszary poza kontrolą kompilatora

---

## 7️⃣ WYSZUKIWARKA — **45%**

### ✅ Co jest
- UI `/szukaj` + modal + autouzupełnianie — działa (200)
- Infrastruktura FTS5 w D1: 7 indeksów pełnotekstowych, polska normalizacja, stemmer, synonimy, podświetlanie, sugestie pisowni, analityka wyszukiwań — **kod i tabele istnieją**

### ❌ Kluczowa wada (zmierzona)
**Trasa `/api/search` czyta ze statycznej tablicy `data-articles.ts`, NIE z D1/FTS.**
Dowód: autocomplete zwraca tytuł, którego nie ma w bazie D1; import w
`src/routes/search/index.ts:6` wskazuje mock. Cała warstwa FTS jest zbudowana,
ale **niepodłączona do publicznego endpointu**. To największy pojedynczy rozjazd
„kod istnieje vs funkcja działa" w projekcie.

**Do zrobienia**: przepięcie `searchRouter` na `search-service.ts`/FTS (wysiłek: mały–średni, infrastruktura gotowa).

---

## 8️⃣ INTEGRACJE ZEWNĘTRZNE — **40%**

| Integracja | Stan | Dowód |
|---|---|---|
| **Pogoda (Open-Meteo)** | ✅ **DZIAŁA** — prognoza + jakość powietrza, cache KV, SSR na stronie głównej | `GET /api/v1/pogoda` → 200 z realnymi danymi |
| **Mapa (MapLibre)** | ✅ działa (naprawiony CSP) | `/mapa` → 200 |
| **Cloudflare Analytics** | 🟡 beacon + baner zgody wdrożone, wymaga tokenu na produkcji | kod w rendererze |
| **E-mail (wysyłka)** | ❌ **MOCK** — bez konfiguracji dostawcy loguje do konsoli | `subscribe` → 503 `email_not_configured`; `provider.ts:68 [MOCK EMAIL]` |
| **Web Push** | 🟡 pełna implementacja VAPID ES256 + aes128gcm (RFC 8291, test wektorem) — **brak wygenerowanych kluczy** | `vapid-public-key` → 503 |
| **Turnstile (antybot)** | 🟡 middleware jest, brak kluczy | — |
| **OAuth Google/Facebook** | ❌ kod jest, brak kluczy aplikacji | — |
| **KV (16 przestrzeni)** | ❌ wszystkie ID = `replace-*` (placeholder) — lokalnie działa, produkcyjnie nie istnieją | `wrangler.jsonc` |
| **R2 (20 kubełków)** | ❌ zdefiniowane w konfiguracji, nie utworzone w chmurze | `wrangler.jsonc` |
| **n8n (30 workflowów)** | 🟠 patrz §15 | — |
| **Kursy paliw / jakość powietrza dodatkowe** | 🟡 KV binding jest (`FUEL_KV`, `AIR_KV`), powietrze działa przez Open-Meteo | — |

---

## 9️⃣ AI — **35%**

### ✅ Co jest (kod)
- **Klient multi-provider**: OpenAI / Anthropic / Groq / OpenRouter / Together / Mistral / Ollama / vLLM / dowolny zgodny endpoint (konfigurowalne `*_BASE_URL`) — architektura solidna
- **15 promptów newsroomowych**: nagłówki, lead, TL;DR, tagi, SEO-meta, social, cytaty, fact-checker, moderator komentarzy, newsletter-blurb, push, prosty język, tłumaczenie PL↔EN, przepisywanie tonu, prompt obrazów
- Wymuszanie JSON-schema odpowiedzi, licznik kosztów (`ai_usage` w D1)
- Alt-text AI dla obrazów, wykrywanie duplikatów mediów (moduły)
- **Trasy `/api/ai`, `/api/rag`, `/api/newsroom` zamontowane i CHRONIONE** (401 bez tokenu — zmierzone; wcześniej były otwarte = luka, załatana)

### ❌ Czego brakuje (65%)
- **Zero skonfigurowanych kluczy API** (`.dev.vars` ma tylko JWT_SECRET, IP_HASH_SALT, ENVIRONMENT) → żadne wywołanie AI nie może się realnie wykonać
- **RAG**: embedder + vector-store + tabele (`rag_documents`, `embeddings`) istnieją, ale tabele są **puste** — zero zaindeksowanych dokumentów; endpoint odpowiada, lecz nie ma na czym pracować; część odpowiedzi RAG nadal z mocków (`public/data/chunks.json` — statyczny indeks BM25 z etapu prototypu)
- Brak UI w panelu redakcyjnym do korzystania z promptów (generuj tytuł/lead z artykułu)
- Brak potoku automatycznego (n8n → AI rewrite → szkic w D1) w działaniu
- Brak ewaluacji jakości promptów (testy promptów nie istnieją)

---

## 🔟 MEDIA — **55%**

### ✅ Co jest
- Trasy uploadu obrazów/wideo/audio (walidacja działa — 400 bez pliku), sniffing MIME, metadane EXIF, warianty obrazów, webp-fallback, serwowanie przez `/media/*`
- 20 modułów R2 (osobne kubełki: obrazy artykułów, galerie, awatary, podcasty, kopie…)
- Galerie: create/add-image/reorder/publish + publiczne widoki; 10 komponentów galeryjnych (karuzela, lightbox, masonry, panorama, before/after, timeline, mapa zdjęć, audio/wideo player)
- RSS podcastu (200)

### ❌ Czego brakuje (45%)
- R2 w chmurze nie istnieje (lokalnie symulowane) → upload produkcyjny niemożliwy
- Transkodowanie wideo / transkrypcja audio w Workerze — **niewykonalne architektonicznie** (limit CPU); moduły są iluzją, wymagają usługi zewnętrznej (np. Cloudflare Stream)
- Brak przycinania/edycji obrazów w panelu; brak CDN-owych transformacji obrazów (Cloudflare Images)

---

## 1️⃣1️⃣ POWIADOMIENIA — **45%**

| Kanał | Stan |
|---|---|
| **Web Push** | 🟡 implementacja kompletna i przetestowana wektorem RFC; SW zarejestrowany (naprawiony błąd escapowania inline-scriptu); **brak kluczy VAPID → 503**; magazyn subskrypcji w KV z limitem 500 (jawnie ostrzeżone) — do przeniesienia do D1 |
| **Newsletter** | 🟡 zapis subskrybentów + zgody w D1, double opt-in w kodzie; **wysyłka = mock (503)**; naprawiono kłamliwe „wysłano" |
| **E-mail transakcyjny** (weryfikacja konta, reset hasła, magic-link) | ❌ ta sama blokada — brak dostawcy; trasy działają, ale list nie wychodzi |
| **Breaking-news ticker** | ✅ na stronie (dane demo) |

---

## 1️⃣2️⃣ TESTY I JAKOŚĆ — **60%**

### ✅ Co jest (zmierzone)
- **168 testów / 29 plików — 100% zaliczonych**: jednostkowe (walidatory, moderacja, prywatność, SEO, push-krypto, stronicowanie KV), integracyjne z atrapą D1 (auth, artykuły, komentarze+moderacja, newsletter — 9 przypadków po przepisaniu, push), kontraktowe (etykiety kategorii, adresy artykułów)
- Kultura „dowodu przez mutację" — testy weryfikowane celowym psuciem kodu
- Usunięte tautologie testowe (np. `expect(status===200||status===500)` maskujący wyciek danych)
- Lint = realny `tsc` z zapadką (ratchet), `test:ci` naprawdę uruchamia testy
- Playwright skonfigurowany (smoke e2e)

### ❌ Czego brakuje (40%)
- **134 błędy typów** (cel: 0; zapadka pilnuje tylko braku regresu)
- Pokrycie: brak testów dla ~80% modułów `lib/` (media, backup, monitoring, r2)
- E2E: 1 plik smoke — brak scenariuszy krytycznych (publikacja artykułu end-to-end, moderacja, logowanie z 2FA)
- Brak testów wydajnościowych i dostępności (axe)

---

## 1️⃣3️⃣ CI/CD — **15%**

### ✅ Co jest
- `.github/`: dependabot, CODEOWNERS, szablony PR/issue
- Skrypty lokalne: `deploy.sh` (staging/prod), `migrate.sh`, `rollback.sh`, `health-check.sh`, `ci-lint.mjs`, `ci-test.mjs`
- Konfiguracje `wrangler-staging.jsonc` / `wrangler-prod.jsonc`

### ❌ Czego brakuje (85%)
- **Katalog `.github/workflows/` NIE ISTNIEJE** — zero automatyzacji: brak buildu na PR, brak testów na push, brak automatycznego deploya
- Brak środowiska staging w chmurze
- Repo GitHub podpięte (`walerys1003/IzbicaKujawskaNews`), ale bez potwierdzenia aktualności push

---

## 1️⃣4️⃣ WDROŻENIE PRODUKCYJNE — **0%**

**Portal nie jest wdrożony na Cloudflare Pages.** Brak:
- projektu Pages i publicznego URL
- produkcyjnej bazy D1 (brak `database_id`)
- 16 przestrzeni KV (wszystkie ID to `replace-*`)
- 20 kubełków R2
- sekretów produkcyjnych (JWT, sól IP, klucze AI, e-mail, VAPID, Turnstile, OAuth)
- domeny `izbica24.pl` (DNS/SSL)
- cron triggers w chmurze

Wszystko działa **wyłącznie lokalnie** w sandboxie (`--local`).

---

## 1️⃣5️⃣ n8n / AUTOMATYZACJE — **30%**

- **30 workflowów JSON** zdefiniowanych: RSS (Gazeta Pomorska, Dziennik Kujawski, Radio PiK), Facebook (gmina, OSP), scraping (powiat, policja), formularze, Telegram tip-line, AI-rewrite, raporty analityczne, kopie D1/R2, wykrywanie anomalii + dokumentacja `.md` do każdego
- Docker-compose + Caddyfile do postawienia n8n
- ❌ **Żaden workflow nie działa**: brak uruchomionej instancji n8n, brak poświadczeń (RSS/FB/Telegram/AI), workflowy nietestowane na żywych danych; scraping FB prawdopodobnie wymaga zmiany podejścia (API/permisje)

---

## 1️⃣6️⃣ WTYCZKA WORDPRESS `izbica24-newsroom` — **50%**

- ✅ Kod wtyczki (PHP): `izbica24-newsroom.php`, admin, includes, uninstall, composer, readme.txt; zbudowany **zip do pobrania** w `public/downloads/izbica24-newsroom-1.0.0.zip`
- ❌ Nie testowana na żadnej instalacji WordPress; brak potwierdzenia komunikacji wtyczka ↔ API portalu; brak instrukcji instalacji dla redakcji

---

## 🚨 NAJWAŻNIEJSZE BRAKI — LISTA PRIORYTETOWA

### 🔴 P0 — blokują produkcję
1. **Wdrożenie na Cloudflare Pages** (projekt, D1 prod + migracje, KV, R2, sekrety, domena) — obszar §14
2. **Wyszukiwarka na D1/FTS** zamiast mocka `data-articles.ts` — §7 (infrastruktura gotowa, tylko przepiąć)
3. **Dostawca e-mail** (Resend/Mailgun przez REST) — odblokuje newsletter, weryfikację kont, reset haseł — §11
4. **Klucze VAPID** (generator już jest w repo) — odblokuje push — §11
5. **Zero błędów typów** (134 → 0) albo świadome wyłączenie testów z zakresu tsc — §12

### 🟠 P1 — pierwszy tydzień po starcie
6. Klucz API dla AI (jeden provider wystarczy — architektura multi-provider gotowa) + indeksacja RAG (tabele puste) — §9
7. Sekcje strony głównej z D1 zamiast danych demo TS (hero, Kujawianka, ogłoszenia, statystyki) — §1
8. CI/CD: minimum `build + tsc + vitest` na PR, deploy na push do main — §13
9. Workflow publikacji w panelu (statusy + uprawnienia przejść) — §5
10. Migracja magazynu subskrypcji push z KV (limit 500) do D1 — §11

### 🟡 P2 — rozwój
11. UI AI w panelu (generowanie tytułów/leadów/SEO z promptów)
12. Uruchomienie n8n + 3–5 najcenniejszych workflowów (RSS → AI rewrite → szkic)
13. E2E krytycznych ścieżek (publikacja, moderacja, logowanie 2FA)
14. Sondy, wydarzenia, inwestycje — UI do istniejących tabel
15. Usunięcie/zastąpienie modułów niewykonalnych w Workerze (transkodowanie wideo → Cloudflare Stream)
16. Test wtyczki WP na żywej instalacji + dokumentacja

---

## 📌 WNIOSEK KOŃCOWY

Projekt jest w stanie **≈ 58–62% wdrożenia**, przy czym rozkład jest nierówny:
**warstwa lokalna (kod + baza + testy) ~75%**, **warstwa produkcyjna (chmura + integracje
z kluczami) ~10%**. Największa wartość ostatnich tygodni to przejście z „plik istnieje"
na „funkcja zmierzona" — załatano przy tym poważne luki (wyciek e-maili, otwarte trasy AI,
martwa sitemapa 69%, artykuły 404). Najkrótsza droga do działającego portalu:
**deploy na Cloudflare (P0.1) → e-mail + VAPID (P0.3–4) → search na FTS (P0.2)** —
to realnie kilka dni pracy, bo cała infrastruktura kodu już czeka.

---
*Audyt wykonany 2026-07-28 na żywym systemie (sandbox, `wrangler pages dev --local`).*
*Poprzednie audyty: `TODO-590-AUDYT.md` (2026-05-26, metodologia plikowa — patrz ostrzeżenie w nagłówku tamtego pliku), `docs/08-AUDYT-2026-07-27.md`.*
