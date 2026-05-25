# RAG Endpoints

## Lista 20 endpointów

1. POST `/api/rag/ingest/article`
2. POST `/api/rag/ingest/bulk`
3. DELETE `/api/rag/document/:slug`
4. POST `/api/rag/search`
5. POST `/api/rag/ask`
6. GET `/api/rag/similar/:slug`
7. POST `/api/rag/summarize-cluster`
8. POST `/api/rag/timeline/:topic`
9. POST `/api/rag/compare`
10. POST `/api/rag/translate-context`
11. GET `/api/rag/topics`
12. POST `/api/rag/qa-archive`
13. POST `/api/rag/recommend/:userId`
14. POST `/api/rag/auto-categorize`
15. POST `/api/rag/find-duplicates`
16. POST `/api/rag/expand-stub`
17. POST `/api/rag/fact-check`
18. GET `/api/rag/stats`
19. POST `/api/rag/reindex`
20. GET `/api/rag/health`

## Typowe scenariusze

- import pojedynczego artykułu do embeddings
- odpowiedź na pytanie z cytowaniami
- sugestia kategorii i duplikatów przed publikacją
- tłumaczenie z lokalnym kontekstem
