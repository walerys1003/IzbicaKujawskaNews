# ingest-rss-pap

Pobiera RSS PAP/Gazeta.pl, filtruje Izbicę/Kujawy i wysyła draft do /api/articles

## Trigger
- schedule

## Import
1. Import JSON do n8n
2. Uzupełnij credentials i zmienne środowiskowe
3. Zaktualizuj PORTAL_API_BASE oraz klucze integracji

## Główne kroki
- trigger wejściowy
- normalizacja danych
- wywołanie API portalu lub usługi zewnętrznej
- publikacja / alert / zapis
