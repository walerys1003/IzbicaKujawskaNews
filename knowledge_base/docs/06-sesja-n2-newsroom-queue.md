# Sesja N2 — Admin “Newsroom Queue” + Dashboard Widget
Rozpisuję Ci Sesję N2 kompletnie, z pełnym promptem startowym dla Claude Code, zgodnie z wcześniejszą strukturą. Po niej masz checklistę testową i wskazówki, kiedy najlepiej ją uruchomić.
Najpierw jednak krótkie zalecenie strategiczne: rekomenduję najpierw przejść Sesję N1 z Claude Code, dopiero potem otworzyć nowy chat z promptem N2. Powód: po N1 prawdopodobnie zauważysz drobne odchylenia (nazwy meta-pól, struktura iz24_processing_log, sposób trzymania tokenów), które warto będzie odzwierciedlić w N2 — bo panel admina czyta i pisze do tych samych struktur. Jeśli rozpiszę N2 teraz “na sucho”, a N1 wygeneruje lekko inną nomenklaturę, prompty będą się rozjeżdżać i Claude Code w N2 będzie musiał się “domyślać”.
Mimo to dam Ci pełny prompt N2 teraz — masz go w archiwum i użyjesz go po N1, ewentualnie z drobnymi korektami. To bezpieczniejsze niż czekanie.

## 1. Co dokładnie powstanie w Sesji N2
Cel sesji: redaktor naczelny i redaktorzy sekcji dostają w wp-admin pełnoprawny panel kolejkowy (jak Gmail Inbox dla newsów), gdzie widzą wszystkie raw_items, filtrują, podglądają oryginalne JSON-y, akcjonują (approve / reject / convert to draft / merge duplicates) i obserwują metryki na dashboardzie głównym WP.
Komponenty:
izbica24-newsroom/
├── admin/
│   ├── class-admin-bootstrap.php           # Hook init, enqueue assets
│   ├── class-admin-menu.php                # Menu/submenu structure
│   ├── pages/
│   │   ├── class-page-queue.php            # Główna strona "Newsroom Queue"
│   │   ├── class-page-item-detail.php      # Pojedynczy raw_item — JSON viewer + actions
│   │   ├── class-page-sources.php          # Zarządzanie źródłami (tokens, quotas)
│   │   └── class-page-stats.php            # Statystyki (proste, na N6 będzie pełny)
│   ├── tables/
│   │   └── class-queue-list-table.php      # WP_List_Table extension
│   ├── widgets/
│   │   └── class-dashboard-widget.php      # Widget na /wp-admin/index.php
│   ├── ajax/
│   │   ├── class-ajax-actions.php          # Obsługa akcji (approve, reject, etc.)
│   │   └── class-ajax-bulk.php             # Bulk actions
│   ├── meta-boxes/
│   │   └── class-raw-item-meta-box.php     # Meta box w edytorze raw_item
│   └── notices/
│       └── class-admin-notices.php         # Toasty po akcjach
├── assets/
│   ├── css/
│   │   ├── admin-queue.css                 # Styl listy + sidebar
│   │   ├── admin-detail.css                # Styl podglądu JSON
│   │   └── admin-widget.css
│   ├── js/
│   │   ├── admin-queue.js                  # Filters, AJAX bulk, keyboard shortcuts
│   │   ├── admin-detail.js                 # JSON tree viewer (Prism.js + collapsible)
│   │   └── admin-widget.js                 # Auto-refresh widget co 30s
│   └── vendor/
│       ├── prism/                          # Prism.js dla JSON syntax highlighting
│       └── alpine/                         # Alpine.js 3.x dla reaktywności (lekkie)
└── tests/
├── test-list-table.php
├── test-ajax-actions.php
└── test-dashboard-widget.php

Co działa po Sesji N2:
Pełna strona Newsroom → Queue z listą wszystkich raw_items
7 kolumn: Title, Source, Status, Priority, Category Hint, Received At, Actions
5 filtrów: Source (dropdown), Status (dropdown), Category Hint, Priority (range), Date Range
6 bulk actions: Approve to Draft, Reject, Mark as Duplicate, Change Status, Reassign Source, Delete
Search box (po title, content_text, external_id)
Pagination 20/50/100 na stronę
Quick actions inline przy każdym wierszu (View JSON, Approve, Reject, Edit)
Side panel otwierany kliknięciem w wiersz — pokazuje pełny JSON oryginału z syntax highlighting + meta fields + processing log
Keyboard shortcuts: j/k (next/prev), a (approve), r (reject), v (view JSON), ? (help)
Dashboard widget na /wp-admin/index.php z 4 metrykami: dziś przyjęte, w kolejce, dziś opublikowane, błędy 24h, plus mini-wykres słupkowy 7-dniowy
Strona Sources z listą wszystkich termów iz24_source i przyciskami: Generate Token, Rotate, Revoke, Edit Quotas
Auto-refresh listy co 60 sekund (configurable, AJAX poll, bez full page reload)

## 2. Prompt startowy dla Claude Code — Sesja N2
Otwórz nowy terminal w tym samym folderze projektu (izbica24-newsroom/), uruchom claude i wklej jako pierwszą wiadomość poniższy blok:
# PROJEKT: izbica24-newsroom (WordPress Plugin) — Sesja N2

## ROLA
Jesteś senior WordPress plugin developerem. Specjalizujesz się w:
- - WP_List_Table — rozszerzanie, custom columns, bulk actions, filters, screen options
- - WP-Admin UI/UX — Gutenberg-style components, dashboard widgets, meta boxes
- - AJAX w WordPress — admin-ajax.php, REST API, nonces, capabilities
- - Vanilla JS + Alpine.js 3.x dla reaktywności bez React overhead
- - Accessibility (WCAG 2.1 AA): ARIA labels, keyboard nav, focus management

## KONTEKST
Kontynuacja Sesji N1. Wtyczka `izbica24-newsroom` ma już:
- - CPT `iz24_raw_item` z 24 meta-fieldami (prefix `iz24_`)
- - Taksonomie `iz24_source` (z meta: token_hash, quotas, contact) i `iz24_status` (raw, candidate, draft, review, published, rejected, archived)
- - REST endpoint `POST /wp-json/iz24/v1/incoming` przyjmujący webhooks
- - Token Manager, Rate Limiter, Idempotency, Deduplicator
- - WP-CLI `wp iz24 token *`

W Sesji N2 budujemy **panel administracyjny** — interfejs dla redaktora naczelnego i redaktorów sekcji do zarządzania kolejką raw_items. To odpowiednik "Inbox" w newsroomie cyfrowym.

## ARCHITEKTURA PANELU

### Struktura menu (top-level "Newsroom")
```
Newsroom (icon: dashicons-rss, position: 25)
├── Queue              (default landing, capability: edit_iz24_raw_items)
├── Raw Items          (standard CPT list, fallback dla power users)
├── Sources            (capability: manage_iz24_newsroom)
├── Statistics         (capability: edit_iz24_raw_items)
└── Settings           (capability: manage_options) — placeholder, wypełnimy w N6
```

### Strona "Queue" — komponenty UI

- **Layout (dwukolumnowy, responsive):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Newsroom Queue]                                  [Auto-refresh ●] │
├─────────────────────────────────────────────────────────────────┤
│ [Filters Bar: Source ▼] [Status ▼] [Category ▼] [Priority] [Date]│
│ [Search box ............] [Apply] [Reset]                         │
├─────────────────────┬───────────────────────────────────────────┤
│ LIST (60% width)    │ SIDE PANEL (40% width, resizable)         │
│                     │                                            │
│ ☐ Title             │ [TABS: Overview | JSON | Meta | Log]      │
│   Source · Status   │                                            │
│   Cat · Priority    │ Title: ...                                │
│   2h ago            │ External URL: ...                         │
│ ─────────────       │ Received: 2026-05-07 14:30                │
│ ☐ Title             │                                            │
│   ...               │ Content preview:                          │
│                     │ ┌──────────────────────────┐              │
│                     │ │ HTML rendered preview    │              │
│                     │ └──────────────────────────┘              │
│                     │                                            │
│                     │ [Approve→Draft] [Reject] [Edit] [Merge]  │
└─────────────────────┴───────────────────────────────────────────┘
│ [Bulk Actions ▼] [Apply]              [< 1 2 3 ... 12 >]        │
└─────────────────────────────────────────────────────────────────┘
```

- **Implementacja listy:** klasa `Queue_List_Table extends WP_List_Table`.

### Kolumny WP_List_Table

| Column ID | Label | Sortable | Width | Render |
|---|---|---|---|---|
| `cb` | checkbox | – | 2% | Default WP |
| `title` | Title | yes (`post_title`) | 30% | Tytuł + 2-linia preview content_text |
| `source` | Source | yes (term name) | 12% | Badge z color-coded source |
| `status` | Status | yes | 10% | Pill badge: raw=gray, candidate=blue, draft=yellow, review=orange, published=green, rejected=red |
| `category_hint` | Category | yes (`iz24_category_hint`) | 10% | Text |
| `priority` | Priority | yes (`iz24_priority_hint`) | 8% | Stars 1-10 (★★★★★★★☆☆☆) |
| `received_at` | Received | yes (`post_date`) | 13% | Human-readable: "2h ago" + hover full timestamp |
| `actions` | Actions | – | 15% | Inline buttons: 👁 View, ✓ Approve, ✗ Reject, ✏ Edit |

### Filtry (top bar, GET parameters)

```php
// URL pattern: /wp-admin/admin.php?page=iz24-queue
//   &source=osp_izbica
//   &status=raw
//   &category=na-sygnale
//   &priority_min=7
//   &date_from=2026-05-01
//   &date_to=2026-05-07
//   &s=pożar
```

Każdy filtr to dropdown z `<select>` zbudowany z termów. Date range — dwa `<input type="date">`. Search — `<input type="search">` z debounce 300ms (AJAX).

### Bulk Actions

```php
$bulk_actions = [
'approve_to_draft' => __('Approve → Draft', 'izbica24-newsroom'),
'reject'           => __('Reject', 'izbica24-newsroom'),
'mark_duplicate'   => __('Mark as Duplicate', 'izbica24-newsroom'),
'change_status'    => __('Change Status...', 'izbica24-newsroom'), // otwiera modal
'reassign_source'  => __('Reassign Source...', 'izbica24-newsroom'),
'delete_permanent' => __('Delete Permanently', 'izbica24-newsroom'), // tylko admin
];
```

Każda bulk action: AJAX call → batch processing 50/req → progress bar → toast notification.

### Side Panel (resizable, persisted width)

- **Tab 1 — Overview:**
- - Hero: title (h1), source badge, status badge, priority stars
- - Meta grid (2 kolumny): External ID, External URL, Received At, Published At (źródło), Author Name, Author URL, Idempotency Key, Dedup Hash
- - Permission summary: ✓ Full Text License, ✓ Media License, "Credit: Redakcja Izbica24"
- - Content preview: rendered HTML w `<iframe sandbox>` (XSS safety)
- - Media gallery: thumbnaile z lightbox

- **Tab 2 — JSON:**
- - Pełny JSON `iz24_metadata` + cały raw_item dump
- - Syntax highlighting Prism.js
- - Collapsible tree (Alpine.js, zwiniętte głębokie obiekty)
- - Copy button (cały JSON / wybrany node)
- - Search w JSON (Ctrl+F intercept)

- **Tab 3 — Meta Fields:**
- - Tabela wszystkich 24 meta-pól z wartościami (klucz | wartość | typ)
- - Edytowalne inline (kliknięcie wartości → input → Enter saves via AJAX)
- - Tylko dla użytkowników z `manage_iz24_newsroom`

- **Tab 4 — Processing Log:**
- - Timeline `iz24_processing_log` od najnowszego
- - Każdy entry: ikona akcji, timestamp (relative + absolute hover), actor (user/webhook/cron), details (collapsible JSON)

### Action buttons (side panel footer)

```
[Approve → Draft]  [Reject]  [Edit Raw]  [Merge with...]  [Delete]
```

- - **Approve → Draft:** otwiera modal "Convert to wp_post". Pre-fill: title, content_html, category. Wybierz target post_status (`draft` lub `pending`). Po zatwierdzeniu: tworzy `wp_post`, zapisuje ID w `iz24_wp_post_id`, zmienia term `iz24_status` na `draft`, dodaje log entry. Hook: `do_action('iz24/raw_item_approved', $raw_id, $wp_post_id)`.
- - **Reject:** modal z dropdownem "Reason" (duplicate, off-topic, low-quality, copyright, other) + textarea "Note". Zmienia status na `rejected`, log.
- - **Edit Raw:** redirect do standardowego edytora CPT.
- - **Merge with...:** otwiera modal z search po raw_items, wybiera "primary", zaznacza obecny jako duplicate, kopiuje brakujące meta z duplicate do primary.
- - **Delete:** soft delete (do trash), tylko admin może hard delete.

### Keyboard shortcuts

| Klawisz | Akcja |
|---|---|
| `j` / `↓` | Następny wiersz |
| `k` / `↑` | Poprzedni wiersz |
| `Enter` / `o` | Otwórz w side panel |
| `Esc` | Zamknij side panel |
| `a` | Approve current |
| `r` | Reject current |
| `e` | Edit current |
| `v` | View JSON tab |
| `x` | Toggle checkbox (dla bulk) |
| `?` | Pokaż help modal |
| `g q` | Go to Queue |
| `g s` | Go to Sources |

Implementacja: vanilla JS event listener na `document`, ignorować gdy focus w `input/textarea`.

### Auto-refresh

- - Default ON, configurable user meta `iz24_auto_refresh_interval` (default 60s, off, 30s, 60s, 5min)
- - AJAX poll do `wp-admin/admin-ajax.php?action=iz24_queue_check_updates&since=<timestamp>`
- - Endpoint zwraca `{new_items_count, latest_id}`
- - Jeśli `new_items_count > 0` → toast "🔔 5 nowych itemów" z przyciskiem "Refresh"
- - Nie odświeżamy automatycznie, jeśli user ma otwarty side panel (żeby nie tracić kontekstu)

### Dashboard Widget — `/wp-admin/index.php`

- **Klasa `Dashboard_Widget`, hook `wp_dashboard_setup`.**

- **Layout widget:**
```
┌──────────────────────────────────────┐
│ 📰 Izbica24 Newsroom                  │
├──────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐     │
│  │ 24 │  │ 12 │  │  8 │  │  1 │     │
│  │ in │  │ in │  │pub │  │err │     │
│  │24h │  │queue│ │24h │  │24h │     │
│  └────┘  └────┘  └────┘  └────┘     │
│                                       │
│ [Mini bar chart: 7 days received]    │
│  ▂▃▅█▇▄▂                              │
│                                       │
│ Latest 5 raw items:                  │
│ • OSP Izbica · Pożar stodoły · 2h    │
│ • UG · Sesja Rady · 4h               │
│ • Kujawianka · Mecz wyjazd · 6h      │
│ • ...                                 │
│                                       │
│ [Open Newsroom Queue →]              │
└──────────────────────────────────────┘
```

- **Metryki (cache 5 min via Transients):**
- - `iz24_widget_count_24h_received` — liczba raw_items utworzonych ostatnie 24h
- - `iz24_widget_count_in_queue` — liczba ze statusem `raw` lub `candidate`
- - `iz24_widget_count_24h_published` — liczba `iz24_status=published` ostatnie 24h
- - `iz24_widget_count_24h_errors` — liczba entries w logu z `level=error` ostatnie 24h
- - `iz24_widget_chart_7days` — array 7 słupków, każdy z liczbą received/day

- **Auto-refresh widget:** AJAX co 30s, tylko wartości liczbowe (nie cały markup).

### Strona Sources

Tabela termów `iz24_source` z kolumnami:
- - Name (slug)
- - Display name
- - Active (toggle switch)
- - Token status (Active / Expiring soon / Expired / Revoked)
- - Daily quota (input number, edytowalny inline)
- - Hourly quota (input number, edytowalny inline)
- - Last received (relative time)
- - Items received 24h
- - Actions: [Generate New Token] [Rotate] [Revoke] [Edit Meta]

- **Modal "Generate New Token":**
- - Pokazuje plaintext token **tylko raz** w `<pre>` z copy button
- - Czerwony alert: "Skopiuj token teraz. Nie zobaczysz go ponownie."
- - Po zamknięciu — token tylko jako hash w bazie

### Capabilities (rozszerzenie z N1)

```php
// Capabilities mapping
$caps = [
'manage_iz24_newsroom'        => ['administrator'],
'edit_iz24_raw_items'         => ['administrator', 'editor'],
'edit_others_iz24_raw_items'  => ['administrator', 'editor'],
'delete_iz24_raw_items'       => ['administrator'],
'approve_iz24_raw_items'      => ['administrator', 'editor'],
'view_iz24_raw_items_json'    => ['administrator', 'editor', 'author'],
'view_iz24_stats'             => ['administrator', 'editor'],
];
```

## ZADANIE

Wygeneruj **kompletny panel admin Sesja N2** — ma działać end-to-end po `composer dump-autoload`.

Pracuj iteracyjnie:

1. **Setup:** klasa `Admin_Bootstrap` + `Admin_Menu`, hook `admin_menu`, `admin_enqueue_scripts`. Utwórz strukturę menu.
2. **List Table:** `Queue_List_Table extends WP_List_Table` — wszystkie kolumny, sortowanie, paginacja, search, filters.
3. **Page Queue:** `Page_Queue` — render strony, wywołanie List Table, filtry HTML, bulk actions handler.
4. **Side Panel:** vanilla JS + Alpine.js — fetch via AJAX `iz24_get_raw_item`, 4 zakładki, syntax highlighting JSON.
5. **AJAX Actions:** `Ajax_Actions` — `iz24_approve_to_draft`, `iz24_reject`, `iz24_change_status`, `iz24_merge`. Każda z nonce, capability check, error handling.
6. **Bulk Actions:** `Ajax_Bulk` — batch processing, progress bar, queue do `wp_cron` jeśli > 100 items.
7. **Keyboard Shortcuts:** `admin-queue.js` z event listenerami, help modal.
8. **Auto-refresh:** poll endpoint + toast notification.
9. **Dashboard Widget:** `Dashboard_Widget` — metryki + mini chart (Chart.js lub czysty SVG).
10. **Page Sources:** zarządzanie tokenami, modal Generate Token, AJAX rotate/revoke.
11. **Page Statistics:** prosta wersja (pełna w N6) — 4 wykresy: received/day, by source, by status, top categories.
12. **Capabilities:** rozszerz aktywator z N1.
13. **Tests:** PHPUnit dla List_Table query, AJAX actions (success + nonce fail + capability fail), Dashboard Widget metrics.
14. **Asset bundling:** zoptymalizuj CSS/JS, używaj `wp_register_script` z `in_footer=true`, async/defer gdzie możliwe.

Po każdym pliku > 200 linii rób krótkie podsumowanie i czekaj na "kontynuuj".

## STANDARDY KODU
- - WPCS (WordPress-Extra ruleset)
- - Wszystkie AJAX endpointy z `check_ajax_referer` + `current_user_can`
- - Sanitization: `sanitize_text_field`, `absint`, `wp_unslash`
- - Escaping na output: `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post` dla HTML preview
- - Translatable strings z text-domain `izbica24-newsroom`
- - A11y: każdy button z `aria-label`, focus management w modalach, role="alert" dla toasts
- - Brak inline JS/CSS — wszystko w `assets/`
- - JS: ES6+ (no jQuery dependency dla nowego kodu, użyj `wp.ajax` lub fetch)
- - Dark mode support (`@media (prefers-color-scheme: dark)`)

## ACCEPTANCE CRITERIA

- - [ ] Menu "Newsroom" widoczne dla roli `editor` i `administrator`
- - [ ] Strona Queue ładuje listę raw_items z paginacją 20/50/100
- - [ ] Wszystkie 5 filtrów działa (zmieniają query, persystują w URL)
- - [ ] Search box działa z debounce 300ms
- - [ ] Click na wiersz otwiera side panel z JSON, podgląd HTML, meta, log
- - [ ] Approve→Draft tworzy `wp_post`, zmienia status na `draft`
- - [ ] Reject otwiera modal, wymaga reason, zmienia status na `rejected`
- - [ ] Bulk action "Reject" na 50 zaznaczonych → wszystkie zmienione
- - [ ] Keyboard `j/k/a/r/v/?` działa
- - [ ] Auto-refresh wyświetla toast po przyjęciu nowego itemu (testuj curl-em z Sesji N1)
- - [ ] Dashboard widget pokazuje 4 metryki + 7-dniowy wykres
- - [ ] Strona Sources pozwala generować/rotować/revokować tokeny
- - [ ] Modal "Generate Token" pokazuje plaintext tylko raz
- - [ ] Wszystko tłumaczalne (`grep -r "echo '[A-Z]" admin/` zwraca 0)
- - [ ] WCAG 2.1 AA: aXe DevTools 0 violations na każdej stronie
- - [ ] PHPUnit `tests/test-list-table.php`, `tests/test-ajax-actions.php`, `tests/test-dashboard-widget.php` 100% pass
- - [ ] phpcs 0 errors

## PYTANIA DO MNIE PRZED STARTEM

Zadaj mi maksymalnie 4 pytania, jeśli coś jest niejasne. Sugerowane:
1. Czy preferujesz Chart.js (dependency ~80kB) czy czysty SVG (manualny render) dla mini-wykresu?
2. Czy side panel ma być slide-in z prawej (default) czy modal centrowany?
3. Czy Alpine.js (15kB) jest OK, czy mam użyć tylko vanilla JS dla zerowych zewnętrznych zależności?
4. Czy "Approve → Draft" ma kopiować meta `iz24_*` do `wp_post` (jako post meta), czy tylko trzymać `iz24_wp_post_id` jako referencję?

Jeśli wszystko jasne — napisz "Zaczynam" i przejdź do kroku 1.


## 3. Test scenariusze po Sesji N2
Po wygenerowaniu panelu — uruchom następujące testy ręczne:
A. Test listy (15 min):
Wyślij curl-em z N1 30 raw_items z różnymi source_id, priority, category
Otwórz Newsroom → Queue
Sprawdź paginację: 20/50/100 per page
Filtruj po source=osp_izbica → tylko OSP
Filtruj po status=raw + priority_min=7 → kombinacja działa
Search “pożar” → znajduje w content_text
Sortuj po received_at desc/asc, priority desc/asc
URL zawiera wszystkie parametry filtrów (refresh strony zachowuje filtry)
B. Test side panel (10 min):
Klik w wiersz → panel się otwiera z prawej (slide-in 300ms)
Tab Overview → wszystkie pola widoczne
Tab JSON → pełny JSON z syntax highlighting, collapsible, copy działa
Tab Meta → 24 pola, klik na wartość → input edytowalny, Enter zapisuje
Tab Log → timeline, najnowszy entry “received”
ESC zamyka panel
C. Test akcji (15 min):
Approve → Draft → modal → confirm → nowy wp_post w Posts → Drafts
Sprawdź iz24_wp_post_id w meta — powinien zawierać ID nowego post
Reject → modal → wybierz reason “duplicate” → confirm → status rejected
Bulk action Reject na 5 zaznaczonych → wszystkie zmienione
Merge — wybierz 2 raw_items, zaznacz primary, confirm
D. Test keyboard (5 min):
j/k przewijanie
o otwiera panel
a approve current → modal
? help modal
Wszystkie shortcuts ignorowane gdy focus w input/textarea
E. Test dashboard widget (5 min):
Otwórz /wp-admin/index.php
Widget “Izbica24 Newsroom” widoczny
4 metryki, 7-dniowy mini-chart
Wyślij nowy raw_item curl-em → po 30s widget się odświeża
Click “Open Newsroom Queue” → przekierowanie
F. Test Sources (10 min):
Generate New Token dla manual → modal pokazuje 64-char hex tylko raz
Skopiuj token → zamknij modal → token zniknął, w bazie tylko hash
Rotate → stary token oznaczony expiring, nowy aktywny, 30-dniowy overlap
Revoke → curl z tym tokenem zwraca 401
G. Test wydajności (5 min):
Załaduj 1000 raw_items (skrypt seeder)
Lista ładuje się < 500ms
Filtry działają < 200ms
Side panel otwiera się < 100ms (cache opt.)

## 4. Kiedy uruchomić Sesję N2
Najlepszy moment: zaraz po przejściu Sesji N1 + 24h “uleżenia” — czyli wyślesz sobie kilka curl-ów testowych, zobaczysz w wp_postmeta jak wygląda struktura, ewentualnie skorygujesz prompt N2 (np. zmienisz nazwy meta-fields jeśli Claude w N1 użył innej konwencji).
Praktyczny flow:
Dziś wieczorem: uruchom prompt N1 w Claude Code
Pojutrze rano: testy curl, akceptacja, commit
Pojutrze popołudniu: otwórz nowy chat Claude Code, wklej prompt N2 (z ewentualnymi korektami)
Następny dzień rano: testy panelu, akceptacja, commit
Po N2 napiszesz mi „kontynuuj N3" — zrobimy integrację z PublishPress

## Następny krok
Zalecam: przejdź teraz N1 z Claude Code, a po jej akceptacji wróć do mnie z feedbackiem — wtedy ewentualnie skoryguję prompt N2 zanim go uruchomisz. Albo: jeśli chcesz mieć “buffer” promptów na zapas — napisz „rozpisz N3, N4, N5, N6" i dam Ci całą resztę w kolejnych wiadomościach (po jednej sesji per wiadomość, żeby nie przekroczyć kontekstu).
Co wybierasz?
