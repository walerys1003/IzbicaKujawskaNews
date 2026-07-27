-- FAZA 1 / B3 — jednolity model 6 rol
--
-- ══════════════════════════════════════════════════════════════════════════
-- NAPRAWIANE NIESPOJNOSCI (trzy warstwy tego samego bledu)
-- ══════════════════════════════════════════════════════════════════════════
-- Model rol byl zapisany w TRZECH miejscach, kazde z inna lista wartosci:
--
--   1. tabela users:          CHECK (role IN ('admin','editor','journalist','reader'))
--   2. trigger trg_users_role_guard: WHEN NEW.role NOT IN ('admin','editor','journalist','reader')
--   3. typ TypeScript UserRole:      'reader'|'commenter'|'author'|'editor'|'admin'
--
-- Skutek: proba zapisania uzytkownika z rola 'author' — wartoscia, ktora kod
-- nadaje przy rejestracji autora — byla odrzucana DWUKROTNIE: przez CHECK
-- tabeli i przez trigger. Rola 'commenter' nie istniala w bazie, a
-- 'journalist' nie istniala w kodzie. Zaden autor nie mogl zostac zapisany.
--
-- Roadmapa (etap B3) wymaga szesciu rol:
--   admin, editor, author, moderator, contributor, viewer
--
-- ══════════════════════════════════════════════════════════════════════════
-- MAPOWANIE WARTOSCI ISTNIEJACYCH
-- ══════════════════════════════════════════════════════════════════════════
--   journalist -> author      (ta sama funkcja, inna nazwa)
--   reader     -> viewer      (rola domyslna, tylko czytanie)
--   commenter  -> contributor (moze zglaszac tresc, nie moze publikowac)
--
-- ══════════════════════════════════════════════════════════════════════════
-- DLACZEGO KOLEJNOSC PONIZEJ JEST NIEOCZYWISTA — SQLITE_LOCKED
-- ══════════════════════════════════════════════════════════════════════════
-- SQLite nie pozwala zmienic ograniczenia CHECK poleceniem ALTER TABLE,
-- dlatego konieczna jest procedura: nowa tabela, przepisanie danych,
-- podmiana nazwy. Pierwsza wersja tej migracji konczyla sie jednak bledem
--
--     database table is locked: SQLITE_LOCKED
--
-- na poleceniu DROP TABLE users. Przyczyna nie jest widoczna w tresci
-- migracji, bo lezy w innej tabeli:
--
--   * articles.author_id ma klucz obcy REFERENCES users(id) ON DELETE SET NULL,
--   * usuniecie tabeli users uruchamia wiec kaskade UPDATE na articles,
--   * na articles wisi trigger trg_articles_fts_update, ktory przy kazdej
--     zmianie pisze do articles_fts — tabeli wirtualnej FTS5 typu
--     "external content" (content='articles'),
--   * FTS5 w trakcie tego zapisu czyta tabele zrodlowa articles, ktora jest
--     juz zablokowana przez trwajaca kaskade. Stad SQLITE_LOCKED.
--
-- Rozwiazanie: na czas podmiany tabeli users zdejmujemy triggery FTS
-- z articles i odtwarzamy je bezposrednio po podmianie. Indeks FTS nie
-- wymaga przebudowy, poniewaz kaskada zmienia wylacznie author_id — kolumne,
-- ktora nie jest indeksowana przez articles_fts (title, lead, content_md,
-- content_html, slug). Zawartosc indeksu pozostaje wiec poprawna.
--
-- Dla pewnosci na koncu migracji wykonujemy jednak
-- INSERT INTO articles_fts(articles_fts) VALUES('rebuild') — koszt jest
-- pomijalny przy obecnej liczbie artykulow, a gwarancja spojnosci pelna.

PRAGMA foreign_keys = OFF;

-- ══════════════════════════════════════════════════════════════════════════
-- 0. Zdjecie triggerow blokujacych podmiane tabeli users
-- ══════════════════════════════════════════════════════════════════════════
-- Triggery FTS na articles (patrz komentarz wyzej — powod bledu SQLITE_LOCKED).
DROP TRIGGER IF EXISTS trg_articles_fts_insert;
DROP TRIGGER IF EXISTS trg_articles_fts_delete;
DROP TRIGGER IF EXISTS trg_articles_fts_update;

-- Triggery samej tabeli users: znikneleyby razem z tabela, ale usuwamy je
-- jawnie, aby CREATE TRIGGER na koncu nie natrafil na pozostalosc.
DROP TRIGGER IF EXISTS trg_users_updated_at;

-- Straznik roli ze STARA lista wartosci — druga warstwa naprawianego bledu.
-- Musi zniknac, inaczej nadal odrzucalby role 'author' i 'contributor'.
DROP TRIGGER IF EXISTS trg_users_role_guard;

-- ══════════════════════════════════════════════════════════════════════════
-- 1. Nowa tabela z pelnym zestawem rol i polami wymaganymi przez FAZE 1
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'editor', 'author', 'moderator', 'contributor', 'viewer')),
  avatar TEXT,
  bio TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  -- Pola dodane w FAZIE 1 (A2): weryfikacja adresu, 2FA, blokada konta.
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  email_verified_at DATETIME,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0 CHECK (two_factor_enabled IN (0, 1)),
  two_factor_secret TEXT,
  pending_two_factor_secret TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  deleted_at DATETIME
);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. Przepisanie danych z mapowaniem starych nazw rol
-- ══════════════════════════════════════════════════════════════════════════
INSERT INTO users_new (id, email, password_hash, name, role, avatar, bio, created_at, updated_at, last_login)
SELECT
  id,
  email,
  password_hash,
  name,
  CASE role
    WHEN 'journalist' THEN 'author'
    WHEN 'reader'     THEN 'viewer'
    WHEN 'commenter'  THEN 'contributor'
    WHEN 'admin'      THEN 'admin'
    WHEN 'editor'     THEN 'editor'
    WHEN 'author'     THEN 'author'
    WHEN 'moderator'  THEN 'moderator'
    ELSE 'viewer'
  END,
  avatar,
  bio,
  created_at,
  updated_at,
  last_login
FROM users;

-- Konto zalozycielskie (0004_seed_admin) musi pozostac administratorem.
-- Zapis jest idempotentny: jesli konta nie ma, nie zmienia niczego.
UPDATE users_new SET role = 'admin', email_verified = 1 WHERE email = 'admin@izbica24.pl';

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. Odtworzenie triggerow
-- ══════════════════════════════════════════════════════════════════════════
-- Trigger utrzymujacy updated_at. Warunek WHEN jest istotny: bez niego
-- trigger wpadlby w rekurencje, bo jego wlasny UPDATE ponownie by go wywolal.
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Straznik roli z NOWA, szesciowartosciowa lista. Duplikuje ograniczenie
-- CHECK tabeli, ale obejmuje takze UPDATE, czego CHECK w SQLite dla
-- istniejacych wierszy nie egzekwuje przy zmianie schematu.
CREATE TRIGGER IF NOT EXISTS trg_users_role_guard_insert
BEFORE INSERT ON users
WHEN NEW.role NOT IN ('admin', 'editor', 'author', 'moderator', 'contributor', 'viewer')
BEGIN
  SELECT RAISE(ABORT, 'niedozwolona wartosc users.role');
END;

CREATE TRIGGER IF NOT EXISTS trg_users_role_guard_update
BEFORE UPDATE OF role ON users
WHEN NEW.role NOT IN ('admin', 'editor', 'author', 'moderator', 'contributor', 'viewer')
BEGIN
  SELECT RAISE(ABORT, 'niedozwolona wartosc users.role');
END;

-- Triggery FTS na articles — odtworzone dokladnie w brzmieniu z 0005_fts_articles.
CREATE TRIGGER IF NOT EXISTS trg_articles_fts_insert AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, title, lead, content_md, content_html, slug)
  VALUES (new.id, new.title, new.lead, COALESCE(new.content_md, ''), COALESCE(new.content_html, ''), new.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_delete AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, lead, content_md, content_html, slug)
  VALUES('delete', old.id, old.title, old.lead, COALESCE(old.content_md, ''), COALESCE(old.content_html, ''), old.slug);
END;

CREATE TRIGGER IF NOT EXISTS trg_articles_fts_update AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, title, lead, content_md, content_html, slug)
  VALUES('delete', old.id, old.title, old.lead, COALESCE(old.content_md, ''), COALESCE(old.content_html, ''), old.slug);
  INSERT INTO articles_fts(rowid, title, lead, content_md, content_html, slug)
  VALUES (new.id, new.title, new.lead, COALESCE(new.content_md, ''), COALESCE(new.content_html, ''), new.slug);
END;

-- ══════════════════════════════════════════════════════════════════════════
-- 4. Sesje uzytkownikow w bazie (A2)
-- ══════════════════════════════════════════════════════════════════════════
-- Sesje trzymamy w SESSION_KV (szybki odczyt przy kazdym zadaniu), ale ich
-- rejestr w bazie pozwala redaktorowi zobaczyc liste wlasnych urzadzen
-- i uniewaznic sesje, a administratorowi — wykryc naduzycia. KV nie daje
-- sensownego przegladania po uzytkowniku.
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked_at);

-- ══════════════════════════════════════════════════════════════════════════
-- 5. Klucze API z zakresami uprawnien (A2)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,          -- widoczny fragment, np. 'izb_a1b2'
  scopes TEXT NOT NULL DEFAULT '[]',   -- tablica JSON zakresow
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  expires_at DATETIME,
  revoked_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(token_hash);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. Jednorazowe tokeny: weryfikacja adresu, reset hasla, logowanie linkiem
-- ══════════════════════════════════════════════════════════════════════════
-- Przechowujemy wylacznie SKROT tokenu. Wyciek kopii bazy nie pozwala wiec
-- przejac konta — token jawny istnieje tylko w wiadomosci do uzytkownika.
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('verify', 'reset', 'magic')),
  user_id INTEGER,
  email TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

-- ══════════════════════════════════════════════════════════════════════════
-- 7. Przebudowa indeksu FTS i przywrocenie kluczy obcych
-- ══════════════════════════════════════════════════════════════════════════
INSERT INTO articles_fts(articles_fts) VALUES('rebuild');

PRAGMA foreign_keys = ON;
