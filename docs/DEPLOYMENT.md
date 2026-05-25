# Deployment

## Wymagania

- Node 20+
- konto Cloudflare z Pages, D1, KV i R2
- sekrety: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `JWT_SECRET`, opcjonalnie `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`

## Staging

1. Uzupełnij `wrangler-staging.jsonc`.
2. `npm ci`
3. `npm run build`
4. `bash scripts/migrate.sh staging`
5. `bash scripts/seed.sh`
6. `bash scripts/deploy.sh staging`
7. `bash scripts/health-check.sh https://staging.izbica24.pl`

## Produkcja

1. Uzupełnij `wrangler-prod.jsonc`.
2. Zweryfikuj PR i CI.
3. Merge do `main`.
4. Workflow `deploy-prod.yml` wykona build i deploy.
5. Workflow `db-migrate.yml` zastosuje migracje D1.
6. Po wdrożeniu uruchom smoke przez `scripts/health-check.sh`.

## Rollback

```bash
bash scripts/rollback.sh HEAD~1
```

Skrypt buduje wskazany ref i publikuje poprzednią wersję jako nowy deployment.
