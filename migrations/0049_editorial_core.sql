-- ════════════════════════════════════════════════════════════════════════════
-- FAZA 2 — Rdzeń redakcyjny: bloki treści, wersjonowanie, dziennik, prawa
--
-- Ta migracja obsługuje cztery etapy planu naraz, bo dotyczą tych samych
-- tabel i rozdzielenie ich powodowałoby dwukrotne przebudowywanie schematu:
--
--   D4   — tabela `article_blocks` (treść jako bloki, nie jako HTML)
--   D9   — rozbudowa `article_versions` i `audit_log`, blokada edycji
--   I11  — kolumny `author`, `license`, `source` w mediach
--   A6   — pola moderacyjne komentarzy
--
-- ────────────────────────────────────────────────────────────────────────────
-- Dlaczego bloki w osobnej tabeli, a nie jako JSON w kolumnie `articles`
-- ────────────────────────────────────────────────────────────────────────────
-- Kolumna `content_json TEXT` byłaby prostsza w zapisie, ale uniemożliwia
-- trzy rzeczy, które portal musi robić:
--
--   1. Odpowiedź na pytanie „w których artykułach użyto tego zdjęcia?”.
--      Przy JSON wymagałoby to `LIKE '%r2_key%'` po całej tabeli — czyli
--      pełnego skanu przy każdym usuwaniu pliku z biblioteki mediów.
--      Z osobną tabelą to indeksowane zapytanie po `media_id`.
--   2. Zmianę jednego bloku bez przepisywania całej treści. Autozapis
--      edytora wywołuje się co kilkanaście sekund; przepisywanie 300 bloków
--      przy każdej zmianie akapitu marnuje budżet zapisu D1.
--   3. Indeksowanie fragmentaryczne dla RAG (AI7), gdzie jednostką jest
--      fragment o długości około 500 znaków, a nie cały artykuł.
--
-- Cena: zapis artykułu to `DELETE` + `INSERT` wielu wierszy zamiast jednego
-- `UPDATE`. D1 obsługuje `batch`, więc jest to jedna podróż sieciowa.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. D4 — Bloki treści artykułu
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS article_blocks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id     INTEGER NOT NULL,
  -- Pozycja bloku w artykule, liczona od 0. Para (article_id, position)
  -- jest unikalna, co uniemożliwia dwa bloki na tym samym miejscu —
  -- przy zmianie kolejności trzeba więc użyć transakcji, ale w zamian
  -- nie da się zapisać porządku niejednoznacznego.
  position       INTEGER NOT NULL,
  block_type     TEXT NOT NULL CHECK (block_type IN (
                   'paragraph','heading','list','quote','image','gallery',
                   'video','audio','embed','file','table','info'
                 )),
  -- Pełna treść bloku jako JSON, w kształcie zgodnym z typem ContentBlock.
  -- Walidację kształtu wykonuje warstwa `src/lib/validation/blocks.ts`
  -- PRZED zapisem; baza sprawdza tylko rodzaj bloku.
  payload_json   TEXT NOT NULL,
  -- Tekst bez znaczników — wyciąg do indeksu pełnotekstowego, do liczenia
  -- słów i do porównań plagiatowych (AI9). Trzymany osobno, żeby nie
  -- rozbierać JSON przy każdym zapytaniu.
  plain_text     TEXT,
  -- Powiązanie z biblioteką mediów. Wypełniane dla bloków image/video/
  -- audio/file. Dzięki temu usunięcie pliku może sprawdzić, czy nie jest
  -- używany, zamiast zostawić w artykule martwy odnośnik.
  media_id       INTEGER,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL,
  UNIQUE (article_id, position)
);

CREATE INDEX IF NOT EXISTS idx_article_blocks_article ON article_blocks(article_id, position);
CREATE INDEX IF NOT EXISTS idx_article_blocks_media ON article_blocks(media_id) WHERE media_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_article_blocks_type ON article_blocks(block_type);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. D4 — Pola artykułu brakujące w stosunku do modelu v4
-- ────────────────────────────────────────────────────────────────────────────
-- Tabela `articles` została zaprojektowana dla treści jako HTML i nie ma
-- pól, których używa front-end v4 (`ARTICLES_V4`). Bez nich przełączenie
-- portalu na bazę oznaczałoby utratę danych widocznych na stronie:
-- podpisu zdjęcia głównego, tagu sołectwa, flagi „pilne”.

ALTER TABLE articles ADD COLUMN content_type TEXT NOT NULL DEFAULT 'article';
ALTER TABLE articles ADD COLUMN short_title TEXT;
ALTER TABLE articles ADD COLUMN subcategory_slug TEXT;
ALTER TABLE articles ADD COLUMN subsubcategory_slug TEXT;
ALTER TABLE articles ADD COLUMN hero_alt TEXT;
ALTER TABLE articles ADD COLUMN hero_caption TEXT;
ALTER TABLE articles ADD COLUMN hero_credit TEXT;
ALTER TABLE articles ADD COLUMN solectwo_slug TEXT;
ALTER TABLE articles ADD COLUMN featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1));
ALTER TABLE articles ADD COLUMN breaking INTEGER NOT NULL DEFAULT 0 CHECK (breaking IN (0,1));
ALTER TABLE articles ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- Pola specyficzne dla typów materiału (incydent „Na sygnale”, wideo,
-- audio, wydarzenie, ogłoszenie, źródło zewnętrzne). Każde jako JSON,
-- bo są rzadkie i różnorodne — dwadzieścia dodatkowych kolumn, z których
-- w typowym wierszu wszystkie byłyby NULL, to gorszy wybór.
ALTER TABLE articles ADD COLUMN type_data_json TEXT;

-- AI11 — oznaczanie materiałów tworzonych z udziałem sztucznej inteligencji.
-- `human_reviewed_by` jest kluczowe: publikacja materiału z `ai_assisted = 1`
-- i `human_reviewed_by IS NULL` jest zablokowana wyzwalaczem niżej.
ALTER TABLE articles ADD COLUMN ai_assisted INTEGER NOT NULL DEFAULT 0 CHECK (ai_assisted IN (0,1));
ALTER TABLE articles ADD COLUMN ai_disclosure TEXT;
ALTER TABLE articles ADD COLUMN human_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN human_reviewed_at DATETIME;

-- B4 — blokada równoczesnej edycji. `locked_by` + `locked_at` mówią,
-- kto otworzył artykuł w edytorze. Blokada wygasa po 15 minutach
-- bezczynności (sprawdzane w kodzie), więc zamknięcie karty przeglądarki
-- nie blokuje materiału na zawsze — to był realny problem systemów
-- redakcyjnych z twardą blokadą.
ALTER TABLE articles ADD COLUMN locked_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN locked_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_articles_solectwo ON articles(solectwo_slug) WHERE solectwo_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured, published_at DESC) WHERE featured = 1;
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);
CREATE INDEX IF NOT EXISTS idx_articles_subcategory ON articles(subcategory_slug) WHERE subcategory_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_scheduled ON articles(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. D9 — Wersjonowanie
-- ────────────────────────────────────────────────────────────────────────────
-- Istniejąca tabela `article_versions` miała cztery kolumny: article_id,
-- body_md, edited_by, edited_at. To nie wystarcza, żeby odtworzyć wersję:
-- brak tytułu, lidu, statusu, bloków. „Przywrócenie wersji poprzedniej”
-- przywróciłoby treść, ale zostawiłoby tytuł z wersji nowszej — czyli
-- artykuł w stanie, który nigdy nie istniał.

ALTER TABLE article_versions ADD COLUMN version_number INTEGER;
ALTER TABLE article_versions ADD COLUMN title TEXT;
ALTER TABLE article_versions ADD COLUMN lead TEXT;
ALTER TABLE article_versions ADD COLUMN slug TEXT;
ALTER TABLE article_versions ADD COLUMN status TEXT;
-- Pełna migawka: wszystkie pola artykułu oraz bloki, jako jeden JSON.
-- Odtworzenie wersji jest wtedy operacją mechaniczną, bez zgadywania.
ALTER TABLE article_versions ADD COLUMN snapshot_json TEXT;
ALTER TABLE article_versions ADD COLUMN blocks_json TEXT;
-- Powód zmiany wpisany przez redaktora — bez niego historia jest listą
-- znaczników czasu, z której nie wynika, dlaczego cokolwiek zmieniono.
ALTER TABLE article_versions ADD COLUMN change_note TEXT;
-- Liczba znaków dodanych i usuniętych — pozwala pokazać rozmiar zmiany
-- na liście wersji bez wyliczania różnicy w czasie żądania.
ALTER TABLE article_versions ADD COLUMN chars_added INTEGER NOT NULL DEFAULT 0;
ALTER TABLE article_versions ADD COLUMN chars_removed INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_article_versions_article
  ON article_versions(article_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_article_versions_editor ON article_versions(edited_by);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. D9 — Dziennik zdarzeń
-- ────────────────────────────────────────────────────────────────────────────
-- `audit_log` ma kolumny user_id, action, entity, entity_id, diff, ip_hash.
-- Brakuje trzech rzeczy potrzebnych przy dochodzeniu, kto co zrobił:
-- roli w chwili działania (rola mogła się później zmienić), identyfikatora
-- żądania (łączy wpis z tabelą `error_log` i logiem serwera) oraz wyniku.

ALTER TABLE audit_log ADD COLUMN actor_email TEXT;
ALTER TABLE audit_log ADD COLUMN actor_role TEXT;
ALTER TABLE audit_log ADD COLUMN request_id TEXT;
ALTER TABLE audit_log ADD COLUMN outcome TEXT NOT NULL DEFAULT 'ok' CHECK (outcome IN ('ok','denied','error'));
ALTER TABLE audit_log ADD COLUMN user_agent TEXT;
-- Stan przed i po — jako JSON, żeby dało się pokazać różnicę.
ALTER TABLE audit_log ADD COLUMN before_json TEXT;
ALTER TABLE audit_log ADD COLUMN after_json TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log(request_id) WHERE request_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. I11 — Prawa autorskie w mediach
-- ────────────────────────────────────────────────────────────────────────────
-- Portal wyświetlał 45 zdjęć pobieranych na bieżąco z Unsplasha, 4 z picsum
-- i 2 z serwera dokumentacji MDN. Poza kwestią licencji (art. 16 prawa
-- autorskiego — prawo do oznaczenia autorstwa jest niezbywalne) oznaczało
-- to, że wygląd portalu zależy od cudzego serwera: awaria po tamtej
-- stronie zostawia puste kadry w każdej karcie.
--
-- `author`, `license` i `source` są wymagane przez warstwę walidacji przy
-- wgrywaniu. W bazie zostawiamy je bez `NOT NULL`, bo tabela zawiera już
-- wiersze bez tych danych — inaczej migracja by się nie wykonała.
-- Raport braków daje `GET /api/v1/media/list?missingCredits=1`.

ALTER TABLE media ADD COLUMN author TEXT;
ALTER TABLE media ADD COLUMN license TEXT;
ALTER TABLE media ADD COLUMN source TEXT;
ALTER TABLE media ADD COLUMN title TEXT;
ALTER TABLE media ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE media ADD COLUMN bucket TEXT NOT NULL DEFAULT 'articles-images';
ALTER TABLE media ADD COLUMN kind TEXT NOT NULL DEFAULT 'image'
  CHECK (kind IN ('image','video','audio','document'));
-- Suma kontrolna treści pliku — wykrywanie duplikatów (A5). Redakcja
-- wgrywała to samo zdjęcie po kilka razy, bo nie miała jak sprawdzić,
-- czy już jest w bibliotece.
ALTER TABLE media ADD COLUMN content_hash TEXT;
ALTER TABLE media ADD COLUMN duration_sec INTEGER;
-- Warianty webp/avif wygenerowane po wgraniu — jako JSON, bo liczba
-- rozmiarów może się zmieniać bez migracji schematu.
ALTER TABLE media ADD COLUMN variants_json TEXT;

CREATE INDEX IF NOT EXISTS idx_media_kind ON media(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_hash ON media(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_license ON media(license);
CREATE INDEX IF NOT EXISTS idx_media_bucket ON media(bucket);

-- Rejestr użycia pliku — komplement do `article_blocks.media_id`,
-- obejmujący też miejsca poza treścią artykułu (zdjęcie główne, galeria,
-- ogłoszenie, awatar).
CREATE TABLE IF NOT EXISTS media_usage (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id    INTEGER NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  usage_kind  TEXT NOT NULL DEFAULT 'inline'
                CHECK (usage_kind IN ('hero','inline','gallery','thumbnail','avatar','attachment')),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  UNIQUE (media_id, entity, entity_id, usage_kind)
);

CREATE INDEX IF NOT EXISTS idx_media_usage_media ON media_usage(media_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_entity ON media_usage(entity, entity_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. A6 — Moderacja komentarzy
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE comments ADD COLUMN moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN moderated_at DATETIME;
ALTER TABLE comments ADD COLUMN moderation_reason TEXT;
-- Ocena filtru spamu (0–100) i lista dopasowanych reguł. Zapisujemy ocenę,
-- a nie tylko decyzję, żeby moderator widział, dlaczego coś trafiło
-- do kolejki, i mógł ocenić, czy filtr nie jest za czuły.
ALTER TABLE comments ADD COLUMN spam_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE comments ADD COLUMN spam_reasons_json TEXT;
ALTER TABLE comments ADD COLUMN profanity_hits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE comments ADD COLUMN report_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE comments ADD COLUMN edited_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN edited_at DATETIME;
ALTER TABLE comments ADD COLUMN edit_reason TEXT;
-- Skrót przeglądarki — pomaga rozpoznać tę samą osobę zmieniającą adres IP,
-- bez przechowywania adresu (RODO: minimalizacja danych).
ALTER TABLE comments ADD COLUMN ua_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_comments_status_created ON comments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_reported ON comments(report_count DESC) WHERE report_count > 0;
CREATE INDEX IF NOT EXISTS idx_comments_spam_score ON comments(spam_score DESC) WHERE spam_score > 0;

CREATE TABLE IF NOT EXISTS comment_reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id   INTEGER NOT NULL,
  reason       TEXT NOT NULL CHECK (reason IN ('spam','obrazliwy','nieprawdziwy','dane-osobowe','inny')),
  details      TEXT,
  reporter_ip_hash TEXT,
  reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  handled      INTEGER NOT NULL DEFAULT 0 CHECK (handled IN (0,1)),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_open ON comment_reports(handled, created_at DESC) WHERE handled = 0;

-- Blokady komentujących. Przechowujemy WYŁĄCZNIE skrót adresu IP —
-- adres w postaci jawnej jest danymi osobowymi (motyw 30 RODO), a do
-- blokady wystarczy porównanie skrótów.
CREATE TABLE IF NOT EXISTS comment_bans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash     TEXT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  banned_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at  DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (ip_hash IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_comment_bans_ip ON comment_bans(ip_hash) WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comment_bans_user ON comment_bans(user_id) WHERE user_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Wyzwalacze pilnujące niezmienników
-- ────────────────────────────────────────────────────────────────────────────

-- AI11 — twarda blokada publikacji materiału AI bez zatwierdzenia przez
-- człowieka. Reguła MUSI mieszkać w bazie, nie tylko w kodzie: gdyby
-- siedziała wyłącznie w warstwie aplikacji, jedno zapytanie z panelu
-- administracyjnego albo z konsoli `wrangler d1 execute` by ją obeszło,
-- a portal opublikowałby tekst maszynowy jako redakcyjny.
DROP TRIGGER IF EXISTS trg_articles_ai_review_guard_update;
CREATE TRIGGER trg_articles_ai_review_guard_update
BEFORE UPDATE OF status ON articles
WHEN NEW.status = 'published'
  AND NEW.ai_assisted = 1
  AND NEW.human_reviewed_by IS NULL
BEGIN
  SELECT RAISE(ABORT, 'Publikacja materialu tworzonego z udzialem AI wymaga zatwierdzenia przez czlowieka (human_reviewed_by).');
END;

DROP TRIGGER IF EXISTS trg_articles_ai_review_guard_insert;
CREATE TRIGGER trg_articles_ai_review_guard_insert
BEFORE INSERT ON articles
WHEN NEW.status = 'published'
  AND NEW.ai_assisted = 1
  AND NEW.human_reviewed_by IS NULL
BEGIN
  SELECT RAISE(ABORT, 'Publikacja materialu tworzonego z udzialem AI wymaga zatwierdzenia przez czlowieka (human_reviewed_by).');
END;

-- Licznik komentarzy utrzymywany przez bazę. Wcześniej `comment_count`
-- nie istniał, a widok liczył komentarze osobnym zapytaniem przy każdej
-- karcie na stronie głównej — dwadzieścia kart to dwadzieścia zapytań
-- `COUNT(*)` w budżecie 10 ms procesora.
DROP TRIGGER IF EXISTS trg_comments_count_insert;
CREATE TRIGGER trg_comments_count_insert AFTER INSERT ON comments
WHEN NEW.status = 'approved'
BEGIN
  UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
END;

DROP TRIGGER IF EXISTS trg_comments_count_delete;
CREATE TRIGGER trg_comments_count_delete AFTER DELETE ON comments
WHEN OLD.status = 'approved'
BEGIN
  UPDATE articles SET comment_count = MAX(0, comment_count - 1) WHERE id = OLD.article_id;
END;

-- Zmiana statusu komentarza też zmienia licznik: zatwierdzenie zwiększa,
-- odrzucenie zmniejsza. Bez tego wyzwalacza licznik rósł przy dodaniu
-- i nie malał przy odrzuceniu, więc pokazywał liczbę zgłoszeń, nie
-- liczbę widocznych komentarzy.
DROP TRIGGER IF EXISTS trg_comments_count_update;
CREATE TRIGGER trg_comments_count_update AFTER UPDATE OF status ON comments
WHEN OLD.status <> NEW.status
BEGIN
  UPDATE articles
  SET comment_count = MAX(0, comment_count
        + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END)
        - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END))
  WHERE id = NEW.article_id;
END;

-- Liczba zgłoszeń komentarza.
DROP TRIGGER IF EXISTS trg_comment_reports_count;
CREATE TRIGGER trg_comment_reports_count AFTER INSERT ON comment_reports BEGIN
  UPDATE comments SET report_count = report_count + 1 WHERE id = NEW.comment_id;
END;

-- Znacznik czasu modyfikacji bloków.
DROP TRIGGER IF EXISTS trg_article_blocks_updated_at;
CREATE TRIGGER trg_article_blocks_updated_at AFTER UPDATE ON article_blocks
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE article_blocks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Widok kolejki moderacyjnej
-- ────────────────────────────────────────────────────────────────────────────
-- Kolejka jest otwierana przez moderatora kilkadziesiąt razy dziennie,
-- a łączy trzy tabele. Widok utrzymuje zapytanie w jednym miejscu, więc
-- zmiana kolumny nie wymaga poprawiania go w panelu i w API osobno.

DROP VIEW IF EXISTS moderation_queue_view;
CREATE VIEW moderation_queue_view AS
SELECT
  c.id,
  c.article_id,
  a.slug        AS article_slug,
  a.title       AS article_title,
  c.author_name,
  c.content,
  c.status,
  c.spam_score,
  c.profanity_hits,
  c.report_count,
  c.parent_id,
  c.created_at,
  c.moderated_at,
  c.moderated_by,
  u.name        AS moderator_name
FROM comments c
LEFT JOIN articles a ON a.id = c.article_id
LEFT JOIN users u ON u.id = c.moderated_by
WHERE c.deleted_at IS NULL
ORDER BY
  -- Najpierw zgłoszone przez czytelników, potem podejrzane o spam,
  -- potem najstarsze oczekujące. Taki porządek odpowiada temu, co
  -- moderator faktycznie chce zobaczyć najpierw.
  (c.status = 'pending') DESC,
  c.report_count DESC,
  c.spam_score DESC,
  c.created_at ASC;
