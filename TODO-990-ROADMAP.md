# 📋 izbica24.pl — Multi-Sandbox Roadmap 990 zadań (10 Sub-Agentów)

**Data startu**: 2026-05-26
**Stan bazowy**: 33% DONE, 23% STUB, 10% PARTIAL, 34% TODO (z audytu 590)
**Cel**: 95%+ DONE do końca fazy, launch-ready portal

---

## 🏗️ 10 Sub-Agentów — Podział pracy

| # | Sub-Agent | Zakres | Zadań | Priorytet |
|---|-----------|--------|-------|-----------|
| SA1 | D1 Production | D1 integration, repository layer, end of mock data | ~100 | 🔴 P0 |
| SA2 | Router Mounting | Mount orphaned routers (push/search/newsletter) + new API | ~100 | 🔴 P0 |
| SA3 | CI/CD | GitHub Actions, deploy, lint, test, lighthouse | ~100 | 🔴 P0 |
| SA4 | Security + GDPR | Security headers, RODO, cookie consent, legal | ~100 | 🔴 P0 |
| SA5 | Admin Panel | Real data from D1, full CRUD, real auth | ~100 | 🟠 P1 |
| SA6 | Frontend Components | Comments, Share, Newsletter, SearchModal, UI polish | ~100 | 🟠 P1 |
| SA7 | SEO + Performance + A11y | Advanced SEO, Core Web Vitals, WCAG | ~100 | 🟠 P1 |
| SA8 | Missing Pages & Routes | Static pages, tag pages, podkategorie | ~100 | 🟡 P2 |
| SA9 | Email + Newsletter + Integrations | Email provider, double opt-in, social media | ~95 | 🟡 P2 |
| SA10 | Testing + Monitoring | Vitest, Playwright, monitoring, alerts | ~95 | 🟡 P2 |

---

## SA1 — D1 Production Integration (~100 zadań) 🔴 P0

**Cel**: Wyeliminować `data-articles.ts` mock data. Wszystkie endpointy API używają D1.

### SA1.1 — Repository Layer (20 zadań)
SA1-001..020: Dokończenie i podpięcie wszystkich repozytoriów
- articles, categories, comments, tags, users, events, media, newsletters
- obituaries, job-offers, real-estate, settings, audit-log, redirects
- weather-cache, analytics, search-queries, push-subscriptions

### SA1.2 — API Refactor (30 zadań)
SA1-021..050: Przepisanie api/v1.ts na D1
- GET /articles → D1 query
- GET /articles/:slug → D1
- POST /articles (admin) → D1
- PUT /articles/:id → D1
- DELETE /articles/:id → D1
- GET /categories → D1
- GET /tags → D1
- GET /popular, /latest → D1
- POST /comments → D1
- GET /comments → D1
- Newsletter subscribe/unsubscribe → D1
- Alerts CRUD → D1
- Events CRUD → D1
- Obituaries CRUD → D1
- Job offers CRUD → D1
- Real estate CRUD → D1
- Settings CRUD → D1

### SA1.3 — D1 Migrations Final (20 zadań)
SA1-051..070: Finalne migracje
- indexes optymalizacyjne
- constraints
- seed data produkcyjne

### SA1.4 — KV Integration (15 zadań)
SA1-071..085: KV caching dla D1 queries

### SA1.5 — R2 Integration Final (15 zadań)
SA1-086..100: R2 upload/download production-ready

---

## SA2 — Router Mounting + New API (~100 zadań) 🔴 P0

### SA2.1 — Mount orphaned routers (15 zadań)
SA2-001..015: Podpięcie push, search, analytics do main app

### SA2.2 — New API endpoints (40 zadań)
SA2-016..055: Nowe endpointy

### SA2.3 — WebSocket/SSE (15 zadań)
SA2-056..070: Real-time features

### SA2.4 — API documentation (15 zadań)
SA2-071..085: OpenAPI/Swagger

### SA2.5 — API versioning (15 zadań)
SA2-086..100: API v2

---

## SA3 — CI/CD (~100 zadań) 🔴 P0

### SA3.1 — GitHub Actions (30 zadań)
SA3-001..030: CI, deploy, lint, test

### SA3.2 — Deploy pipelines (25 zadań)
SA3-031..055: Staging, production, rollback

### SA3.3 — Quality gates (25 zadań)
SA3-056..080: Lighthouse, bundle-size, coverage

### SA3.4 — Dependabot + security (20 zadań)
SA3-081..100: Dependency scanning, secret scanning

---

## SA4 — Security + GDPR (~100 zadań) 🔴 P0

### SA4.1 — Security headers (20 zadań)
SA4-001..020: CSP, HSTS, X-Frame-Options, etc.

### SA4.2 — GDPR/RODO (30 zadań)
SA4-021..050: Cookie consent, data export, deletion

### SA4.3 — Auth hardening (25 zadań)
SA4-051..075: Rate limiting, lockout, audit

### SA4.4 — Legal pages (25 zadań)
SA4-076..100: Regulamin, privacy, AI disclaimer

---

## SA5 — Admin Panel Real Data (~100 zadań) 🟠 P1

### SA5.1 — Login page (10 zadań)
SA5-001..010: Admin login UI

### SA5.2 — Articles CRUD (20 zadań)
SA5-011..030: Real article management

### SA5.3 — Comments moderation (15 zadań)
SA5-031..045: Real comment moderation

### SA5.4 — Users management (15 zadań)
SA5-046..060: Real user management

### SA5.5 — Media library (15 zadań)
SA5-061..075: Real media management

### SA5.6 — Settings + Analytics (15 zadań)
SA5-076..090: Real settings, analytics dashboard

### SA5.7 — Admin polish (10 zadań)
SA5-091..100: Keyboard shortcuts, dark mode, onboarding

---

## SA6 — Frontend Components (~100 zadań) 🟠 P1

### SA6.1 — Comments system (20 zadań)
SA6-001..020: Comments, CommentForm, moderation UI

### SA6.2 — Share + Social (15 zadań)
SA6-021..035: ShareModal, Web Share API

### SA6.3 — Newsletter UI (15 zadań)
SA6-036..050: NewsletterInline, modal, success/error

### SA6.4 — Search UI (15 zadań)
SA6-051..065: SearchModal, autocomplete, keyboard shortcuts

### SA6.5 — Article enhancements (20 zadań)
SA6-066..085: ReadingProgress, TableOfContents, RelatedArticles, AuthorCard

### SA6.6 — Accessibility UI (15 zadań)
SA6-086..100: DarkModeToggle, FontSizeToggle, ScrollToTop, PrintButton

---

## SA7 — SEO + Performance + A11y (~100 zadań) 🟠 P1

### SA7.1 — Advanced SEO (25 zadań)
SA7-001..025: JSON-LD complete, IndexNow, hreflang, rich results

### SA7.2 — Performance optimization (25 zadań)
SA7-026..050: Critical CSS, code splitting, image optimization, preload

### SA7.3 — Core Web Vitals (25 zadań)
SA7-051..075: LCP, FID, CLS optimization

### SA7.4 — Accessibility (25 zadań)
SA7-076..100: WCAG 2.1 AA, ARIA, keyboard nav, screen reader

---

## SA8 — Missing Pages & Routes (~100 zadań) 🟡 P2

### SA8.1 — Static pages (25 zadań)
SA8-001..025: o-portalu, mapa-strony, telefony, linki, faq, pomoc, sponsorzy, dolacz, rodo

### SA8.2 — Tag pages (15 zadań)
SA8-026..040: /tag/:slug implementation

### SA8.3 — Subcategory pages (20 zadań)
SA8-041..060: Deep category routing

### SA8.4 — Advanced pages (20 zadań)
SA8-061..080: Przeglad, multimedia, galerie

### SA8.5 — Widget pages (20 zadań)
SA8-081..100: Pogoda, paliwo, apteki, lekarze, ranking solectw

---

## SA9 — Email + Newsletter + Integrations (~95 zadań) 🟡 P2

### SA9.1 — Email provider (20 zadań)
SA9-001..020: Resend/SendGrid integration, templates, SPF/DKIM/DMARC

### SA9.2 — Newsletter engine (25 zadań)
SA9-021..045: Double opt-in, segments, campaigns, A/B testing

### SA9.3 — Social media (25 zadań)
SA9-046..070: FB, X, Instagram, Telegram, Mastodon, Bluesky

### SA9.4 — External integrations (25 zadań)
SA9-071..095: IMGW, GIOŚ, Energa, GDDKiA, Google Maps

---

## SA10 — Testing + Monitoring (~95 zadań) 🟡 P2

### SA10.1 — Unit tests (25 zadań)
SA10-001..025: Full Vitest coverage

### SA10.2 — Integration tests (25 zadań)
SA10-026..050: API endpoint tests

### SA10.3 — E2E tests (20 zadań)
SA10-051..070: Playwright scenarios

### SA10.4 — Monitoring final (25 zadań)
SA10-071..095: Sentry, alerts, dashboards, status page

---

## 📊 Harmonogram

| Sprint | Sub-Agenty | Tydzień | Kamień milowy |
|--------|-----------|---------|---------------|
| Sprint 1 | SA1, SA2, SA3, SA4 | Tydzień 1 | Krytyczna infrastruktura |
| Sprint 2 | SA5, SA6, SA7 | Tydzień 2 | Admin + UI + SEO |
| Sprint 3 | SA8, SA9, SA10 | Tydzień 3 | Content + Integracje + Testy |

---

**Razem**: 990 zadań, 10 sub-agentów, 3 sprinty (3 tygodnie)
