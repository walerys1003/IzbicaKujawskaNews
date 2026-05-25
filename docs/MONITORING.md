# Monitoring

## Minimum operacyjne

- `GET /api/v1/health`
- `GET /api/rag/health`
- `bash scripts/health-check.sh`
- GitHub Actions status
- logi deployów Cloudflare

## Alerty

- błąd deployu prod
- spadek Lighthouse
- brak klucza AI dla endpointów `/api/ai` i `/api/rag`
- wzrost błędów 5xx po wdrożeniu
