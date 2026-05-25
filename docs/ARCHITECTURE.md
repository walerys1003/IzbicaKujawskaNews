# Architektura systemu

## Stack

- Frontend SSR: Hono JSX + Cloudflare Pages Functions
- Build: Vite
- Dane transakcyjne: Cloudflare D1 (SQLite)
- Cache / runtime state: Cloudflare KV
- Asset storage: Cloudflare R2
- AI: OpenAI + Anthropic
- Automatyzacja: n8n

## Diagram ASCII

```text
                 ┌──────────────────────────┐
                 │  GitHub / CI / Actions   │
                 └────────────┬─────────────┘
                              │ deploy
                              ▼
┌──────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│  Browser     │────▶│ Cloudflare Pages + Hono │────▶│   D1 (SQL + FTS5)   │
└──────────────┘     │ SSR + API + Public Pages│     └─────────────────────┘
                     │ /api/v1 /api/ai /api/rag│────▶ KV (flags/cache/queue)
                     └────────────┬─────────────┘────▶ R2 (media/archive)
                                  │
                                  ▼
                      ┌─────────────────────────┐
                      │  OpenAI / Anthropic     │
                      │  prompts + embeddings   │
                      └────────────┬────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ n8n newsroom flows   │
                        │ ingest / publish /   │
                        │ alerts / backups     │
                        └──────────────────────┘
```

## Warstwy

1. **Presentation** — strona główna, kategorie, artykuły, strony publiczne, błędy.
2. **Delivery** — Hono routes, renderer i edge middleware.
3. **Application** — auth, AI prompts, RAG, SEO, automatyzacja publikacji.
4. **Data** — D1 migrations, FTS5, embeddings, analityka.
5. **State / Cache** — KV dla flag, cache i rate-limitów.
6. **Blob storage** — R2 dla mediów, eksportów, backupów.
7. **Operations** — GitHub Actions, deploy, smoke tests, monitoring.

## Granice odpowiedzialności

- `src/index.tsx` — routing SSR i mount API.
- `src/api/v1.ts` — REST dla rdzenia portalu i auth.
- `src/routes/ai.ts` — prompt registry + structured output.
- `src/routes/rag.ts` — indexing, retrieval, QA i heurystyki redakcyjne.
- `migrations/*.sql` — źródło prawdy dla D1.
- `n8n-workflows/*.json` — automatyzacja importu, SEO, social i backupów.
