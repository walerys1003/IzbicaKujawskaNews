# izbica24 Newsroom — n8n VPS Stack

Self-hosted n8n na Hetzner CX22 (4 vCPU / 4 GB RAM / 40 GB SSD, ~5 EUR/mc).

## Architektura

```
┌──────────────────────────────────────────────┐
│ Caddy (TLS auto, Let's Encrypt)              │
│   ↓                                          │
│ n8n main (UI, webhooks) ──► Postgres 16     │
│ n8n-worker-1 ──┐                             │
│ n8n-worker-2 ──┴► Redis 7 (Bull queue)       │
└──────────────────────────────────────────────┘
              │ HTTPS
              ▼
    https://izbica24.pl/wp-json/iz24/v1/incoming
```

## Quickstart

```bash
# 1. Hetzner: utwórz CX22 z Debian 12, SSH key
ssh root@vps.example.com

# 2. Klonuj repo
git clone https://github.com/YOUR/izbica24-portal.git
cd izbica24-portal/n8n

# 3. First-time setup (UFW, Docker, swap, sysctl)
sudo bash scripts/setup.sh
# → utworzy .env z .env.example, EDYTUJ

# 4. Uzupełnij sekrety
nano .env
# - N8N_HOST=n8n.izbica24.pl   (ustaw DNS A record na IP VPS)
# - POSTGRES_PASSWORD, REDIS_PASSWORD, N8N_ENCRYPTION_KEY (openssl rand -hex 32)
# - IZBICA24_API_TOKEN (z `wp iz24 token:generate`)
# - ANTHROPIC_API_KEY

# 5. Start
docker compose up -d
docker compose logs -f n8n

# 6. Otwórz UI: https://n8n.izbica24.pl  → utwórz konto admin

# 7. Zainstaluj cron (daily backup + weekly update)
sudo bash scripts/cron-install.sh
```

## Import workflowów

W UI n8n → Workflows → **Import from File** → wybierz `workflows/01-rss-gazeta-pomorska.json` (i 16 pozostałych).

Lub przez CLI w kontenerze:
```bash
for f in /home/node/workflows/*.json; do
  docker compose exec n8n n8n import:workflow --input="$f"
done
```

## Lista 17 workflowów

| ID | Slug | Trigger | Opis |
|----|------|---------|------|
| 01 | rss-gazeta-pomorska | cron 15min | Gazeta Pomorska — Włocławek RSS |
| 02 | rss-dziennik-kujawski | cron 15min | Dziennik Kujawski RSS |
| 03 | rss-radio-pik | cron 15min | Polskie Radio PiK — filtr „Izbica” |
| 04 | facebook-gmina-izbica | cron 30min | FB Gmina Izbica Kujawska |
| 05 | facebook-osp-izbica | cron 30min | FB OSP Izbica (priority=8) |
| 06 | scrape-powiat-wloclawski | cron 1h | Powiat Włocławski — HTML scrape |
| 07 | scrape-kpp-wloclawek | cron 1h | KPP Włocławek — komunikaty |
| 08 | webhook-form-submission | webhook | Formularz mieszkańca |
| 09 | telegram-tip-line | webhook | Telegram tip-line |
| 10 | ai-rewrite-news | webhook | Claude — rewrite |
| 11 | ai-fact-check | webhook | Claude — fact-check |
| 12 | ai-evergreen-generator | cron 6:00 | Codzienne rocznice (historia) |
| 13 | ai-headline-ab | webhook | A/B test nagłówków |
| 14 | publish-to-wordpress | webhook | Promote raw_item → post |
| 15 | distribute-social | webhook | FB + Telegram + X |
| 16 | cost-sync | cron 1h | n8n cost_log → wp_iz24_cost_runs |
| 17 | health-check | cron 7:00 | Daily Telegram report |

## Maintenance

```bash
# backup (na żądanie)
bash scripts/backup.sh

# restore
bash scripts/restore.sh /var/backups/n8n/n8n_YYYYMMDD_HHMMSS.tar.gz

# update n8n
bash scripts/update.sh

# logi
docker compose logs -f n8n
docker compose logs -f n8n-worker-1
docker compose logs -f caddy
```

## Monitoring

Health endpoint: `https://n8n.izbica24.pl/healthz`  
Metrics (Prometheus): `https://n8n.izbica24.pl/metrics` (włącz `N8N_METRICS=true`)

## Bezpieczeństwo

- UFW: tylko 22, 80, 443
- fail2ban: SSH brute-force protection
- Caddy: automatic HTTPS (Let's Encrypt), HSTS preload
- n8n login wymagany (włącz `N8N_BASIC_AUTH` lub własna auth)
- API token rotacja: `wp iz24 token:revoke <id>` w WordPress
