# Migration Guide

## Schemat D1

1. Zrób backup.
2. Uruchom `bash scripts/migrate.sh staging`.
3. Zweryfikuj `migrations/0021-0028` dla FTS5.
4. Uruchom `bash scripts/seed.sh` jeśli środowisko jest puste.

## Zmiana środowiska

- lokalne → staging: `wrangler-staging.jsonc`
- staging → prod: `wrangler-prod.jsonc`

## Migracja promptów i workflowów

- prompty są wersjonowane w `src/ai/prompts`
- workflowy n8n importuj z `n8n-workflows/*.json`
