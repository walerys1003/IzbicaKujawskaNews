# 07 — ROADMAPA — wszystkie etapy prac po kolei

**Projekt:** izbica24.pl — portal informacyjny gminy Izbica Kujawska
**Data:** 2026-07-27
**Dokument ostateczny — plan wykonania całości**

Ten dokument scala **49 etapów** z sześciu dokumentów szczegółowych i ustawia je w **jedynej możliwej kolejności wykonania**, wynikającej z zależności technicznych.

---

## SPIS TREŚCI

- [1. Punkt wyjścia](#1-punkt-wyjścia)
- [2. Zasada kolejności](#2-zasada-kolejności)
- [3. Graf zależności](#3-graf-zależności)
- [4. FAZA 0 — Fundament](#faza-0--fundament-blokujący-wszystko)
- [5. FAZA 1 — Baza i uwierzytelnianie](#faza-1--baza-danych-i-uwierzytelnianie)
- [6. FAZA 2 — Redakcja działa](#faza-2--redakcja-działa)
- [7. FAZA 3 — AI w edytorze](#faza-3--ai-w-edytorze)
- [8. FAZA 4 — Dystrybucja i integracje](#faza-4--dystrybucja-i-integracje)
- [9. FAZA 5 — Jakość i wdrożenie](#faza-5--jakość-i-wdrożenie)
- [10. Podsumowanie czasowe](#10-podsumowanie-czasowe)
- [11. Warianty zakresu](#11-warianty-zakresu)
- [12. Ryzyka](#12-ryzyka)

---

## 1. PUNKT WYJŚCIA

### Stan na 2026-07-27

| Obszar | Realizacja | Dokument |
|---|---|---|
| FRONT-END (część publiczna) | **88 %** | [`01-FRONTEND.md`](./01-FRONTEND.md) |
| FRONT-END (panel redakcyjny) | **35 %** | [`01-FRONTEND.md`](./01-FRONTEND.md) |
| BACK-END | **12 %** | [`02-BACKEND.md`](./02-BACKEND.md) |
| BAZA DANYCH | **8 %** | [`03-BAZA-DANYCH.md`](./03-BAZA-DANYCH.md) |
| API | **25 %** | [`04-API.md`](./04-API.md) |
| INTEGRACJE | **10 %** | [`05-INTEGRACJE.md`](./05-INTEGRACJE.md) |
| SZTUCZNA INTELIGENCJA | **30 %** kod / **0 %** interfejs | [`06-AI.md`](./06-AI.md) |
| **CAŁOŚĆ** | **≈ 32 %** | [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md) |

### Co to znaczy w praktyce

**Portal wygląda jak gotowy i nim nie jest.**

Działa: 88 tras publicznych, wierne odwzorowanie projektu graficznego, mega-menu z rotującymi kartami, 58 artykułów, 11 kategorii, 67 podkategorii, 34 sołectwa, zero błędów w konsoli przeglądarki.

Nie działa nic, co wymaga zapisu danych:
- **Nie da się dodać artykułu** — 0 tras zapisu, formularz z `action="#"`
- **Nie da się zalogować** — moduł uwierzytelniania (18 plików) niezamontowany, `POST /api/auth/login` → 404
- **Nie ma bazy danych** — brak bindingu D1, 51 migracji bez celu
- **Nie da się wgrać pliku** — 20 bindingów R2 używanych w kodzie, 0 zadeklarowanych
- **AI jest niedostępna dla redaktora** — 1 328 LOC warstwy AI, zero przycisków w interfejsie
- **Panel admina otwarty dla wszystkich** — uwierzytelnianie „fail-open"

Sedno problemu: **napisano bardzo dużo kodu, którego nigdy nie wykonano.** ~6 000 LOC backendu (17 modeli, 68 plików tras, 21 modułów R2, 15 modułów KV, 22 pliki AI) nie zostało uruchomionych ani raz, bo brakuje bindingów i montowania.

---

## 2. ZASADA KOLEJNOŚCI

Kolejność nie jest dowolna. Wynika z twardych zależności:

```
Bez bindingu D1        → nie zadziała żaden model, żadna trasa zapisu, żaden RAG
Bez uwierzytelniania   → nie wolno wystawić żadnej trasy zapisu (luka bezpieczeństwa)
Bez bindingu R2        → nie zadziała upload mediów, galerie, backup
Bez tras zapisu        → panel redakcyjny nie ma z czym rozmawiać
Bez edytora            → AI nie ma gdzie się pojawić
Bez sekretów           → AI zwraca atrapę, panel jest otwarty
Bez handlera cronów    → status "scheduled" jest bezużyteczny
```

**Reguła nadrzędna:** żadna trasa zapisu nie może zostać udostępniona przed ukończeniem uwierzytelniania. Wystawienie CRUD artykułów przed etapem A2 oznacza portal, w którym każdy może publikować.

---

## 3. GRAF ZALEŻNOŚCI

```
                    ┌─────────────────────────────────┐
                    │  FAZA 0 — FUNDAMENT             │
                    │  D1 · D2 · I1 · I2 · I3 · A1    │
                    │  (migracje, D1, R2, KV, sekrety)│
                    └───────────────┬─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │  FAZA 1a      │     │  FAZA 1b      │     │  FAZA 1c      │
      │  D3 · D4      │     │  A2 · B2 · B3 │     │  A3 · I4      │
      │  schemat+seed │     │  auth + role  │     │  kontrakt+cron│
      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
              └─────────────────────┼─────────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │  FAZA 2 — REDAKCJA DZIAŁA       │
                    │  A4 · A5 · B4 · F-panel · A6    │
                    │  CRUD + media + workflow        │
                    └───────────────┬─────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │  FAZA 3 — AI W EDYTORZE         │
                    │  AI1..AI12 (12 etapów)          │
                    └───────────────┬─────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │  FAZA 4 — DYSTRYBUCJA           │
                    │  I5..I12 · D5 · D7 · D9         │
                    └───────────────┬─────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │  FAZA 5 — JAKOŚĆ I WDROŻENIE    │
                    │  F2..F7 · A8 · A9 · A10 · D8    │
                    └─────────────────────────────────┘
```

---

## FAZA 0 — FUNDAMENT *(blokujący wszystko)*

**Czas: 9–11 dni roboczych**
**Bez ukończenia tej fazy żadna inna praca nie ma sensu — cały napisany kod pozostaje niewykonalny.**

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **1** | **D1** | Sanityzacja 51 migracji: usunąć 5 plików z kolidującym schematem (`0001_users`, `0002_articles`, `0003_categories`, `0004_comments`, `0011_media_assets`), usunąć duplikat `0021_fts_articles`, przenumerować na ciągłe `0001–0045`, dodać pliki `.down.sql`, dodać `PRAGMA foreign_keys = ON` | 2–3 dni | [03](./03-BAZA-DANYCH.md) |
| **2** | **D2** | `wrangler d1 create izbica24-production`, wpisać `database_id`, dodać sekcję `d1_databases`, zaktualizować `ecosystem.config.cjs` o `--d1=`, dodać skrypty `db:*`, zaaplikować 45 migracji lokalnie | 1 dzień | [03](./03-BAZA-DANYCH.md) |
| **3** | **I1** | R2: utworzyć 4 buckety (`izbica24-media`, `-documents`, `-system`, `-public`), dodać `r2_buckets`, zrefaktoryzować 21 modułów `src/lib/r2/` na 1 adapter z prefiksami | 2 dni | [05](./05-INTEGRACJE.md) |
| **4** | **I2** | KV: utworzyć namespace'y, podmienić 15 atrap `replace-*-kv` na realne ID, **dodać brakujący `APP_KV`** (galerie zapisują się do nieistniejącego namespace'u) | 1 dzień | [05](./05-INTEGRACJE.md) |
| **5** | **I3** | Sekrety: utworzyć `.dev.vars`, ustawić 8 sekretów produkcyjnych, wygenerować parę VAPID, **usunąć zaszytą atrapę `VAPID_FALLBACK`** z `push/index.ts:50` | 1 dzień | [05](./05-INTEGRACJE.md) |
| **6** | **A1** | API: jeden plik kompozycji, zamontować **wszystkie** routery pod `/api/v1` (w tym 18 plików `auth/`), naprawić 11 tras zwracających 404, dodać `GET /` do każdego routera, **wyłączyć renderer JSX dla `/api/*`** (błędy zwracają HTML) | 2 dni | [04](./04-API.md) |

### Kryterium wyjścia z FAZY 0

```bash
npm run db:migrate:local          # 45/45 migracji bez błędu
wrangler d1 execute ... --command="SELECT count(*) FROM sqlite_master WHERE type='table'"  # 46
curl -X POST /api/v1/media/upload -F file=@test.jpg   # obiekt w R2
curl -X POST /api/v1/auth/login -d '{...}'            # NIE 404
curl /admin                                            # 401 (nie 200!)
curl -X POST /api/newsroom/suggestHeadlines            # realna odpowiedź, nie {"mock":true}
grep -c "replace-" wrangler.jsonc                      # 0
```

---

## FAZA 1 — BAZA DANYCH I UWIERZYTELNIANIE

**Czas: 15–19 dni** — trzy ścieżki możliwe częściowo równolegle

### Ścieżka 1a — Dane *(5–6 dni)*

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **7** | **D3** | Weryfikacja 17 plików modeli względem rzeczywistego schematu, skrypt `db:verify`, sprawdzenie 30 triggerów | 2 dni | [03](./03-BAZA-DANYCH.md) |
| **8** | **D4** | Konwerter `ARTICLES_V4[]` → SQL, tabela `article_blocks` dla `ContentBlock[]`, seed 58 artykułów + 4 autorów + 3 galerii + 24 mediów + 11 kategorii + 67 podkategorii + 34 sołectw, przepięcie `content-db.ts` na D1 z zachowaniem 18 sygnatur funkcji, **usunięcie osieroconego `repo.ts`** | 3–4 dni | [03](./03-BAZA-DANYCH.md) |

### Ścieżka 1b — Bezpieczeństwo *(6–8 dni)* 🔴 KRYTYCZNA

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **9** | **A2** | JWT (access 15 min + refresh 30 dni), sesje w `SESSION_KV`, zamontowane `/api/v1/auth/*`, **likwidacja fail-open** w `admin.tsx` (brak sekretu = odmowa, nie rola admin), 2FA dla admin/editor, klucze API z zakresami | 4–5 dni | [04](./04-API.md) |
| **10** | **B3** | Model 6 ról: `admin`, `editor`, `author`, `moderator`, `contributor`, `viewer` + macierz uprawnień, `requireRole` na każdej trasie zapisu | 2 dni | [02](./02-BACKEND.md) |
| **11** | **A7** | Rate limiting (login 5/min, komentarz 3/10 min, upload 20/h, AI 10/min), CORS na listę domen, limit rozmiaru żądania, sanityzacja HTML | 2 dni | [04](./04-API.md) |
| **12** | **I9** | Turnstile na 7 formularzach publicznych + honeypot | 1–2 dni | [05](./05-INTEGRACJE.md) |

### Ścieżka 1c — Infrastruktura *(4–5 dni)*

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **13** | **A3** | Jednolita koperta odpowiedzi, katalog 12 kodów błędów, `request_id`, **usunięcie flagi `fallback:true`** (brak bazy = 503, nie pusta lista z sukcesem), middleware `errorHandler` bez wycieku szczegółów | 2 dni | [04](./04-API.md) |
| **14** | **I4** | Handler `scheduled()` dla 2 istniejących cronów + cron dobowy: pogoda, publikacja zaplanowanych, kolejka powiadomień, agregacja analityki, RSS, czyszczenie sesji, backup | 2 dni | [05](./05-INTEGRACJE.md) |
| **15** | **B7** | Zapis błędów do `error_log`, logowanie żądań z `request_id` | 1 dzień | [02](./02-BACKEND.md) |

### Kryterium wyjścia z FAZY 1

- Portal renderuje wszystkie 88 tras **z danych D1**, nie z pliku TypeScript
- `POST /api/v1/auth/login` zwraca token; trasa zapisu bez tokena → 401; z niewystarczającą rolą → 403
- `/admin` bez tokena → 401
- 6. próba logowania w ciągu minuty → 429
- Artykuł ze `scheduled_at` w przeszłości zostaje opublikowany cronem
- Żadna odpowiedź z `/api/*` nie zawiera `<!DOCTYPE html>`

---

## FAZA 2 — REDAKCJA DZIAŁA

**Czas: 20–26 dni**
**Po tej fazie redakcja może realnie prowadzić portal.** To pierwszy moment, w którym projekt ma wartość użytkową.

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **16** | **A4** | 12 endpointów artykułów: create, read, update, patch (autosave), delete, publish, unpublish, schedule, duplicate, versions, restore, blocks | 6–8 dni | [04](./04-API.md) |
| **17** | **B4** | Workflow `draft → review → scheduled → published → archived` z kontrolą przejść wg roli, blokada współbieżnej edycji | 2 dni | [02](./02-BACKEND.md) |
| **18** | **F-panel** | **Przebudowa panelu redakcyjnego:** usunąć `action="#"` z `ArticleForm.tsx`, edytor blokowy dla 12 typów `ContentBlock`, biblioteka mediów, kolejka moderacji, zarządzanie użytkownikami, ustawienia | 8–10 dni | [01](./01-FRONTEND.md) |
| **19** | **A5** | Media: upload z walidacją MIME i rozmiaru, upload wieloczęściowy > 100 MB, automatyczne warianty webp/avif, detekcja duplikatów, galerie (create → add → reorder → publish), wideo, audio, podcast RSS | 4–5 dni | [04](./04-API.md) |
| **20** | **A6** | Moderacja komentarzy: 6 endpointów, filtr wulgaryzmów, detektor spamu, anonimizacja IP (RODO), kolejka w panelu | 2 dni | [04](./04-API.md) |
| **21** | **B5** | Walidacja wszystkich endpointów (obecnie 3 walidatory na ~48 endpointów) — schematy Zod jako jedno źródło | 2 dni | [02](./02-BACKEND.md) |
| **22** | **D9** | `article_versions` przy każdej edycji, `audit_log`, soft delete, widok historii z przywracaniem | 2 dni | [03](./03-BAZA-DANYCH.md) |
| **23** | **I11** | Zastąpienie **45 obrazów Unsplash + 4 picsum + 2 MDN** własnymi zasobami w R2, reguła CI blokująca hotlinki, pola `author`/`license`/`source` w `media_assets` | 2–3 dni | [05](./05-INTEGRACJE.md) |

### Kryterium wyjścia z FAZY 2 — **PIERWSZY KAMIEŃ MILOWY**

✅ Redaktor loguje się, tworzy artykuł, wgrywa zdjęcie, układa bloki treści, zapisuje szkic, wysyła do recenzji, redaktor naczelny publikuje — **artykuł pojawia się na portalu**.
✅ Komentarz czytelnika trafia do kolejki, po zatwierdzeniu jest widoczny.
✅ Historia zmian dostępna, możliwy powrót do wersji poprzedniej.
✅ Zero obrazów zewnętrznych.

---

## FAZA 3 — AI W EDYTORZE

**Czas: 33–41 dni**
Realizacja głównego wymagania zamawiającego. Szczegóły w [`06-AI.md`](./06-AI.md).

| # | Etap | Zadanie | Czas | Wymóg |
|---|---|---|---|---|
| **24** | **AI1** | Uniwersalny adapter dostawców: `openai-compatible` + `anthropic` + `workers-ai`; usunięcie zaszytych URL-i i typu `SupportedModel` (2 wartości); obsługa Groq, OpenRouter, Together, Mistral, Ollama, vLLM, Workers AI; **fallback `{mock:true}` → `503`** | 3–4 dni | W1 |
| **25** | **AI2** | Profile dostawców w bazie, klucze szyfrowane AES-GCM, ekran `/admin/settings/ai`, **przycisk „Testuj połączenie"**, podpowiedź klucza `sk-…f3a9` | 2–3 dni | W2 |
| **26** | **AI3** | 🔴 **PANEL AI W EDYTORZE** — panel boczny, menu kontekstowe zaznaczenia, komenda `/ai`, podłączenie **wszystkich 25 istniejących akcji**, podgląd różnicowy, cofanie, historia z kosztem | 5–6 dni | W3, W6 |
| **27** | **AI4** | Generator całego artykułu: `POST /api/v1/ai/write-article`, wyjście jako `ContentBlock[]`, kontrola długości, kontekst faktów o gminie, instrukcja anty-konfabulacyjna, 2–3 warianty, wynik zawsze `draft` | 4–5 dni | W3 |
| **28** | **AI5** | Presety i ustawienia: 8 presetów startowych („Relacja z sesji rady", „Notka OSP", „Mecz Kujawianki"…), suwaki długości/tonu/odbiorcy/poziomu języka, wytyczne redakcyjne jako trwały kontekst | 2–3 dni | W4 |
| **29** | **AI7** | RAG na archiwum: indeks Vectorize (`izbica24-articles`, 1536 wymiarów), indeksacja 58 artykułów, chunking 500 tokenów, automatyczna indeksacja przy publikacji, **zabezpieczenie `/api/rag/reindex`** | 3 dni | W5, W6 |
| **30** | **AI6** | Wyszukiwanie w internecie: Brave/Tavily, pobieranie treści przez `HTMLRewriter`, priorytet źródeł lokalnych (BIP gminy, powiat, radiopik, portalwloclawek, pomorska), **obowiązkowe przypisy**, cache 24 h | 3–4 dni | W5 |
| **31** | **AI8** | Strumieniowanie SSE — tekst powstający na żywo, przycisk „Przerwij", licznik tokenów | 2 dni | — |
| **32** | **AI9** | Weryfikacja i anty-halucynacja: automatyczny fact-check, **kontrola nazw względem listy 34 sołectw**, weryfikacja liczb i dat, wykrywanie zapożyczeń wobec 58 artykułów, korekta, ocena czytelności, **blokada publikacji przy ostrzeżeniach** | 3–4 dni | W6 |
| **33** | **AI10** | Koszty i limity: `ai_generations`, `ai_budgets`, licznik tokenów, limity dzienne/miesięczne per użytkownik, alert przy 80 %, panel `/admin/ai/usage` | 2–3 dni | — |
| **34** | **AI11** | Oznaczanie AI: kolumny `ai_assisted`/`ai_disclosure`/`human_reviewed_by`, **twarda blokada publikacji bez akceptacji człowieka**, nota na artykule, polityka AI, schema.org | 2 dni | prawny |
| **35** | **AI12** | Odporność: ponawianie z opóźnieniem wykładniczym, dostawca zapasowy, limit czasu 60 s, wyłącznik awaryjny w `FEATURE_FLAGS_KV`, zachowanie pracy redaktora przy błędzie | 2 dni | — |

### Kryterium wyjścia z FAZY 3 — **DRUGI KAMIEŃ MILOWY**

✅ Administrator wpisuje w panelu klucz dowolnego dostawcy (OpenAI / Anthropic / Groq / Ollama / Workers AI), klika „Testuj", widzi odpowiedź.
✅ Redaktor wpisuje temat („Sesja rady gminy 24 lipca — budżet na remont drogi w Pasiece"), wybiera preset i długość, klika „Generuj" — **widzi tekst powstający na żywo**.
✅ Artykuł ma poprawną strukturę bloków, listę źródeł z internetu, powiązania z archiwum i oznaczone twierdzenia do weryfikacji.
✅ Wymyślona nazwa sołectwa generuje ostrzeżenie; publikacja zablokowana do decyzji redaktora.
✅ Panel pokazuje koszt; przekroczenie limitu blokuje wywołania.

---

## FAZA 4 — DYSTRYBUCJA I INTEGRACJE

**Czas: 16–21 dni**

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **36** | **I7** | E-mail: Resend + weryfikacja domeny (SPF/DKIM/DMARC), 6 szablonów HTML, podwójna zgoda, wysyłka wsadowa, obsługa odbić, naprawa błędu 500 na `/newsletter/subscribe` | 2–3 dni | [05](./05-INTEGRACJE.md) |
| **37** | **D5** | FTS5 + wyszukiwanie polskie: weryfikacja tokenizerów w D1, indeks z 58 artykułów, rozstrzygnięcie duplikacji FTS vs `polish-stemmer.ts`, podłączenie `/szukaj`, wyszukiwanie hybrydowe z Vectorize | 2–3 dni | [03](./03-BAZA-DANYCH.md) |
| **38** | **I8** | Push: Service Worker, podpisywanie VAPID przez Web Crypto (Workers nie ma `web-push`), preferencje kategorii, segmentacja, **zabezpieczenie `/send-broadcast`** (obecnie otwarte!) | 2–3 dni | [05](./05-INTEGRACJE.md) |
| **39** | **I5** | Pogoda i powietrze: Open-Meteo (52.4247 N, 18.7561 E), IMGW-PIB (stacja Włocławek), GIOŚ, cache 10 min, ostrzeżenia IMGW → „Na sygnale", **usunięcie zaszytych wartości pozornych** | 2–3 dni | [05](./05-INTEGRACJE.md) |
| **40** | **I6** | Agregator RSS dla „Przeglądu mediów": tabele `external_sources` + `external_items`, parser RSS/Atom, 7 źródeł lokalnych, filtr trafności po 34 nazwach sołectw, ocena AI, **kolejka zatwierdzania przez redaktora**, zasada „nagłówek + 2 zdania + link" | 3–4 dni | [05](./05-INTEGRACJE.md) |
| **41** | **D7** | Backup: bucket `izbica24-system`, `d1-export` → `encrypt` → `r2-snapshot`, retencja 7/4/12, **realny test odtworzenia** | 2 dni | [03](./03-BAZA-DANYCH.md) |
| **42** | **I12** | Cloudflare Web Analytics (bez cookies, RODO), uptime monitor, Sentry dla frontendu, alerty e-mail, `ip-anonymize` w analityce, baner cookies faktycznie blokujący | 2 dni | [05](./05-INTEGRACJE.md) |
| **43** | **I10** | Mapy: kolumny lat/lng dla 34 sołectw, MapLibre GL + OpenStreetMap, mapa gminy (147 km²), geolokalizacja zdarzeń „Na sygnale", mapa inwestycji | 3 dni | [05](./05-INTEGRACJE.md) |

---

## FAZA 5 — JAKOŚĆ I WDROŻENIE

**Czas: 21–27 dni**

| # | Etap | Zadanie | Czas | Dok. |
|---|---|---|---|---|
| **44** | **F2** | Weryfikacja responsywności na realnych urządzeniach (obecnie 10 reguł `@media` nieprzetestowanych), 4 punkty łamania, menu mobilne, mega-menu na dotyku | 3–4 dni | [01](./01-FRONTEND.md) |
| **45** | **F3** | Dostępność WCAG 2.1 AA — **wymóg ustawy o dostępności cyfrowej**: audyt, kontrast, nawigacja klawiaturą, ARIA, czytnik ekranu, deklaracja dostępności | 4–5 dni | [01](./01-FRONTEND.md) |
| **46** | **F4** | Wydajność: Core Web Vitals, lazy loading, budżet zasobów, krytyczny CSS, wstępne łączenie z domenami | 3–4 dni | [01](./01-FRONTEND.md) |
| **47** | **F5** | SEO: dane strukturalne (NewsArticle, LocalBusiness, BreadcrumbList), sitemapy, RSS, Open Graph, kanoniczne adresy, Google News | 2–3 dni | [01](./01-FRONTEND.md) |
| **48** | **D6** | Integralność i wydajność bazy: `PRAGMA foreign_keys`, `EXPLAIN QUERY PLAN` dla 20 zapytań, przegląd 127 indeksów, rotacja `analytics_pageviews`, prognoza rozmiaru | 2 dni | [03](./03-BAZA-DANYCH.md) |
| **49** | **A8** | OpenAPI: `@hono/zod-openapi`, `openapi.json`, Swagger UI na `/api/docs`, aktualizacja `docs/API.md` | 2–3 dni | [04](./04-API.md) |
| **50** | **A9** | Testy: Vitest + `@cloudflare/vitest-pool-workers`, testy integracyjne (pozytywny/walidacja/autoryzacja dla każdego endpointu), smoke 30 tras, próg 70 % dla tras zapisu, GitHub Actions | 3–4 dni | [04](./04-API.md) |
| **51** | **A10** | Obserwowalność: metryki per endpoint (p50/p95/p99), panel `/admin/errors`, `/admin/slow-queries` na realnych danych, alerty przy błędach > 1 % | 2 dni | [04](./04-API.md) |
| **52** | **D8** | Środowiska: baza `izbica24-staging`, konfiguracja per-environment, procedura staging → produkcja, bramka blokująca migrację produkcyjną bez testu | 1–2 dni | [03](./03-BAZA-DANYCH.md) |

---

## 10. PODSUMOWANIE CZASOWE

| Faza | Zakres | Etapów | Czas |
|---|---|---|---|
| **FAZA 0** | Fundament — D1, R2, KV, sekrety, montowanie API | 6 | **9–11 dni** |
| **FAZA 1** | Baza danych + uwierzytelnianie + kontrakt | 9 | **15–19 dni** |
| **FAZA 2** | Redakcja działa — CRUD, panel, media | 8 | **20–26 dni** |
| **FAZA 3** | AI w edytorze | 12 | **33–41 dni** |
| **FAZA 4** | Dystrybucja i integracje | 8 | **16–21 dni** |
| **FAZA 5** | Jakość i wdrożenie | 9 | **21–27 dni** |
| **RAZEM** | | **52** | **114–145 dni roboczych** |

### Przeliczenie kalendarzowe

| Zespół | Czas realizacji |
|---|---|
| 1 programista | **23–29 tygodni** (~6–7 miesięcy) |
| 2 programistów (podział front / back) | **13–17 tygodni** (~3,5–4 miesiące) |
| 3 programistów (front / back / AI) | **10–13 tygodni** (~2,5–3 miesiące) |

Przy 2–3 osobach fazy 1 i 4 zawierają ścieżki wykonywalne równolegle. Fazy 0 i 2 są w dużej mierze sekwencyjne.

---

## 11. WARIANTY ZAKRESU

### Wariant A — MINIMUM DZIAŁAJĄCE *(29–37 dni, ~6–8 tygodni)*

Faza 0 + Faza 1 + wybrane z Fazy 2 (etapy 16, 17, 18)

**Otrzymujesz:** portal, na którym redakcja może publikować artykuły z uwierzytelnianiem i bazą danych. Bez AI, bez mediów w R2, bez newslettera.

**Dla kogo:** gdy priorytetem jest jak najszybsze uruchomienie redakcji.

### Wariant B — REDAKCJA + AI *(82–104 dni, ~17–21 tygodni)*

Fazy 0 + 1 + 2 + 3

**Otrzymujesz:** pełną redakcję z edytorem wspieranym AI, generowaniem artykułów, wyszukiwaniem w internecie, RAG na archiwum i kontrolą kosztów. Bez newslettera, push, map, agregatora RSS.

**Dla kogo:** **wariant rekomendowany** — realizuje wszystkie 6 wymagań AI zamawiającego i daje w pełni sprawną redakcję.

### Wariant C — PEŁNY ZAKRES *(114–145 dni, ~23–29 tygodni)*

Wszystkie fazy 0–5.

**Otrzymujesz:** kompletny portal z dystrybucją, integracjami, dostępnością WCAG, testami, dokumentacją API i procedurą wdrożeniową.

### Wariant D — ŚCIEŻKA SZYBKIEGO AI *(minimalna droga do widocznej AI)*

Jeżeli najważniejsze jest zobaczenie AI w działaniu jak najszybciej:

```
FAZA 0 (etapy 1–6)         9–11 dni    ← nieuniknione
D3 + D4 (etapy 7–8)        5–6 dni     ← dane w bazie
A2 (etap 9)                4–5 dni     ← logowanie
A4 (etap 16)               6–8 dni     ← zapis artykułu
F-panel (etap 18, część)   4 dni       ← edytor działa
AI1 + AI2 (etapy 24–25)    5–7 dni     ← dostawcy + klucze
AI3 (etap 26)              5–6 dni     ← PANEL AI
AI4 (etap 27)              4–5 dni     ← generowanie artykułu
─────────────────────────────────────
RAZEM                      42–52 dni   (~9–11 tygodni)
```

**Efekt:** redaktor wpisuje temat, wybiera model, klika „Generuj" i otrzymuje gotowy szkic artykułu w edytorze.

---

## 12. RYZYKA

| Ryzyko | Prawdopodobieństwo | Skutek | Przeciwdziałanie |
|---|---|---|---|
| **Kolizja schematów `articles`** — pierwsza migracja alfabetycznie tworzy uboższą tabelę, kod oczekuje bogatszej; błąd `no such column` na produkcji, nie w migracji | **wysokie** | krytyczny | Etap D1 przed wszystkim; obowiązkowa weryfikacja D3 |
| 6 000 LOC kodu nigdy nie wykonanego może zawierać błędy widoczne dopiero przy pierwszym uruchomieniu | **wysokie** | wysoki | Etapy D3 i A9 (testy); budżet czasowy na naprawy |
| Model AI konfabuluje o gminie 5 400 mieszkańców — brak danych treningowych | **bardzo wysokie** | wysoki | Etapy AI6 (wyszukiwanie), AI7 (RAG), AI9 (weryfikacja); obowiązkowa akceptacja człowieka |
| Limity CPU Cloudflare Workers przy generowaniu AI | średnie | średni | Etap AI8 (strumieniowanie), `ctx.waitUntil`, kolejka |
| Brak `VAPID_PRIVATE_KEY` w kodzie — push niewykonalny w obecnym kształcie | wysokie | średni | Etap I3 + I8 |
| Prawa autorskie w „Przeglądzie mediów" | średnie | wysoki | Etap I6: wyłącznie nagłówek + 2 zdania + link; zatwierdzanie przez redaktora |
| Ustawa o dostępności cyfrowej — portal informacyjny gminy | wysokie | wysoki | Etap F3 (WCAG 2.1 AA) nie może zostać pominięty |
| Niezabezpieczone kosztowne endpointy (`/api/rag/reindex`, `/api/push/send-broadcast`, `/api/admin/backups/restore`) | **wysokie** | krytyczny | Etap A2 przed wystawieniem czegokolwiek publicznie |
| Rozrost `analytics_pageviews` zapełni limit D1 (500 MB) | średnie | średni | Etap D6 — rotacja i agregacja |
| Rozjazd danych `content-db.ts` (58 art.) vs `repo.ts` (43 art.) | średnie | średni | Etap D4 — usunięcie `repo.ts` |

---

## KOLEJNOŚĆ WYKONANIA — LISTA SKRÓCONA

```
FAZA 0   1. D1  sanityzacja migracji                    2–3 d  🔴
         2. D2  utworzenie D1 + binding                 1 d    🔴
         3. I1  R2 — 4 buckety                          2 d    🔴
         4. I2  KV — namespace'y + APP_KV               1 d    🔴
         5. I3  sekrety (8 pozycji)                     1 d    🔴
         6. A1  montowanie API + auth                   2 d    🔴

FAZA 1   7. D3  weryfikacja schemat ↔ modele            2 d
         8. D4  seed 58 artykułów + przepięcie          3–4 d
         9. A2  JWT + likwidacja fail-open              4–5 d  🔴
        10. B3  6 ról + macierz uprawnień               2 d
        11. A7  rate limiting + CORS                    2 d
        12. I9  Turnstile                               1–2 d
        13. A3  kontrakt odpowiedzi i błędów            2 d
        14. I4  handler cronów                          2 d
        15. B7  error_log                               1 d

FAZA 2  16. A4  CRUD artykułów (12 endpointów)          6–8 d  🔴
        17. B4  workflow publikacji                     2 d
        18. F-panel  przebudowa panelu redakcyjnego     8–10 d 🔴
        19. A5  media / galerie / wideo / audio         4–5 d
        20. A6  moderacja komentarzy                    2 d
        21. B5  walidacja (Zod)                         2 d
        22. D9  wersjonowanie + audyt                   2 d
        23. I11 usunięcie 51 obrazów zewnętrznych       2–3 d

FAZA 3  24. AI1 uniwersalny adapter dostawców           3–4 d  🔴 W1
        25. AI2 klucze i profile + „Testuj"             2–3 d  🔴 W2
        26. AI3 PANEL AI W EDYTORZE                     5–6 d  🔴 W3/W6
        27. AI4 generator całego artykułu               4–5 d  🔴 W3
        28. AI5 presety i ustawienia                    2–3 d  W4
        29. AI7 RAG na archiwum                         3 d    W5/W6
        30. AI6 wyszukiwanie w internecie               3–4 d  W5
        31. AI8 strumieniowanie SSE                     2 d
        32. AI9 weryfikacja + anty-halucynacja          3–4 d  W6
        33. AI10 koszty i limity                        2–3 d
        34. AI11 oznaczanie AI + audyt                  2 d    prawny
        35. AI12 odporność i błędy                      2 d

FAZA 4  36. I7  e-mail / newsletter                     2–3 d
        37. D5  FTS5 + wyszukiwanie polskie             2–3 d
        38. I8  push notifications                      2–3 d
        39. I5  pogoda / powietrze                      2–3 d
        40. I6  agregator RSS                           3–4 d
        41. D7  backup + test odtworzenia               2 d
        42. I12 monitoring / analityka                  2 d
        43. I10 mapy 34 sołectw                         3 d

FAZA 5  44. F2  responsywność                           3–4 d
        45. F3  dostępność WCAG 2.1 AA                  4–5 d  🔴 prawny
        46. F4  wydajność                               3–4 d
        47. F5  SEO + dane strukturalne                 2–3 d
        48. D6  integralność + indeksy                  2 d
        49. A8  OpenAPI + dokumentacja                  2–3 d
        50. A9  testy + CI                              3–4 d
        51. A10 obserwowalność                          2 d
        52. D8  staging → produkcja                     1–2 d
```

---

## TRZY DZIAŁANIA NA NAJBLIŻSZE 48 GODZIN

1. **Usunąć 5 kolidujących plików migracji** (`0001_users.sql`, `0002_articles.sql`, `0003_categories.sql`, `0004_comments.sql`, `0011_media_assets.sql`) i duplikat `0021_fts_articles.sql`. Bez tego pierwsza migracja utworzy tabelę `articles` niezgodną z całym kodem — a błąd ujawni się dopiero na produkcji, przy pierwszym żądaniu użytkownika.

2. **Utworzyć bazę D1 i dodać binding.** Jedna komenda i 6 linii w `wrangler.jsonc` odblokowuje ~6 000 LOC już napisanego backendu.

3. **Zamknąć panel admina.** Obecnie `curl /admin` zwraca 200 bez żadnego tokena, bo `requireAdmin` przy braku `JWT_SECRET` przydziela rolę `admin`. To musi zostać naprawione, zanim projekt trafi na jakikolwiek publiczny adres.

---

## MAPA DOKUMENTACJI

| Dokument | Zakres | Etapy |
|---|---|---|
| [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md) | Podsumowanie, procenty, ustalenia K1–K11 | — |
| [`01-FRONTEND.md`](./01-FRONTEND.md) | Front-end publiczny + panel | F1–F7 |
| [`02-BACKEND.md`](./02-BACKEND.md) | Logika biznesowa, role, workflow | B1–B8 |
| [`03-BAZA-DANYCH.md`](./03-BAZA-DANYCH.md) | D1, migracje, seed, FTS5, backup | D1–D9 |
| [`04-API.md`](./04-API.md) | Endpointy, kontrakty, auth, testy | A1–A10 |
| [`05-INTEGRACJE.md`](./05-INTEGRACJE.md) | R2, KV, sekrety, e-mail, push, mapy | I1–I12 |
| [`06-AI.md`](./06-AI.md) | Edytor wspierany AI — 6 wymagań | AI1–AI12 |
| **`07-ROADMAP.md`** | **Ten dokument — kolejność wykonania** | **52 etapy** |
