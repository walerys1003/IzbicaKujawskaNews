# API Reference

## Konwencje

- Base URL: `/api`
- Format: `application/json`
- Auth: Bearer JWT dla endpointów chronionych
- Główne przestrzenie: `/api/v1`, `/api/ai`, `/api/rag`

## Core API (`/api/v1`)

| Method | Path | Opis |
|---|---|---|
| GET | `/api/v1/health` | health endpoint |
| GET | `/api/v1/articles` | lista artykułów |
| GET | `/api/v1/articles/:slug` | detal artykułu |
| GET | `/api/v1/categories` | lista kategorii |
| GET | `/api/v1/categories/:slug` | detal kategorii |
| GET | `/api/v1/search` | wyszukiwarka artykułów |
| POST | `/api/v1/newsletter/subscribe` | zapis do newslettera |
| POST | `/api/v1/newsletter/unsubscribe` | wypisanie z newslettera |
| GET | `/api/v1/alerts` | alerty i utrudnienia |
| GET | `/api/v1/roads` | dane drogowe |
| GET | `/api/v1/weather` | pogoda |
| GET | `/api/v1/fuel` | ceny paliw |
| POST | `/api/v1/incoming` | bridge z n8n / integracji |
| POST | `/api/v1/comment-submit` | dodanie komentarza |
| POST | `/api/v1/comments` | alias komentarzy |
| POST | `/api/v1/share-count` | inkrementacja udostępnień |
| GET | `/api/v1/rag-search` | proxy / bridge do RAG |
| GET | `/api/v1/auth/*` | auth routes |

## Auth (`/api/v1/auth`)

`register`, `login`, `logout`, `refresh`, `magic-link`, `verify-email`, `reset-password`, `change-password`, `profile`, `delete-account`, `2fa-enable`, `2fa-verify`, `social-google`, `social-facebook`, `api-keys`, `sessions`.

## AI (`/api/ai`)

| Method | Path | Opis |
|---|---|---|
| GET | `/api/ai/prompts` | lista 15 promptów |
| POST | `/api/ai/prompt/:id` | wykonanie promptu ze zmiennymi |

### Przykład requestu

```json
{
  "variables": {
    "title": "Nowa inwestycja drogowa",
    "lede": "Rusza przebudowa ulicy Kościuszki"
  },
  "overrideModel": "gpt-4o-mini"
}
```

## RAG (`/api/rag`)

Pełna lista znajduje się też w `RAG_ENDPOINTS.md`.

| Method | Path |
|---|---|
| POST | `/api/rag/ingest/article` |
| POST | `/api/rag/ingest/bulk` |
| DELETE | `/api/rag/document/:slug` |
| POST | `/api/rag/search` |
| POST | `/api/rag/ask` |
| GET | `/api/rag/similar/:slug` |
| POST | `/api/rag/summarize-cluster` |
| POST | `/api/rag/timeline/:topic` |
| POST | `/api/rag/compare` |
| POST | `/api/rag/translate-context` |
| GET | `/api/rag/topics` |
| POST | `/api/rag/qa-archive` |
| POST | `/api/rag/recommend/:userId` |
| POST | `/api/rag/auto-categorize` |
| POST | `/api/rag/find-duplicates` |
| POST | `/api/rag/expand-stub` |
| POST | `/api/rag/fact-check` |
| GET | `/api/rag/stats` |
| POST | `/api/rag/reindex` |
| GET | `/api/rag/health` |

## Auto-gen friendly notes

- Zachowuj kompatybilność nazw pól i metod HTTP.
- Nowe endpointy dokumentuj tabelą `Method / Path / Auth / Notes`.
- Przykłady payloadów trzymaj jako JSON bez komentarzy.
