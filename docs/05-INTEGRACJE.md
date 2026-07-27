# 05 — INTEGRACJE — audyt szczegółowy i plan wdrożenia

**Projekt:** izbica24.pl — portal informacyjny gminy Izbica Kujawska
**Data audytu:** 2026-07-27
**Stan realizacji: 10 %**
**Dokument nadrzędny:** [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md)

---

## SPIS TREŚCI

- [CZĘŚĆ A — Co JEST zrobione](#część-a--co-jest-zrobione)
- [CZĘŚĆ B — Co BRAKUJE (literalnie)](#część-b--co-brakuje-literalnie)
- [CZĘŚĆ C — Etapy prac I1–I12](#część-c--etapy-prac-i1i12)
- [CZĘŚĆ D — Rejestr sekretów](#część-d--rejestr-sekretów)

---

## CZĘŚĆ A — CO JEST ZROBIONE

### A1. Warstwa R2 — 21 modułów kodu

`src/lib/r2/`: `_base.ts` (wspólny wrapper) + 20 modułów dziedzinowych:

```
ai-generated.ts        articles-images.ts     articles-videos.ts
backups-db.ts          badges-icons.ts        email-attachments.ts
exports-csv.ts         fonts-custom.ts        galerie-photos.ts
infographics.ts        logos-partners.ts      moderation-queue.ts
ogloszenia-photos.ts   pdf-archive.ts         podcast-audio.ts
site-snapshots.ts      social-cards.ts        user-avatars.ts
user-uploads.ts        video-thumbnails.ts
```

### A2. Warstwa KV — 15 modułów kodu

`src/lib/kv/`: `ab-tests.ts`, `air-quality-cache.ts`, `analytics-buffer.ts`, `backup-snapshots.ts`, `cache-pages.ts`, `captcha-tokens.ts`, `config-runtime.ts`, `feature-flags.ts`, `fuel-cache.ts`, `notifications-queue.ts`, `rate-limit-store.ts`, `search-suggestions.ts`, `session-store.ts`, `user-prefs.ts`, `weather-cache.ts`

Plus `src/lib/runtime-kv.ts` — typowany dostęp do namespace'ów.

### A3. Warstwa e-mail — `src/lib/email/provider.ts`

Abstrakcja z trzema dostawcami (Resend / SendGrid / Mailgun). Interfejs:

```typescript
export interface EmailProvider {
  send(message: EmailMessage): Promise<{ ok: boolean; messageId?: string; error?: string }>
  sendBatch(messages: EmailMessage[]): Promise<{ sent: number; failed: number; errors: string[] }>
}
```

Implementacja Resend gotowa (`https://api.resend.com/emails`), domyślny nadawca `izbica24.pl <newsletter@izbica24.pl>`.

### A4. Warstwa mediów — `src/lib/media/` (16 plików)

`alt-text-ai.ts`, `audio-transcribe.ts`, `audio-upload.ts`, `db.ts`, `duplicate-detect.ts`, `gallery-store.ts`, `image-metadata.ts`, `image-resize.ts`, `image-variants.ts`, `podcast-rss.ts`, `r2-upload.ts`, `video-captions.ts`, `video-thumbnail.ts`, `video-transcode.ts`, `video-upload.ts`, `webp-fallback.ts`

### A5. Push — `src/routes/push/index.ts`

9 tras zapisu + `GET /vapid-public-key`. Tabele w migracji `0029_push_notifications.sql`: `push_subscribers`, `push_preferences`, `push_messages`.

### A6. Backup — `src/lib/backup/` (7 plików)

`d1-export.ts`, `d1-import.ts`, `encrypt.ts`, `kv-dump.ts`, `r2-snapshot.ts`, `restore.ts`, `schedule.ts`

`kv-dump.ts` wylicza 16 namespace'ów do zrzutu.

### A7. Wykorzystywane CDN (działają)

| Zasób | URL | Wystąpień |
|---|---|---|
| Fonty Google (Barlow, Source Serif 4) | `fonts.googleapis.com` | 5 |
| jsDelivr (Tailwind, FontAwesome, Chart.js) | `cdn.jsdelivr.net` | 11 |
| YouTube embed | `youtube.com` | 7 |
| Vimeo embed | `player.vimeo.com` | 1 |

### A8. Zaplanowane crony w `wrangler.jsonc`

```jsonc
"triggers": { "crons": ["*/10 * * * *", "0 * * * *"] }
```

---

## CZĘŚĆ B — CO BRAKUJE (LITERALNIE)

### ⛔ B1. R2 — 20 bindingów używanych w kodzie, ZERO zadeklarowanych

**Test dowodowy:**
```bash
$ grep -c "r2_buckets" wrangler.jsonc
0
```

Kod odwołuje się do 20 bindingów R2:

```
env.R2_AI_GENERATED          env.R2_ARTICLES_IMAGES      env.R2_ARTICLES_VIDEOS
env.R2_BACKUPS_DB            env.R2_BADGES_ICONS         env.R2_EMAIL_ATTACHMENTS
env.R2_EXPORTS_CSV           env.R2_FONTS_CUSTOM         env.R2_GALERIE_PHOTOS
env.R2_INFOGRAPHICS          env.R2_LOGOS_PARTNERS       env.R2_MODERATION_QUEUE
env.R2_OGLOSZENIA_PHOTOS     env.R2_PDF_ARCHIVE          env.R2_PODCAST_AUDIO
env.R2_SITE_SNAPSHOTS        env.R2_SOCIAL_CARDS         env.R2_USER_AVATARS
env.R2_USER_UPLOADS          env.R2_VIDEO_THUMBNAILS
```

**Każdy z nich jest `undefined` w runtime.**

Konsekwencje:
- **Nie da się wgrać ani jednego pliku** — cały upload mediów, wideo, audio, galerii jest niedziałający
- Backup bazy nie ma gdzie zapisać (`R2_BACKUPS_DB`)
- Karty społecznościowe (OG images) nie mają gdzie się zapisać
- Avatary użytkowników niemożliwe
- Kod 21 modułów `src/lib/r2/` nigdy nie został wykonany

**Uwaga architektoniczna:** 20 osobnych bucketów to nadmierne rozdrobnienie. Cloudflare nie ogranicza liczby bucketów, ale zarządzanie 20 bucketami (uprawnienia, lifecycle, koszty, monitoring) jest nieproporcjonalne do skali portalu obsługującego gminę 5 400 mieszkańców. **Rekomendacja: konsolidacja do 4 bucketów z prefiksami katalogowymi** (szczegóły w etapie I1).

### ⛔ B2. KV — 15 namespace'ów z ID zastępczymi + 1 niezadeklarowany

Wszystkie 15 wpisów w `wrangler.jsonc` mają ID w formie `"replace-*-kv"`:

| Binding | ID w konfiguracji | Stan |
|---|---|---|
| `WEATHER_KV` | `replace-weather-kv` | ❌ atrapa |
| `FUEL_KV` | `replace-fuel-kv` | ❌ atrapa |
| `AIR_KV` | `replace-air-kv` | ❌ atrapa |
| `SESSION_KV` | `replace-session-kv` | ❌ atrapa |
| `RATE_LIMIT_KV` | `replace-rate-limit-kv` | ❌ atrapa |
| `PAGES_CACHE_KV` | `replace-pages-cache-kv` | ❌ atrapa |
| `FEATURE_FLAGS_KV` | `replace-feature-flags-kv` | ❌ atrapa |
| `AB_TESTS_KV` | `replace-ab-tests-kv` | ❌ atrapa |
| `RUNTIME_CONFIG_KV` | `replace-runtime-config-kv` | ❌ atrapa |
| `USER_PREFS_KV` | `replace-user-prefs-kv` | ❌ atrapa |
| `ANALYTICS_BUFFER_KV` | `replace-analytics-buffer-kv` | ❌ atrapa |
| `NOTIFICATIONS_KV` | `replace-notifications-kv` | ❌ atrapa |
| `CAPTCHA_KV` | `replace-captcha-kv` | ❌ atrapa |
| `SEARCH_SUGGESTIONS_KV` | `replace-search-suggestions-kv` | ❌ atrapa |
| `BACKUP_SNAPSHOTS_KV` | `replace-backup-snapshots-kv` | ❌ atrapa |
| **`APP_KV`** | **BRAK WPISU** | ❌ **niezadeklarowany** |

`APP_KV` jest używany w:
- `src/lib/media/gallery-store.ts:48,53,54` — **przechowywanie galerii**
- `src/lib/backup/kv-dump.ts:3` — pierwszy na liście do backupu
- `src/lib/runtime-kv.ts:4` — typ

Czyli: **galerie zapisują się do namespace'u, który nie istnieje w konfiguracji.** Kod ma bezpiecznik (`if (!env.APP_KV) return record`), więc nie wywala się — po prostu **cicho nic nie zapisuje**.

### ⛔ B3. Vectorize — binding używany, nieskonfigurowany

`src/ai/rag/vector-store.ts` linie 110, 111, 127, 128, 134 używają `this.bindings.VECTORIZE_INDEX.upsert()` i `.deleteByIds()`.

W `wrangler.jsonc` nie ma sekcji `vectorize`. Cały RAG (wyszukiwanie semantyczne, `/api/rag/*` — 16 tras) nie ma indeksu wektorowego. Szczegóły w [`06-AI.md`](./06-AI.md).

### ⛔ B4. Brak pliku `.dev.vars` — zero sekretów lokalnie

```bash
$ cat .dev.vars
BRAK PLIKU .dev.vars
```

Kod oczekuje 6 sekretów, żaden nie jest dostępny ani lokalnie, ani na produkcji:

| Sekret | Używany w | Skutek braku |
|---|---|---|
| `JWT_SECRET` | `routes/admin.tsx`, auth | **panel admina otwarty dla wszystkich** (fail-open) |
| `OPENAI_API_KEY` | `ai/client.ts`, `ai/rag/embedder.ts` | AI zwraca `{"mock":true}` |
| `ANTHROPIC_API_KEY` | `ai/client.ts` | j.w. |
| `RESEND_API_KEY` | `lib/email/provider.ts` | newsletter nie wysyła |
| `VAPID_PUBLIC_KEY` | `routes/push/index.ts:132` | push nie działa |
| *(brak)* `VAPID_PRIVATE_KEY` | — | **kod nie ma nawet klucza prywatnego** |

**Krytyczne:** `src/routes/push/index.ts:50` zawiera zaszytą atrapę:
```typescript
const VAPID_FALLBACK = 'BElzbGljYTI0LWRldi12YXBpZC1wdWJsaWMta2V5LXBsYWNlaG9sZGVy'
```
(dekoduje się do `Izbica24-dev-vapid-public-key-placeholder`) — endpoint `/vapid-public-key` zwraca ten śmieć jako prawdziwy klucz, co spowoduje błąd subskrypcji w przeglądarce użytkownika.

Dodatkowo: **push wymaga pary kluczy VAPID**, a kod odwołuje się tylko do publicznego. Bez `VAPID_PRIVATE_KEY` nie da się podpisać żadnego powiadomienia — funkcja push jest niewykonalna w obecnym kształcie kodu.

### ⛔ B5. Crony skonfigurowane, ale BEZ HANDLERA

```jsonc
"triggers": { "crons": ["*/10 * * * *", "0 * * * *"] }
```

```bash
$ grep -n "scheduled" src/index.tsx
BRAK handlera scheduled()
```

`src/index.tsx` eksportuje tylko `default app` (fetch handler). Cloudflare wywoła cron co 10 minut i co godzinę, **a Worker nie ma czego uruchomić** — każde wywołanie zakończy się błędem w logach Cloudflare.

Zadania, które powinny być cykliczne, a nie są:
- odświeżanie cache pogody / jakości powietrza / cen paliw (co 10 min)
- publikacja artykułów zaplanowanych (`scheduled_at`) — **bez tego status `scheduled` jest bezużyteczny**
- wysyłka kolejki powiadomień (`notifications-queue.ts`)
- agregacja analityki (`analytics_pageviews` → `analytics_daily_rollup`)
- backup bazy (`backup/schedule.ts`)
- pobieranie RSS dla „Przeglądu mediów"
- czyszczenie wygasłych sesji i rate-limitów
- reindeksacja FTS / wektorów

### ⛔ B6. Pogoda, jakość powietrza, ceny paliw — dane pozorne

Endpointy `/api/v1/weather`, `/api/v1/fuel` zwracają 200, ale:
- Brak URL żadnego dostawcy danych meteorologicznych w kodzie (przeszukano: brak `openweathermap`, `open-meteo`, `imgw`, `airly`, `gios`)
- `WEATHER_KV`, `FUEL_KV`, `AIR_KV` mają atrapy ID
- Brak jakiejkolwiek funkcji `fetch()` do zewnętrznego API pogodowego

Czyli: **wartości są zaszyte w kodzie**. Widget pogody na portalu pokazuje fikcję.

Wymagane integracje dla Izbicy Kujawskiej:
- **IMGW-PIB** (`danepubliczne.imgw.pl`) — darmowe API, stacja Włocławek lub Toruń
- **Open-Meteo** (`api.open-meteo.com`) — darmowe, bez klucza, współrzędne Izbicy Kujawskiej (52.42 N, 18.75 E)
- **GIOŚ** (`api.gios.gov.pl`) — jakość powietrza, najbliższa stacja Włocławek
- Ceny paliw — brak darmowego API w Polsce; rozwiązanie: ręczne wprowadzanie w panelu z aktualizacją tygodniową

### ⛔ B7. „Przegląd mediów" — 7 artykułów, zero automatyzacji

Kategoria `przeglad-mediow` ma 7 artykułów w `content-db.ts` i 4 podkategorie. W kodzie są linki do źródeł lokalnych:

```
radiopik.pl · portalwloclawek.pl · pomorska.pl · nwloclawek.pl · kujawy.info
```

**Brak jakiegokolwiek mechanizmu pobierania:**
- Brak parsera RSS (jedyne pliki z „rss" to `podcast-rss.ts` — generowanie własnego feedu, nie czytanie obcych)
- Brak tabeli na źródła zewnętrzne (żadna z 46 tabel nie służy do przechowywania pobranych nagłówków)
- Brak crona pobierającego
- Brak deduplikacji względem własnych artykułów

To oznacza, że kategoria „Przegląd mediów" — jedna z 11 głównych kategorii portalu — jest w całości uzupełniana ręcznie.

### ⛔ B8. Brak ochrony formularzy — Turnstile / captcha

- `CAPTCHA_KV` — atrapa ID
- `src/lib/kv/captcha-tokens.ts` istnieje
- Brak integracji z Cloudflare Turnstile (brak `TURNSTILE_SECRET_KEY`, brak widgetu w formularzach)
- Formularze publiczne bez ochrony: komentarze, newsletter, kontakt, ogłoszenia, nekrologi

W połączeniu z brakiem rate limitingu (`04-API.md`, B8) — formularze są całkowicie otwarte na boty.

### ⛔ B9. Mapy — brak integracji dla 34 sołectw

Portal ma stronę `/solectwa` i 34 podstrony sołectw (Błenna, Ciepliny, Cieplinki, Długie, Gąsiorowo, Grabina, Grochowiska, Helenowo, Izbica Kujawska, Kazimierowo, Komorowo, Krzewent, Mchówek, Modzerowo, Naczachowo, Obałki, Pasieka, Podtymień, Skarbanowo, Słomkowo, Sokołowo, Świętosławice, Świszewy, Tymień, Wiszczelice, Wietrzychowice, Zdzisławin, Ziemięcin, Żerniki i pozostałe).

Brak:
- Współrzędnych geograficznych w danych sołectw (tabela `solectwa` nie ma kolumn lat/lng)
- Mapy interaktywnej (brak Leaflet / MapLibre — sprawdzono CDN: tylko Tailwind, FontAwesome, Chart.js)
- Warstwy z granicami gminy (147 km²)
- Geolokalizacji zdarzeń w kategorii „Na sygnale" (7 artykułów o pożarach, wypadkach, awariach — bez mapy)

Rekomendacja: **MapLibre GL + OpenStreetMap** (darmowe, bez klucza API, bez limitów jak Google Maps).

### ⛔ B10. Social media — tylko linki wychodzące

Znalezione URL-e: `facebook.com` (4), `twitter.com` (2), `instagram.com` (1), `linkedin.com` (1), `wa.me` (1), `t.me` (1) — to przyciski udostępniania i linki do profili.

Brak:
- Automatycznej publikacji artykułu na Facebooku (Graph API)
- Generowania kart społecznościowych OG (`R2_SOCIAL_CARDS` istnieje w kodzie, bucket nie)
- Osadzania postów z Facebooka (typowe dla portali lokalnych — komunikaty gminy)
- OAuth logowania Google/Facebook — pliki `social-google.ts`, `social-facebook.ts` istnieją, ale nie są zamontowane (patrz `04-API.md`, B1)

### ⛔ B11. 45 obrazów hotlinkowanych z Unsplash + 4 z picsum.photos

```
45 × https://images.unsplash.com
 4 × https://picsum.photos
 2 × https://interactive-examples.mdn.mozilla.net
```

Problemy:
1. **Prawne** — hotlinkowanie zewnętrznych zasobów bez kontroli licencji na portalu komercyjnym/informacyjnym
2. **Niezawodność** — obraz zniknie, gdy Unsplash zmieni URL lub zablokuje hotlinking
3. **Wydajność** — dodatkowe połączenie DNS/TLS do obcej domeny; obchodzi cały mechanizm wariantów webp/avif z `src/lib/performance.ts`
4. **Autentyczność** — portal lokalny gminy prezentujący zdjęcia stockowe zamiast lokalnych fotografii traci wiarygodność
5. `picsum.photos` i `interactive-examples.mdn.mozilla.net` to placeholdery deweloperskie — nie mogą wystąpić na produkcji

### ⛔ B12. Brak monitoringu zewnętrznego i alertowania

- Brak integracji z zewnętrznym uptime monitorem
- Brak Sentry / GlitchTip do zbierania błędów frontendu
- Brak alertów e-mail/SMS przy awarii
- Brak statusu publicznego (status page)
- `/api/health` istnieje, ale nikt go nie sprawdza cyklicznie

### ⛔ B13. Brak analityki zgodnej z RODO

- `analytics_events`, `analytics_pageviews`, `analytics_sessions` — migracje istnieją, brak D1
- `ip-anonymize.ts` i `pii-scrubber.ts` istnieją, nieużywane
- Brak banera zgody na cookies powiązanego z faktycznym blokowaniem trackingu
- Brak integracji z Cloudflare Web Analytics (darmowe, bez cookies, zgodne z RODO — naturalny wybór przy hostingu na Cloudflare)

---

## CZĘŚĆ C — ETAPY PRAC I1–I12

### ETAP I1 — R2: konsolidacja i utworzenie bucketów *(2 dni)* 🔴 BLOKUJĄCY

**Decyzja architektoniczna: 20 bucketów → 4 buckety z prefiksami.**

```bash
npx wrangler r2 bucket create izbica24-media       # zdjęcia, wideo, audio, galerie
npx wrangler r2 bucket create izbica24-documents   # PDF, eksporty CSV, załączniki
npx wrangler r2 bucket create izbica24-system      # backupy, snapshoty, fonty
npx wrangler r2 bucket create izbica24-public      # OG cards, logo partnerów, ikony
```

Wpis w `wrangler.jsonc`:
```jsonc
"r2_buckets": [
  { "binding": "R2_MEDIA",     "bucket_name": "izbica24-media" },
  { "binding": "R2_DOCUMENTS", "bucket_name": "izbica24-documents" },
  { "binding": "R2_SYSTEM",    "bucket_name": "izbica24-system" },
  { "binding": "R2_PUBLIC",    "bucket_name": "izbica24-public" }
]
```

Struktura prefiksów w `R2_MEDIA`:
```
articles/images/{rok}/{miesiac}/{slug}-{hash}.jpg
articles/images/{rok}/{miesiac}/{slug}-{hash}.webp
articles/images/{rok}/{miesiac}/{slug}-{hash}.avif
articles/videos/{rok}/{id}.mp4
galleries/{gallery-slug}/{n}.jpg
podcast/audio/{odcinek}.mp3
video/thumbnails/{id}.jpg
avatars/{user-id}.jpg
ogloszenia/{id}/{n}.jpg
moderation/queue/{id}
```

Refaktoryzacja: 21 modułów `src/lib/r2/` przepisać na `_base.ts` z parametrem prefiksu — z 21 plików zostaje 1 + mapa prefiksów.

**Kryterium odbioru:** wgranie testowego pliku przez `POST /api/v1/media/upload` kończy się obiektem w R2 i publicznym URL-em.

### ETAP I2 — KV: utworzenie 16 namespace'ów *(1 dzień)* 🔴 BLOKUJĄCY

```bash
for ns in APP WEATHER FUEL AIR SESSION RATE_LIMIT PAGES_CACHE \
          FEATURE_FLAGS AB_TESTS RUNTIME_CONFIG USER_PREFS \
          ANALYTICS_BUFFER NOTIFICATIONS CAPTCHA SEARCH_SUGGESTIONS \
          BACKUP_SNAPSHOTS; do
  npx wrangler kv namespace create "${ns}_KV"
  npx wrangler kv namespace create "${ns}_KV" --preview
done
```

Podmienić 15 atrap ID na rzeczywiste + **dodać brakujący `APP_KV`**.

**Uwaga:** rozważyć konsolidację — 16 namespace'ów przy skali portalu gminnego jest nadmiarowe. Namespace'y `AB_TESTS_KV`, `USER_PREFS_KV`, `FEATURE_FLAGS_KV` można scalić w `RUNTIME_CONFIG_KV` z prefiksami kluczy. Minimalny sensowny zestaw: `APP_KV`, `SESSION_KV`, `RATE_LIMIT_KV`, `CACHE_KV`, `CONFIG_KV`, `ANALYTICS_BUFFER_KV` = 6.

**Kryterium odbioru:** `wrangler kv key put --binding=APP_KV test 1` i odczyt zwraca wartość; galeria zapisana przez `gallery-store.ts` jest odczytywalna po restarcie.

### ETAP I3 — Sekrety: rejestr i wdrożenie *(1 dzień)* 🔴 BLOKUJĄCY

Utworzyć `.dev.vars` (dodać do `.gitignore` — sprawdzić, czy już jest):
```
JWT_SECRET=<losowy 64-znakowy>
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
TURNSTILE_SECRET_KEY=...
BACKUP_ENCRYPTION_KEY=<losowy 32-bajtowy>
```

Produkcja:
```bash
npx wrangler pages secret put JWT_SECRET --project-name izbica24-portal
# ...dla każdego sekretu
```

Usunąć zaszytą atrapę `VAPID_FALLBACK` z `src/routes/push/index.ts:50` — brak klucza musi zwracać 503, nie śmieć.

Wygenerowanie pary VAPID:
```bash
npx web-push generate-vapid-keys
```

**Kryterium odbioru:** `/admin` bez tokena zwraca 401; AI zwraca realną odpowiedź modelu, nie `{"mock":true}`.

### ETAP I4 — Handler cronów *(2 dni)* 🔴 BLOKUJĄCY

Dodać do `src/index.tsx`:
```typescript
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    switch (event.cron) {
      case '*/10 * * * *':
        ctx.waitUntil(Promise.allSettled([
          refreshWeather(env), refreshAirQuality(env),
          publishScheduledArticles(env), flushNotificationQueue(env),
        ]))
        break
      case '0 * * * *':
        ctx.waitUntil(Promise.allSettled([
          aggregateAnalytics(env), fetchExternalRss(env),
          cleanupExpiredSessions(env), reindexSearch(env),
        ]))
        break
    }
  },
}
```

Dodać cron dobowy dla backupu: `"0 3 * * *"`.

**Kryterium odbioru:** `wrangler pages dev --test-scheduled` + `curl "localhost:3000/__scheduled?cron=*/10+*+*+*+*"` wykonuje zadania; artykuł ze `scheduled_at` w przeszłości zostaje opublikowany.

### ETAP I5 — Pogoda, powietrze, paliwa *(2–3 dni)*

1. **Open-Meteo** dla współrzędnych Izbicy Kujawskiej (52.4247 N, 18.7561 E) — bez klucza API:
   ```
   https://api.open-meteo.com/v1/forecast?latitude=52.4247&longitude=18.7561
     &current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min
     &timezone=Europe/Warsaw
   ```
2. **IMGW-PIB** jako źródło uzupełniające (stacja Włocławek): `https://danepubliczne.imgw.pl/api/data/synop/station/wloclawek`
3. **GIOŚ** dla jakości powietrza: `https://api.gios.gov.pl/pjp-api/rest/station/findAll` → najbliższa stacja
4. Cache w `WEATHER_KV` / `AIR_KV` z TTL 10 min, odświeżanie cronem
5. Ostrzeżenia meteorologiczne IMGW → automatyczny wpis w „Na sygnale"
6. Ceny paliw: panel ręcznego wprowadzania (brak darmowego API w PL)
7. Usunąć wszystkie zaszyte wartości pogodowe z kodu

**Kryterium odbioru:** widget pogody pokazuje realną temperaturę dla Izbicy Kujawskiej; ostrzeżenie IMGW generuje alert na portalu.

### ETAP I6 — Agregator RSS dla „Przeglądu mediów" *(3–4 dni)*

1. Nowa tabela:
   ```sql
   CREATE TABLE external_sources (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL, url TEXT NOT NULL, feed_url TEXT NOT NULL,
     kind TEXT NOT NULL DEFAULT 'rss',
     active INTEGER NOT NULL DEFAULT 1,
     last_fetched_at DATETIME, fetch_interval_minutes INTEGER DEFAULT 60,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   CREATE TABLE external_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     source_id INTEGER NOT NULL REFERENCES external_sources(id) ON DELETE CASCADE,
     guid TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL,
     excerpt TEXT, image_url TEXT, published_at DATETIME,
     relevance_score REAL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','approved','rejected','published')),
     fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     UNIQUE (source_id, guid)
   );
   ```
2. Parser RSS/Atom (bez zależności zewnętrznych — Workers ma `HTMLRewriter` i `DOMParser` niedostępny; użyć parsowania regex lub lekkiej biblioteki zgodnej z Workers)
3. Źródła startowe: radiopik.pl, portalwloclawek.pl, pomorska.pl, nwloclawek.pl, kujawy.info + BIP gminy Izbica Kujawska + strona powiatu włocławskiego
4. Filtrowanie po trafności — wyłącznie materiały wzmiankujące Izbicę Kujawską lub sołectwa (34 nazwy jako słowa kluczowe)
5. Ocena trafności przez AI (patrz `06-AI.md`)
6. Kolejka zatwierdzania w panelu — **redaktor decyduje o publikacji, nigdy automat** (kwestia praw autorskich)
7. Zasada prawna: publikować **tylko nagłówek + 1–2 zdania + link do źródła**, nigdy pełnej treści

**Kryterium odbioru:** cron pobiera materiały z 5 źródeł; kolejka pokazuje tylko pozycje dotyczące gminy; zatwierdzenie tworzy wpis w kategorii „Przegląd mediów" z atrybucją źródła.

### ETAP I7 — E-mail: newsletter i powiadomienia transakcyjne *(2–3 dni)*

1. Konto Resend + weryfikacja domeny izbica24.pl (rekordy SPF, DKIM, DMARC w DNS)
2. Podłączyć `createResendProvider()` do tras newslettera (naprawić błąd 500 z `04-API.md`, B4)
3. Szablony HTML: potwierdzenie subskrypcji, powitanie, newsletter tygodniowy, reset hasła, weryfikacja e-mail, alert breaking news
4. Wysyłka wsadowa z limitem (Resend: 100 odbiorców/żądanie) przez kolejkę w `NOTIFICATIONS_KV`
5. Podwójna zgoda (double opt-in) — wymóg RODO
6. Link wypisania w każdej wiadomości + obsługa `List-Unsubscribe`
7. Obsługa odbić (bounce) i skarg przez webhook Resend

**Kryterium odbioru:** zapis na newsletter wysyła e-mail potwierdzający; klik potwierdza subskrypcję; wypisanie działa jednym klikiem.

### ETAP I8 — Push Web Notifications *(2–3 dni)*

1. Wygenerować parę VAPID, ustawić oba sekrety
2. Usunąć atrapę `VAPID_FALLBACK`
3. Service Worker w `public/sw.js` z obsługą `push` i `notificationclick`
4. Podpisywanie żądań push (JWT ES256 z kluczem prywatnym VAPID) — implementacja przez Web Crypto API (Workers nie ma biblioteki `web-push`)
5. UI zapisu na powiadomienia + preferencje kategorii (`push_preferences`)
6. Segmentacja: breaking news / kategoria / sołectwo
7. Kolejkowanie i limity wysyłki
8. Zabezpieczenie `/send-broadcast` rolą admin (obecnie otwarte!)

**Kryterium odbioru:** subskrypcja w przeglądarce działa; powiadomienie breaking news dociera; klik otwiera artykuł.

### ETAP I9 — Turnstile i ochrona formularzy *(1–2 dni)*

1. Utworzyć widget Turnstile w panelu Cloudflare
2. Klucz publiczny w formularzach, `TURNSTILE_SECRET_KEY` po stronie serwera
3. Weryfikacja tokena: `https://challenges.cloudflare.com/turnstile/v0/siteverify`
4. Objąć: komentarze, newsletter, kontakt, ogłoszenia, nekrologi, oferty pracy, rejestracja
5. Fallback przy braku JS
6. Honeypot jako dodatkowa warstwa

**Kryterium odbioru:** wysłanie formularza bez tokena Turnstile odrzucone z 403.

### ETAP I10 — Mapy i geolokalizacja *(3 dni)*

1. Dodać kolumny `latitude`, `longitude`, `boundary_geojson` do tabeli `solectwa`
2. Zebrać współrzędne 34 sołectw (źródło: PRNG / OpenStreetMap Nominatim)
3. MapLibre GL JS z kafelkami OpenStreetMap (bez klucza API):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.js"></script>
   ```
4. Mapa gminy na `/solectwa` z 34 znacznikami i granicą 147 km²
5. Geolokalizacja zdarzeń „Na sygnale" — pola lat/lng w artykule + mapa w widoku artykułu
6. Mapa inwestycji gminnych (tabela `investments`)
7. Lazy loading — mapa tylko na żądanie (waga biblioteki)

**Kryterium odbioru:** `/solectwa` pokazuje interaktywną mapę z 34 znacznikami; artykuł o pożarze w Bierzynie ma mapkę lokalizacji.

### ETAP I11 — Zastąpienie obrazów zewnętrznych *(2–3 dni)*

1. Zinwentaryzować wszystkie 51 zewnętrznych URL-i obrazów (45 Unsplash + 4 picsum + 2 MDN)
2. Dla każdego zdecydować: fotografia lokalna / grafika generowana / usunięcie
3. Wgrać do R2 `izbica24-media`, wygenerować warianty webp/avif
4. Podmienić URL-e w `content-db.ts` i komponentach
5. Dodać regułę CI blokującą commit z `images.unsplash.com` lub `picsum.photos` w `src/`
6. Wdrożyć politykę: każde zdjęcie musi mieć w `media_assets` pola `author`, `license`, `source`

**Kryterium odbioru:** `grep -r "unsplash\|picsum" src/` zwraca 0 wyników; wszystkie obrazy serwowane z R2 z wariantami.

### ETAP I12 — Monitoring, analityka, alerty *(2 dni)*

1. Cloudflare Web Analytics (darmowe, bez cookies, zgodne z RODO) — token w `<head>`
2. Zewnętrzny uptime monitor sprawdzający `/api/health` co 5 min
3. Sentry lub GlitchTip dla błędów JS frontendu
4. Alerty e-mail przy: awarii, wskaźniku błędów > 1 %, przekroczeniu budżetu AI
5. Podłączyć `ip-anonymize.ts` do wszystkich zapisów analitycznych
6. Baner cookies faktycznie blokujący skrypty do momentu zgody
7. Publiczna strona statusu

**Kryterium odbioru:** awaria serwisu generuje alert e-mail w ciągu 5 min; analityka nie zapisuje pełnych adresów IP.

---

### Podsumowanie harmonogramu integracji

| Etap | Zakres | Czas | Priorytet |
|---|---|---|---|
| I1 | R2: 4 buckety + refaktoryzacja | 2 dni | 🔴 blokujący |
| I2 | KV: 16 namespace'ów + `APP_KV` | 1 dzień | 🔴 blokujący |
| I3 | Sekrety: 8 pozycji | 1 dzień | 🔴 blokujący |
| I4 | Handler cronów | 2 dni | 🔴 blokujący |
| I5 | Pogoda / powietrze / paliwa | 2–3 dni | 🟠 średni |
| I6 | Agregator RSS | 3–4 dni | 🟠 średni |
| I7 | E-mail / newsletter | 2–3 dni | 🔴 wysoki |
| I8 | Push notifications | 2–3 dni | 🟠 średni |
| I9 | Turnstile | 1–2 dni | 🔴 wysoki |
| I10 | Mapy + geolokalizacja | 3 dni | 🟡 niski |
| I11 | Zastąpienie obrazów zewnętrznych | 2–3 dni | 🔴 wysoki |
| I12 | Monitoring / analityka / alerty | 2 dni | 🟠 średni |
| **RAZEM** | | **23–29 dni** | |

---

## CZĘŚĆ D — REJESTR SEKRETÓW

| Sekret | Przeznaczenie | Skąd pozyskać | Etap |
|---|---|---|---|
| `JWT_SECRET` | Podpis tokenów sesji | wygenerować lokalnie (64 znaki) | I3 |
| `OPENAI_API_KEY` | Generowanie treści, embeddingi | platform.openai.com | I3 |
| `ANTHROPIC_API_KEY` | Alternatywny dostawca AI | console.anthropic.com | I3 |
| `AI_CUSTOM_BASE_URL` | Model open-source / lokalny | własna instancja | 06-AI.md |
| `AI_CUSTOM_API_KEY` | Klucz dla powyższego | j.w. | 06-AI.md |
| `RESEND_API_KEY` | Wysyłka e-mail | resend.com | I7 |
| `VAPID_PUBLIC_KEY` | Push — klucz publiczny | `npx web-push generate-vapid-keys` | I8 |
| `VAPID_PRIVATE_KEY` | Push — klucz prywatny | j.w. | I8 |
| `TURNSTILE_SECRET_KEY` | Weryfikacja captcha | panel Cloudflare | I9 |
| `BACKUP_ENCRYPTION_KEY` | Szyfrowanie backupów | wygenerować (32 bajty) | D7 |
| `SENTRY_DSN` | Zbieranie błędów | sentry.io | I12 |
| `SEARCH_API_KEY` | Wyszukiwanie w internecie dla AI | Brave / Tavily / Serper | 06-AI.md |

**Zasada bezpieczeństwa:** żaden z tych kluczy nie może pojawić się w kodzie frontendu ani w repozytorium. Wszystkie wywołania zewnętrznych API wyłącznie przez trasy serwerowe Hono.

---

## POWIĄZANE DOKUMENTY

- [`00-AUDYT-OGOLNY.md`](./00-AUDYT-OGOLNY.md) — podsumowanie, ustalenia K1–K11
- [`03-BAZA-DANYCH.md`](./03-BAZA-DANYCH.md) — D1, backup do R2
- [`04-API.md`](./04-API.md) — trasy korzystające z tych integracji
- [`06-AI.md`](./06-AI.md) — dostawcy AI, Vectorize, wyszukiwanie w internecie
- [`07-ROADMAP.md`](./07-ROADMAP.md) — kolejność wykonania
