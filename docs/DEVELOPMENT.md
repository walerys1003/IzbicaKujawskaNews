# Development

## Lokalny setup

```bash
npm ci
cp .envrc .envrc.local # opcjonalnie
npm run dev
```

## Przydatne komendy

- `npm run build` — build SSR
- `npm run preview` — lokalny Pages dev
- `npm run lint` — repo contract checks
- `npm run test` — smoke dla dokumentacji i deploy artefacts
- `npm run health-check` — HTTP smoke po starcie lokalnym

## Struktura katalogów

- `src/components` — komponenty stron i modułów
- `src/routes` — sub-aplikacje Hono
- `migrations` — SQL dla D1 / FTS5 / RAG
- `n8n-workflows` — gotowe workflowy newsroomu
- `docs` — dokumentacja operacyjna i referencyjna

## Workflow developera

1. branch feature/fix
2. zmiana kodu + dokumentacji
3. `npm run build`
4. PR z checklistą
