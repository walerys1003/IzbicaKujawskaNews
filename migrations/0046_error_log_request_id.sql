-- FAZA 1 / B7 — powiązanie wpisu w error_log z konkretnym żądaniem HTTP
--
-- Tabela error_log (migracja 0043) przechowywała komunikat i ślad stosu,
-- ale nie sposób było powiązać wpisu z odpowiedzią, którą zobaczył klient.
-- Użytkownik zgłaszający „strona wyrzuciła błąd” nie miał czego podać
-- redakcji, a redakcja nie miała czego szukać w logu.
--
-- Dodajemy request_id (ten sam, który trafia do koperty JSON i nagłówka
-- x-request-id) oraz podstawowy kontekst żądania.

ALTER TABLE error_log ADD COLUMN request_id TEXT;
ALTER TABLE error_log ADD COLUMN method TEXT;
ALTER TABLE error_log ADD COLUMN status INTEGER;
ALTER TABLE error_log ADD COLUMN code TEXT;
ALTER TABLE error_log ADD COLUMN user_agent TEXT;
ALTER TABLE error_log ADD COLUMN ip TEXT;

CREATE INDEX IF NOT EXISTS idx_error_log_request_id ON error_log(request_id);
CREATE INDEX IF NOT EXISTS idx_error_log_code ON error_log(code);
CREATE INDEX IF NOT EXISTS idx_error_log_status ON error_log(status);
