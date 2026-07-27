# Dokumentacja izbica24.pl

Centralny indeks dokumentacji technicznej portalu Izbica24 zbudowanego na Cloudflare Pages + Workers, Hono, D1, KV, R2, AI newsroom i n8n.

---

## 🔴 AUDYT I PLAN WDROŻENIA (2026-07-27) — CZYTAJ NAJPIERW

Szczegółowy audyt analityczny stanu projektu wraz z planem prac. **Stan realizacji całości: ≈32 %.**

| Dokument | Zakres | Realizacja | Etapy |
|---|---|---|---|
| [**00-AUDYT-OGOLNY.md**](./00-AUDYT-OGOLNY.md) | Podsumowanie, procenty, 11 ustaleń krytycznych K1–K11 | — | — |
| [**01-FRONTEND.md**](./01-FRONTEND.md) | Front-end publiczny + panel redakcyjny | 88 % / 35 % | F1–F7 |
| [**02-BACKEND.md**](./02-BACKEND.md) | Logika biznesowa, role, workflow publikacji | 12 % | B1–B8 |
| [**03-BAZA-DANYCH.md**](./03-BAZA-DANYCH.md) | D1, 51 migracji, seed, FTS5, backup | 8 % | D1–D9 |
| [**04-API.md**](./04-API.md) | Endpointy, kontrakty, auth, testy | 25 % | A1–A10 |
| [**05-INTEGRACJE.md**](./05-INTEGRACJE.md) | R2, KV, sekrety, e-mail, push, mapy, RSS | 10 % | I1–I12 |
| [**06-AI.md**](./06-AI.md) | **Edytor artykułów wspierany AI** — 6 wymagań W1–W6 | 30 % kod / 0 % UI | AI1–AI12 |
| [**07-ROADMAP.md**](./07-ROADMAP.md) | **Wszystkie 52 etapy w kolejności wykonania** | — | 5 faz |

### Trzy ustalenia krytyczne

1. **Brak bindingu D1** — 51 migracji nie ma do czego być zaaplikowanych; ~6 000 LOC backendu nigdy nie wykonano
2. **Kolizja schematów tabeli `articles`** — dwie niekompatybilne definicje; alfabetycznie wygrywa uboższa, błąd ujawni się dopiero na produkcji
3. **Panel admina otwarty dla wszystkich** — `requireAdmin` przy braku `JWT_SECRET` przydziela rolę `admin`

---

## Spis treści (dokumentacja techniczna)

- [ARCHITECTURE.md](./ARCHITECTURE.md) — architektura systemu i przepływy
- [API.md](./API.md) — referencja REST API
- [DEPLOYMENT.md](./DEPLOYMENT.md) — wdrożenie krok po kroku
- [DEVELOPMENT.md](./DEVELOPMENT.md) — lokalny setup i workflow
- [CONTRIBUTING.md](./CONTRIBUTING.md) — zasady pracy z repozytorium
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — standard współpracy
- [SECURITY.md](./SECURITY.md) — polityka bezpieczeństwa
- [CHANGELOG.md](./CHANGELOG.md) — historia zmian
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) — przewodnik migracji środowisk i schematu
- [AI_PROMPTS.md](./AI_PROMPTS.md) — katalog 15 promptów newsroomowych
- [RAG_ENDPOINTS.md](./RAG_ENDPOINTS.md) — opis 20 endpointów RAG
- [N8N_WORKFLOWS.md](./N8N_WORKFLOWS.md) — instrukcje dla 30 workflowów
- [AUTH.md](./AUTH.md) — JWT, sesje i 2FA
- [D1_SCHEMA.md](./D1_SCHEMA.md) — schemat bazy D1
- [KV_NAMESPACES.md](./KV_NAMESPACES.md) — przeznaczenie 15 namespace'ów KV
- [R2_BUCKETS.md](./R2_BUCKETS.md) — przeznaczenie 20 bucketów R2
- [SEO.md](./SEO.md) — SEO, robots, sitemap i social cards
- [PERFORMANCE.md](./PERFORMANCE.md) — tuning wydajności i budżety
- [MONITORING.md](./MONITORING.md) — obserwowalność i health-checki

## Szybki start

1. `npm ci`
2. `npm run build`
3. `npm run preview`
4. `bash scripts/health-check.sh`

## Środowiska

- lokalne: `wrangler.jsonc`
- staging: `wrangler-staging.jsonc`
- production: `wrangler-prod.jsonc`
