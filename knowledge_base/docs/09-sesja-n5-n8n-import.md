# Sesja N5 — Instalacja n8n na drugim VPS-ie + import workflowów end-to-end
Piąta sesja. Po niej masz żywą fabrykę treści: RSS/Webhook → n8n → Claude (z promptami z N4) → REST /v1/incoming (z N1) → Newsroom Queue (z N2) → Editorial Workflow (z N3). To moment, w którym całość zaczyna działać autonomicznie.
To największa sesja — 2 dni pracy (a nie 1 jak poprzednie). Powód: sam setup n8n na VPS to ~3h, import + dostosowanie 17 workflowów to ~10h, end-to-end testing to ~3h.

## 1. Co dokładnie powstanie w Sesji N5
Cel sesji: druga maszyna (osobny VPS, nie ten z WordPressem) pracuje 24/7 jako orchestrator AI workflow. n8n co X minut sprawdza źródła, normalizuje dane, wywołuje Claude przez prompt z WordPressa (z A/B variant!), wysyła wynik do /v1/incoming jako raw_item gotowy do redaktora.
Komponenty:
n8n-vps/
├── docker-compose.yml              # n8n + Postgres + Redis + Caddy
├── .env                            # Sekrety (Claude key, WP token, etc.)
├── Caddyfile                       # Reverse proxy + auto-SSL
├── workflows/                      # 17 workflowów .json do importu
│   ├── 00-shared/
│   │   ├── shared-claude-call.json         # Sub-workflow: wywołanie Claude
│   │   ├── shared-wp-incoming.json         # Sub-workflow: POST do /v1/incoming
│   │   ├── shared-prompt-fetcher.json      # Sub-workflow: GET prompt z WP
│   │   ├── shared-cost-guard.json          # Sub-workflow: limit dzienny
│   │   └── shared-error-handler.json       # Sub-workflow: error logging + Telegram
│   ├── 01-ingestion/
│   │   ├── 01-rss-ddwloclawek.json         # Co 2h, RSS Dobry Dzień Włocławek
│   │   ├── 02-rss-nwloclawek.json          # Co 3h, Nasz Włocławek
│   │   ├── 03-rss-generic.json             # Generic RSS (15+ feedów)
│   │   ├── 04-perplexity-research.json     # Co 6h, queries Izbica
│   │   ├── 05-fb-graph-osp.json            # Co 1h, OSP Izbica fanpage
│   │   └── 06-email-incoming.json          # IMAP poll, parsing forwardów
│   ├── 02-processing/
│   │   ├── 07-classifier.json              # Klasyfikacja → kategoria
│   │   ├── 08-rewrite-news.json            # Rewrite z RSS na własny styl
│   │   ├── 09-na-sygnale-formatter.json    # OSP/Policja → format Na sygnale
│   │   ├── 10-evergreen-generator.json     # Co 24h, generuj evergreen
│   │   └── 11-fact-check.json              # Po rewrite, weryfikacja
│   ├── 03-deduplication/
│   │   └── 12-dedup-similarity.json        # Embeddings + cosine similarity
│   ├── 04-publication/
│   │   ├── 13-headline-generator.json
│   │   ├── 14-seo-meta.json
│   │   ├── 15-social-snippet.json
│   │   └── 16-final-push-to-wp.json        # Wysyłka do /v1/incoming
│   └── 05-monitoring/
│       └── 17-cost-monitor.json            # Co 1h, sprawdza budget
├── credentials/                    # n8n credentials (encrypted)
├── data/                           # Persistent volume (DB, executions)
└── backups/                        # Codzienne backupy

Co działa po Sesji N5:
VPS z n8n na własnej domenie (n8n.izbica24.pl), HTTPS, basic auth + 2FA
17 workflowów aktywnych, schedule trigger lub webhook
Claude API z rate limit i cost guard (max $5/dzień, $100/miesiąc)
Każdy workflow loguje do PostgreSQL + Telegram alerty na błędy
Raw items płyną do WP automatycznie — w Newsroom Queue widzisz przyrost
A/B testy promptów działają w produkcji (n8n losuje wariant z WP)
Pełny rollback: jeśli workflow się zepsuje, możesz go wyłączyć z n8n UI bez wpływu na inne

## 2. Wymagania wstępne
Hardware (VPS):
Hetzner CX22 (2 vCPU, 4GB RAM, 40GB SSD, ~5 EUR/mc) lub Vultr/Contabo o podobnej spec
Ubuntu 24.04 LTS
IP publiczne, domena n8n.izbica24.pl (lub subdomain) z DNS A → IP
Konta zewnętrzne:
Anthropic API account z kluczem sk-ant-api03-...
Perplexity API ($5 startowo)
Telegram bot (przez @BotFather) + chat ID
Meta Developer account dla Graph API (OSP page)
Backblaze B2 lub Wasabi dla backupów (~$5/miesiąc)
Koszt miesięczny n8n VPS:
Hetzner CX22: ~22 PLN
Domena (jeśli osobna): ~50 PLN/rok = ~4 PLN/mc
Backblaze B2: ~20 PLN
Razem: ~46 PLN/mc

## 3. Część 1: Setup VPS (manualne kroki, ~3h)
### 3.1. Provisioning Hetzner
# 1. Załóż konto Hetzner Cloud, stwórz projekt "izbica24"
# 2. Dodaj SSH key (z lokalnego ~/.ssh/id_ed25519.pub)
# 3. Utwórz server:
#    - Type: CX22 (Shared vCPU, 2 cores, 4GB)
#    - Image: Ubuntu 24.04
#    - Location: Falkenstein lub Helsinki (najbliżej Polski)
#    - Networking: Public IPv4 + IPv6
#    - SSH key: dodaj swój
#    - Name: n8n-izbica24
# 4. Po utworzeniu zanotuj IP (np. 95.217.123.45)
# 5. W panelu DNS swojej domeny dodaj:
#    A    n8n    →    95.217.123.45
#    AAAA n8n    →    2a01:...

### 3.2. Initial server hardening
# Zaloguj się jako root
ssh root@95.217.123.45

# Update system
apt update && apt upgrade -y
apt install -y ufw fail2ban unattended-upgrades curl wget git vim htop ncdu

# Stwórz user roboczego
adduser izbica24
usermod -aG sudo izbica24

# Skopiuj SSH key
rsync --archive --chown=izbica24:izbica24 ~/.ssh /home/izbica24

# Wyłącz root login + password auth
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban
systemctl enable --now fail2ban

# Auto-updates
dpkg-reconfigure -plow unattended-upgrades

# Wyloguj root, zaloguj jako izbica24
exit
ssh izbica24@95.217.123.45

### 3.3. Docker + Docker Compose
# Install Docker (official script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker izbica24
newgrp docker

# Verify
docker --version
docker compose version

### 3.4. Struktura katalogów
mkdir -p ~/n8n-izbica24/{data,workflows,credentials,backups,caddy}
cd ~/n8n-izbica24

### 3.5. Plik docker-compose.yml
version: '3.8'

services:
postgres:
image: postgres:16-alpine
container_name: n8n-postgres
restart: unless-stopped
environment:
POSTGRES_USER: ${POSTGRES_USER}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
POSTGRES_DB: ${POSTGRES_DB}
volumes:
- - ./data/postgres:/var/lib/postgresql/data
healthcheck:
test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
interval: 10s
timeout: 5s
retries: 5
networks:
- - n8n-net

redis:
image: redis:7-alpine
container_name: n8n-redis
restart: unless-stopped
command: redis-server --requirepass ${REDIS_PASSWORD}
volumes:
- - ./data/redis:/data
networks:
- - n8n-net

n8n:
image: n8nio/n8n:latest
container_name: n8n
restart: unless-stopped
depends_on:
postgres:
condition: service_healthy
environment:
# Database
DB_TYPE: postgresdb
DB_POSTGRESDB_HOST: postgres
DB_POSTGRESDB_PORT: 5432
DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
DB_POSTGRESDB_USER: ${POSTGRES_USER}
DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}

# Queue mode (Redis)
EXECUTIONS_MODE: queue
QUEUE_BULL_REDIS_HOST: redis
QUEUE_BULL_REDIS_PORT: 6379
QUEUE_BULL_REDIS_PASSWORD: ${REDIS_PASSWORD}

# Auth
N8N_BASIC_AUTH_ACTIVE: 'true'
N8N_BASIC_AUTH_USER: ${N8N_USER}
N8N_BASIC_AUTH_PASSWORD: ${N8N_PASSWORD}

# Encryption
N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}

# Host
N8N_HOST: ${N8N_HOST}
N8N_PORT: 5678
N8N_PROTOCOL: https
WEBHOOK_URL: https://${N8N_HOST}/
N8N_EDITOR_BASE_URL: https://${N8N_HOST}/

# Timezone
GENERIC_TIMEZONE: Europe/Warsaw
TZ: Europe/Warsaw

# Performance
EXECUTIONS_DATA_PRUNE: 'true'
EXECUTIONS_DATA_MAX_AGE: 168  # 7 dni
EXECUTIONS_DATA_PRUNE_MAX_COUNT: 10000

# Logs
N8N_LOG_LEVEL: info
N8N_LOG_OUTPUT: file
N8N_LOG_FILE_LOCATION: /home/node/.n8n/logs/n8n.log
N8N_LOG_FILE_MAXSIZE: 50
N8N_LOG_FILE_MAXCOUNT: 10
volumes:
- - ./data/n8n:/home/node/.n8n
- - ./workflows:/workflows  # Read-only, dla import script
networks:
- - n8n-net

n8n-worker:
image: n8nio/n8n:latest
container_name: n8n-worker
restart: unless-stopped
command: worker
depends_on:
- - n8n
environment:
# (te same env co n8n, oprócz BASIC_AUTH)
DB_TYPE: postgresdb
DB_POSTGRESDB_HOST: postgres
DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
DB_POSTGRESDB_USER: ${POSTGRES_USER}
DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
EXECUTIONS_MODE: queue
QUEUE_BULL_REDIS_HOST: redis
QUEUE_BULL_REDIS_PORT: 6379
QUEUE_BULL_REDIS_PASSWORD: ${REDIS_PASSWORD}
N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
GENERIC_TIMEZONE: Europe/Warsaw
TZ: Europe/Warsaw
volumes:
- - ./data/n8n:/home/node/.n8n
networks:
- - n8n-net

caddy:
image: caddy:2-alpine
container_name: n8n-caddy
restart: unless-stopped
ports:
- - "80:80"
- - "443:443"
volumes:
- - ./caddy/Caddyfile:/etc/caddy/Caddyfile
- - ./data/caddy:/data
- - ./data/caddy-config:/config
networks:
- - n8n-net

networks:
n8n-net:
driver: bridge

### 3.6. Plik .env (sekrety, NIE commit!)
cat > .env <<'EOF'
# Postgres
POSTGRES_USER=n8n
POSTGRES_PASSWORD=<wygeneruj 32-char hex>
POSTGRES_DB=n8n

# Redis
REDIS_PASSWORD=<wygeneruj 32-char hex>

# n8n auth
N8N_USER=admin
N8N_PASSWORD=<wygeneruj silne hasło>
N8N_ENCRYPTION_KEY=<wygeneruj 64-char hex — KRYTYCZNE!>
N8N_HOST=n8n.izbica24.pl

# External APIs (te dodasz w n8n UI jako credentials, nie env)
EOF

chmod 600 .env

# Wygeneruj sekrety
openssl rand -hex 32  # użyj dla POSTGRES_PASSWORD
openssl rand -hex 32  # użyj dla REDIS_PASSWORD
openssl rand -hex 32  # użyj dla N8N_ENCRYPTION_KEY (zapisz BACKUP!)
pwgen -s 24 1         # użyj dla N8N_PASSWORD

### 3.7. Plik caddy/Caddyfile
n8n.izbica24.pl {
reverse_proxy n8n:5678 {
header_up Host {host}
header_up X-Real-IP {remote_host}
header_up X-Forwarded-For {remote_host}
header_up X-Forwarded-Proto {scheme}
}

# Security headers
header {
Strict-Transport-Security "max-age=31536000; includeSubDomains"
X-Frame-Options "DENY"
X-Content-Type-Options "nosniff"
Referrer-Policy "no-referrer"
- -Server
}

# Logs
log {
output file /var/log/caddy/n8n.log
format json
}
}

### 3.8. Start
# Pull images
docker compose pull

# Start
docker compose up -d

# Sprawdź logi
docker compose logs -f n8n

# Po ~30s otwórz https://n8n.izbica24.pl
# Login: admin / <hasło z .env>
# Pierwszy ekran: setup owner account (e-mail + hasło — NIE basic auth!)

### 3.9. Backup setup
# Cron co 24h: backup Postgres + .n8n folder do Backblaze B2

cat > ~/n8n-izbica24/backup.sh <<'EOF'
#!/bin/bash
set -e

BACKUP_DIR=~/n8n-izbica24/backups
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

# Postgres dump
docker compose -f ~/n8n-izbica24/docker-compose.yml exec -T postgres \
pg_dump -U n8n n8n | gzip > $BACKUP_DIR/postgres-$DATE.sql.gz

# n8n data
tar czf $BACKUP_DIR/n8n-data-$DATE.tar.gz -C ~/n8n-izbica24/data n8n

# Upload do B2
b2 upload-file izbica24-backups $BACKUP_DIR/postgres-$DATE.sql.gz n8n/postgres-$DATE.sql.gz
b2 upload-file izbica24-backups $BACKUP_DIR/n8n-data-$DATE.tar.gz n8n/n8n-data-$DATE.tar.gz

# Lokalna retention 7 dni
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x ~/n8n-izbica24/backup.sh

# Cron
crontab -e
# Dodaj: 0 3 * * * /home/izbica24/n8n-izbica24/backup.sh >> /home/izbica24/n8n-izbica24/backup.log 2>&1


## 4. Część 2: n8n Credentials (manualne, ~30 min)
W n8n UI → Credentials → New Credential dodaj:
Anthropic Claude (HTTP Header Auth)
Name: Claude API
Header Name: x-api-key
Header Value: sk-ant-api03-...
Dodatkowo: header anthropic-version: 2023-06-01
Perplexity API (HTTP Header Auth)
Name: Perplexity API
Header Name: Authorization
Header Value: Bearer pplx-...
Izbica24 WP Incoming (HTTP Header Auth)
Name: WP Incoming Token
Header Name: Authorization
Header Value: Bearer <token z N1 wp iz24 token create --source=n8n_workflows>
Izbica24 WP Prompts (HTTP Header Auth)
Name: WP Prompts Token
Header Name: Authorization
Header Value: Bearer <token z N4 wp iz24 prompt-token create --read-only>
Telegram Bot (Telegram API)
Name: Izbica24 Alerts Bot
Access Token: <token z @BotFather>
Default Chat ID: <twoje chat ID>
Facebook Graph API (HTTP Header Auth)
Name: Meta Graph OSP
Header Name: Authorization
Header Value: Bearer <long-lived page token OSP>
PostgreSQL n8n (Postgres)
Name: n8n local DB (do query historii executions)
Host: postgres
Port: 5432
Database: n8n
User/Password: z .env
Email IMAP (IMAP)
Name: Newsroom Inbox
Host: imap.gmail.com lub własny
Port: 993
User: newsroom@izbica24.pl
Password: app password

## 5. Część 3: Prompt dla Claude Code (workflowy + automation, ~10h pracy)
Otwórz lokalnie w ~/projects/izbica24-n8n-workflows/, uruchom claude, wklej:
# PROJEKT: izbica24 n8n workflows — Sesja N5

## ROLA
Jesteś senior automation engineer ze specjalizacją w:
- - n8n (self-hosted, queue mode, sub-workflows, error workflows)
- - Workflow design patterns: idempotency, retry, circuit breaker, dead letter queue
- - LLM orchestration: prompt chaining, fallback models, cost optimization
- - Data normalization, deduplication (hash + embeddings + Levenshtein)
- - HTTP/REST integrations, webhook security, rate limiting
- - JSON workflow files (n8n export format)

## KONTEKST
Buduję orchestrator AI dla portalu Izbica24.pl. WordPress (osobny VPS) ma już wtyczkę `izbica24-newsroom` z:
- - REST endpoint `POST /wp-json/iz24/v1/incoming` (Bearer auth) — przyjmuje raw items
- - REST endpoint `GET /wp-json/iz24/v1/prompts/{slug}` — zwraca aktualny prompt + A/B variant
- - REST endpoint `POST /wp-json/iz24/v1/prompts/{slug}/feedback` — zwraca metryki

Drugi VPS ma n8n (Docker, Postgres, Redis, queue mode). W tej sesji tworzysz **17 workflowów** (.json export format n8n), które:
1. Co X minut pobierają dane z 6+ źródeł (RSS, Perplexity, Facebook Graph, Email)
2. Klasyfikują, deduplikują, przepuszczają przez Claude (z promptami z WP)
3. Wysyłają wyniki jako raw_items do WP

- **Kluczowe wymaganie:** każdy workflow musi być **idempotentny** — restart nie powoduje duplikatów. Używaj `external_id` + `X-Idempotency-Key` w nagłówkach do WP.

## ŹRÓDŁA DANYCH (Layer 1)

| Source ID | Type | URL/Endpoint | Frequency | Workflow |
|---|---|---|---|---|
| `ddwloclawek` | RSS | `https://ddwloclawek.pl/feed/` | 2h | 01-rss-ddwloclawek |
| `nwloclawek` | RSS | `https://nwloclawek.pl/feed/` | 3h | 02-rss-nwloclawek |
| `tvk_wloclawek` | RSS | `https://tvk.wloclawek.pl/rss` | 4h | 03-rss-generic |
| `radio_pik` | RSS | `https://www.radiopik.pl/feed` | 4h | 03-rss-generic |
| `gov_pl_kujawsko` | RSS | `https://www.gov.pl/web/uw-kujawsko-pomorski/rss.xml` | 6h | 03-rss-generic |
| `n8n_perplexity` | API | Perplexity sonar-pro | 6h | 04-perplexity-research |
| `osp_izbica` | FB Graph | `/v19.0/{page_id}/posts` | 1h | 05-fb-graph-osp |
| `email_inbox` | IMAP | newsroom@izbica24.pl | 15min | 06-email-incoming |
| `manual` | Webhook | (z N1, formularze) | trigger | (już w WP) |
| `webhook_partners` | Webhook | (z N1, Zapier/Make) | trigger | (już w WP) |

## STRUKTURA WORKFLOWÓW

### Sub-workflowy współdzielone (`00-shared/`)

#### `shared-claude-call.json`
Wywołuje Claude API z built-in retry + cost guard.

- **Input:**
```json
{
"prompt_slug": "rewrite-news",
"context": {"title": "...", "content_html": "..."},
"raw_item_id": 123  // optional, do feedback later
}
```

- **Logika:**
1. GET prompt z WP: `https://izbica24.pl/wp-json/iz24/v1/prompts/{prompt_slug}` (z `?ab=true`)
2. Render placeholders w prompt.user (substitute `{{var}}` with context)
3. Sprawdź cost guard — sub-workflow `shared-cost-guard` zwraca `allowed: true/false`
4. Wywołaj Claude API: `POST https://api.anthropic.com/v1/messages` z body:
```json
{
"model": prompt.model,
"max_tokens": prompt.max_tokens,
"temperature": prompt.temperature,
"system": prompt.system,
"messages": [{"role": "user", "content": prompt.user_rendered}]
}
```
5. Retry z exponential backoff (1s, 2s, 4s, 8s) na 429/500/503
6. Jeśli wszystkie retry fail → fallback model (claude-haiku-4-5) + retry
7. POST feedback do WP: `POST /v1/prompts/{slug}/feedback` z metrykami (input_tokens, output_tokens, cost, latency)
8. Return: `{success, content, cost_usd, latency_ms, model_used, ab_variant}`

- **Error handling:** zwraca `{success: false, error: "..."}` zamiast throw — caller decyduje co dalej.

#### `shared-wp-incoming.json`
Wysyła raw_item do WP `/v1/incoming`.

- **Input:** schema raw_item (jak w N1)

- **Logika:**
1. Generate `X-Idempotency-Key` (UUID v4) — opcjonalnie z `external_id` jeśli dostępny
2. POST z headers + body
3. Sprawdź response: 201 = nowy, 200 = duplikat, 401/422/429 = error
4. Loguj do Postgres `iz24_n8n_runs` table
5. Jeśli error → trigger `shared-error-handler`

#### `shared-prompt-fetcher.json`
Pomocniczy: GET prompt z WP, parse, return rendered system+user.

#### `shared-cost-guard.json`
- **Krytyczne:** zatrzymuje workflow jeśli przekroczono budget.

- **Limity (konfigurowalne w n8n env):**
- - `IZ24_BUDGET_DAILY_USD = 5.0`
- - `IZ24_BUDGET_MONTHLY_USD = 100.0`
- - `IZ24_BUDGET_PER_RUN_MAX_USD = 0.50`

- **Logika:**
1. Query Postgres: SUM(cost_usd) FROM iz24_n8n_runs WHERE date = today
2. Jeśli > daily limit → return `{allowed: false, reason: 'daily_limit'}`
3. Query SUM dla bieżącego miesiąca → jeśli > monthly → block
4. Jeśli single run cost estimate > per-run limit → block
5. Jeśli 80% któregoś limitu → wyślij warning Telegram
6. Return `{allowed: true/false, daily_spent, monthly_spent, daily_remaining}`

#### `shared-error-handler.json`
Centralny error handler.

- **Input:** `{workflow_name, node_name, error_message, context, severity}`

- **Logika:**
1. Insert do Postgres `iz24_n8n_errors`
2. Jeśli severity = 'critical' → Telegram natychmiast
3. Jeśli severity = 'warning' → batch Telegram (co 1h aggregated)
4. Jeśli severity = 'info' → tylko log

### Workflowy ingestion (`01-ingestion/`)

#### `01-rss-ddwloclawek.json`
- **Trigger:** Schedule, every 2 hours, `0 */2 * * *`

- **Nodes:**
1. **Schedule Trigger**
2. **HTTP Request** — GET `https://ddwloclawek.pl/feed/`
3. **XML** — parse RSS XML
4. **Split In Batches** — items[]
5. **Filter** — tylko items z keywords kujawskich (Izbica, Włocławek, Brześć, Kowal, Kruszwica) lub last 24h
6. **Code (JavaScript)** — normalizacja:
```javascript
return items.map(item => ({
source_id: 'ddwloclawek',
external_id: item.guid || item.link,
external_url: item.link,
title: item.title.trim(),
content_html: item.description || item['content:encoded'],
content_text: stripHtml(item.description),
published_at: new Date(item.pubDate).toISOString(),
author_name: item['dc:creator'] || 'ddwloclawek.pl',
tags: extractTags(item),
priority_hint: detectPriority(item.title, item.description),
permission: { publish_full_text: false, publish_media: false, credit_name: 'Dobry Dzień Włocławek', credit_link: item.link }
}));
```
7. **Execute Sub-Workflow** — `12-dedup-similarity` (sprawdź duplikaty)
8. **IF** — jeśli not duplicate
9. **Execute Sub-Workflow** — `07-classifier` (kategoria + priority)
10. **Execute Sub-Workflow** — `08-rewrite-news` (przepisanie przez Claude)
11. **Execute Sub-Workflow** — `11-fact-check`
12. **Execute Sub-Workflow** — `16-final-push-to-wp`
13. **Error Trigger** — przy każdym błędzie wywołaj `shared-error-handler`

#### `02-rss-nwloclawek.json`
Identyczne jak 01, ale dla `https://nwloclawek.pl/feed/`, frequency 3h.

#### `03-rss-generic.json`
Parametryczny workflow — config sources w n8n Variables:
```json
[
{"id": "tvk_wloclawek", "url": "https://tvk.wloclawek.pl/rss", "frequency": 4},
{"id": "radio_pik", "url": "https://www.radiopik.pl/feed", "frequency": 4},
{"id": "gov_pl_kujawsko", "url": "https://www.gov.pl/web/uw-kujawsko-pomorski/rss.xml", "frequency": 6}
]
```

- **Logika:** Schedule trigger co 1h, iteruj sources, sprawdź czy `last_run + frequency_h < now`.

#### `04-perplexity-research.json`
- **Trigger:** co 6h.

- **Queries (n8n Variables):**
```json
[
"Najnowsze wiadomości Izbica Kujawska ostatni tydzień",
"Wydarzenia gminy Izbica Kujawska samorząd",
"Inwestycje Izbica Kujawska 2026",
"Sport MGKS Kujawianka Izbica wyniki",
"Kultura MGCK Izbica wydarzenia"
]
```

- **Logika:**
1. Schedule trigger
2. Loop queries
3. POST do Perplexity API:
```json
{
"model": "llama-3.1-sonar-large-128k-online",
"messages": [{"role": "user", "content": query}],
"return_citations": true,
"search_recency_filter": "week"
}
```
4. Parse response, ekstrakcja unique URLs z citations
5. Dla każdego URL: HTTP GET, parse, normalize do raw_item schema
6. Source_id = `n8n_perplexity_research`
7. Push do WP

#### `05-fb-graph-osp.json`
- **Trigger:** co 1h.

- **Logika:**
1. GET `https://graph.facebook.com/v19.0/{OSP_PAGE_ID}/posts?fields=id,message,created_time,permalink_url,attachments&since={now-2h}`
2. Filter: tylko posty z attachments lub message > 50 znaków
3. Normalize:
- - title = first 100 chars message
- - content_html = full message + attachment description
- - external_id = post.id (już unique)
- - source_id = `osp_izbica`
- - category_hint = `na-sygnale`
- - priority_hint = detectPriority(message) — zazwyczaj 6-9
4. Sub-workflow `09-na-sygnale-formatter` (Claude konwertuje na format Na sygnale)
5. Push do WP

#### `06-email-incoming.json`
- **Trigger:** IMAP node, poll co 15 min.

- **Logika:**
1. IMAP fetch unread, folder INBOX
2. Filter: from address w whitelist `partners` lub do `slug@in.izbica24.pl` (subdomain catch-all)
3. Parse subject + body
4. Source_id = z subject prefix `[OSP]`, `[KUJAWIANKA]`, etc.
5. Push do WP
6. Mark as read (lub move do `Processed/`)

### Workflowy processing (`02-processing/`)

#### `07-classifier.json`
- **Trigger:** Sub-workflow.

- **Input:** `{title, content_text, raw_item_id}`

- **Logika:**
1. Execute sub-workflow `shared-claude-call` z `prompt_slug: 'category-classifier'`
2. Parse JSON response: `{category: 'wiadomosci', subcategory: 'samorzad', confidence: 0.92}`
3. Jeśli confidence < 0.7 → set status 'manual_review'
4. Return classification

#### `08-rewrite-news.json`
Sub-workflow. Wywołuje `shared-claude-call` z `prompt_slug: 'rewrite-news'`.

#### `09-na-sygnale-formatter.json`
Sub-workflow. `prompt_slug: 'na-sygnale-conversion'`.

#### `10-evergreen-generator.json`
- **Trigger:** Schedule, codzienne 03:00.

- **Logika:**
1. Lista tematów evergreen w n8n Variables (JSON):
```json
[
{"topic": "Historia Izbicy Kujawskiej", "category": "historia"},
{"topic": "Tradycyjna kuchnia kujawska", "category": "zycie-codzienne"},
{"topic": "Zabytki gminy Izbica Kujawska", "category": "historia"}
]
```
2. Wybierz losowo 1 temat
3. Sub-workflow `shared-claude-call` z `prompt_slug: 'evergreen-author'`
4. Push jako raw_item do WP

#### `11-fact-check.json`
Sub-workflow. `prompt_slug: 'fact-check'`. Po rewrite, weryfikuje fakty. Jeśli zwraca `issues_found > 0` — set raw_item meta `iz24_factcheck_issues` i status `manual_review`.

### Workflow deduplikacji (`03-deduplication/`)

#### `12-dedup-similarity.json`
- **Input:** raw_item candidate.

- **3-stage dedup:**

1. **Hash check** (fast):
- - Compute SHA-256 z normalized title (lowercase, no punctuation, first 100 chars)
- - Query Postgres: SELECT FROM iz24_dedup_cache WHERE hash = ? AND created > NOW() - INTERVAL '7 days'
- - Jeśli match → return `{is_duplicate: true, reason: 'hash_match', existing_id}`

2. **Levenshtein** (medium):
- - Query last 30 raw_items z tej samej kategorii (last 24h)
- - Compute Levenshtein distance dla każdego title
- - Jeśli > 85% similarity → duplicate

3. **Embeddings + Cosine** (slow, only if 1+2 pass):
- - Skip dla niskiej priority (< 5)
- - POST do Anthropic embeddings API: `POST /v1/embeddings` with title+excerpt
- - (Anthropic nie ma dedicated embeddings, użyj Voyage AI lub OpenAI text-embedding-3-small)
- - Query Postgres pgvector: nearest neighbors w 7-day window
- - Jeśli cosine > 0.92 → duplicate

- **Update cache:** zapisz hash + embedding nowego raw_item do `iz24_dedup_cache`.

### Workflowy publication (`04-publication/`)

#### `13-headline-generator.json`
Sub-workflow. `prompt_slug: 'headline-generator'`. Generuje 5 wariantów headline, wybiera best (przez Claude scoring lub embedding similarity z target style).

#### `14-seo-meta.json`
Sub-workflow. `prompt_slug: 'seo-meta'`. Title (60 chars) + meta description (160 chars).

#### `15-social-snippet.json`
Sub-workflow. `prompt_slug: 'social-media-snippet'`. Snippet pod FB/Twitter/Instagram (różne długości).

#### `16-final-push-to-wp.json`
- **Główny aggregator** — łączy wszystkie wyniki processing i wysyła JEDEN raw_item do WP.

- **Input (od ingestion workflow):**
```json
{
"source_id": "ddwloclawek",
"external_id": "...",
"title_original": "...",
"content_original": "...",
"rewritten_content": "...",
"classification": {category, subcategory, priority},
"headlines_variants": [...],
"seo_meta": {...},
"social_snippets": {...},
"factcheck_result": {...}
}
```

- **Logika:**
1. Build raw_item payload zgodnie ze schemą `/v1/incoming`
2. Pakuj wszystkie metadata do `iz24_metadata`:
```json
{
"ai_processing": {
"rewrite_prompt_id": 123,
"rewrite_ab_variant": "A",
"headline_variants": [...],
"seo_meta": {...},
"factcheck_passed": true,
"total_cost_usd": 0.087,
"total_latency_ms": 12400
}
}
```
3. Jeśli factcheck_issues > 0 → category_hint = unchanged, ale dodaj tag `do-weryfikacji`
4. Sub-workflow `shared-wp-incoming`
5. Loguj sukces / błąd do Postgres

### Workflow monitoring (`05-monitoring/`)

#### `17-cost-monitor.json`
- **Trigger:** co 1h.

- **Logika:**
1. Query Postgres: aggregated stats per workflow, per prompt last 24h
2. Daily cost summary: SUM(cost_usd), SUM(input_tokens), SUM(output_tokens)
3. Top 5 most expensive workflows
4. Errors count per workflow
5. Send Telegram dashboard:
```
📊 Izbica24 Daily Stats (last 24h)
💰 Cost: $1.23 / $5.00 (24%)
📥 Items received: 47
📤 Items pushed: 38
❌ Errors: 2
🏆 Most active: 01-rss-ddwloclawek (12 runs)
```
6. Jeśli daily cost > 80% limit → priority alert

## ZADANIE

Wygeneruj **17 workflowów n8n w formacie .json** + skrypt importu + skrypt setup Postgres tables.

Pracuj iteracyjnie:

1. **Postgres setup script** (`scripts/init-db.sql`):
- - Tabele: `iz24_n8n_runs`, `iz24_n8n_errors`, `iz24_dedup_cache` (z pgvector dla embeddings)
- - Indexes na `created_at`, `workflow_name`, `prompt_id`

2. **Import script** (`scripts/import-workflows.sh`):
- - Iteruje pliki w `workflows/`
- - Curl-em do n8n REST API: `POST /rest/workflows` z body
- - Aktywuje każdy workflow

3. **Sub-workflow `shared-claude-call.json`** — najważniejszy, używany 8x

4. **Sub-workflow `shared-wp-incoming.json`**

5. **Sub-workflow `shared-prompt-fetcher.json`**

6. **Sub-workflow `shared-cost-guard.json`**

7. **Sub-workflow `shared-error-handler.json`**

8. **Workflow `01-rss-ddwloclawek.json`** — najpełniejszy, wzorzec dla pozostałych

9. **Workflowy 02-06** (ingestion) — bazując na 01

10. **Workflowy 07-12** (processing + dedup)

11. **Workflowy 13-16** (publication)

12. **Workflow 17** (monitoring)

13. **README.md** — instrukcja importu, troubleshooting, kalibracja cost guard

14. **Test script** (`scripts/test-end-to-end.sh`) — wywołuje webhook test, czeka na pojawienie się w WP, weryfikuje przez REST API

## STANDARDY n8n

- - **Naming nodes:** snake_case lub Title Case, opisowe (np. "Fetch RSS Feed", "Parse Items", "Check Duplicate")
- - **Sticky notes:** każdy workflow ma 1-2 sticky notes z opisem celu i flow
- - **Error workflow:** każdy workflow ma "Error Trigger" połączony z `shared-error-handler`
- - **Tags:** taguj workflow: `ingestion`, `processing`, `publication`, `monitoring`, `shared`
- - **Versioning:** w nazwie workflow dodaj `v1.0` (np. "01-rss-ddwloclawek-v1.0")
- - **Variables:** wszystkie sekrety przez Credentials (nie hardcoded), wszystkie configi przez n8n Variables
- - **Idempotency:** każde wywołanie do WP musi mieć `X-Idempotency-Key` header
- - **Logging:** krytyczne nody logują do Postgres przez "Postgres" node
- - **Retry:** HTTP nody mają retry on fail = true, max retries = 3, exponential backoff

## ACCEPTANCE CRITERIA

- - [ ] `scripts/init-db.sql` tworzy 3 tabele bez błędów
- - [ ] `scripts/import-workflows.sh` importuje 17 workflowów
- - [ ] Każdy workflow można otworzyć w n8n UI bez warning
- - [ ] `shared-claude-call` zwraca prawidłowy response na test prompt
- - [ ] `shared-wp-incoming` wysyła do WP, response 201
- - [ ] `shared-cost-guard` blokuje gdy daily > $5
- - [ ] `01-rss-ddwloclawek` po manualnym trigger przetwarza 5+ items i 1+ ląduje w WP
- - [ ] `04-perplexity-research` zwraca min 3 unique URLs per query
- - [ ] `12-dedup-similarity` wykrywa duplikat tytułu po Levenshtein 90%
- - [ ] `17-cost-monitor` wysyła Telegram message
- - [ ] Wszystkie error workflows triggerują na test
- - [ ] End-to-end test: webhook → przez 5 workflowów → raw_item w WP < 60s
- - [ ] Idempotency: 2x ten sam external_id → tylko 1 raw_item w WP
- - [ ] README pokrywa wszystkie 17 workflowów

## PYTANIA DO MNIE PRZED STARTEM

Zadaj maksymalnie 5 pytań. Sugerowane:
1. Czy używać Voyage AI czy OpenAI text-embedding-3-small dla dedup w stage 3?
2. Czy `04-perplexity-research` ma scrape-ować URL-e z citations czy poprzestać na summary z Perplexity?
3. Czy chcesz osobne workflow dla każdego RSS źródła (lepsza obserwowalność) czy 1 generic z config?
4. Czy logging do Postgres ma być sync (każdy node) czy async (batch co 1 min)?
5. Czy włączać `EXECUTIONS_DATA_PRUNE` w n8n (oszczędność disku) czy trzymać 90 dni dla audytu?

Jeśli wszystko jasne — napisz "Zaczynam" i przejdź do kroku 1.


## 6. Test scenariusze po Sesji N5
A. Test infrastruktury (15 min):
docker compose ps — wszystkie containery healthy
https://n8n.izbica24.pl otwiera się, login działa
SSL cert ważny (Caddy auto-issued)
docker compose logs caddy — brak errorów
Backup script wykonuje się (manual ./backup.sh) i pliki w B2
B. Test sub-workflowów (30 min):
shared-claude-call: manual execute z {prompt_slug: 'rewrite-news', context: {title: 'Test', content_html: '<p>Test</p>'}} → response z Claude content
shared-wp-incoming: test payload → response 201 + raw_item_id
shared-cost-guard: ręcznie wstaw 50 wpisów po $0.10 do iz24_n8n_runs → guard zwraca allowed: false
shared-error-handler: test severity=‘critical’ → Telegram natychmiast
C. Test end-to-end RSS (15 min):
W n8n UI manual execute 01-rss-ddwloclawek
Zobacz execution log — wszystkie nody zielone
Otwórz WP → Newsroom Queue
Powinno być 5-15 nowych raw_items z source ddwloclawek
Każdy ma metadata iz24_metadata.ai_processing z costs
Sprawdź iz24_processing_log — entries: received, classified, rewritten, factchecked, pushed
D. Test deduplikacji (10 min):
Manual execute 01-rss-ddwloclawek 2 razy z rzędu
Pierwszy run: 10 raw_items utworzonych
Drugi run: 0 nowych (wszystkie dedup hit)
Sprawdź n8n executions: drugi run skróconym flow (early return po dedup)
E. Test Perplexity (10 min):
Manual execute 04-perplexity-research
Każda query zwraca min 3 unique URLs
URL-e są scrape-owane (sprawdź n8n HTTP Request node response sizes)
raw_items pushed do WP z source n8n_perplexity_research
F. Test OSP Facebook (10 min):
Manual execute 05-fb-graph-osp
Last 24h posts pobrane z Graph API
Każdy post → raw_item z category na-sygnale
Sprawdź że 09-na-sygnale-formatter przekształcił content na format strukturalny (typ zdarzenia, lokalizacja, jednostki)
G. Test cost guard (5 min):
Symuluj 100 zapytań Claude w jednym dniu
Po przekroczeniu $5 → workflow zatrzymuje się, Telegram alert
Następnego dnia (po 00:00) → cost reset, workflowy znów działają
H. Test Monitoring (5 min):
Manual execute 17-cost-monitor
Telegram dostaje formatted dashboard
Wykres dzienny w n8n widoczny
I. Test idempotency (10 min):
Wyślij ten sam webhook 5x z tym samym external_id
WP raw_items: tylko 1
n8n executions: 5 runs, ale 4 zwracają duplicate=true early
J. Test resilience (15 min):
Wyłącz Postgres na 2 minuty
Workflowy n8n w queue mode → executions czekają
Po włączeniu Postgresa → automatic resume
Brak data loss
K. Test feedback loop (15 min):
Po 10 raw_items pushed (z A/B test active na rewrite-news)
Manual execute test ręczny: zaakceptuj 5 draftów (z N2 “Approve→Draft”), edytuj 3, odrzuć 2
Sprawdź WP wp_iz24_prompt_runs table — feedback rows present
Otwórz Prompt Analytics → metryki accept_rate update

## 7. Konfiguracja po Sesji N5
Wszystkie workflowy aktywuj (toggle “Active” w n8n UI)
Wyloguj się z basic auth — używaj owner account (bezpieczniejsze)
Skonfiguruj 2FA w n8n Settings → Personal
Cost limits w n8n Variables:
IZ24_BUDGET_DAILY_USD = 5.0
IZ24_BUDGET_MONTHLY_USD = 100.0
IZ24_BUDGET_PER_RUN_MAX_USD = 0.50

Telegram chat dodaj do swojej listy — będziesz dostawał alerty
Pierwsze 7 dni — nadzoruj uważnie:
Codziennie sprawdzaj n8n executions
Codziennie zaglądaj do Newsroom Queue (czy jakość OK?)
Codziennie patrz Cost Monitor (czy budget realistyczny?)
Tweaking promptów (z N4):
Po tygodniu zauważysz że niektóre prompty słabo działają
Wracaj do N4, edytuj, A/B test, mierz

## 8. Troubleshooting cheat sheet

## 9. Po Sesji N5 — co dalej
Masz kompletną fabrykę treści. Brakuje:
Monitoring kosztów długoterminowy (sesja N6)
Dashboardy redaktorskie (cofnijmy się do N2 jeśli trzeba ulepszyć)
Frontend WordPress (oddzielny projekt, sesje F1-Fx)
Kolejna w sesji N6 — monitoring doda warstwę obserwowalności: cost dashboards, Telegram alerts (już częściowo z N5, ale rozszerzony), miesięczne raporty PDF, integracja Grafana (opcjonalnie), historia tokenów Claude/Perplexity.
Idę dalej z Sesją N6 w następnej wiadomości.


| Problem | Diagnoza | Fix |
| --- | --- | --- |
| n8n nie startuje | docker compose logs n8n | sprawdź ENCRYPTION_KEY, DB connection |
| Caddy 502 | docker compose logs caddy | DNS A record, port 443 firewall |
| Workflowy zatrzymane | Cost guard | sprawdź iz24_n8n_runs, podnieś budget |
| Brak raw_items w WP | shared-wp-incoming errors | token expired? rate limit? |
| Claude 429 | rate limit Anthropic | dodaj retry, downgrade do haiku |
| Deduplikacja false positives | Levenshtein próg za niski | podnieś z 85% do 90% |
| RSS feed broken | ddwloclawek.pl down | error handler aktywny, log warning |
| FB token expired | po 60 dniach | rotate przez Meta Business Suite |
| Postgres full disk | execution data prune off | włącz EXECUTIONS_DATA_PRUNE |
| Telegram spam | severity threshold za niski | podnieś do ‘warning’ |
