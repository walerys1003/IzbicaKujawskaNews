# Sesja N4 — Szablony promptów Claude jako CPT iz24_prompt_template
Czwarta sesja. Po niej masz edytowalny system promptów AI bez deploya — redaktor naczelny może zmieniać instrukcje dla Claude (rewrite, evergreen, fact-check, Na sygnale) z wp-admin, testować nowe wersje na próbnych raw_items, prowadzić A/B testy i mierzyć jakość outputu.
To kluczowy element architektury, bo prompty to “kod” workflow AI — w 90% przypadków zmiana promptu to zmiana zachowania całej redakcji. Nie chcesz, żeby każda taka zmiana wymagała deploya pluginu.

## 1. Co dokładnie powstanie w Sesji N4
Cel sesji: każdy prompt używany przez n8n/Claude (sesja N5) jest CPT w WordPressie. Redaktor naczelny otwiera Newsroom → Prompt Templates, klika edycję, zmienia tekst, zapisuje. Następne wywołanie n8n pobiera nową wersję przez REST API. Wszystko wersjonowane (jak wp_post_revisions), porównywalne, A/B testowalne.
Komponenty:
izbica24-newsroom/
├── includes/
│   ├── prompts/
│   │   ├── class-cpt-prompt-template.php       # CPT iz24_prompt_template
│   │   ├── class-prompt-meta.php               # Meta-fields
│   │   ├── class-prompt-versioning.php         # Revisions + diff
│   │   ├── class-prompt-renderer.php           # Template engine (Mustache-like)
│   │   ├── class-prompt-validator.php          # Walidacja syntax (placeholders, JSON)
│   │   ├── class-prompt-ab-test.php            # A/B testing engine
│   │   ├── class-prompt-metrics.php            # Quality scoring (cost, latency, accept rate)
│   │   └── class-prompt-library.php            # Domyślne 12 promptów (seedy)
│   └── rest/
│       ├── class-prompts-endpoint.php          # GET /v1/prompts/{slug}
│       └── class-prompts-feedback.php          # POST /v1/prompts/{slug}/feedback
├── admin/
│   ├── pages/
│   │   ├── class-page-prompts-list.php         # Lista promptów z metrykami
│   │   ├── class-page-prompt-editor.php        # Edytor z preview + test
│   │   ├── class-page-ab-tests.php             # Aktywne A/B testy
│   │   └── class-page-prompt-analytics.php     # Wykresy jakości promptów
│   ├── editor/
│   │   ├── class-monaco-integration.php        # Monaco Editor (VS Code engine)
│   │   ├── class-placeholder-helper.php        # Auto-complete dla {{variables}}
│   │   └── class-token-counter.php             # Liczenie tokenów (tiktoken-php)
│   └── ajax/
│       ├── class-ajax-prompt-test.php          # "Test on sample raw_item"
│       └── class-ajax-prompt-diff.php          # Diff between versions
└── tests/
├── test-prompt-renderer.php
├── test-prompt-versioning.php
└── test-ab-test-engine.php

Co działa po Sesji N4:
12 pre-loaded promptów: rewrite-news, na-sygnale-conversion, evergreen-author, sport-match-report, fact-check, headline-generator, excerpt-generator, tag-extractor, category-classifier, priority-scorer, seo-meta, social-media-snippet
Strona Newsroom → Prompt Templates z listą wszystkich, kolumny: Name, Slug, Version, Last Modified, Cost/Run, Accept Rate, A/B Status, Active
Edytor promptu z Monaco Editor (silnik VS Code) — syntax highlighting, auto-complete dla {{placeholders}}, walidacja składni
Live token counter (tiktoken) — pokazuje koszt zapytania w USD/PLN
Panel “Variables” — lista placeholderów z opisem (np. {{title}}, {{content_html}}, {{source_name}}, {{category_hint}})
Przycisk “Test on sample raw_item” — wybierasz raw_item z dropdownu, prompt się renderuje, możesz wysłać do Claude API i zobaczyć output side-by-side
Wersjonowanie — każdy zapis tworzy revision, możesz porównać dowolne 2 wersje (diff jak GitHub PR)
A/B testing — wybierasz prompt, klikasz “Start A/B Test”, definiujesz wariant B (np. inna instrukcja), ustawiasz traffic split (50/50 lub 80/20), n8n losuje wariant per request, system mierzy metryki (accept rate, edit distance, cost, latency)
Quality scoring — każdy prompt ma 5 metryk: avg cost, avg latency, accept rate (% draftów zaakceptowanych przez redaktora bez edycji), edit distance (jak bardzo redaktor edytuje wynik), reject rate
REST endpoint GET /wp-json/iz24/v1/prompts/{slug} — n8n pobiera aktualny prompt + wszystkie meta (model, temperature, max_tokens), z eTagiem dla cache
REST endpoint POST /wp-json/iz24/v1/prompts/{slug}/feedback — n8n wysyła feedback po użyciu (cost, latency, output, was_accepted, edit_distance)

## 2. Wymagania wstępne
Biblioteki PHP (composer):
yethee/tiktoken — liczenie tokenów Claude (~99% zgodność)
sebastian/diff — diff między wersjami (już używane przez PHPUnit, więc często już jest)
Frontend:
Monaco Editor (CDN lub bundled) — ~3MB, ale lazy load tylko w edytorze
Chart.js — już z N2/N3
Konfiguracja:
W wp-config.php dodaj define('IZ24_CLAUDE_API_KEY', 'sk-ant-...') — używane do testowania promptów
Limit testowy: 10 testów/dzień per user (żeby nie przepalać API key)

## 3. Prompt startowy dla Claude Code — Sesja N4
Otwórz nowy terminal w izbica24-newsroom/, uruchom claude, wklej:
# PROJEKT: izbica24-newsroom (WordPress Plugin) — Sesja N4

## ROLA
Jesteś senior WordPress developerem ze specjalizacją w:
- - Custom Post Types z zaawansowanym revision system
- - Template engines (Mustache, Twig, Handlebars) implementacja w PHP
- - Integracja zewnętrznych API (Claude/Anthropic) — error handling, retry, rate limit
- - Monaco Editor integracja w wp-admin (lazy load, AMD modules)
- - A/B testing engines, statistical significance, traffic splitting
- - Token counting (tiktoken algorithm) dla LLM cost estimation

## KONTEKST
Kontynuacja Sesji N1, N2, N3. Wtyczka `izbica24-newsroom` ma:
- - CPT `iz24_raw_item`, taksonomie, REST endpoint `/v1/incoming`
- - Panel admin "Newsroom Queue"
- - Editorial workflow z PublishPress (Section Routing, Workflow Rules)

W Sesji N4 budujemy **system promptów AI** — wszystkie instrukcje dla Claude/n8n są CPT w WordPress, edytowalne z wp-admin, wersjonowane, A/B testowalne.

- **Dlaczego CPT, nie pliki PHP:**
1. Redaktor naczelny może zmienić prompt bez deploya (5 sek vs 15 min)
2. Wersjonowanie out-of-the-box (wp_revisions)
3. A/B testing łatwy (2 instancje CPT, traffic split na request)
4. Audytowalne (kto zmienił, kiedy, dlaczego)
5. Multi-tenant ready (różne instancje portalu, różne prompty)

## ARCHITEKTURA

### CPT `iz24_prompt_template`

- **Rejestracja:**
```php
register_post_type('iz24_prompt_template', [
'labels' => [...],
'public' => false,
'show_in_rest' => true,
'show_in_menu' => 'izbica24-newsroom',
'supports' => ['title', 'editor', 'revisions', 'custom-fields', 'author'],
'capability_type' => 'iz24_prompt',
'map_meta_cap' => true,
'rewrite' => false,
]);
```

- **Custom capabilities:**
- - `manage_iz24_prompts` (admin only)
- - `edit_iz24_prompts` (admin + editor-in-chief)
- - `view_iz24_prompts` (admin + editor + section editors — read only)
- - `test_iz24_prompts` (admin + editor-in-chief — może wywołać Claude API)

### Meta-fields prompt template

| Meta key | Type | Sanitize | Opis |
|---|---|---|---|
| `iz24_prompt_slug` | string | sanitize_key | Unique slug, używany przez n8n: `rewrite-news`, `fact-check` |
| `iz24_prompt_category` | string | sanitize_key | Kategoria: `content_generation`, `classification`, `quality`, `metadata` |
| `iz24_prompt_system` | string | wp_kses (basic) | System prompt (rola Claude) |
| `iz24_prompt_user` | string | wp_kses (basic) | User prompt (zadanie z placeholderami) |
| `iz24_prompt_model` | string | sanitize_text_field | `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001` |
| `iz24_prompt_temperature` | float | (0.0-2.0) | Default 0.7 |
| `iz24_prompt_max_tokens` | integer | absint | Default 4096 |
| `iz24_prompt_stop_sequences` | array | (each: sanitize_text_field) | Stop sequences |
| `iz24_prompt_response_format` | string | sanitize_key | `text`, `json`, `markdown` |
| `iz24_prompt_response_schema` | string | (json validator) | Jeśli format=json, JSON Schema |
| `iz24_prompt_placeholders` | array | (custom validator) | Lista zmiennych z opisem i typem |
| `iz24_prompt_examples` | array | (custom) | Few-shot examples |
| `iz24_prompt_active` | boolean | rest_sanitize_boolean | Default true |
| `iz24_prompt_ab_variant_of` | integer | absint | ID promptu jeśli to wariant B |
| `iz24_prompt_ab_traffic_split` | integer | absint | 0-100 % dla wariantu B |
| `iz24_prompt_metrics_cache` | array | (custom) | Cached metryki (refresh co 1h) |
| `iz24_prompt_changelog` | string | wp_kses_post | Notatki redaktora przy edycji |
| `iz24_prompt_tags` | array | (each: sanitize_text_field) | Tagi do wyszukiwania |
| `iz24_prompt_owner` | integer | absint | User ID właściciela (default = post_author) |
| `iz24_prompt_review_required` | boolean | rest_sanitize_boolean | Czy zmiana wymaga drugiego approval |

### Klasa `Prompt_Renderer`

- **Template engine** — Mustache-like syntax z rozszerzeniami.

- **Składnia placeholderów:**
```
{{title}}                          — proste
{{author.name}}                    — zagnieżdżone
{{#if category_hint}}...{{/if}}    — warunkowe
{{#each tags}}- {{.}}{{/each}}     — pętle
{{title|truncate:100}}             — filtry
{{content_html|strip_tags}}
{{published_at|date:"d.m.Y"}}
{{priority_hint|default:5}}
{{source_name|upper}}
```

- **Filtry built-in:**
- - `truncate:N` — obcina do N znaków
- - `strip_tags` — usuwa HTML
- - `date:FORMAT` — format daty
- - `default:VALUE` — fallback
- - `upper`, `lower`, `capitalize`
- - `markdown` — render markdown do HTML
- - `json` — JSON encode
- - `polish_quotes` — zamienia "..." na „..."

- **Metoda główna:**
```php
public function render(int $prompt_id, array $context, array $options = []): array
// Returns: ['system' => '...', 'user' => '...', 'placeholders_used' => [...], 'placeholders_missing' => [...]]
```

- **Walidacja przed render:**
- - Wszystkie required placeholders muszą być w `$context`
- - Brakujące → throw `Missing_Placeholder_Exception` lub fallback do `default`
- - Niezdefiniowane filtry → warning w log, użyj raw value

### Klasa `Prompt_Versioning`

- **Wykorzystuje `wp_revisions` + custom diff.**

- **Metody:**
```php
public function get_revisions(int $prompt_id): array  // [revisions z meta]
public function diff(int $revision_a, int $revision_b): array  // Side-by-side diff
public function restore(int $prompt_id, int $revision_id): bool  // Rollback
public function compare_metrics(int $rev_a, int $rev_b): array  // Cost, accept rate
```

- **UI w edytorze:**
- - Sidebar "Revisions" z timeline (timestamp, autor, changelog note)
- - Kliknięcie → modal "Compare with current"
- - Diff view: czerwone usunięcia, zielone dodania (jak GitHub)
- - Per-line + per-character precision (LibreOffice-style)
- - Przycisk "Restore this version"

### Klasa `Prompt_AB_Test`

- **Engine A/B testów.**

- **Workflow:**
1. Admin klika "Start A/B Test" na promptcie X (wersja A)
2. Modal: "Create variant B" — pre-fill z A, edytuj dowolne pole
3. Wariant B zapisany jako nowy CPT z `iz24_prompt_ab_variant_of = X.ID`
4. Traffic split: 50/50 default, slider 0-100
5. n8n przy każdym wywołaniu `GET /v1/prompts/rewrite-news` losuje (per request) wariant A lub B
6. Endpoint zwraca `{prompt_id, prompt_data, ab_variant: 'A'|'B', ab_test_id}`
7. n8n po użyciu wysyła feedback `POST /v1/prompts/rewrite-news/feedback` z `ab_variant`
8. System agreguje metryki per wariant
9. Po N requests (default 100 per wariant) — system pokazuje "Statistical significance" alert
10. Admin może promować wariant B → nadpisuje A, kasuje wariant

- **Statistical significance:**
- - Używaj **Bayesian A/B test** lub **Frequentist t-test**
- - Library: `phpstats/phpstats` (composer) lub własna implementacja
- - Próg: p-value < 0.05 OR Bayesian probability > 95%

- **Metryki porównywane:**
- - `accept_rate` — % outputów zaakceptowanych bez edycji (główna metryka)
- - `edit_distance` — średnia Levenshtein distance między AI output a final post
- - `cost_per_run` — koszt API per run
- - `latency_ms` — czas odpowiedzi
- - `quality_score` — composite (weighted)

### Klasa `Prompt_Metrics`

- **Zbieranie metryk z każdego użycia promptu.**

- **Schema feedback (wysyłane przez n8n):**
```json
{
"prompt_slug": "rewrite-news",
"prompt_id": 123,
"ab_variant": "A",
"raw_item_id": 456,
"wp_post_id": 789,
"execution": {
"model": "claude-opus-4-7",
"input_tokens": 1234,
"output_tokens": 567,
"cost_usd": 0.0234,
"latency_ms": 3400,
"timestamp": "2026-05-07T14:30:00Z"
},
"output": {
"content": "...",
"finish_reason": "stop"
},
"human_feedback": {
"was_accepted": true,
"edit_distance": 142,
"edit_percentage": 8.5,
"rejected_reason": null,
"editor_id": 12,
"editor_action_at": "2026-05-07T15:00:00Z"
}
}
```

- **Storage:** custom table `wp_iz24_prompt_runs` (CPT byłby zbyt ciężki przy 1000+ runs/dzień).

- **SQL:**
```sql
CREATE TABLE wp_iz24_prompt_runs (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
prompt_id BIGINT UNSIGNED NOT NULL,
prompt_slug VARCHAR(64) NOT NULL,
ab_variant CHAR(1) DEFAULT NULL,
raw_item_id BIGINT UNSIGNED DEFAULT NULL,
wp_post_id BIGINT UNSIGNED DEFAULT NULL,
model VARCHAR(64) NOT NULL,
input_tokens INT UNSIGNED DEFAULT 0,
output_tokens INT UNSIGNED DEFAULT 0,
cost_usd DECIMAL(10,6) DEFAULT 0,
latency_ms INT UNSIGNED DEFAULT 0,
was_accepted TINYINT(1) DEFAULT NULL,
edit_distance INT UNSIGNED DEFAULT NULL,
edit_percentage DECIMAL(5,2) DEFAULT NULL,
rejected_reason VARCHAR(64) DEFAULT NULL,
created_at DATETIME NOT NULL,
INDEX idx_prompt_slug_date (prompt_slug, created_at),
INDEX idx_prompt_id (prompt_id),
INDEX idx_ab (prompt_id, ab_variant)
);
```

- **Agregacja (cache 1h):**
```php
public function get_metrics(int $prompt_id, string $period = '7d'): array
// Returns:
// [
//     'total_runs' => 234,
//     'avg_cost' => 0.0234,
//     'total_cost' => 5.47,
//     'avg_latency' => 3400,
//     'accept_rate' => 0.78,
//     'avg_edit_distance' => 142,
//     'rejection_breakdown' => ['off-topic' => 5, 'low-quality' => 12],
//     'trend' => [...] // daily array
// ]
```

### Klasa `Token_Counter`

- **Wykorzystuje `yethee/tiktoken`** (composer) z BPE tokenizer dla Claude (cl100k_base — Claude używa zbliżonego).

- **Metoda:**
```php
public function count(string $text, string $model = 'claude-opus-4-7'): int
public function estimate_cost(int $input_tokens, int $output_tokens, string $model): array
// Returns: ['input_cost_usd' => 0.012, 'output_cost_usd' => 0.045, 'total_usd' => 0.057]
```

- **Pricing table (built-in, 2026):**
```php
$pricing = [
'claude-opus-4-7'        => ['input' => 15.0, 'output' => 75.0], // per 1M tokens
'claude-sonnet-4-6'      => ['input' => 3.0,  'output' => 15.0],
'claude-haiku-4-5'       => ['input' => 0.8,  'output' => 4.0],
];
```

- **Live counter w edytorze:**
- - Po każdym keystroke (debounce 300ms) — count tokenów
- - Pokazuje: "1,234 input tokens · ~$0.018 per run · $5.40 / 300 runs"

### REST Endpoints

#### `GET /wp-json/iz24/v1/prompts/{slug}`

- **Auth:** Bearer token (osobny `iz24_prompts_read` token, generowany w admin)

- **Query params:**
- - `?ab=true` — uwzględnij A/B test traffic split (losuj wariant)
- - `?context_hash=...` — eTag dla cache (jeśli prompt nie zmienił się od X, zwróć 304)

- **Response:**
```json
{
"prompt_id": 123,
"slug": "rewrite-news",
"version": 5,
"ab_variant": "A",
"ab_test_id": null,
"system": "Jesteś dziennikarzem portalu Izbica24.pl...",
"user": "Przepisz ten artykuł: {{title}}\n\n{{content_html}}",
"model": "claude-sonnet-4-6",
"temperature": 0.7,
"max_tokens": 2048,
"response_format": "markdown",
"placeholders": [
{"name": "title", "type": "string", "required": true},
{"name": "content_html", "type": "string", "required": true},
{"name": "category_hint", "type": "string", "required": false}
],
"etag": "abc123...",
"updated_at": "2026-05-07T14:30:00Z"
}
```

- **Headers:**
- - `ETag: "abc123"` — dla cache
- - `Cache-Control: max-age=300`

#### `POST /wp-json/iz24/v1/prompts/{slug}/feedback`

- **Auth:** Bearer token

- **Body:** schema feedback z sekcji "Klasa Prompt_Metrics" (powyżej)

- **Response:** `{"success": true, "run_id": 12345}`

#### `POST /wp-json/iz24/v1/prompts/{slug}/test` (admin only)

- **Auth:** WP nonce + capability `test_iz24_prompts`

- **Body:**
```json
{
"raw_item_id": 456,
"context_overrides": {"title": "Custom test title"},
"model_override": "claude-haiku-4-5"
}
```

- **Response:**
```json
{
"rendered_system": "...",
"rendered_user": "...",
"claude_response": "...",
"tokens": {"input": 1234, "output": 567},
"cost_usd": 0.018,
"latency_ms": 3400,
"rate_limit_remaining": 8
}
```

### Strona "Prompt Templates" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-prompts`

- **Lista (WP_List_Table):**

| Kolumna | Opis |
|---|---|
| Name | Tytuł + slug |
| Category | Badge (content/classification/quality/metadata) |
| Model | claude-opus-4-7 / sonnet / haiku |
| Version | v5 (last edit 2h ago) |
| Cost/Run | ~$0.018 |
| Accept Rate | 78% (color: <60% red, 60-80% yellow, >80% green) |
| Runs (7d) | 234 |
| A/B | Badge "Testing A/B" / "—" |
| Active | Toggle |
| Actions | Edit · Test · Duplicate · Start A/B · View Stats |

- **Filtry:** Category, Model, A/B status, Active, Owner

- **Bulk actions:** Activate, Deactivate, Export JSON, Import JSON

### Strona "Prompt Editor" (admin)

- **URL:** `/wp-admin/post.php?post=123&action=edit` (custom screen dla `iz24_prompt_template`)

- **Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Prompt: "Rewrite News"                                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐ ┌────────────────────────┐│
│ │ MAIN EDITOR (60%)                │ │ SIDEBAR (40%)         ││
│ │                                   │ │                        ││
│ │ [Tabs: System | User | Examples]  │ │ Settings:             ││
│ │                                   │ │  Slug: rewrite-news    ││
│ │ ┌────────────────────────────┐   │ │  Category: [▼]         ││
│ │ │ Monaco Editor              │   │ │  Model: [▼]            ││
│ │ │                            │   │ │  Temperature: [0.7]    ││
│ │ │ Jesteś dziennikarzem...    │   │ │  Max tokens: [2048]    ││
│ │ │ {{title}}                  │   │ │  Format: [▼markdown]   ││
│ │ │                            │   │ │                        ││
│ │ └────────────────────────────┘   │ │ Placeholders:         ││
│ │                                   │ │  • {{title}} ✓        ││
│ │ Tokens: 234 input · ~$0.012/run   │ │  • {{content_html}} ✓ ││
│ │ Validation: ✓ All placeholders OK │ │  • {{cat_hint}} ?     ││
│ │                                   │ │ [+ Add placeholder]    ││
│ │ [Test on Raw Item ▼] [Run Test]   │ │                        ││
│ │                                   │ │ Revisions:            ││
│ │ ─── Test Output ───               │ │  v5 (now)             ││
│ │ Claude response:                  │ │  v4 (2d ago) [Diff]   ││
│ │ ┌────────────────────────────┐   │ │  v3 (1w ago) [Diff]   ││
│ │ │ Lorem ipsum...             │   │ │                        ││
│ │ └────────────────────────────┘   │ │ A/B Test:             ││
│ │ Cost: $0.018 · Latency: 3.4s     │ │  Not active            ││
│ │                                   │ │  [Start A/B Test]      ││
│ │                                   │ │                        ││
│ │                                   │ │ Metrics (7d):         ││
│ │                                   │ │  Runs: 234             ││
│ │                                   │ │  Accept: 78% ●●●●○     ││
│ │                                   │ │  Avg cost: $0.018      ││
│ │                                   │ │  [Full analytics →]    ││
│ │                                   │ │                        ││
│ └──────────────────────────────────┘ └────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ Changelog note (required if review_required):                    │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Co zmieniło się w tej wersji?                               ││
│ └─────────────────────────────────────────────────────────────┘│
│ [Save Draft] [Save & Activate] [Cancel]                          │
└─────────────────────────────────────────────────────────────────┘
```

- **Monaco Editor config:**
- - Language: `handlebars` (built-in) lub custom `iz24-prompt`
- - Auto-complete dla placeholderów (Ctrl+Space)
- - Hover dla `{{var}}` → tooltip z opisem
- - Linting: red squiggle dla niezdefiniowanych placeholderów

- **Test panel:**
- - Dropdown "Raw item" — ostatnie 50 raw_items
- - Override placeholders — formularz auto-generowany na podstawie definicji
- - Override model (haiku zamiast opus dla cheap test)
- - Przycisk "Run Test" → POST do `/v1/prompts/{slug}/test`
- - Wynik side-by-side z poprzednim testem (jeśli był)
- - Rate limit: 10 testów/dzień per user

- **Validation panel (live):**
- - Wszystkie required placeholdery mają wartości w teście? ✓/✗
- - Sum placeholders + system + user nie przekracza max_tokens? ✓/✗
- - Składnia Mustache poprawna? ✓/✗
- - JSON Schema (jeśli format=json) waliduje się? ✓/✗

### Strona "A/B Tests" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-ab-tests`

- **Lista aktywnych testów:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Active A/B Tests                                                  │
├─────────────────────────────────────────────────────────────────┤
│ rewrite-news: v5 vs v6 (variant B)                               │
│   Started: 3 days ago · Runs: A=156, B=148                       │
│   Accept rate: A=78% B=84% (+6pp)                                │
│   Cost: A=$0.018 B=$0.021 (+17%)                                  │
│   Quality score: A=72 B=79 (+9.7%)                               │
│   Statistical significance: ✓ p=0.032 (95% confidence)            │
│   Recommendation: Promote variant B                               │
│   [Promote B] [Stop Test] [View Details]                         │
├─────────────────────────────────────────────────────────────────┤
│ headline-generator: v2 vs v3                                      │
│   Started: 1 day ago · Runs: A=42, B=39                          │
│   Accept rate: A=65% B=68% (+3pp)                                │
│   Statistical significance: ✗ p=0.421 (need more data)           │
│   [Stop Test] [View Details]                                      │
└─────────────────────────────────────────────────────────────────┘
[+ Start New A/B Test]
```

### Strona "Prompt Analytics" (admin)

- **URL:** `/wp-admin/admin.php?page=iz24-prompt-analytics`

- **Wykresy (Chart.js):**
1. **Cost over time** — line chart, daily, per prompt + total
2. **Accept rate trend** — line chart per prompt
3. **Top performing prompts** — bar chart sorted by accept rate
4. **Token usage breakdown** — doughnut: input vs output, per model
5. **Rejection reasons** — stacked bar per prompt

- **Filter:** prompt, period, model, owner

- **Export:** CSV miesięczny raport (zintegrowany z N6 monitoring)

### Pre-loaded prompts (12 sztuk seed)

W `Prompt_Library::seed()` przy aktywacji wtyczki:

| Slug | Category | Model | Cel |
|---|---|---|---|
| `rewrite-news` | content_generation | sonnet-4-6 | Przepisanie news z RSS na własny styl Izbica24 |
| `na-sygnale-conversion` | content_generation | sonnet-4-6 | Konwersja raportu OSP/Policji na format "Na sygnale" |
| `evergreen-author` | content_generation | opus-4-7 | Generowanie evergreen artykułów (history, lifestyle) |
| `sport-match-report` | content_generation | sonnet-4-6 | Auto-raport meczowy Kujawianki z wyniku + składu |
| `fact-check` | quality | opus-4-7 | Weryfikacja faktów w drafcie |
| `headline-generator` | content_generation | haiku-4-5 | Generowanie 5 wariantów tytułów |
| `excerpt-generator` | metadata | haiku-4-5 | Generowanie 160-char excerpt |
| `tag-extractor` | metadata | haiku-4-5 | Ekstrakcja tagów z treści |
| `category-classifier` | classification | haiku-4-5 | Klasyfikacja do 12 kategorii Izbica24 |
| `priority-scorer` | classification | haiku-4-5 | Score 1-10 priorytetu |
| `seo-meta` | metadata | haiku-4-5 | SEO title + meta description |
| `social-media-snippet` | content_generation | haiku-4-5 | Snippet na FB/Twitter/Instagram |

Każdy prompt z **kompletnym tekstem** (system + user) gotowym do użycia. Pełne treści muszą być po polsku, dostosowane do kontekstu Izbica Kujawska.

## ZADANIE

Wygeneruj **kompletny prompt management system Sesja N4**.

Pracuj iteracyjnie:

1. **Composer:** dodaj `yethee/tiktoken`, `sebastian/diff` do composer.json
2. **CPT + meta:** rejestracja `iz24_prompt_template` z 18 meta-fields
3. **Capabilities:** 4 custom caps, mapowanie na role
4. **Prompt_Renderer:** template engine z 9 filtrami built-in
5. **Token_Counter:** integracja tiktoken, pricing table 2026
6. **Prompt_Versioning:** rozszerzenie wp_revisions z diff
7. **Prompt_AB_Test:** engine z Bayesian significance
8. **Prompt_Metrics:** custom table `wp_iz24_prompt_runs`, agregacja
9. **REST endpoints:** GET `/v1/prompts/{slug}`, POST `/feedback`, POST `/test`
10. **Page Prompts List:** WP_List_Table z metrykami, bulk actions
11. **Page Prompt Editor:** Monaco Editor integration (lazy load), test panel, validation
12. **Page A/B Tests:** lista, statistics, promote/stop
13. **Page Prompt Analytics:** 5 wykresów Chart.js, filtry, export
14. **Prompt_Library seed:** 12 pre-loaded promptów po polsku z pełną treścią
15. **WP-CLI:** `wp iz24 prompt list`, `wp iz24 prompt test <slug> --raw-item=ID`, `wp iz24 prompt export <slug>`, `wp iz24 prompt import <file>`
16. **Tests:** PHPUnit dla Renderer (15 cases — wszystkie filtry), Versioning (5), AB_Test (8), Metrics (6), REST (10)

Po każdym pliku > 200 linii — krótkie podsumowanie i czekaj na "kontynuuj".

## STANDARDY KODU
- - WPCS (WordPress-Extra)
- - Wszystkie REST endpointy z capability check + nonce
- - Sanitize na input, escape na output
- - Wszystkie strings translatable (text-domain `izbica24-newsroom`)
- - Monaco Editor lazy-load (tylko na edytorze prompt) — `wp_enqueue_script` warunkowy
- - Cache: metryki w transient (1h TTL)
- - Rate limit testów Claude API: 10/dzień per user (transient)
- - Logging: każdy run promptu → custom table + processing_log na raw_item
- - Composer autoload PSR-4

## ACCEPTANCE CRITERIA

- - [ ] CPT `iz24_prompt_template` widoczny w menu Newsroom
- - [ ] 12 promptów seed-ed po aktywacji, wszystkie z polskim tekstem
- - [ ] Edytor otwiera Monaco z syntax highlighting
- - [ ] Auto-complete `{{` pokazuje listę placeholderów
- - [ ] Token counter aktualizuje się po keystroke (debounce 300ms)
- - [ ] "Test on Raw Item" wywołuje Claude API i pokazuje response
- - [ ] Rate limit 10/dzień działa (11-ty test → error)
- - [ ] Save tworzy revision, sidebar pokazuje historię
- - [ ] Diff między wersjami renderuje się side-by-side
- - [ ] "Start A/B Test" tworzy variant B i ustawia traffic split
- - [ ] `GET /v1/prompts/rewrite-news` zwraca losowy wariant (test 100 calls — distribution ~50/50)
- - [ ] Statistical significance liczy się correctly (porównaj z Python scipy)
- - [ ] `POST /feedback` zapisuje do `wp_iz24_prompt_runs`
- - [ ] Strona Analytics renderuje 5 wykresów
- - [ ] WP-CLI `wp iz24 prompt list` zwraca tabelkę 12 promptów
- - [ ] PHPUnit 44/44 testów pass
- - [ ] phpcs 0 errors

## PYTANIA DO MNIE PRZED STARTEM

Zadaj maksymalnie 4 pytania. Sugerowane:
1. Czy preferujesz Monaco Editor (3MB, rich) czy CodeMirror 6 (~200KB, lżejszy) dla edytora?
2. Czy "Test on Raw Item" ma używać prawdziwego Claude API (koszty!) czy mock w trybie dev?
3. Czy A/B test traffic split ma być per-request (random) czy per-raw-item (deterministic z hash) — drugie pozwala reprodukować wyniki?
4. Czy 12 pre-loaded promptów ma być w jednym pliku PHP czy w osobnych plikach JSON w `assets/prompts/`?

Jeśli wszystko jasne — napisz "Zaczynam" i przejdź do kroku 1.


## 4. Test scenariusze po Sesji N4
A. Test seed (5 min):
Aktywuj wersję N4
Otwórz Newsroom → Prompt Templates
Sprawdź że jest 12 promptów z polskimi tytułami
Otwórz rewrite-news — system + user prompt po polsku, placeholders zdefiniowane
B. Test edytora (15 min):
Otwórz rewrite-news w edytorze
Monaco się ładuje, syntax highlighting działa
Wpisz {{ — pokazuje się autocomplete z placeholderami
Hover nad {{title}} — tooltip “string, required”
Token counter pokazuje liczby + cost
Zmień model → cost się aktualizuje
Wpisz {{nieistniejaca_zmienna}} → red squiggle + warning
C. Test “Test on Raw Item” (10 min):
Wybierz raw_item z dropdownu
Klik “Run Test”
Spinner, po 3s output Claude
Cost + latency widoczne
Powtórz 11 razy → 11-ty zwraca rate limit error
D. Test versioning (10 min):
Edytuj rewrite-news, zmień jeden zdanie
Save → revision v6 widoczny w sidebar
Click “Diff with v5” → modal side-by-side
Czerwone delete, zielone insert
Click “Restore v5” → confirm → wraca do v5
E. Test A/B (15 min):
Klik “Start A/B Test” na rewrite-news
Modal: edytuj system prompt (drobna zmiana)
Save jako variant B, split 50/50
Curl-em wywołaj GET /v1/prompts/rewrite-news 100x
Sprawdź distribution: ~50A, ~50B (±10%)
Mock-uj 100 feedbacków (50 per wariant) z różnym was_accepted
Otwórz A/B Tests page → zobacz statistical significance
Promote B → A jest archiwizowany
F. Test REST (5 min):
# Get prompt
curl -H "Authorization: Bearer $PROMPTS_TOKEN" \
https://izbica24.test/wp-json/iz24/v1/prompts/rewrite-news

# Test caching (eTag)
curl -i -H "If-None-Match: \"abc123\"" \
https://izbica24.test/wp-json/iz24/v1/prompts/rewrite-news
# Expected: 304 Not Modified

# Send feedback
curl -X POST -H "Authorization: Bearer $TOKEN" \
- -H "Content-Type: application/json" \
- -d '{"prompt_id":1,"raw_item_id":456,"execution":{...},"human_feedback":{"was_accepted":true,"edit_distance":50}}' \
https://izbica24.test/wp-json/iz24/v1/prompts/rewrite-news/feedback

G. Test Analytics (5 min):
Po 50+ runs (mock data)
Otwórz Prompt Analytics
5 wykresów się renderuje
Filter “Last 7 days” → wykresy się aktualizują
Export CSV → plik z 7 kolumnami
H. Test WP-CLI (5 min):
wp iz24 prompt list
wp iz24 prompt test rewrite-news --raw-item=456
wp iz24 prompt export rewrite-news > rewrite-news.json
wp iz24 prompt import < rewrite-news.json


## 5. Po Sesji N4 — co zrobić zanim ruszysz N5
Skonfiguruj Claude API key w wp-config.php
Wygeneruj read-only token dla n8n (wp iz24 prompt-token create --read-only)
Przejrzyj wszystkie 12 seed promptów — popraw teksty pod swój styl/dialekt kujawski
Wygeneruj testowe runs — manualnie wywołaj kilka promptów, żeby zobaczyć jakość
Skonfiguruj minimum 2 A/B testy dla najczęściej używanych promptów (rewrite-news, headline-generator)
Zapisz token API w n8n — będzie potrzebny w Sesji N5

Następna w kolejce: Sesja N5 — instalacja n8n + import workflowów end-to-end. Idę dalej.
