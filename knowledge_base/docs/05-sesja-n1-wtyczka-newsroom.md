# Sesja N1 – Wtyczka izbica24-newsroom: szkielet, CPT, taksonomie, REST endpoint
Zaczynamy od pierwszej sesji. Daję Ci kompletny pakiet startowy dla Claude Code: kontekst projektu, prompt systemowy, prompt zadaniowy oraz checklist akceptacyjny. Wszystko w formie gotowej do wklejenia. Po każdej sesji będę pytał, czy kontynuować — jeśli zabraknie kontekstu, napisz „kontynuuj N2” (lub kolejną).

## 1. Co dokładnie powstanie w Sesji N1
Wtyczka WordPress izbica24-newsroom w wersji 0.1.0 z następującymi komponentami:
Struktura plików:
izbica24-newsroom/
├── izbica24-newsroom.php          # Main plugin file, bootstrap
├── readme.txt                      # WP-style readme
├── composer.json                   # Autoload PSR-4
├── uninstall.php                   # Czyste odinstalowanie
├── includes/
│   ├── class-plugin.php           # Singleton, init hooks
│   ├── class-activator.php        # Aktywacja (capabilities, default terms)
│   ├── class-deactivator.php      # Deaktywacja
│   ├── post-types/
│   │   └── class-cpt-raw-item.php # Rejestracja CPT iz24_raw_item
│   ├── taxonomies/
│   │   ├── class-tax-source.php   # iz24_source
│   │   └── class-tax-status.php   # iz24_status
│   ├── meta/
│   │   └── class-raw-item-meta.php # 24 meta-fieldy z register_post_meta
│   ├── rest/
│   │   ├── class-rest-controller.php  # Główny kontroler REST
│   │   ├── class-incoming-endpoint.php # POST /v1/incoming
│   │   └── class-auth.php             # Bearer token validation
│   ├── security/
│   │   ├── class-token-manager.php    # Generowanie, hashowanie, rotacja
│   │   ├── class-rate-limiter.php     # 60/h, 500/d per token
│   │   └── class-idempotency.php      # X-Idempotency-Key handling
│   ├── dedup/
│   │   └── class-deduplicator.php     # Hash + Levenshtein
│   ├── helpers/
│   │   ├── class-logger.php           # Custom logging do iz24_logs
│   │   └── class-validator.php        # Walidacja JSON schema
│   └── traits/
│       └── trait-singleton.php
├── admin/
│   └── (sesja N2)
├── languages/
│   └── izbica24-newsroom.pot
├── assets/
│   └── (sesja N2)
└── tests/
├── bootstrap.php
├── test-cpt.php
├── test-rest-endpoint.php
└── test-token-manager.php

Co działa po Sesji N1:
Aktywujesz wtyczkę → pojawia się menu “Newsroom” w wp-admin (puste, panel w N2)
W bazie danych masz CPT iz24_raw_item z 24 meta-polami
Masz 2 taksonomie z domyślnymi termami załadowanymi przy aktywacji
Endpoint POST https://izbica24.pl/wp-json/iz24/v1/incoming przyjmuje JSON, autoryzuje Bearer token, deduplikuje, tworzy raw_item
Możesz wygenerować pierwszy token przez WP-CLI: wp iz24 token create --source=ddwloclawek
Test endpointu z curl działa i zwraca 201/200/401/422/429

## 2. Prompt startowy dla Claude Code (do wklejenia)
Otwórz w terminalu folder swojego projektu lokalnego (Local WP / Studio / Docker), uruchom claude i wklej jako pierwszą wiadomość poniższy blok. Zawiera on system prompt + zadanie + acceptance criteria.
# PROJEKT: izbica24-newsroom (WordPress Plugin) — Sesja N1

## ROLA
Jesteś senior WordPress plugin developerem z 10-letnim doświadczeniem. Specjalizujesz się w:
- - WordPress Plugin Boilerplate i WPCS (WordPress Coding Standards)
- - WP REST API z custom autoryzacją
- - Custom Post Types, taksonomie, register_post_meta z `show_in_rest`
- - Bezpieczeństwo: nonces, capabilities, sanitization, escaping, prepared statements
- - PSR-4 autoload, namespacing (Izbica24\Newsroom), composer
- - PHPUnit + WP_UnitTestCase

## KONTEKST PROJEKTU
Buduję portal informacyjny gminy Izbica Kujawska (izbica24.pl) z hybrydowym workflow:
- - 40% treści generowanej przez AI (Claude Opus 4.7 via n8n)
- - 25% treści od kontrybutorów instytucjonalnych (Webhook Pusher model)
- - 20% AI + redaktor, 15% redaktor naczelny

Wtyczka `izbica24-newsroom` to **kolejka treści** (raw items) — wszystko co przychodzi z różnych źródeł (Make.com webhooks, n8n, RSS, manual) ląduje najpierw jako CPT `iz24_raw_item` ze statusem `raw` lub `candidate`, dopiero po obróbce AI/redaktora staje się `wp_post`.

Wymagania środowiska: PHP 8.2+, WordPress 6.7+, MySQL 8.0+.

## ARCHITEKTURA WTYCZKI

### Namespace i autoload
- - Namespace główny: `Izbica24\Newsroom`
- - Composer PSR-4: `"Izbica24\\Newsroom\\": "includes/"`
- - Singleton bootstrap w `class-plugin.php`

### Custom Post Type: `iz24_raw_item`
```
Slug: iz24_raw_item
Public: false
Show in REST: true (dla wewnętrznego API admina, NIE na froncie)
Show in menu: 'izbica24-newsroom' (top-level menu)
Supports: ['title', 'editor', 'custom-fields']
Capability type: 'iz24_raw_item' (custom caps, nie 'post')
Hierarchical: false
Has archive: false
Rewrite: false
Menu icon: 'dashicons-rss'
Menu position: 25
```

### Taksonomia: `iz24_source`
- - Niehierarchiczna (jak tagi, ale używamy jak kategorii — jeden term per item)
- - Domyślne termy ładowane w aktywatorze:
- - `ddwloclawek` (Dobry Dzień Włocławek)
- - `nwloclawek` (Nasz Włocławek)
- - `osp_izbica` (OSP Izbica Kujawska)
- - `mgks_kujawianka` (MGKS Kujawianka)
- - `ug_izbica` (Urząd Gminy Izbica)
- - `mgck_izbica` (MGCK Izbica)
- - `biblioteka_izbica`
- - `parafia_izbica`
- - `manual` (ręczny wpis przez redaktora)
- - `n8n_perplexity` (research z Perplexity)
- - `n8n_rss` (generic RSS)
- - Każdy term ma meta: `token_hash` (SHA-256 of token), `token_created_at`, `token_expires_at`, `webhook_url` (n8n callback), `contact_email`, `is_active` (bool), `daily_quota` (int, default 500), `hourly_quota` (int, default 60).

### Taksonomia: `iz24_status`
- - Niehierarchiczna
- - Domyślne termy:
- - `raw` — surowy item, świeżo z webhooka, nieprzetworzony
- - `candidate` — przeszedł deduplikację, czeka na AI
- - `draft` — AI wygenerowało draft `wp_post`, czeka na redaktora
- - `review` — redaktor zaakceptował, czeka na publikację
- - `published` — opublikowany jako `wp_post` (link w meta `iz24_wp_post_id`)
- - `rejected` — odrzucony (duplikat, niska jakość, off-topic)
- - `archived` — starszy niż 90 dni, nie został opublikowany

### Meta-fields (register_post_meta z `show_in_rest`)
Wszystkie mają prefiks `iz24_`. Lista pełna:

| Meta key | Type | Single | Sanitize | Opis |
|---|---|---|---|---|
| `iz24_external_id` | string | true | sanitize_text_field | ID z systemu źródłowego (FB post id, RSS guid) |
| `iz24_external_url` | string | true | esc_url_raw | Oryginalny URL |
| `iz24_source_type` | string | true | sanitize_key | webhook/rss/api/scrape/manual/email |
| `iz24_published_at` | string | true | sanitize_text_field | ISO-8601 z źródła |
| `iz24_received_at` | string | true | (auto, current_time mysql) | timestamp przyjęcia |
| `iz24_author_name` | string | true | sanitize_text_field | Autor oryginału |
| `iz24_author_url` | string | true | esc_url_raw | Profil autora |
| `iz24_content_html` | string | true | wp_kses_post | Pełna treść HTML |
| `iz24_content_text` | string | true | sanitize_textarea_field | Plain text |
| `iz24_excerpt` | string | true | sanitize_textarea_field | Skrót |
| `iz24_media` | array (object) | true | (custom validator) | [{type, url, alt, width, height, mime}] |
| `iz24_category_hint` | string | true | sanitize_key | Sugerowana główna kategoria |
| `iz24_subcategory_hint` | string | true | sanitize_key | Subkategoria |
| `iz24_tags` | array (string) | true | (each: sanitize_text_field) | Tagi |
| `iz24_priority_hint` | integer | true | absint | 1-10 (10 = breaking) |
| `iz24_permission_full_text` | boolean | true | rest_sanitize_boolean | Pełna licencja |
| `iz24_permission_media` | boolean | true | rest_sanitize_boolean | Licencja na media |
| `iz24_credit_name` | string | true | sanitize_text_field | Nazwa do credit line |
| `iz24_credit_link` | string | true | esc_url_raw | Link do creditu |
| `iz24_geolocation` | object | true | (custom: lat,lng,name) | Geolokalizacja |
| `iz24_metadata` | object | true | (custom JSON validator) | Pole na dodatkowe dane (incident_number, units_dispatched dla Na sygnale) |
| `iz24_dedup_hash` | string | true | sanitize_text_field | SHA-256 z normalized title+content (pierwsze 200 znaków) |
| `iz24_idempotency_key` | string | true | sanitize_text_field | UUID v4 z nagłówka |
| `iz24_processing_log` | array (object) | true | (custom) | Historia: [{timestamp, action, actor, details}] |
| `iz24_wp_post_id` | integer | true | absint | ID `wp_post` po publikacji |

### REST Endpoint: `POST /wp-json/iz24/v1/incoming`

- **Routing:** `register_rest_route('iz24/v1', '/incoming', ...)`

- **Headers wymagane:**
- - `Authorization: Bearer <token>` (64-char hex)
- - `Content-Type: application/json`
- - `X-Idempotency-Key: <uuid-v4>` (opcjonalny, ale zalecany)

- **Walidacja (JSON Schema, w `args` przy register_rest_route):**
- - `source_id`: string, required, pattern `^[a-z0-9_]{2,40}$` (musi istnieć jako term w `iz24_source`)
- - `external_id`: string, required, max 255
- - `external_url`: string format uri, optional
- - `title`: string, required, max 500
- - `content_html`: string, required, max 65535
- - `published_at`: string format date-time (ISO-8601), required
- - `media`: array, max 20 items, każdy: `{type: enum[image,video,audio,document], url: uri, alt: string max 255, width: int, height: int}`
- - `category_hint`, `subcategory_hint`: string, optional
- - `tags`: array of string, max 20 items
- - `priority_hint`: integer 1-10, default 5
- - `permission`: object `{publish_full_text: bool, publish_media: bool, credit_name: string, credit_link: uri}`
- - `metadata`: object, additionalProperties: true (free-form)

- **Logika handlera (krok po kroku):**
1. Wczytaj nagłówek `Authorization`, wyciągnij token. Brak → 401.
2. Hash token SHA-256, znajdź term `iz24_source` z meta `token_hash`. Brak/wygasł/inactive → 401.
3. Sprawdź `source_id` w body == slug znalezionego termu. Niezgodne → 403.
4. Rate limit per term (transient `iz24_rl_<term_id>_h` i `_d`). Przekroczony → 429 z `Retry-After`.
5. Walidacja JSON Schema (automatyczna przez WP REST). Błąd → 422.
6. Sprawdź `X-Idempotency-Key` w transient `iz24_idem_<key>` (TTL 24h). Hit → zwróć 200 z poprzednim `raw_item_id`.
7. Oblicz `dedup_hash` = SHA-256 z `mb_strtolower(normalize(title + first_200_chars(content)))`. Sprawdź meta_query w `iz24_raw_item` z tym hashem (last 30 dni). Hit → zwróć 200 z istniejącym ID + status `duplicate`.
8. (Opcjonalnie, jeśli prościej: drugi krok dedup z Levenshtein ≥ 85% odłóż na N3, nie blokuje N1).
9. Stwórz `wp_insert_post` z `post_type=iz24_raw_item`, `post_status=publish` (status workflow trzymamy w taksonomii `iz24_status`, nie `post_status`).
10. Przypisz term `iz24_source` (slug z `source_id`) i `iz24_status` (slug `raw`).
11. Zapisz wszystkie meta-fields przez `update_post_meta`.
12. Zapisz `iz24_idempotency_key` w transient.
13. Inkrementuj rate-limit countery.
14. Zapisz log w `iz24_processing_log` (action=`received`, actor=`webhook`, details=`{ip, user_agent, source_id}`).
15. Trigger `do_action('iz24/raw_item_received', $post_id, $request_data)` — hook dla n8n callback (sesja N5).
16. Zwróć 201 z body:
```json
{
"success": true,
"raw_item_id": 12345,
"wp_admin_url": "https://izbica24.pl/wp-admin/post.php?post=12345&action=edit",
"status": "queued_for_review",
"dedup_hash": "abc123...",
"received_at": "2026-05-07T14:30:00Z"
}
```

- **Kody odpowiedzi:**
- - 201 Created — sukces
- - 200 OK — duplikat lub idempotency hit (z `status: "duplicate"` lub `"idempotent_replay"`)
- - 400 Bad Request — malformed JSON
- - 401 Unauthorized — brak/zły token
- - 403 Forbidden — token nie pasuje do `source_id`
- - 422 Unprocessable Entity — błąd walidacji schemy (z polem `errors: [...]`)
- - 429 Too Many Requests — rate limit (z `Retry-After: <seconds>`)
- - 500 Internal Server Error — log + zwróć generyczny komunikat

### Token Manager (klasa `Token_Manager`)
- - `generate(int $term_id, int $ttl_days = 365): string` — tworzy 64-char hex (`bin2hex(random_bytes(32))`), hashuje SHA-256, zapisuje w term meta, zwraca **plaintext token tylko raz**.
- - `verify(string $token): ?WP_Term` — hashuje, szuka, sprawdza expiry/active.
- - `rotate(int $term_id): string` — generuje nowy, oznacza stary jako `expiring` z 30-dniowym overlap.
- - `revoke(int $term_id): bool` — natychmiastowe usunięcie hash.

### Rate Limiter (klasa `Rate_Limiter`)
- - Backend: Transients (z auto-cleanup) + opcjonalnie Redis (jeśli `WP_REDIS_HOST` zdefiniowany).
- - `check(int $term_id): array` — zwraca `['allowed' => bool, 'remaining_h' => int, 'remaining_d' => int, 'retry_after' => ?int]`.
- - `increment(int $term_id): void` — po sukcesie.

### WP-CLI komendy (sub-command `wp iz24`)
- - `wp iz24 token create --source=<slug> [--ttl=365]` — generuje token, drukuje raz w terminalu.
- - `wp iz24 token list` — tabelka tokenów (bez plaintext, tylko fingerprint).
- - `wp iz24 token revoke --source=<slug>` — odwołuje.
- - `wp iz24 stats [--days=7]` — statystyki przyjętych raw_items per source.

## ZADANIE
Wygeneruj **kompletną strukturę plików wtyczki Sesja N1** w formie gotowej do `composer install && wp plugin activate izbica24-newsroom`.

Pracuj iteracyjnie:
1. Najpierw stwórz strukturę katalogów + `izbica24-newsroom.php` (header WP, bootstrap) + `composer.json`.
2. Następnie `class-plugin.php` (singleton, hook init).
3. Następnie `class-activator.php` z dodaniem default terms i custom capabilities (`manage_iz24_newsroom`, `edit_iz24_raw_items`, etc. dla rola `editor` i `administrator`).
4. CPT i obie taksonomie.
5. Klasa meta-fields z register_post_meta dla wszystkich 24 pól.
6. REST controller + endpoint + auth + rate limiter + idempotency.
7. Token Manager + WP-CLI komendy.
8. Plik `tests/test-rest-endpoint.php` z PHPUnit (min. 8 testów: success, missing token, bad token, wrong source, rate limit, idempotency replay, duplicate, validation error).
9. `readme.txt` w stylu WP.org.
10. Po każdym pliku rób krótkie podsumowanie i czekaj na "kontynuuj" jeśli plik > 200 linii.

## STANDARDY KODU
- - WPCS (WordPress-Extra ruleset).
- - Wszystkie public methods z PHPDoc.
- - Wszystkie strony tłumaczalne (`__()`, `_e()`, text-domain `izbica24-newsroom`).
- - Sanitization on input, escaping on output (zawsze).
- - Prepared statements (`$wpdb->prepare`) dla custom queries.
- - Brak `global $wpdb` poza klasami repo.
- - Hooks zawsze przez `add_action`/`add_filter` w klasach, nie w plikach głównych.
- - Każda klasa w osobnym pliku, nazwa pliku `class-<slug>.php`.

## ACCEPTANCE CRITERIA (musisz potwierdzić każdy punkt)
- - [ ] `composer install` przechodzi bez błędów
- - [ ] `wp plugin activate izbica24-newsroom` przechodzi bez WSOD
- - [ ] CPT widoczny w wp-admin (menu "Newsroom" → "Raw Items")
- - [ ] 11 default termów `iz24_source` istnieje po aktywacji
- - [ ] 7 default termów `iz24_status` istnieje po aktywacji
- - [ ] `wp iz24 token create --source=ddwloclawek` zwraca 64-char token
- - [ ] `curl -X POST` z poprawnym tokenem i body zwraca 201 + raw_item_id
- - [ ] `curl -X POST` bez tokenu zwraca 401
- - [ ] `curl -X POST` z tym samym X-Idempotency-Key dwa razy zwraca 201, potem 200
- - [ ] `curl -X POST` 61 razy w godzinę zwraca 429 z Retry-After
- - [ ] `phpunit` przechodzi 8/8 testów
- - [ ] `phpcs --standard=WordPress-Extra` 0 errors

## PYTANIA DO MNIE PRZED STARTEM
Zanim zaczniesz, zadaj mi maksymalnie 3 pytania, jeśli coś jest niejasne (np. preferowany sposób trzymania logów, czy chcesz wsparcie dla Redis od razu, czy IP allow-list). Jeśli wszystko jest jasne, napisz "Zaczynam" i przejdź do kroku 1.


## 3. Curl test po Sesji N1 (do checklisty)
Po wygenerowaniu wtyczki przez Claude Code i aktywacji, przetestuj endpoint:
# 1. Wygeneruj token
TOKEN=$(wp iz24 token create --source=manual --ttl=365 --porcelain)

# 2. Test: success
curl -X POST https://izbica24.test/wp-json/iz24/v1/incoming \
- -H "Authorization: Bearer $TOKEN" \
- -H "Content-Type: application/json" \
- -H "X-Idempotency-Key: $(uuidgen)" \
- -d '{
"source_id": "manual",
"external_id": "test-001",
"title": "Testowy news z Izbicy Kujawskiej",
"content_html": "<p>To jest test endpointu /v1/incoming. Wszystko działa poprawnie.</p>",
"published_at": "2026-05-07T14:30:00Z",
"category_hint": "wiadomosci",
"subcategory_hint": "samorzad",
"tags": ["test", "izbica", "samorzad"],
"priority_hint": 5,
"permission": {
"publish_full_text": true,
"publish_media": true,
"credit_name": "Redakcja Izbica24",
"credit_link": "https://izbica24.pl"
}
}'

# Oczekiwana odpowiedź: 201 Created, raw_item_id, wp_admin_url

# 3. Test: brak tokenu → 401
curl -X POST https://izbica24.test/wp-json/iz24/v1/incoming \
- -H "Content-Type: application/json" \
- -d '{"source_id":"manual","title":"x","content_html":"y","external_id":"z","published_at":"2026-05-07T14:30:00Z"}'

# 4. Test: zły schema → 422
curl -X POST https://izbica24.test/wp-json/iz24/v1/incoming \
- -H "Authorization: Bearer $TOKEN" \
- -H "Content-Type: application/json" \
- -d '{"source_id":"manual"}'


## 4. Co robisz po Sesji N1
Aktywujesz wtyczkę, sprawdzasz menu “Newsroom” w wp-admin
Generujesz token testowy wp iz24 token create --source=manual
Uruchamiasz wszystkie 4 curl testy z punktu 3
Zaglądasz do tabeli wp_postmeta żeby zobaczyć, że meta-fieldy się zapisały
Commitujesz do GitHub (git init && git add . && git commit -m "Session N1: newsroom plugin scaffold")
Piszesz mi: „kontynuuj N2" — wtedy dostaniesz prompt na panel admina Newsroom Queue

## Kontynuacja
Czy mam od razu rozpisać Sesję N2 (admin “Newsroom Queue” + dashboard widget) w tej samej wiadomości, czy wolisz najpierw przejść Sesję N1 z Claude Code i wrócić po feedback?
Rekomenduję drugi wariant — każda sesja może odsłonić niuanse (np. struktura meta, którą warto zmienić), które wpłyną na kolejny prompt. Ale jeśli chcesz mieć całość jako referencję od razu — napisz „rozpisz wszystkie 6 sesji" i lecę dalej.
