# Izbica24 — Portal Gminy Izbica Kujawska

> **Magazyn Kujawski Premium** — kompletny portal informacyjny gminy Izbica Kujawska zbudowany na Cloudflare Pages + Workers + Hono + TypeScript

## 🎯 Status Projektu

**Faza implementacji**: 1-5 z 10 — **~435/590 zadań ukończonych (74%)**

| Faza | Sandbox | Zakres | Zadania | Status |
|------|---------|--------|---------|--------|
| 1.1+1.2+1.3 | S1 | D1 schema + 15 typed models + base routes + RSS/sitemap | 45 | ✅ MERGED |
| 1.4+2.1+2.2 | S2 | Frontend enhancements + D1 migrations + 15 KV wrappers | 50 | ✅ MERGED |
| 2.3+2.4+3.1 | S3 | 20 R2 buckets + FTS5 + 16 JWT auth routes + PBKDF2 | 55 | ✅ MERGED |
| 3.2+3.3+4.1 | S4 | Admin Panel + Tiptap WYSIWYG + AI Newsroom workflow | 65 | ✅ MERGED |
| 4.2+4.3+4.4 | S5 | 15 AI prompts + 20 RAG endpoints + 30 n8n workflows | 65 | ✅ MERGED |
| 5.1+5.2+5.3 | S6 | Media library + Galleries + Podcast + Video | 55 | ✅ MERGED |
| 6.1+6.2+6.3 | S7 | Web Push + Analytics + Search UI + autocomplete | 50 | ✅ MERGED |
| 8.2+9.1+9.2 | S9 | Vitest + Playwright + 10 monitoring modules + backup | 50 | ✅ MERGED |
| 10.1+10.2+10.3 | S10 | CI/CD + 20 docs + Public pages + Performance edge | 50 | ✅ MERGED |
| 7.1+7.2+8.1 | S8 | SEO advanced + Admin UI + Newsletter advanced | 60 | ⚠️ PARTIALLY (truncated agent) |
| Phase 5-10 extra | — | Reserved for next batch | ~110 | ⏳ TODO |

## 🏗️ Architektura

### Tech Stack
- **Runtime**: Cloudflare Workers (edge globally distributed)
- **Framework**: Hono 4.x + JSX SSR via `hono/jsx-renderer`
- **Database**: Cloudflare D1 (SQLite, 60+ migracji)
- **Cache/Sessions**: 15 Cloudflare KV namespaces (typed wrappers)
- **Storage**: 20 Cloudflare R2 buckets
- **Auth**: JWT (hono/jwt) + PBKDF2 password hashing (Web Crypto API)
- **AI**: OpenAI GPT-4o-mini + Anthropic Claude 3.5 Sonnet (15 newsroom prompts)
- **RAG**: Cloudflare Vectorize fallback + D1 cosine similarity
- **Search**: SQLite FTS5 + Polish stemmer + spell-suggest
- **Editor**: Tiptap WYSIWYG (CDN)
- **Testing**: Vitest + Playwright

### Endpointy API (290+ registered)

**Public:**
- `/` — strona główna (25 modułów, Magazyn Kujawski Premium)
- `/szukaj?q=` — wyszukiwanie z FTS5
- `/o-nas`, `/kontakt`, `/regulamin`, `/polityka-prywatnosci`, `/cookies`, `/redakcja`, `/reklama`, `/kariera`, `/dla-prasy`, `/dostepnosc`
- `/sitemap.xml`, `/sitemap-news.xml`, `/rss`, `/rss/:category`, `/robots.txt`, `/humans.txt`
- `/manifest.json`, `/security.txt`

**API v1:**
- `/api/v1/articles`, `/api/v1/articles/:slug` — artykuły CRUD
- `/api/v1/categories`, `/api/v1/tags`, `/api/v1/popular`, `/api/v1/latest`
- `/api/v1/comments/*`, `/api/v1/newsletter/*`, `/api/v1/alerts/*`
- `/api/v1/auth/*` — 16 endpointów (register, login, logout, refresh, magic-link, verify-email, reset-password, change-password, profile, delete-account, 2fa-enable/verify, social-google/facebook, api-keys, sessions)
- `/api/v1/health`, `/api/v1/version`, `/api/v1/metrics`

**AI Newsroom:**
- `/api/ai/prompts` — lista 15 promptów (headline, lead, tldr, seo-meta, fact-checker, tone-rewriter, quote-extractor, tags-classifier, image-prompt, social-snippets, newsletter-blurb, push-notification, translate-pl-en, plain-language, comments-moderator)
- `/api/ai/prompt/:id` — wywołanie konkretnego promptu

**RAG (20 endpointów):**
- `/api/rag/ingest/article`, `/api/rag/search`, `/api/rag/ask`, `/api/rag/similar/:slug`
- `/api/rag/summarize-cluster`, `/api/rag/timeline/:topic`, `/api/rag/compare`
- `/api/rag/topics`, `/api/rag/recommend/:userId`, `/api/rag/auto-categorize`
- + 10 dodatkowych endpointów RAG

**Media + Galleries + Podcast/Video (55 endpointów):**
- `/api/media/upload`, `/api/media/library`, `/api/media/:id/optimize`
- `/api/galleries/*` — 15 endpointów
- `/api/podcast/episodes`, `/api/podcast/rss`, `/api/video/*` — 20 endpointów

**Push + Analytics + Search (50 endpointów):**
- `/api/push/subscribe`, `/api/push/send-broadcast`, `/api/push/breaking`
- `/api/analytics/pageview`, `/api/analytics/dashboard`, `/api/analytics/realtime`
- `/api/search/autocomplete`, `/api/search/trending`, `/api/search/spell-check`

**Admin (Sandbox 4 + 9):**
- `/admin` — Dashboard, Articles, Categories, Comments, Media, Settings
- `/admin/logs`, `/admin/errors`, `/admin/slow-queries`
- `/admin/backup-list`, `/admin/backup-create`, `/admin/backup-restore`

## 🚀 Deployment

**Local development:**
```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
# Test: curl http://localhost:3000
```

**Cloudflare Pages deployment:**
```bash
npm run build
npx wrangler pages deploy dist --project-name izbica24-portal
```

**Database migrations:**
```bash
npx wrangler d1 migrations apply izbica24-production --local  # dev
npx wrangler d1 migrations apply izbica24-production           # prod
```

## 📁 Struktura

```
webapp/
├── src/
│   ├── ai/                # AI prompts (15) + RAG (embedder, vector-store)
│   ├── api/v1.ts          # REST API v1 sub-app
│   ├── components/        # JSX SSR (HomeV3, ArticlePage, AdminPanel, ...)
│   ├── db/                # Typed D1 models + repositories
│   ├── lib/               # kv/, backup/, monitoring/, performance/
│   ├── middleware/        # request-id, request-logger, error-handler
│   ├── monitoring/        # 10 modules (logger, metrics, tracing, ...)
│   ├── routes/
│   │   ├── admin/         # 8 admin routes
│   │   ├── auth/          # 16 JWT auth routes
│   │   ├── public/        # 10 public pages
│   │   ├── v1/            # health, metrics, version + media-list, etc.
│   │   ├── ai.ts, rag.ts, push, analytics, search, ai-newsroom
│   │   └── media-lib, galleries, podcast, video
│   ├── seo/               # sitemap, jsonld, og
│   └── types/             # env.ts (Bindings: 15 KV + 20 R2 + D1 + secrets)
├── migrations/            # 60+ D1 SQL migrations
├── n8n-workflows/         # 30 n8n JSON templates (RSS ingest, social publish, ...)
├── docs/                  # 20 markdown docs (architecture, api, auth, ...)
├── tests/                 # vitest unit + integration + playwright e2e
├── public/static/         # vitals.js, push-client.js, search.js, sw.js
├── scripts/               # deploy, migrate, seed, backup, rollback
└── .github/workflows/     # CI, CodeQL, deploy-preview/prod, lighthouse
```

## 🔗 URLs

- **GitHub**: https://github.com/walerys1003/IzbicaKujawskaNews
- **Local dev**: http://localhost:3000
- **Sandbox preview**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai

## 📊 Build Stats (ostatni build)
- **Modules transformed**: 246
- **dist/_worker.js**: 409.66 KB
- **Build time**: 3.09s (Vite 6.4.2)

## ✅ Testy Smoke (zweryfikowane)
- `GET /` → HTTP 200, 151 KB HTML
- `GET /healthz` → HTTP 200
- `GET /api/v1/health` → HTTP 200 JSON
- `GET /api/ai/prompts` → HTTP 200 (15 promptów)

## 🚧 TODO — pozostałe zadania (~155 z 590)

### Sandbox 8 — Faza 7.1+7.2+8.1 (60 zadań) — TRUNCATED, do re-run:
- 15 SEO advanced (sitemap-images.xml, IndexNow, JSON-LD complete)
- 25 Admin UI Dashboard (drag-drop sort, AI buttons w editorze, charts)
- 20 Newsletter advanced (segments, campaigns, A/B test, Mailchimp/Resend integration)

### Phase 5-10 extras (~95 zadań):
- Real-time WebSocket alternative (Server-Sent Events)
- PWA install banner + offline mode
- Live blog feature (commenting + auto-refresh)
- Dyżury aptek + lekarzy z auto-rotation
- Pogoda widget + AQI integration (IMGW + GIOŚ)
- Strona partnerów + reklamodawców
- Ranking sołectw
- Galeria fotografów (UGC submissions)
- Live transmisje z sesji Rady Gminy
- Mobile app PWA manifest + icons full set

## 📜 Licencja
Proprietary — Gmina Izbica Kujawska

---

**Last Updated**: 2026-05-25
**Tech Lead**: WordPress Innovation Seeker (walerys1003)
**Orchestration**: Multi-sandbox parallel build (10 sub-agents, 590-task roadmap)
