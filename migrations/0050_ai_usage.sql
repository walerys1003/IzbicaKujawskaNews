-- FAZA 3 / AI10 — rejestr wywolan modeli i limity budzetowe.
--
-- Bez tej tabeli limit dzienny nie ma na czym sie oprzec: kod moglby
-- najwyzej liczyc wywolania w pamieci Workera, a ta jest kasowana miedzy
-- zadaniami. Redakcja dowiedzialaby sie o wydatkach z faktury dostawcy.
--
-- Liczymy TOKENY, nie wywolania. Jedno zapytanie o pelny artykul kosztuje
-- tyle, co kilkadziesiat krotkich poprawek stylistycznych — licznik wywolan
-- nie mowilby nic o rzeczywistym wydatku.

CREATE TABLE IF NOT EXISTS ai_generations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER,
  -- Rodzaj dostawcy, nie nazwa handlowa: ten sam klucz moze wskazywac
  -- na roznych dostawcow zgodnych z tym samym API.
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  -- Operacja, ktora wywolala model: complete, stream, write-article,
  -- fact-check, rag-index. Pozwala odpowiedziec na pytanie „co zjada budzet”.
  action          TEXT NOT NULL,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER NOT NULL DEFAULT 0,
  outcome         TEXT NOT NULL DEFAULT 'ok' CHECK (outcome IN ('ok','error','aborted')),
  error_message   TEXT,
  -- Powiazanie z artykulem, jesli wywolanie dotyczylo konkretnego tekstu.
  article_id      INTEGER,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- Zapytanie o limit dzienny biegnie przy KAZDYM wywolaniu AI, wiec musi
-- trafiac w indeks — inaczej po miesiacu pracy kazde generowanie tekstu
-- zaczynaloby sie od skanu calej tabeli.
CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_action ON ai_generations(action);
CREATE INDEX IF NOT EXISTS idx_ai_generations_article ON ai_generations(article_id);

-- Profile dostawcow (AI2). Klucz przechowujemy ZASZYFROWANY (AES-GCM),
-- nigdy jawnie: kopia bazy nie moze byc rownoznaczna z wyciekiem klucza,
-- za ktory placi redakcja.
CREATE TABLE IF NOT EXISTS ai_providers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  label           TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('anthropic','openai-compatible','workers-ai')),
  base_url        TEXT NOT NULL DEFAULT '',
  model           TEXT NOT NULL,
  -- Szyfrogram klucza + wektor inicjujacy. Rozdzielone, bo IV nie jest
  -- tajny, ale musi byc rozny dla kazdego zapisu.
  api_key_cipher  TEXT,
  api_key_iv      TEXT,
  -- Podpowiedz w formie `sk-…f3a9` do rozpoznania klucza w panelu.
  api_key_hint    TEXT,
  is_default      INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  enabled         INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  last_test_at    DATETIME,
  last_test_ok    INTEGER CHECK (last_test_ok IN (0,1)),
  last_test_note  TEXT,
  created_by      INTEGER,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_providers_label ON ai_providers(label);

-- Tylko jeden profil moze byc domyslny. Wymuszamy to indeksem czesciowym,
-- a nie regula w kodzie: dwa profile domyslne oznaczalyby, ze wybor
-- dostawcy zalezy od kolejnosci wiersza w zapytaniu.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_providers_one_default
  ON ai_providers(is_default) WHERE is_default = 1;

-- Limity budzetowe. Osobna tabela, bo limit globalny i limity per rola
-- maja te sama strukture, a redakcja moze chciec podniesc limit jednej
-- osobie bez ruszania pozostalych.
CREATE TABLE IF NOT EXISTS ai_budgets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  scope           TEXT NOT NULL CHECK (scope IN ('global','role','user')),
  scope_value     TEXT,
  daily_tokens    INTEGER NOT NULL DEFAULT 400000,
  monthly_tokens  INTEGER NOT NULL DEFAULT 8000000,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_budgets_scope ON ai_budgets(scope, scope_value);

INSERT OR IGNORE INTO ai_budgets (scope, scope_value, daily_tokens, monthly_tokens)
VALUES ('global', NULL, 400000, 8000000);

CREATE TRIGGER IF NOT EXISTS trg_ai_providers_updated_at
AFTER UPDATE ON ai_providers
BEGIN
  UPDATE ai_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
