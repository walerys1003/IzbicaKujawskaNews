# Sesja N6 — Monitoring: Cost Guard, Telegram alerts, dashboards, raporty miesięczne
Szósta i ostatnia sesja backendowa. Po niej masz pełną kontrolę finansową i operacyjną nad całym systemem: wiesz co kosztuje ile, kto generuje najwięcej, co się psuje, kiedy zbliżasz się do limitu — i wszystko to bez konieczności logowania się do n8n czy Anthropic Console.
To także najważniejsza sesja defensywna — zła kalibracja Cost Guard albo brak alertu może oznaczać $500 rachunku za miesiąc zamiast $30. Dlatego N6 nie jest “miło mieć”, tylko “must-have przed włączeniem produkcji”.

## 1. Co dokładnie powstanie w Sesji N6
Cel sesji: zbudować w WordPressie centralny Newsroom Operations Center — dashboard z metrykami cost, latency, accept rate, errors, runs per source, plus rozszerzony Cost Guard (multi-tier, predictive), Telegram bot z komendami interaktywnymi, miesięczne raporty PDF, eksport CSV, opcjonalnie Grafana dla power users.
Komponenty:
izbica24-newsroom/
├── includes/
│   ├── monitoring/
│   │   ├── class-cost-guard.php                # Multi-tier limits, predictive
│   │   ├── class-cost-aggregator.php           # Agregacja z prompt_runs + n8n_runs
│   │   ├── class-budget-forecaster.php         # ML-light: prognoza miesiąca
│   │   ├── class-anomaly-detector.php          # Detection nagłych skoków
│   │   ├── class-token-history.php             # Historia tokenów per provider
│   │   └── class-error-tracker.php             # Errors + fingerprinting
│   ├── alerts/
│   │   ├── class-telegram-bot.php              # Bot z komendami /status /budget
│   │   ├── class-alert-router.php              # Routing alertów (severity, channel)
│   │   ├── class-alert-throttler.php           # Anti-spam (max 3/h same alert)
│   │   ├── class-email-alerts.php              # Fallback dla Telegram down
│   │   └── class-slack-alerts.php              # Opcjonalnie, dla redaktorów
│   ├── reports/
│   │   ├── class-monthly-report.php            # PDF generator (mpdf)
│   │   ├── class-csv-exporter.php              # CSV per period
│   │   ├── class-report-scheduler.php          # WP Cron: 1-go każdego miesiąca
│   │   └── class-pdf-templates.php             # Templates HTML→PDF
│   └── grafana/
│       ├── class-prometheus-endpoint.php       # /metrics dla Prometheus scrape
│       └── class-grafana-datasource.php        # JSON API dla Grafana
├── admin/
│   ├── pages/
│   │   ├── class-page-ops-center.php           # Główny dashboard
│   │   ├── class-page-cost-explorer.php        # Drill-down kosztów
│   │   ├── class-page-error-log.php            # Lista błędów z grouping
│   │   ├── class-page-alerts-config.php        # Konfiguracja alertów
│   │   ├── class-page-reports.php              # Lista miesięcznych raportów
│   │   └── class-page-token-history.php        # Historia tokenów Claude/Perplexity
│   └── widgets/
│       ├── class-widget-cost-today.php         # Dashboard widget: dzisiejszy cost
│       └── class-widget-system-health.php      # Dashboard widget: health status
├── cli/
│   └── class-cli-monitoring.php                # WP-CLI komendy
├── templates/
│   └── pdf/
│       ├── monthly-report.html                 # Template raportu miesięcznego
│       └── monthly-report.css                  # Style (print-optimized)
└── tests/
├── test-cost-guard.php
├── test-budget-forecaster.php
├── test-anomaly-detector.php
├── test-telegram-bot.php
└── test-monthly-report.php

Co działa po Sesji N6:
Strona Ops Center (główna landing dla redaktora naczelnego): 12 kafelków z live metrykami + 6 wykresów real-time
Cost Guard rozszerzony: 5 poziomów limitów (per-run, hourly, daily, weekly, monthly), 4 stage warning (50%, 80%, 95%, 100%), predictive (“przy obecnym tempie wyjdziesz z budżetu za 4 dni”)
Telegram bot z komendami: /status, /budget, /errors, /pause, /resume, /top — pełna kontrola z telefonu
Alert router: critical → Telegram + email, warning → Telegram batch, info → tylko log
Anomaly detection: jeśli koszty dziś są >2x średniej z ostatnich 7 dni → alert
Miesięczny raport PDF wysyłany 1-go każdego miesiąca: 12-stronicowy dokument z wykresami, top promptami, top sources, top errors, kosztami per kategoria, prognozą na kolejny miesiąc
CSV export dowolnego okresu z 8 widoków
Token history: szczegółowa historia każdego wywołania Claude/Perplexity z możliwością drill-down
Prometheus endpoint /wp-json/iz24/v1/metrics (basic auth) dla integracji z Grafana
Pre-built Grafana dashboard (.json do importu) z 16 panelami
WP-CLI: wp iz24 monitoring status, wp iz24 monitoring forecast, wp iz24 monitoring report --month=2026-04

## 2. Architektura przepływu danych
┌────────────────────────────────────────────────────────────────┐
│                     SOURCES OF METRICS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WP Plugin                    n8n (drugi VPS)                   │
│  ├─ wp_iz24_prompt_runs       ├─ Postgres iz24_n8n_runs        │
│  ├─ wp_iz24_processing_log    ├─ Postgres iz24_n8n_errors      │
│  └─ wp_iz24_dedup_cache       └─ n8n executions table           │
│         │                              │                         │
│         │                              │                         │
│         └──────────────┬───────────────┘                        │
│                        ▼                                         │
│            ┌──────────────────────┐                              │
│            │  Cost Aggregator     │ (5min cron)                  │
│            │  • Prompt costs (WP) │                              │
│            │  • Workflow costs    │                              │
│            │  • Errors            │                              │
│            └──────────┬───────────┘                              │
│                       │                                          │
│                       ▼                                          │
│            ┌──────────────────────┐                              │
│            │  Aggregated Storage  │                              │
│            │  wp_iz24_metrics_5m  │ (5-min buckets)              │
│            │  wp_iz24_metrics_1h  │ (hourly rollup)              │
│            │  wp_iz24_metrics_1d  │ (daily rollup)               │
│            └──────────┬───────────┘                              │
│                       │                                          │
│        ┌──────────────┼──────────────────┬───────────────┐      │
│        ▼              ▼                  ▼               ▼       │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │Cost Guard│  │Anomaly      │  │Forecaster    │  │Reports   │ │
│  │(realtime)│  │Detector     │  │(daily)       │  │(monthly) │ │
│  └────┬─────┘  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
│       │               │                 │                │       │
│       └───────────────┴────────┬────────┴────────────────┘      │
│                                ▼                                 │
│                     ┌──────────────────┐                         │
│                     │   Alert Router   │                         │
│                     └────────┬─────────┘                         │
│                              │                                   │
│       ┌──────────────┬───────┴────────┬─────────────┐           │
│       ▼              ▼                ▼             ▼            │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐    │
│  │Telegram │  │  Email   │  │   Slack      │  │  Admin   │    │
│  │  Bot    │  │  (SMTP)  │  │  (webhook)   │  │  Notice  │    │
│  └─────────┘  └──────────┘  └──────────────┘  └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Dlaczego rollupy 5min/1h/1d:
5min bucket: dla real-time dashboardu (last 24h pokazane z 5min granularity = 288 punktów)
1h rollup: dla wykresów ostatnie 7 dni (168 punktów)
1d rollup: dla raportów miesięcznych i prognoz (30+ punktów)
Bez rollupów query po wp_iz24_prompt_runs przy 10k runs/miesiąc trwałyby 5+ sekund. Z rollupami — 50ms.

## 3. Wymagania wstępne
Composer libraries:
mpdf/mpdf — generator PDF dla raportów (~5MB)
phpoffice/phpspreadsheet — Excel export (opcjonalne, alternatywa CSV)
irazasyed/telegram-bot-sdk — Telegram bot framework
External services:
Telegram bot z BotFather (już z N5, ale w N6 dodajemy webhook)
Webhook URL dla Telegram: https://izbica24.pl/wp-json/iz24/v1/telegram-webhook (HTTPS wymagany!)
(Opcjonalne) Grafana Cloud account (free tier: 10k metrics) lub własny Grafana na n8n VPS
WordPress Cron:
Wymagany działający WP Cron (lub real cron: * * * * * curl -s https://izbica24.pl/wp-cron.php)
Akcje:
iz24_aggregate_metrics_5m — co 5 min
iz24_aggregate_metrics_1h — co 1h
iz24_aggregate_metrics_1d — codziennie 00:05
iz24_anomaly_check — co 30 min
iz24_monthly_report — 1-go każdego miesiąca 06:00
iz24_cleanup_old_metrics — codziennie 04:00 (5min keep 7 dni, 1h keep 90 dni, 1d keep 24 mc)

## 4. Prompt startowy dla Claude Code — Sesja N6
Otwórz terminal w izbica24-newsroom/, uruchom claude, wklej:
# PROJEKT: izbica24-newsroom (WordPress Plugin) — Sesja N6

## ROLA
Jesteś senior platform engineer ze specjalizacją w:
- - Observability (logs, metrics, traces) i monitoring stack design
- - Cost management dla LLM workloads (token tracking, budget forecasting)
- - Telegram Bot API (webhooks, inline keyboards, conversational UI)
- - PDF generation (mpdf, HTML→PDF, print CSS)
- - Time-series data design (rollups, retention policies, downsampling)
- - Anomaly detection (statistical: z-score, MAD, EWMA)
- - Prometheus exposition format, Grafana dashboard JSON

## KONTEKST
Kontynuacja Sesji N1-N5. System Izbica24.pl ma:
- - WP Plugin `izbica24-newsroom` z CPT raw_items, prompts, queue, editorial workflow
- - Drugi VPS z n8n (17 workflowów, Postgres, Redis)
- - Claude API integration przez prompts CPT (z A/B testing)
- - Wszystkie metryki dropowane do `wp_iz24_prompt_runs` (WP) i `iz24_n8n_runs` (n8n Postgres)

W Sesji N6 budujemy **monitoring layer**: agregację metryk, multi-tier cost guard, Telegram bot z komendami, miesięczne raporty PDF, opcjonalnie Grafana endpoint.

## ARCHITEKTURA

### Custom tables (3 nowe)

```sql
- -- 5-minute buckets (high resolution, last 7 days)
CREATE TABLE wp_iz24_metrics_5m (
bucket_start DATETIME NOT NULL,
metric_key VARCHAR(64) NOT NULL,
dimensions JSON,                    -- {prompt_slug, source_id, model, etc.}
count_runs INT UNSIGNED DEFAULT 0,
sum_cost_usd DECIMAL(12,6) DEFAULT 0,
sum_input_tokens BIGINT UNSIGNED DEFAULT 0,
sum_output_tokens BIGINT UNSIGNED DEFAULT 0,
avg_latency_ms INT UNSIGNED DEFAULT 0,
count_errors INT UNSIGNED DEFAULT 0,
count_accepted INT UNSIGNED DEFAULT 0,
count_rejected INT UNSIGNED DEFAULT 0,
PRIMARY KEY (bucket_start, metric_key),
INDEX idx_metric_time (metric_key, bucket_start)
);

- -- Hourly rollups (last 90 days)
CREATE TABLE wp_iz24_metrics_1h (
bucket_start DATETIME NOT NULL,
metric_key VARCHAR(64) NOT NULL,
dimensions JSON,
count_runs INT UNSIGNED DEFAULT 0,
sum_cost_usd DECIMAL(12,6) DEFAULT 0,
sum_input_tokens BIGINT UNSIGNED DEFAULT 0,
sum_output_tokens BIGINT UNSIGNED DEFAULT 0,
avg_latency_ms INT UNSIGNED DEFAULT 0,
p50_latency_ms INT UNSIGNED DEFAULT 0,
p95_latency_ms INT UNSIGNED DEFAULT 0,
p99_latency_ms INT UNSIGNED DEFAULT 0,
count_errors INT UNSIGNED DEFAULT 0,
count_accepted INT UNSIGNED DEFAULT 0,
count_rejected INT UNSIGNED DEFAULT 0,
PRIMARY KEY (bucket_start, metric_key),
INDEX idx_metric_time (metric_key, bucket_start)
);

- -- Daily rollups (kept 24 months)
CREATE TABLE wp_iz24_metrics_1d (
bucket_date DATE NOT NULL,
metric_key VARCHAR(64) NOT NULL,
dimensions JSON,
count_runs INT UNSIGNED DEFAULT 0,
sum_cost_usd DECIMAL(12,6) DEFAULT 0,
sum_input_tokens BIGINT UNSIGNED DEFAULT 0,
sum_output_tokens BIGINT UNSIGNED DEFAULT 0,
p50_latency_ms INT UNSIGNED DEFAULT 0,
p95_latency_ms INT UNSIGNED DEFAULT 0,
p99_latency_ms INT UNSIGNED DEFAULT 0,
count_errors INT UNSIGNED DEFAULT 0,
count_accepted INT UNSIGNED DEFAULT 0,
count_rejected INT UNSIGNED DEFAULT 0,
PRIMARY KEY (bucket_date, metric_key),
INDEX idx_metric_date (metric_key, bucket_date)
);

- -- Errors with fingerprinting
CREATE TABLE wp_iz24_errors (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
fingerprint VARCHAR(64) NOT NULL,    -- SHA-256 z error_type+stack_top
error_type VARCHAR(64) NOT NULL,     -- claude_429, perplexity_500, wp_timeout, etc.
severity ENUM('info','warning','error','critical') DEFAULT 'error',
source VARCHAR(64) NOT NULL,         -- workflow_name, endpoint, cli_command
message TEXT NOT NULL,
context JSON,                         -- workflow_id, raw_item_id, prompt_id
occurred_at DATETIME NOT NULL,
resolved_at DATETIME DEFAULT NULL,
resolved_by BIGINT UNSIGNED DEFAULT NULL,
INDEX idx_fingerprint (fingerprint),
INDEX idx_severity_time (severity, occurred_at),
INDEX idx_unresolved (resolved_at, occurred_at)
);

- -- Alert history (anti-spam)
CREATE TABLE wp_iz24_alerts_sent (
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
alert_key VARCHAR(128) NOT NULL,    -- "cost_guard:daily_80pct"
channel ENUM('telegram','email','slack','admin_notice') NOT NULL,
severity VARCHAR(16) NOT NULL,
sent_at DATETIME NOT NULL,
payload JSON,
INDEX idx_key_time (alert_key, sent_at)
);

- -- Telegram bot user sessions
CREATE TABLE wp_iz24_telegram_sessions (
chat_id BIGINT NOT NULL PRIMARY KEY,
wp_user_id BIGINT UNSIGNED DEFAULT NULL,
is_authorized TINYINT(1) DEFAULT 0,
auth_token VARCHAR(64) DEFAULT NULL,
last_command VARCHAR(64) DEFAULT NULL,
state JSON,
last_seen DATETIME NOT NULL,
created_at DATETIME NOT NULL
);
```

### Klasa `Cost_Guard`

- **Multi-tier limits (option `iz24_cost_limits`):**
```php
[
'per_run_max_usd'    => 0.50,
'hourly_max_usd'     => 1.00,
'daily_max_usd'      => 5.00,
'weekly_max_usd'     => 25.00,
'monthly_max_usd'    => 100.00,
'warning_thresholds' => [0.50, 0.80, 0.95],  // 50%, 80%, 95%
'hard_stop_at'       => 1.00,                 // 100% = stop API calls
]
```

- **Metoda główna:**
```php
public function check_budget(?float $estimated_run_cost = null): array
// Returns:
// [
//     'allowed' => true|false,
//     'reason' => null|'daily_limit'|'monthly_limit'|...,
//     'current_spend' => [
//         'today_usd' => 1.23,
//         'this_week_usd' => 8.45,
//         'this_month_usd' => 34.67,
//     ],
//     'limits' => [...],
//     'percentage_used' => [
//         'daily' => 24.6,
//         'weekly' => 33.8,
//         'monthly' => 34.67,
//     ],
//     'forecast' => [
//         'monthly_at_current_rate' => 78.45,  // ML-light forecast
//         'days_until_limit' => 12,
//     ],
//     'next_reset' => '2026-05-08T00:00:00Z',
// ]
```

- **Hard stop logic:**
- - Jeśli `monthly_spent >= monthly_max_usd * hard_stop_at` → ustaw option `iz24_api_paused = true`
- - n8n co request sprawdza ten flag (przez `GET /v1/system/status` endpoint)
- - Wszystkie workflowy zatrzymują się (graceful, nie kill)
- - Admin notice w WP: "API paused — budget exceeded. [Resume manually]"
- - Tylko admin może `resume` (button + Telegram `/resume`)

- **Per-run check:**
- - Przed każdym wywołaniem Claude → Token_Counter::estimate_cost(input_tokens, max_output_tokens, model)
- - Jeśli > `per_run_max_usd` → blokada + log warning + Telegram notification
- - Pomyłka: zbyt długi prompt z embedded image, error w prompt → ochrona przed fat finger

### Klasa `Cost_Aggregator`

- **Hook: WP Cron `iz24_aggregate_metrics_5m` co 5 min.**

- **Logika:**
1. Query `wp_iz24_prompt_runs` WHERE created_at > last_aggregation
2. Query Postgres remote `iz24_n8n_runs` (przez prepared statement, read-only user)
3. Group by 5-minute buckets + dimensions:
- - `prompt_runs:by_prompt_slug`
- - `prompt_runs:by_model`
- - `n8n_runs:by_workflow`
- - `errors:by_type`
- - `accepts:total`
4. Insert/update do `wp_iz24_metrics_5m`
5. Update `iz24_last_aggregation_5m` timestamp

- **Hook `iz24_aggregate_metrics_1h` co godzinę:**
- - Group SUM/AVG z 5-min buckets z ostatniej godziny → 1-hour buckets

- **Hook `iz24_aggregate_metrics_1d` codziennie 00:05:**
- - Group z 1-hour buckets → daily

- **Cleanup hook `iz24_cleanup_old_metrics`:**
- - 5-min: keep 7 dni
- - 1-hour: keep 90 dni
- - 1-day: keep 24 miesiące

- **Optymalizacja:** używaj `INSERT ... ON DUPLICATE KEY UPDATE` zamiast SELECT+UPDATE.

### Klasa `Budget_Forecaster`

- **Lightweight ML — nie potrzebujemy NumPy.**

- **Algorytm:**
1. Pobierz ostatnie 14 dni daily costs z `wp_iz24_metrics_1d`
2. Oblicz:
- - `avg_daily_cost` (last 7d)
- - `trend` (linear regression slope: cost vs days_offset)
- - `weekday_factor` (ratio: śr. weekday vs avg) — bo media intensity różna w weekendy
3. Forecast każdego pozostałego dnia w miesiącu:
```
day_forecast = avg_daily_cost + (trend * day_offset) * weekday_factor[dow]
```
4. Sum forecasts → predicted month-end total
5. `days_until_limit`: iteruj forecasts, gdy cumulative + already_spent ≥ limit → return day count

- **Confidence interval:**
- - Wariancja last 14d → SD
- - 95% CI: `forecast ± 1.96 * SD * sqrt(days_remaining)`

- **Output:**
```json
{
"forecast_eom_usd": 78.45,
"confidence_interval_95": [62.10, 94.80],
"days_until_limit": 12,
"trend": "increasing",  // "stable", "decreasing"
"trend_slope_per_day": 0.34,
"based_on_days": 14
}
```

### Klasa `Anomaly_Detector`

- **Hook: co 30 min.**

- **3 detektory:**

1. **Cost spike** (z-score):
- - Compare current 5-min bucket cost vs średnia z ostatnich 24h same time-of-day
- - z-score > 3 → anomaly
- - Severity: warning (z=3-5), error (z>5)

2. **Error rate spike** (EWMA):
- - Exponentially Weighted Moving Average of errors per hour
- - Jeśli current > EWMA + 3*sigma → anomaly
- - Też tracking per error_type (claude_429 osobno, perplexity_timeout osobno)

3. **Accept rate drop**:
- - Calculate accept_rate ostatnie 50 runs vs średnia 7 dni
- - Jeśli drop > 20pp → anomaly (prompt się zepsuł, A/B variant gorszy?)
- - Severity: warning

- **Output → Alert Router.**

### Klasa `Telegram_Bot`

- **Webhook setup:**
- - URL: `https://izbica24.pl/wp-json/iz24/v1/telegram-webhook`
- - Set via Telegram API: `POST /setWebhook?url=...&secret_token=...`
- - Verify `X-Telegram-Bot-Api-Secret-Token` header w handlerze

- **Komendy (z auto-completion w Telegram):**

| Komenda | Opis | Auth |
|---|---|---|
| `/start` | Welcome + auth flow | All |
| `/auth <token>` | Autoryzacja chat-u | Token from WP |
| `/status` | Live status systemu | Authorized |
| `/budget` | Cost summary today/week/month | Authorized |
| `/forecast` | Budget forecast EOM | Authorized |
| `/errors [count]` | Top N latest errors (default 5) | Authorized |
| `/top [period]` | Top promptów po koszcie (today/week) | Authorized |
| `/runs [period]` | Liczba runs per source | Authorized |
| `/queue` | Liczba raw_items per status | Authorized |
| `/pause` | Wstrzymaj wszystkie API calls | Admin only |
| `/resume` | Wznów po pause | Admin only |
| `/limit <type> <usd>` | Update limit (np. `/limit daily 10`) | Admin only |
| `/silent <minutes>` | Wycisz alerty na X min (default 60) | Admin only |
| `/help` | Lista komend | All |

- **Przykład odpowiedzi `/budget`:**
```
💰 Budżet — 7 maja 2026, 14:30

Dziś:    $1.23 / $5.00   ▓▓░░░░░░░░ 24.6%
Tydzień: $8.45 / $25.00  ▓▓▓░░░░░░░ 33.8%
Miesiąc: $34.67 / $100.00 ▓▓▓░░░░░░░ 34.7%

📈 Prognoza końca miesiąca: $78 ($62-$95)
📅 Do limitu: 12 dni (przy obecnym tempie)
🎯 Trend: ⬆ +$0.34/dzień

[Szczegóły]  [Top 5 promptów]  [⚙️ Limity]
```

- **Inline keyboards:** Telegram supports inline buttons → kliknięcie wywołuje callback z dalszymi komendami.

- **Przykład odpowiedzi `/status`:**
```
🟢 Izbica24 Newsroom — All Systems Operational

📥 Ingestion (last 24h):
- • RSS:        47 items (12 sources)
- • Perplexity: 8 items
- • OSP FB:     3 items
- • Email:      2 items

📤 Pushed do WP: 38 (80% accept rate)
❌ Errors 24h: 2 (1 critical resolved)

💸 Cost 24h: $1.23 ($0.87 prompts, $0.36 ingest)
⚡ Avg latency: 3.2s

🔗 Open Ops Center
```

### Klasa `Alert_Router`

- **Routing matrix:**
```php
[
'critical' => ['telegram_immediate', 'email', 'admin_notice'],
'error'    => ['telegram_immediate', 'admin_notice'],
'warning'  => ['telegram_batch_1h', 'log'],
'info'     => ['log'],
]
```

- **Telegram batch:** zbieraj warnings przez 1h, wyślij digest:
```
⚠️ Izbica24 — 5 warnings (last hour)

- • 14:23 — claude_429 retry (workflow: 01-rss-ddwloclawek)
- • 14:31 — perplexity_timeout (recovered)
- • 14:45 — accept_rate drop on rewrite-news (78%→65%)
- • 15:02 — cost daily 80% reached
- • 15:18 — 1 raw_item factcheck failed

[Resolve all] [Details]
```

- **Throttler:**
- - Same alert_key max 3x w 1h (potem mute)
- - Reset throttle po manualnym `resolve` w Telegram

### Klasa `Email_Alerts`

- **Fallback gdy Telegram nieosiągalny.**

- - SMTP via WP Mail SMTP (Gmail, SendGrid, Mailgun)
- - Format HTML email z tabelką + screenshot dashboard (opcjonalne, screenshot via Browserless API)
- - Zawsze leci do `editor-in-chief@izbica24.pl` + opcjonalnie cc

### Klasa `Monthly_Report`

- **Hook: WP Cron `iz24_monthly_report` 1-go każdego miesiąca 06:00.**

- **Co generuje (12-stronicowy PDF):**

- **Strona 1 — Cover:**
- - Logo Izbica24
- - "Raport Operacyjny — Maj 2026"
- - Podsumowanie executive: 3 KPIs (total cost, items published, accept rate)
- - Generated date

- **Strona 2 — Executive Summary:**
- - Tabela: This Month vs Last Month (delta %)
- - Total Cost USD/PLN
- - Items received
- - Items published
- - Accept rate
- - Avg latency
- - Errors count
- - Highlights (auto-generated bullet points)
- - 3 problemy do uwagi

- **Strona 3 — Cost Breakdown:**
- - Wykres: Daily cost trend (whole month)
- - Pie chart: Cost by service (Claude, Perplexity, Anthropic embeddings)
- - Pie chart: Cost by prompt category
- - Top 10 most expensive runs (table)

- **Strona 4 — Prompt Performance:**
- - Table: każdy prompt z metrykami:
- - Slug, runs, cost, accept rate, edit distance, A/B status
- - Best performing (top 3)
- - Worst performing (bottom 3) — propozycje optymalizacji
- - A/B test results (kompletne testy z zeszłego miesiąca)

- **Strona 5 — Sources Performance:**
- - Table per source: items received, accepted, rejected, avg priority
- - Wykres: contributions over time

- **Strona 6 — Editorial Workflow:**
- - Avg time from raw_item → published
- - Per editor: assigned, completed, in_progress, missed_deadlines
- - Per category: throughput

- **Strona 7 — Errors Report:**
- - Top 10 error types (count + last occurrence)
- - Resolution rate
- - MTTR (mean time to resolve)
- - Open issues > 7 dni (action required)

- **Strona 8 — Quality Trends:**
- - Accept rate trend (line chart)
- - Avg edit distance trend
- - Factcheck pass rate
- - User-reported issues (jeśli implemented)

- **Strona 9 — Forecast Next Month:**
- - Predicted cost (with CI)
- - Recommended limit adjustments
- - Capacity planning (jeśli volume rośnie >20%)

- **Strona 10 — Recommendations:**
- - Auto-generated based na anomalies + trends:
- - "Prompt `rewrite-news` ma drop accept rate o 15pp — rozważ rollback do v4"
- - "Workflow `04-perplexity-research` 25% drożej niż średnia — czy potrzebne wszystkie queries?"
- - "Source `nwloclawek` 3 błędy parse w tym miesiącu — sprawdź feed format"

- **Strona 11 — Appendix: Raw Numbers:**
- - Pełne tabele dla audit trail

- **Strona 12 — Glossary + Methodology:**
- - Definicje metryk, jak liczone

- **Email delivery:**
- - PDF jako attachment do `editor-in-chief@izbica24.pl`
- - Subject: `[Izbica24] Raport miesięczny — Maj 2026`
- - Body: HTML preview top KPIs + link do pełnego PDF (uploaded do `/wp-content/uploads/iz24-reports/`)
- - Permalink dla audit (CPT `iz24_report` private)

### Klasa `CSV_Exporter`

- **8 widoków export:**
1. `prompt_runs_full` — wszystkie wpisy `wp_iz24_prompt_runs`
2. `daily_costs` — daily aggregates
3. `prompt_performance` — per prompt summary
4. `errors_log` — wszystkie błędy z fingerprintem
5. `editorial_throughput` — raw → published lifecycle
6. `source_contributions` — items per source
7. `ab_test_results` — wyniki A/B testów
8. `monthly_summary` — comparable month-over-month

- **UI:** dropdown "Select view" + date range + format (CSV/Excel).

### Strona "Ops Center" (główny dashboard)

- **URL:** `/wp-admin/admin.php?page=iz24-ops-center`

- **Capability:** `view_iz24_ops` (admin + editor-in-chief).

- **Layout (responsive grid):**

```
┌─────────────────────────────────────────────────────────────────┐
│ Newsroom Operations Center        [Auto-refresh ●] [Export ▼]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │  $1.23   │ │   38     │ │   78%    │ │   3.2s   │            │
│ │ Cost     │ │ Pushed   │ │ Accept   │ │ Avg lat  │            │
│ │ today    │ │ 24h      │ │ rate     │ │ 24h      │            │
│ │ ▓▓▓░░░░░ │ │ ↑12%     │ │ ↑3pp     │ │ ↓0.3s    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │   47     │ │    9     │ │    2     │ │   12d    │            │
│ │ In queue │ │ Drafts   │ │ Errors   │ │ Days to  │            │
│ │          │ │ pending  │ │ critical │ │ limit    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │  $34.67  │ │ $78 EOM  │ │  93%    │ │   12     │            │
│ │ Month    │ │ Forecast │ │ Uptime  │ │ Active   │            │
│ │ spend    │ │ ±15%     │ │         │ │ workflows│            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌────────────────────────────────┐ ┌──────────────────────────┐│
│ │ Cost trend (last 30 days)      │ │ Items by source (24h)    ││
│ │ [Line chart]                    │ │ [Bar chart]              ││
│ └────────────────────────────────┘ └──────────────────────────┘│
│                                                                   │
│ ┌────────────────────────────────┐ ┌──────────────────────────┐│
│ │ Latency p50/p95/p99 (24h)      │ │ Accept rate by prompt    ││
│ │ [Multi-line chart]              │ │ [Horizontal bar]         ││
│ └────────────────────────────────┘ └──────────────────────────┘│
│                                                                   │
│ ┌────────────────────────────────┐ ┌──────────────────────────┐│
│ │ Errors by type (7d)             │ │ Editorial throughput     ││
│ │ [Stacked area]                  │ │ [Funnel: raw→draft→pub]  ││
│ └────────────────────────────────┘ └──────────────────────────┘│
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ Recent Alerts (5)                                              │
│ • 14:23 [WARNING] Cost daily 80% reached                          │
│ • 14:45 [INFO] Accept rate drop on rewrite-news (78%→65%)        │
│ • ...                                                             │
│ [Open full alert log →]                                          │
└─────────────────────────────────────────────────────────────────┘
```

- **Auto-refresh:** AJAX co 30s, tylko liczbowe wartości (kafelki), wykresy co 5 min.

- **Charts library:** Chart.js (już z N3/N4, no need for new dep).

### Strona "Cost Explorer"

- **URL:** `/wp-admin/admin.php?page=iz24-cost-explorer`

- **Drill-down interface:**

```
Time range: [Last 7 days ▼]      Group by: [Prompt ▼]   Filter: [All ▼]

┌────────────────────────────────────────────────────────────────┐
│ Total: $8.45    Runs: 234    Avg/run: $0.036                     │
└────────────────────────────────────────────────────────────────┘

[Stacked bar chart per day, segments per prompt]

┌──────────────────────────────────────────────────────────────────┐
│ Slug                  Runs   Cost    Avg/run   Accept   Trend     │
├──────────────────────────────────────────────────────────────────┤
│ rewrite-news          89     $3.12   $0.035    78%      ↑         │
│ na-sygnale-conv       45     $1.58   $0.035    82%      →         │
│ evergreen-author      12     $2.04   $0.170    91%      ↓         │
│ headline-generator   123     $0.62   $0.005    94%      →         │
│ ...                                                                │
└──────────────────────────────────────────────────────────────────┘
```

- **Drill-down:** klik na wiersz → otwiera szczegóły promptu (wykres trend + sample runs).

### Strona "Error Log"

- **URL:** `/wp-admin/admin.php?page=iz24-errors`

- **Grouping by fingerprint:**

```
[Filter: severity ▼] [Source ▼] [Resolved/Unresolved ▼]

┌──────────────────────────────────────────────────────────────────┐
│ ⚠️ claude_429 (Rate limit exceeded)                               │
│   First seen: 3 dni temu  ·  Last: 14:23 dziś  ·  Count: 12      │
│   Source: shared-claude-call                                       │
│   [▼ Show occurrences] [Resolve] [Mute 24h]                      │
├──────────────────────────────────────────────────────────────────┤
│ 🔴 wp_timeout (REST endpoint /v1/incoming timeout)                │
│   First seen: 1d temu  ·  Last: 12:45 dziś  ·  Count: 3           │
│   Severity: critical                                               │
│   Source: 16-final-push-to-wp                                      │
│   [▼ Show occurrences] [Resolve] [Mute]                           │
└──────────────────────────────────────────────────────────────────┘
```

- **Klik occurrence → modal z full context (workflow_id, raw_item_id, stack trace, request payload).**

### Strona "Reports"

- **URL:** `/wp-admin/admin.php?page=iz24-reports`

- **Lista wygenerowanych raportów:**

```
┌──────────────────────────────────────────────────────────────────┐
│ Month         Generated     Cost     Items    Status   Actions    │
├──────────────────────────────────────────────────────────────────┤
│ April 2026    1.05.2026     $87.23   1,247    ✓ Sent  [PDF][CSV] │
│ March 2026    1.04.2026     $61.45   892      ✓ Sent  [PDF][CSV] │
│ February 2026 1.03.2026     $43.12   542      ✓ Sent  [PDF][CSV] │
└──────────────────────────────────────────────────────────────────┘

[Generate report manually...]  [Schedule settings]
```

- **"Generate manually":** dropdown miesiąca + button → trigger cron action immediately.

### Strona "Token History"

- **URL:** `/wp-admin/admin.php?page=iz24-token-history`

- **Detailed log każdego LLM call z search/filter.**

Kolumny: Timestamp, Provider (Claude/Perplexity), Model, Prompt slug, Input tokens, Output tokens, Cost, Latency, Status (success/error), Raw item ID (link).

Filters: provider, model, date range, status, prompt, cost > X.

### Prometheus endpoint (opcjonalne)

- **URL:** `/wp-json/iz24/v1/metrics`

- **Auth:** Bearer token (osobny `iz24_metrics_read` token).

- **Format Prometheus:**
```
# HELP iz24_runs_total Total number of LLM runs
# TYPE iz24_runs_total counter
iz24_runs_total{provider="claude",model="claude-opus-4-7",prompt="rewrite-news"} 234
iz24_runs_total{provider="claude",model="claude-haiku-4-5",prompt="headline-generator"} 567

# HELP iz24_cost_usd_total Total cost in USD
# TYPE iz24_cost_usd_total counter
iz24_cost_usd_total{provider="claude"} 34.67
iz24_cost_usd_total{provider="perplexity"} 4.23

# HELP iz24_latency_seconds Request latency
# TYPE iz24_latency_seconds histogram
iz24_latency_seconds_bucket{prompt="rewrite-news",le="1.0"} 12
iz24_latency_seconds_bucket{prompt="rewrite-news",le="5.0"} 89
iz24_latency_seconds_bucket{prompt="rewrite-news",le="10.0"} 145
iz24_latency_seconds_bucket{prompt="rewrite-news",le="+Inf"} 234

# HELP iz24_queue_size Current items in queue
# TYPE iz24_queue_size gauge
iz24_queue_size{status="raw"} 47
iz24_queue_size{status="draft"} 9
iz24_queue_size{status="review"} 3
```

- **Grafana dashboard JSON:** wygeneruj `templates/grafana/izbica24-dashboard.json` z 16 panelami:
1. Cost rate (now, 1h, 24h)
2. Cost trend (30d)
3. Cost forecast EOM
4. Runs per minute (live)
5. Latency p50/p95/p99
6. Error rate
7. Accept rate by prompt
8. Top 10 expensive prompts
9. Items by source (24h)
10. Editorial funnel
11. Token consumption rate
12. Queue size by status
13. A/B test progress
14. Workflow execution count
15. Anomalies detected
16. Budget burn rate

## ZADANIE

Wygeneruj **kompletny monitoring layer Sesja N6** + Grafana dashboard.

Pracuj iteracyjnie:

1. **Composer:** dodaj `mpdf/mpdf`, `irazasyed/telegram-bot-sdk`
2. **Database migrations:** 5 nowych tabel (5m, 1h, 1d, errors, alerts_sent, telegram_sessions)
3. **Cost_Aggregator:** wszystkie 3 levele rollup, cleanup hooks
4. **Cost_Guard:** multi-tier check, hard stop, system status endpoint
5. **Budget_Forecaster:** linear regression + weekday factor + CI
6. **Anomaly_Detector:** 3 detektory (z-score, EWMA, accept drop)
7. **Telegram_Bot:** webhook handler, 13 komend, inline keyboards, auth flow
8. **Alert_Router:** routing matrix, throttler, multi-channel
9. **Email_Alerts:** SMTP HTML email
10. **Monthly_Report:** 12-stronicowy PDF z 8+ wykresami (mpdf + Chart.js→PNG)
11. **CSV_Exporter:** 8 widoków, daterange, format
12. **Page Ops Center:** 12 kafelków + 6 wykresów, auto-refresh
13. **Page Cost Explorer:** drill-down z group by
14. **Page Error Log:** grouping by fingerprint, resolve action
15. **Page Reports:** lista, manual generate, settings
16. **Page Token History:** detailed log z filters
17. **Page Alerts Config:** routing matrix UI, channel test
18. **Prometheus endpoint:** Prometheus exposition format
19. **Grafana dashboard JSON:** 16 panels, ready to import
20. **WP-CLI:** `wp iz24 monitoring status`, `forecast`, `report --month`, `aggregate-now`, `test-alert`
21. **Tests:** PHPUnit dla Aggregator (10), Cost_Guard (12), Forecaster (8), Anomaly (10), Telegram_Bot (15)

Po każdym pliku > 200 linii — krótkie podsumowanie i czekaj na "kontynuuj".

## STANDARDY KODU
- - WPCS (WordPress-Extra)
- - Wszystkie REST endpointy z capability check + nonce
- - Sanitize/escape
- - Translatable strings (text-domain `izbica24-newsroom`)
- - Cache: aggregations w transient (5min TTL)
- - Throttling: alert_throttler tabela
- - Telegram webhook: verify secret token (constant-time compare)
- - PDF: optimize images (Chart.js → PNG via headless approach OR server-side ImageMagick)
- - Composer autoload PSR-4

## ACCEPTANCE CRITERIA

- - [ ] 5 tabel utworzonych przez activator
- - [ ] Cost Aggregator wypełnia metryki (sprawdź po 10 min cron run)
- - [ ] Forecaster zwraca sensible numbers (test z mock data 14 dni)
- - [ ] Anomaly detector triggeruje na sztuczne 10x cost spike
- - [ ] Telegram `/start` → auth flow → `/status` zwraca dashboard
- - [ ] `/pause` zatrzymuje API (n8n widzi `iz24_api_paused = true`)
- - [ ] `/resume` przywraca
- - [ ] Cost guard hard-stop przy 100% miesięcznego limitu
- - [ ] Email alert leci na critical (test SMTP)
- - [ ] Monthly report PDF generuje się dla April 2026 mock data
- - [ ] PDF ma 12 stron, wszystkie wykresy renderowane
- - [ ] CSV export 8 widoków, każdy z poprawną strukturą kolumn
- - [ ] Ops Center renderuje wszystkie 12 kafelków + 6 wykresów
- - [ ] Cost Explorer drill-down działa
- - [ ] Error Log grouping by fingerprint
- - [ ] Prometheus endpoint zwraca valid format (test: `promtool check metrics`)
- - [ ] Grafana dashboard JSON valid (import test w Grafana)
- - [ ] WP-CLI `wp iz24 monitoring status` zwraca summary
- - [ ] PHPUnit 55/55 testów pass
- - [ ] phpcs 0 errors

## PYTANIA DO MNIE PRZED STARTEM

Zadaj maksymalnie 5 pytań. Sugerowane:
1. Czy Telegram bot ma być dla 1 osoby (tylko Ty) czy multi-user (redaktorzy też)? Wpływa na auth.
2. Czy charts w PDF mają być rendered jako PNG (server-side, ImageMagick) czy SVG embedded (lżejsze, ale niektóre PDF readery nie radzą)?
3. Czy metryki z n8n (Postgres remote) pull-ujemy via prepared statements (live query) czy push-ujemy z n8n do WP webhook (asynchroniczne)?
4. Czy chcesz Grafana endpoint od razu, czy tylko WP-native dashboards (Grafana = power user feature)?
5. Czy raport miesięczny ma iść do edytora w PL, czy też w EN dla potencjalnych inwestorów/sponsorów?

Jeśli wszystko jasne — napisz "Zaczynam" i przejdź do kroku 1.


## 5. Test scenariusze po Sesji N6
A. Test agregacji (15 min):
Wygeneruj mock data — 100 wpisów w wp_iz24_prompt_runs z różnymi timestamps
Trigger manual: wp iz24 monitoring aggregate-now --level=5m
Sprawdź wp_iz24_metrics_5m — powinno być ~20 buckets
Trigger 1h aggregate — sprawdź metrics_1h
Trigger 1d aggregate — sprawdź metrics_1d
B. Test Cost Guard (10 min):
Ustaw daily_max_usd = 1.00 w admin
Wygeneruj fake $0.95 today w wp_iz24_prompt_runs
Wywołaj Cost_Guard::check_budget(0.10) → allowed: true, percentage 95%
Wywołaj z 0.20 → allowed: false, reason: daily_limit
Sprawdź czy alert leciał na 80% próg
C. Test Forecaster (10 min):
Mock 14 dni daily costs (rosnące: $1, $1.20, $1.40, …)
Wywołaj Budget_Forecaster::forecast()
Output: forecast_eom_usd, days_until_limit, confidence_interval
Compare z manualną kalkulacją (Excel/Python scipy)
D. Test Anomaly (10 min):
Mock normal cost $0.05/5min przez 24h
Wstaw spike: $5.00 w jednym 5-min bucket
Trigger anomaly detector
Powinien wykryć z-score > 5 → critical alert
Telegram dostaje alert
E. Test Telegram bot (20 min):
Wyślij /start do bota
Bot odpowiada welcome + prosi o /auth <token>
Pobierz token z WP (wp iz24 telegram-token --user=admin)
Wyślij /auth <token> → “Authorized successfully”
Wyślij /status → pełny dashboard
Wyślij /budget → progress bars
Wyślij /forecast → predicted EOM
Wyślij /pause → wszystkie workflowy zatrzymane (sprawdź n8n)
Wyślij /resume → wznawia
Wyślij /limit daily 10 → option update
Test /silent 30 → mute alerts 30 min
F. Test Monthly Report (15 min):
Mock pełny miesiąc danych (1000+ runs, 50+ posts, 20 errors)
Trigger wp iz24 monitoring report --month=2026-04
PDF wygenerowany w /wp-content/uploads/iz24-reports/2026-04.pdf
Otwórz PDF — 12 stron, wszystkie wykresy widoczne
E-mail dotarł do edytora-naczelnego
Sprawdź attachment size < 5MB
G. Test Ops Center (10 min):
Otwórz /wp-admin/admin.php?page=iz24-ops-center
Wszystkie 12 kafelków renderują wartości
6 wykresów ładuje się w < 2s
Auto-refresh po 30s — kafelki się updatują
“Open full alert log” link działa
H. Test Prometheus + Grafana (15 min):
Curl https://izbica24.pl/wp-json/iz24/v1/metrics z Bearer token
Output w Prometheus format
Validate: cat metrics.txt | promtool check metrics
Setup Prometheus scrape config:
- job_name: 'izbica24'
scrape_interval: 60s
static_configs:
- - targets: ['izbica24.pl']
metrics_path: '/wp-json/iz24/v1/metrics'
authorization:
credentials: '<token>'

Import Grafana dashboard templates/grafana/izbica24-dashboard.json
16 paneli wyświetla dane
I. Test Anti-spam (5 min):
Symuluj 10 critical alerts w 5 minut z tym samym fingerprint
Sprawdź wp_iz24_alerts_sent — max 3 wpisy (po throttle)
Po 1h throttle reset → kolejny może wysłać
J. Test resilience (5 min):
Wyłącz Telegram (mock 500 response)
Critical alert → fallback do email
Sprawdź email odebrany
Po Telegram up → kolejne alerty znów Telegram

## 6. Kalibracja po Sesji N6 (pierwsze 30 dni)
Tydzień 1:
Włącz wszystkie monitoring components
Cost limits ostrożnie: daily=$2, monthly=$30 (low ball, żeby nie spalić zaraz)
Telegram: WSZYSTKIE alerty (severity=info)
Codziennie patrz Ops Center, koryguj limity
Tydzień 2:
Zauważasz prawdziwe średnie — adjustuj limits na 2x typowe usage
Telegram zmień na warning+ (mniej szumu)
Skup się na anomaly detector — czy false positives?
Tydzień 3:
Pierwszy A/B test ma już dane statystycznie istotne (z N4)
Promote winning variant
Tweakuj prompty na podstawie accept rate trends
Tydzień 4:
Pierwszy miesięczny raport (1-go następnego miesiąca)
Review wszystkich rekomendacji z raportu
Adjust budget na bazie forecasted vs actual

## 7. Co dalej, po N6
Backend complete! Masz:
✅ N1: Newsroom plugin core (CPT, REST, security)
✅ N2: Admin Newsroom Queue
✅ N3: Editorial workflow (PublishPress)
✅ N4: Prompt management (CPT, A/B tests, versioning)
✅ N5: n8n VPS + 17 workflowów
✅ N6: Monitoring, alerts, reports, Grafana
Co zostaje:
Frontend WordPress (sesje F1-F8):
F1: Setup Kadence + child theme
F2: Header z 12 kategoriami, mega-menu, search
F3: Homepage layout (hero, news tiles, “Na sygnale” bar, Kujawianka widget)
F4: Archive templates per kategoria (12 wariantów)
F5: Single post templates (4 typy: news, interview, sport, na-sygnale)
F6: Custom blocks (24 sztuk: hero slider, event card, sołectwo card, lightbox gallery, podcast embed, interactive SVG map)
F7: Static pages (12 sztuk: O portalu, Redakcja, Kontakt, RODO, etc.)
F8: Performance optimization, schema, sitemap, Google News submission
Operacje (sesje O1-O3):
O1: Onboarding partnerów (Webhook Pusher) + regulamin + badge
O2: Setup Google News Publisher Center, Search Console, GA4
O3: Pierwsza kampania marketingowa, FB strona, Newsletter setup
Optymalizacja (sesje OPT1-OPT3):
OPT1: SEO audit po 30 dniach, content gaps
OPT2: Conversion optimization (newsletter signups, ad clicks)
OPT3: Monetyzacja: AdSense, sponsorowane artykuły, classifieds

## 8. Podsumowanie wszystkich 6 sesji backendowych
Total: 7 dni intensywnej pracy z Claude Code. Realnie z testowaniem, debugowaniem i kalibracją: 2-3 tygodnie kalendarzowe.
Total cost backendu (pierwszy rok):
Plugins: ~2,500 PLN
Hosting WP: ~1,200 PLN
n8n VPS: ~550 PLN
Backupy: ~250 PLN
Claude API: ~600-1,800 PLN
Perplexity: ~250 PLN
Razem: ~5,400-7,000 PLN/rok (~450-580 PLN/miesiąc)
Dla portalu o zasięgu lokalnym (gmina ~12k mieszkańców, potencjalny zasięg powiat 100k+) to bardzo rozsądny budżet — porównywalne portale komercyjne kosztują 30-50k PLN/rok.

## Pytanie do Ciebie
Mamy zamknięty backend. Co dalej?
„rozpisz F1" — frontend Kadence setup + child theme
„rozpisz O1" — onboarding pierwszych partnerów Webhook Pusher
„zrób review N1-N6" — przegląd całego planu, czy czegoś nie brakuje
„stop, idę robić" — odpalam Claude Code z N1 i wracam po feedback
„podsumuj wszystko" — jeden kompaktowy summary dla mojego dokumentu projektu
Co wybierasz?


| Sesja | Czas | Produkt | Kluczowy plik |
| --- | --- | --- | --- |
| N1 | 1 dzień | Plugin core, CPT, REST | class-incoming-endpoint.php |
| N2 | 1 dzień | Newsroom Queue panel | class-queue-list-table.php |
| N3 | 1 dzień | Editorial workflow | class-assignment-engine.php |
| N4 | 1 dzień | Prompt management | class-prompt-renderer.php |
| N5 | 2 dni | n8n + 17 workflowów | shared-claude-call.json |
| N6 | 1 dzień | Monitoring + alerts | class-cost-guard.php |
