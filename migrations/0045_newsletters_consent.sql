-- Uzupełnienie tabeli `newsletters` (schemat kanoniczny z 0002_core_schema.sql)
-- o wersję zgody marketingowej, wymaganą przy rozliczalności zgód (RODO art. 7 ust. 1).
--
-- Kontekst: src/repository/index.ts odwoływał się do tabeli `newsletter_subs`,
-- która nigdy nie istniała w schemacie — każde żądanie
-- POST /api/v1/newsletter/subscribe kończyło się błędem
-- "no such table: newsletter_subs". Zapytania przepisano na `newsletters`,
-- a jedyną brakującą kolumnę dodaje ta migracja.
--
-- Tabela `newsletter_subscribers` z migracji 0006 pozostaje nieużywana przez
-- kod aplikacji i nie jest tu modyfikowana.
ALTER TABLE newsletters ADD COLUMN consent_version TEXT NOT NULL DEFAULT '1.0';

CREATE INDEX IF NOT EXISTS idx_newsletters_consent_version ON newsletters(consent_version);
CREATE INDEX IF NOT EXISTS idx_newsletters_status_created ON newsletters(status, created_at DESC);
