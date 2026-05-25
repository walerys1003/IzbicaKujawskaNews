# Dokumentacja izbica24.pl

Centralny indeks dokumentacji technicznej portalu Izbica24 zbudowanego na Cloudflare Pages + Workers, Hono, D1, KV, R2, AI newsroom i n8n.

## Spis treści

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
