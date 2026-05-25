# Sesja N3 — Integracja z PublishPress: automatyczne kierowanie draftów do redaktorów sekcji
Trzecia sesja. Po niej masz pełny editorial workflow: raw_item → AI draft → automatyczne przypisanie do właściwego redaktora sekcji → kolejka review → publikacja.

## 1. Co dokładnie powstanie w Sesji N3
Cel sesji: kiedy Claude (przez n8n, sesja N5) lub redaktor (manualnie z N2) zatwierdzi raw_item i utworzy wp_post jako draft, system automatycznie:
Czyta iz24_category_suggestion (lub iz24_category_hint) z raw_item
Mapuje kategorię → redaktora sekcji (na podstawie tabeli przypisań)
Ustawia post_author = ID redaktora sekcji
Tworzy zadanie w PublishPress Editorial Calendar z deadlinem
Dodaje raw_item do PublishPress Notifications (e-mail + Slack do redaktora)
Ustawia post status na PublishPress custom status pitch lub assigned
Loguje akcję w iz24_processing_log
Aktualizuje dashboard widget (counter “assigned today”)
Komponenty:
izbica24-newsroom/
├── includes/
│   ├── editorial/
│   │   ├── class-editorial-bootstrap.php       # Detect PublishPress, init
│   │   ├── class-section-router.php            # Mapowanie kategoria → redaktor
│   │   ├── class-assignment-engine.php         # Logika przypisania
│   │   ├── class-pp-statuses.php               # Custom post statuses
│   │   ├── class-pp-notifications.php          # Hook PublishPress Notifications
│   │   ├── class-pp-calendar.php               # Editorial Calendar integration
│   │   ├── class-deadline-calculator.php       # Logika deadline (priority-based)
│   │   └── class-fallback-editor.php           # Co gdy brak przypisania
│   └── compat/
│       ├── class-compat-publishpress.php       # Wykrywanie wersji PP
│       └── class-compat-publishpress-pro.php   # Funkcje Pro (Slack, Multiple Authors)
├── admin/
│   └── pages/
│       ├── class-page-section-editors.php      # UI mapowania kategoria → redaktor
│       ├── class-page-workflow-rules.php       # Reguły routingu (warunki)
│       └── class-page-editorial-stats.php      # Statystyki redaktorów
└── tests/
├── test-section-router.php
├── test-assignment-engine.php
└── test-pp-integration.php

Co działa po Sesji N3:
Strona Newsroom → Section Editors z tabelą mapowań:
Wiadomości → Redaktor #1 (Anna K.)
Na sygnale → Redaktor #2 (Piotr M.)
Samorząd → Redaktor #3 (Krzysztof N.)
Kujawianka → Redaktor #4 (Tomasz W.)
Kultura → Redaktor #5 (Maria S.)
Historia → Redaktor #6 (Jan B.)
…itd. dla wszystkich 12 głównych kategorii
Każda kategoria może mieć primary editor + backup editor + fallback (redaktor naczelny)
Strona Workflow Rules — reguły warunkowe (np. „jeśli priority ≥ 8 → notify primary + backup natychmiast", „jeśli source = osp_izbica → assign do Na sygnale niezależnie od category_hint")
5 custom post statuses PublishPress: pitch, assigned, in_progress, awaiting_review, ready_to_publish
Notyfikacje e-mail + Slack (jeśli PP Pro) do przypisanego redaktora w momencie assignment
Editorial Calendar pokazuje wszystkie przypisane drafty z color-coding po sekcji
Dashboard widget z N2 dostaje 2 nowe metryki: “Assigned to me today” + “My pending reviews”
Strona Editorial Stats — wykres: drafty per redaktor, średni czas review, opóźnienia

## 2. Wymagania wstępne (zanim uruchomisz N3)
Zainstaluj na WordPress:
Free (działa minimalnie):
PublishPress Planner (free, WP.org) — Editorial Calendar, Custom Statuses, Notifications
Pro (zalecane, ~530 PLN/rok):
PublishPress Pro — Slack notifications, Multiple Authors, Editorial Comments, Advanced Permissions
PublishPress Authors Pro (opcjonalnie) — multi-author posts (przyda się gdy AI + redaktor współpracują)
Skonfiguruj wcześniej w PublishPress:
Dodaj 5 custom statuses: pitch, assigned, in_progress, awaiting_review, ready_to_publish
Aktywuj Notifications dla post type post
Stwórz role WordPress: iz24_section_editor (capabilities: edit_posts, edit_others_posts, publish_posts) — opcjonalnie, można użyć standardowej editor
Dodaj userów testowych: redaktor_wiadomosci, redaktor_nasygnale, redaktor_samorzad itd.
Wtyczka N3 wykryje obecność PublishPress i zaadaptuje funkcjonalność (graceful degradation jeśli brak Pro).

## 3. Prompt startowy dla Claude Code — Sesja N3
Otwórz nowy terminal w izbica24-newsroom/, uruchom claude i wklej:
# PROJEKT: izbica24-newsroom (WordPress Plugin) — Sesja N3

## ROLA
Jesteś senior WordPress developerem ze specjalizacją w editorial workflow:
- - PublishPress Planner & Pro — custom statuses, notifications, editorial calendar API
- - WordPress user roles, capabilities, post_author management
- - Hooks-driven architecture: filters/actions dla rozszerzalności
- - Integracje "graceful degradation" — fallback gdy plugin nieaktywny
- - Zaawansowane meta queries, taxonomy queries, user meta queries

## KONTEKST
Kontynuacja Sesji N1 i N2. Wtyczka `izbica24-newsroom` ma:
- - CPT `iz24_raw_item` z 24 meta-fieldami
- - Taksonomie `iz24_source` i `iz24_status`
- - REST endpoint `/v1/incoming` (N1)
- - Panel admin "Newsroom Queue" z action "Approve → Draft" (N2)

W Sesji N3 budujemy **most między raw_items a editorial workflow**: kiedy ktoś (redaktor manualnie z N2 lub n8n automatycznie z N5) wywoła "Approve → Draft", system tworzy `wp_post` i automatycznie:
1. Wybiera właściwego redaktora sekcji bazując na `iz24_category_suggestion`
2. Ustawia `post_author` = ID tego redaktora
3. Ustawia post status na `pitch` lub `assigned` (PublishPress custom status)
4. Wysyła notification (e-mail + Slack)
5. Tworzy entry w Editorial Calendar z deadlinem
6. Loguje wszystko w `iz24_processing_log`

PublishPress Free jest wymagany. PublishPress Pro opcjonalny (Slack, multi-author) — kod ma działać bez Pro w trybie degraded.

## STRUKTURA REDAKCJI IZBICA24

```
Redaktor Naczelny (admin)
│
├── Redaktor Wiadomości       → kategorie: Wiadomości (+ subkategorie)
├── Redaktor Na Sygnale        → kategorie: Na sygnale
├── Redaktor Samorząd          → kategorie: Samorząd
├── Redaktor Kujawianka        → kategorie: Kujawianka
├── Redaktor Kultura           → kategorie: Kultura
├── Redaktor Historia          → kategorie: Historia
├── Redaktor Ludzie            → kategorie: Ludzie, Życie codzienne
├── Redaktor Multimedia        → kategorie: Multimedia (galerie, video, podcast)
├── Redaktor Przegląd Mediów   → kategorie: Przegląd mediów
└── Redaktor Ogłoszenia        → kategorie: Ogłoszenia
```

Każdy redaktor sekcji ma:
- - WordPress user account z rolą `editor` (lub custom `iz24_section_editor`)
- - User meta `iz24_section_assignments` (array slugów kategorii za które odpowiada)
- - User meta `iz24_max_concurrent_assignments` (default 10) — gdy przekroczone, fallback do backup
- - User meta `iz24_slack_user_id` (opcjonalnie)
- - User meta `iz24_notify_email` (default = user_email)
- - User meta `iz24_working_hours` (np. "08:00-16:00") — poza godzinami → notification opóźniony

## ARCHITEKTURA

### Klasa `Section_Router`

- **Odpowiedzialność:** mapowanie kategoria → redaktor.

- **Metody:**
```php
public function get_editor_for_category(string $category_slug, ?int $priority = null): ?WP_User
public function get_backup_editor(string $category_slug): ?WP_User
public function get_fallback_editor(): ?WP_User  // Redaktor naczelny
public function is_editor_overloaded(int $user_id): bool  // > max_concurrent
public function is_within_working_hours(int $user_id): bool
public function set_assignment(string $category_slug, int $user_id, string $role = 'primary'): bool
public function get_all_assignments(): array  // Dla strony Section Editors
```

- **Algorytm wyboru redaktora (`get_editor_for_category`):**
1. Znajdź wszystkich userów z `iz24_section_assignments` zawierającym `$category_slug`
2. Filtruj po roli `primary` (lub `backup` jeśli primary niedostępny)
3. Sprawdź `is_editor_overloaded` — jeśli przekroczony max_concurrent → przejdź do backup
4. Sprawdź `is_within_working_hours` — jeśli nie, oznacz notification jako "deferred"
5. Jeśli `priority >= 8` (breaking news) → ignoruj working_hours, notyfikuj natychmiast
6. Jeśli brak żadnego redaktora → zwróć fallback (redaktor naczelny)
7. Hook `apply_filters('iz24/editorial/select_editor', $user, $category, $priority, $context)` — pozwala zmienić wybór z innych pluginów

- **Storage mapowania:** WordPress option `iz24_section_assignments` (array):
```php
[
'wiadomosci' => ['primary' => 5, 'backup' => 12, 'rules' => [...]],
'na-sygnale' => ['primary' => 7, 'backup' => 5, 'rules' => [...]],
// ...
]
```

### Klasa `Assignment_Engine`

- **Odpowiedzialność:** wykonanie pełnego flow assignment.

- **Główna metoda:**
```php
public function assign_post(int $post_id, ?int $raw_item_id = null): array
```

- **Krok po kroku:**
1. Wczytaj post — sprawdź czy `post_type=post` i ma `iz24_raw_item_id` w meta (lub przekazane jako arg)
2. Jeśli brak raw_item — użyj samej kategorii post (`wp_get_post_categories`)
3. Wywołaj `Section_Router::get_editor_for_category($category, $priority)`
4. Wywołaj `apply_filters('iz24/editorial/before_assign', ...)` — pozwala innym pluginom przerwać
5. `wp_update_post(['ID' => $post_id, 'post_author' => $editor_id, 'post_status' => 'assigned'])`
6. `update_post_meta($post_id, 'iz24_assigned_at', current_time('mysql'))`
7. `update_post_meta($post_id, 'iz24_assigned_to', $editor_id)`
8. `update_post_meta($post_id, 'iz24_deadline', $this->calculate_deadline($priority))`
9. Wywołaj `Deadline_Calculator::calculate($priority)`:
- - priority 9-10: deadline = +1h (breaking)
- - priority 7-8: deadline = +4h
- - priority 5-6: deadline = +12h
- - priority 3-4: deadline = +24h
- - priority 1-2: deadline = +72h (evergreen)
10. `do_action('publishpress_notifications_send_workflow', $post_id, $editor_id)` — trigger PP Notifications
11. Jeśli PP Pro + Slack: `do_action('iz24/editorial/slack_notify', $editor_id, $post_id)`
12. Dodaj entry do raw_item processing_log: `{action: 'assigned', actor: 'system', editor_id: 123, deadline: '...'}`
13. Wywołaj `do_action('iz24/editorial/post_assigned', $post_id, $editor_id, $context)`
14. Zwróć array `['success' => true, 'editor_id' => 123, 'editor_name' => '...', 'deadline' => '...', 'status' => 'assigned']`

- **Obsługa błędów:**
- - Brak redaktora dla kategorii → fallback do naczelnego, log warning
- - Redaktor przeciążony → backup, log info
- - PublishPress nieaktywny → ustaw standardowy status `draft`, log warning, kontynuuj (graceful degradation)

### Klasa `PP_Statuses`

- **Rejestracja 5 custom statusów PublishPress przy aktywacji:**

```php
$statuses = [
[
'name'        => 'pitch',
'label'       => __('Pitch', 'izbica24-newsroom'),
'description' => __('Initial idea or raw item awaiting decision', 'izbica24-newsroom'),
'color'       => '#7c8087', // gray
'icon'        => 'dashicons-lightbulb',
'position'    => 1,
],
[
'name'        => 'assigned',
'label'       => __('Assigned', 'izbica24-newsroom'),
'description' => __('Assigned to section editor, awaiting work', 'izbica24-newsroom'),
'color'       => '#1e8cbe', // blue
'icon'        => 'dashicons-businessperson',
'position'    => 2,
],
[
'name'        => 'in_progress',
'label'       => __('In Progress', 'izbica24-newsroom'),
'description' => __('Editor is working on the article', 'izbica24-newsroom'),
'color'       => '#f5b800', // yellow
'icon'        => 'dashicons-edit',
'position'    => 3,
],
[
'name'        => 'awaiting_review',
'label'       => __('Awaiting Review', 'izbica24-newsroom'),
'description' => __('Submitted by editor, awaiting editor-in-chief approval', 'izbica24-newsroom'),
'color'       => '#ff9800', // orange
'icon'        => 'dashicons-visibility',
'position'    => 4,
],
[
'name'        => 'ready_to_publish',
'label'       => __('Ready to Publish', 'izbica24-newsroom'),
'description' => __('Approved by editor-in-chief, scheduled or ready', 'izbica24-newsroom'),
'color'       => '#46b450', // green
'icon'        => 'dashicons-yes-alt',
'position'    => 5,
],
];
```

- **Rejestracja:** PublishPress Free API `register_post_status` + filter `pp_custom_status_list`. Jeśli PP nieaktywny — fallback do standardowych `draft`/`pending`.

### Klasa `PP_Notifications`

- **Hooki PublishPress Notifications:**
```php
add_action('pp_send_notification_status_change', [$this, 'on_status_change'], 10, 3);
add_filter('pp_notification_recipients', [$this, 'add_section_editor_to_recipients'], 10, 3);
add_filter('pp_notification_subject', [$this, 'customize_subject'], 10, 3);
add_filter('pp_notification_body', [$this, 'customize_body'], 10, 3);
```

- **Custom workflow "New Assignment":**
- - Trigger: post status zmienia się na `assigned`
- - Recipients: `post_author` (redaktor sekcji) + redaktor naczelny (CC)
- - Subject: `[Izbica24 Newsroom] Nowe zadanie: {post_title} (priority: {priority})`
- - Body: HTML template z linkiem do edytora, deadline, source info, link do raw_item

- **Slack integration (PP Pro):**
- - Wymaga skonfigurowanego Slack webhook w PP Pro Settings
- - Format wiadomości: rich attachment z preview, deadline, source badge
- - DM do `iz24_slack_user_id` (jeśli ustawione) lub kanał `#newsroom`

### Klasa `PP_Calendar`

- **Editorial Calendar integration:**
- - Filter `pp_calendar_post_query_args` — pokaż custom statuses
- - Filter `pp_calendar_post_classes` — color coding po sekcji (CSS class `iz24-section-{slug}`)
- - Filter `pp_calendar_post_html` — dodaj badge z priority, deadline countdown, source icon
- - Action `pp_calendar_after_post_render` — dodaj inline button "Open Raw Item"

- **Custom view "By Section":**
- - Endpoint `/wp-admin/admin.php?page=pp-calendar&view=by-section`
- - Grid: kolumny = redaktorzy sekcji, wiersze = dni
- - Każda komórka = posty assigned do tego redaktora w tym dniu
- - Color coding: zielony (na czas), żółty (deadline < 24h), czerwony (przekroczony)

### Strona "Section Editors" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-section-editors`

- **Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│ Section Editors — Mapowanie kategoria → redaktor                  │
├──────────────────────────────────────────────────────────────────┤
│ Category          │ Primary       │ Backup        │ Max│ Actions │
├──────────────────────────────────────────────────────────────────┤
│ Wiadomości        │ Anna K. ▼     │ Piotr M. ▼    │ 10 │ [Edit] │
│ Na sygnale        │ Piotr M. ▼    │ Anna K. ▼     │ 15 │ [Edit] │
│ Samorząd          │ Krzysztof N.▼ │ Anna K. ▼     │ 8  │ [Edit] │
│ Kujawianka        │ Tomasz W. ▼   │ —             │ 12 │ [Edit] │
│ Kultura           │ Maria S. ▼    │ Jan B. ▼      │ 8  │ [Edit] │
│ Historia          │ Jan B. ▼      │ Maria S. ▼    │ 5  │ [Edit] │
│ Ludzie            │ Anna K. ▼     │ Krzysztof N.▼ │ 6  │ [Edit] │
│ Życie codzienne   │ Maria S. ▼    │ Anna K. ▼     │ 6  │ [Edit] │
│ Multimedia        │ Tomasz W. ▼   │ —             │ 8  │ [Edit] │
│ Przegląd mediów   │ Anna K. ▼     │ —             │ 5  │ [Edit] │
│ Ogłoszenia        │ Krzysztof N.▼ │ —             │ 20 │ [Edit] │
├──────────────────────────────────────────────────────────────────┤
│ Fallback Editor (gdy żaden redaktor sekcji niedostępny):         │
│ ▼ Redaktor Naczelny (Tomek K.)                                    │
└──────────────────────────────────────────────────────────────────┘
[Save Changes]
```

- **Inline editing:** dropdown z listą userów filtrowaną po `capability=edit_others_posts`. Toggle "Active" per user. AJAX save.

- **Modal "Edit Assignment":**
- - User picker
- - Working hours (time range)
- - Max concurrent assignments
- - Slack user ID
- - Notify email (jeśli inny niż user_email)
- - Subkategorie (które konkretnie z głównej kategorii)

### Strona "Workflow Rules" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-workflow-rules`

- **Reguły warunkowe** (if-then) wykonywane przed standardowym routingiem:

```
┌──────────────────────────────────────────────────────────────────┐
│ Workflow Rules — Reguły routingu (top to bottom priority)         │
├──────────────────────────────────────────────────────────────────┤
│ Rule 1: Breaking News → Redaktor Naczelny + Notify All           │
│   IF iz24_priority >= 9                                            │
│   THEN assign_to = editor-in-chief                                │
│        notify = ['editor-in-chief', 'all-section-editors']        │
│        deadline = +30 minutes                                     │
│   [Edit] [Delete] [↑↓]                                           │
├──────────────────────────────────────────────────────────────────┤
│ Rule 2: OSP Source → Na sygnale                                   │
│   IF iz24_source.slug == 'osp_izbica'                             │
│   THEN assign_to = section_editor('na-sygnale')                   │
│        category = 'na-sygnale'                                    │
│   [Edit] [Delete] [↑↓]                                           │
├──────────────────────────────────────────────────────────────────┤
│ Rule 3: Kujawianka match → Sport editor + tag "mecz"              │
│   IF iz24_source.slug == 'mgks_kujawianka' AND title CONTAINS     │
│      ('mecz' OR 'wynik' OR 'liga')                                 │
│   THEN assign_to = section_editor('kujawianka')                   │
│        tags += ['mecz', 'kujawianka']                             │
│   [Edit] [Delete] [↑↓]                                           │
├──────────────────────────────────────────────────────────────────┤
│ Rule 4: Sesja Rady Gminy → Samorząd + ustaw deadline na dzień    │
│         przed sesją                                                │
│   IF iz24_category_hint == 'samorzad' AND title CONTAINS         │
│      ('sesja' OR 'rada gminy')                                     │
│   THEN assign_to = section_editor('samorzad')                     │
│        deadline = parse_date(content) - 1 day                     │
│   [Edit] [Delete] [↑↓]                                           │
├──────────────────────────────────────────────────────────────────┤
│ [+ Add New Rule]                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- **Storage:** option `iz24_workflow_rules` (array).

- **Engine:** klasa `Workflow_Rules_Engine` z metodami:
```php
public function evaluate(int $raw_item_id): array  // Zwraca wszystkie matched rules
public function apply(int $post_id, array $rules): void  // Aplikuje action
public function add_rule(array $rule): int  // Zapisuje regułę
public function test_rule(array $rule, int $sample_raw_item_id): array  // Symulacja
```

- **Visual rule builder:** Alpine.js dropdown z polami `iz24_*`, operatorami (`==`, `!=`, `CONTAINS`, `>=`, `IN`), i akcjami (`assign_to`, `set_category`, `add_tags`, `set_deadline`, `notify`).

### Dashboard Widget — rozszerzenie z N2

- **Dodaj 2 metryki dla zalogowanego użytkownika:**
```
┌──────────────────────────────────────┐
│ 📰 Izbica24 Newsroom                  │
├──────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐     │
│  │ 24 │  │ 12 │  │  8 │  │  1 │     │
│  │24h │  │queue│ │24h │  │err │     │
│  └────┘  └────┘  └────┘  └────┘     │
│                                       │
│ ── My Assignments ──                  │
│  ┌────┐  ┌────┐                      │
│  │  3 │  │  1 │                      │
│  │new │  │late│                      │
│  └────┘  └────┘                      │
│                                       │
│ My pending posts:                    │
│ • Pożar stodoły · deadline 2h · 🔥   │
│ • Sesja Rady · deadline 1d           │
│ • Mecz Kujawianki · deadline 4h      │
│                                       │
│ [My Editorial Calendar →]            │
└──────────────────────────────────────┘
```

### Strona "Editorial Stats" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-editorial-stats`

- **Wykresy (Chart.js):**

1. **Drafts per Editor (last 30 days)** — bar chart
2. **Average Review Time per Section** — bar chart (godziny)
3. **Deadlines Met vs Missed** — doughnut chart
4. **Workload Distribution** — heatmap (redaktor × dzień tygodnia)
5. **Top Bottlenecks** — tabela: kategorie z najdłuższym `awaiting_review` time

- **Filter:** date range, section, editor.

- **Export:** CSV + PDF (use `mpdf` library).

## ZADANIE

Wygeneruj **kompletny editorial workflow Sesja N3**.

Pracuj iteracyjnie:

1. **Compat layer:** detekcja PublishPress Free/Pro, graceful degradation, admin notice jeśli brak.
2. **Custom statuses:** rejestracja 5 statusów PP, fallback do standardowych.
3. **Section_Router:** algorytm wyboru, user meta, hooks.
4. **Assignment_Engine:** główny flow, deadline calculator, error handling.
5. **PP Notifications:** workflow "New Assignment", custom subject/body, Slack (PP Pro).
6. **PP Calendar:** color coding, custom "By Section" view.
7. **Page Section Editors:** UI mapowania, inline edit, AJAX save.
8. **Workflow Rules Engine:** rule builder UI, evaluator, applier.
9. **Page Workflow Rules:** lista reguł, drag-drop priority, modal edit.
10. **Dashboard Widget extensions:** "My Assignments" section, "My pending" list.
11. **Page Editorial Stats:** 5 wykresów, filtry, export.
12. **Hooks:** wpięcie do "Approve → Draft" z N2 — automatyczne wywołanie `Assignment_Engine::assign_post()`.
13. **WP-CLI:** `wp iz24 editorial assign <post_id>`, `wp iz24 editorial test-rules`, `wp iz24 editorial stats`.
14. **Tests:** PHPUnit dla Section_Router (10 cases), Assignment_Engine (8 cases), Workflow_Rules_Engine (12 cases), PP integration (4 cases).

Po każdym pliku > 200 linii — krótkie podsumowanie i czekaj na "kontynuuj".

## STANDARDY KODU
- - WPCS (WordPress-Extra)
- - Wszystkie integracje PP przez hooks/filters (nie modyfikuj plików PP)
- - Class_exists('PublishPress\\...') przed użyciem
- - Wszystkie strings translatable (text-domain `izbica24-newsroom`)
- - A11y: focus management w modalach, aria-live dla AJAX updates
- - Performance: cache `Section_Router::get_editor_for_category` w transient (5min)
- - Logging: każda akcja → `iz24_processing_log` na raw_item

## ACCEPTANCE CRITERIA

- - [ ] PublishPress Free wykryty — wtyczka aktywuje się bez fatal error
- - [ ] PublishPress nieaktywny — admin notice, fallback do `draft` status, log warning
- - [ ] Strona "Section Editors" — 11 kategorii (zgodnie ze strukturą Izbica24), inline edit działa
- - [ ] Strona "Workflow Rules" — minimum 4 sample rules pre-loaded przy aktywacji
- - [ ] Approve→Draft z N2 wywołuje `Assignment_Engine::assign_post()`
- - [ ] Post automatycznie zmienia `post_author` + status `assigned`
- - [ ] PP Notification wysyła e-mail do redaktora sekcji (test z `wp_mail`)
- - [ ] Deadline ustawiony na podstawie priority (9→1h, 7→4h, 5→12h, etc.)
- - [ ] Rule "Breaking News" override standardowy routing dla priority ≥ 9
- - [ ] Rule "OSP Source → Na sygnale" działa niezależnie od category_hint
- - [ ] Editorial Calendar pokazuje custom statuses z color coding
- - [ ] Dashboard Widget pokazuje "My Assignments" dla zalogowanego redaktora
- - [ ] Editorial Stats — 5 wykresów renderuje się, export CSV działa
- - [ ] WP-CLI `wp iz24 editorial assign 123` działa
- - [ ] PHPUnit 34/34 testów pass
- - [ ] phpcs 0 errors

## PYTANIA DO MNIE PRZED STARTEM

Zadaj maksymalnie 4 pytania. Sugerowane:
1. Czy PublishPress Pro będzie zainstalowany od razu, czy zaczynamy z Free i kod ma wykrywać Pro później (lazy detection)?
2. Czy Workflow Rules mają być w UI tylko klikalne (visual builder) czy chcesz też tryb "advanced" z JSON edytowalnym ręcznie?
3. Czy notifications mają iść także przez SMS/WhatsApp (Twilio integration), czy na N3 wystarczy e-mail + Slack?
4. Czy "fallback editor" (redaktor naczelny) ma dostawać CC od każdej notyfikacji, czy tylko gdy żaden redaktor sekcji niedostępny?

Jeśli wszystko jasne — napisz "Zaczynam" i przejdź do kroku 1.


## 4. Test scenariusze po Sesji N3
A. Setup testowy (15 min):
Zainstaluj PublishPress Planner (Free)
Stwórz 5 testowych userów: red_wiadomosci, red_nasygnale, red_samorzad, red_kultura, red_naczelny
Każdy user ma rolę editor
W Section Editors zmapuj: Wiadomości→red_wiadomosci, Na sygnale→red_nasygnale, etc.
Sprawdź że 4 sample rules są pre-loaded
B. Test podstawowego routingu (10 min):
Wyślij curl-em raw_item z category_hint=samorzad, priority=5
W Newsroom Queue (N2) klik “Approve → Draft”
Sprawdź wp_posts: nowy post ma post_author = red_samorzad.ID, post_status = assigned
Sprawdź wp_postmeta: iz24_assigned_at, iz24_assigned_to, iz24_deadline (≈ +12h)
Sprawdź processing_log raw_item — ostatni entry: assigned
Sprawdź skrzynkę red_samorzad — e-mail z notification
C. Test reguły warunkowej (10 min):
Wyślij raw_item z priority=9, category_hint=kultura
Approve → Draft
Rule 1 “Breaking News” override → post przypisany do red_naczelny, nie red_kultura
Deadline = +30min
Notification → all section editors (CC) + red_naczelny
D. Test OSP routing (5 min):
Wyślij raw_item z source_id=osp_izbica, category_hint=wiadomosci (źle dobrany hint)
Approve → Draft
Rule 2 “OSP Source” override → post w kategorii na-sygnale, assigned do red_nasygnale
Tag automatycznie dodany: osp
E. Test overload protection (10 min):
Ustaw red_wiadomosci.iz24_max_concurrent_assignments = 3
Stwórz 3 posty assigned do red_wiadomosci ze statusem in_progress
Wyślij 4-ty raw_item z category_hint=wiadomosci
Approve → Draft
Sprawdź — przypisany do backup editor (nie red_wiadomosci)
processing_log: warning “primary_editor_overloaded”
F. Test working hours (5 min):
Ustaw red_wiadomosci.iz24_working_hours = 08:00-16:00
Wyślij raw_item o 22:00 z priority=5
Approve → Draft → przypisany do red_wiadomosci, ale notification status = deferred
Wyślij raw_item o 22:00 z priority=9 (breaking)
Notification natychmiast (override working hours)
G. Test fallback (5 min):
Dezaktywuj wszystkich redaktorów dla kategorii Historia (no primary, no backup)
Wyślij raw_item z category_hint=historia
Approve → Draft → fallback do red_naczelny
processing_log: warning “no_section_editor_found, fallback_used”
H. Test PublishPress disabled (5 min):
Dezaktywuj PublishPress Planner
Reload admin → zobacz admin notice
Approve → Draft → post status = draft (standardowy), nie assigned
processing_log: warning “publishpress_inactive”
Aktywuj z powrotem → wszystko działa
I. Test Editorial Stats (5 min):
Po 2-3 dniach pracy z 20+ raw_items
Otwórz Editorial Stats
5 wykresów się renderuje
Filter “Last 7 days” działa
Export CSV — plik z poprawnym formatem

## 5. Konfiguracja po Sesji N3 (manualna)
Po aktywacji wtyczki w wersji N3:
Newsroom → Section Editors — przypisz prawdziwych redaktorów do kategorii
Newsroom → Workflow Rules — przejrzyj 4 sample rules, dostosuj
PublishPress → Settings → Notifications — aktywuj workflow “New Assignment”
PublishPress → Settings → Statuses — sprawdź że 5 custom statuses widoczne
Users → All Users — dla każdego redaktora ustaw user meta (working_hours, slack_user_id, max_concurrent)
Newsroom → Editorial Stats — zostaw, wypełni się danymi po pierwszych assignments

## Kontynuacja
Mam dalej rozpisywać kolejne sesje? Wybierz:
„rozpisz N4" — szablony promptów Claude jako CPT iz24_prompt_template (edytowalne z wp-admin, wersjonowane, A/B testowalne)
„rozpisz N5" — instalacja n8n na drugim VPS-ie + import gotowych workflow (RSS → Claude → WP draft, end-to-end)
„rozpisz N6" — monitoring: Cost Guard, Telegram alerts, dashboard tokenów Claude/Perplexity, miesięczne raporty
„rozpisz wszystkie" — N4, N5, N6 jedno po drugim w kolejnych wiadomościach
Albo: „stop, idę robić N1" — dam Ci spokój żebyś przeszedł realny development z Claude Code i wrócił po feedback.
