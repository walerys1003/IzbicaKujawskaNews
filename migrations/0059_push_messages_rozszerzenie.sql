-- 0059 — s8: migracja magazynu push z KV do D1 (tabele z 0036 były puste).
--
-- Typ PushMessageRecord zawiera od etapu I8 pola raportu wysyłki
-- (attempted/failed/removedSubscribers/failureReasons/failureReason/
-- failureDetail), których schemat 0036 nie przewidział — powstał przed
-- naprawą fałszywego raportowania. Bez tych kolumn zapis do D1 gubiłby
-- dokładnie te informacje, dla których raport naprawiono.
ALTER TABLE push_messages ADD COLUMN attempted INTEGER;
ALTER TABLE push_messages ADD COLUMN failed INTEGER;
ALTER TABLE push_messages ADD COLUMN removed_subscribers INTEGER;
ALTER TABLE push_messages ADD COLUMN failure_reasons_json TEXT;
ALTER TABLE push_messages ADD COLUMN failure_reason TEXT;
ALTER TABLE push_messages ADD COLUMN failure_detail TEXT;

CREATE INDEX IF NOT EXISTS idx_push_subscribers_status ON push_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_push_messages_status ON push_messages(status, scheduled_for);
