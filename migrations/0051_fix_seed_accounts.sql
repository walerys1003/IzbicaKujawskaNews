-- ============================================================================
-- 0051 — naprawa kont startowych: hash hasla w formacie, ktory kod potrafi
--        sprawdzic, oraz konta dla pozostalych rol redakcyjnych.
-- ============================================================================
--
-- CO BYLO ZLE
-- ───────────
-- Migracja 0004_seed_admin wstawila haslo administratora jako hash bcrypt:
--
--     '$2b$12$5xV0l6vG8q2S1p3c8a9A0uY0tXzRrV2wQ6kD0eJ8sL9mN1oP2qR3S'
--
-- Tymczasem `verifyPassword()` w src/lib/auth/store.ts rozbija zapis po '$'
-- i odrzuca wszystko, co nie zaczyna sie od 'pbkdf2':
--
--     const [algorithm, iterationsText, salt, hash] = storedHash.split('$')
--     if (algorithm !== 'pbkdf2' || ...) return false
--
-- Efekt: logowanie na admin@izbica24.pl zwracalo 'Nieprawidlowy adres e-mail
-- lub haslo' dla KAZDEGO hasla — nie z powodu zlego hasla, ale dlatego, ze
-- funkcja nie potrafila odczytac zapisanego skrotu. Nie bylo tez zadnego
-- hasla, ktore by pasowalo: bcrypt z 0004 to ciag wpisany recznie w migracji,
-- a nie wynik hashowania znanego slowa.
--
-- Dlaczego to blokowalo caly projekt: bez zalogowanego konta nie da sie
-- wywolac zadnej trasy redakcyjnej (`/api/v1/admin/articles`, `/api/v1/ai/*`),
-- a wiec ani kryterium wyjscia FAZY 2 („redaktor loguje sie, tworzy artykul…”),
-- ani FAZY 3 („administrator wpisuje klucz, klika Testuj”) nie mialo jak zostac
-- sprawdzone.
--
-- bcrypt/argon2 nie sa dostepne w Cloudflare Workers (brak modulow natywnych),
-- wiec poprawka idzie w strone kodu, ktory dziala: PBKDF2-SHA256, 210 000
-- iteracji, format `pbkdf2$<iteracje>$<sol>$<klucz>` — dokladnie to, co
-- produkuje `hashPassword()`.
--
-- HASLA STARTOWE (do zmiany po pierwszym zalogowaniu)
-- ───────────────────────────────────────────────────
--   admin@izbica24.pl      Izbica24!Admin-2026        rola admin
--   redaktor@izbica24.pl   Izbica24!Redaktor-2026     rola editor
--   autor@izbica24.pl      Izbica24!Autor-2026        rola author
--   moderator@izbica24.pl  Izbica24!Moderator-2026    rola moderator
--
-- Sa to konta robocze do uruchomienia i sprawdzenia przeplywu redakcyjnego.
-- Przed udostepnieniem portalu publicznie kazde z nich wymaga zmiany hasla —
-- powyzsze wartosci widnieja w repozytorium, wiec nalezy je traktowac jako
-- publicznie znane.
--
-- Konta maja email_verified = 1: przeplyw weryfikacji adresu wysyla wiadomosc
-- e-mail, ktorej w srodowisku lokalnym nie ma jak odebrac, a niezweryfikowane
-- konto nie przejdzie przez `requireAuth`.
-- ============================================================================

-- Administrator — nadpisujemy nieczytelny hash bcrypt z migracji 0004.
UPDATE users
   SET password_hash = 'pbkdf2$210000$wGj1MRdtbMccDHVyuKjYgQ$bccuyMt11LaEh_JQ2yvU-ObiUN2bD6umigKnHxmrPJs',
       email_verified = 1,
       email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
       failed_login_attempts = 0,
       locked_until = NULL,
       updated_at = CURRENT_TIMESTAMP
 WHERE email = 'admin@izbica24.pl';

-- Redaktor naczelny (editor) — jedyna rola ponizej admina z 'article:publish'.
-- Potrzebna, by sprawdzic, ze autor NIE moze publikowac samodzielnie.
INSERT INTO users (email, password_hash, name, role, bio, email_verified, email_verified_at)
VALUES (
  'redaktor@izbica24.pl',
  'pbkdf2$210000$e7HLhYb47mgXDcBdGhX_sg$tZlvOsgbTV6wWd33A1_1o-nwHa2_VxE3Dg9sgrGkeag',
  'Redaktor naczelny',
  'editor',
  'Konto redaktora naczelnego — recenzja i publikacja materialow.',
  1,
  CURRENT_TIMESTAMP
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = excluded.role,
  email_verified = 1,
  email_verified_at = COALESCE(users.email_verified_at, CURRENT_TIMESTAMP),
  failed_login_attempts = 0,
  locked_until = NULL,
  updated_at = CURRENT_TIMESTAMP;

-- Autor — tworzy i zglasza do recenzji, nie publikuje.
INSERT INTO users (email, password_hash, name, role, bio, email_verified, email_verified_at)
VALUES (
  'autor@izbica24.pl',
  'pbkdf2$210000$c2NBNrvBDrVORc026kXAIQ$CXjk_gPzjSog4XnFdmtywl0qgf5ZiN4L14K38mcTuS0',
  'Autor redakcyjny',
  'author',
  'Konto autora — przygotowanie materialow i zgloszenie do recenzji.',
  1,
  CURRENT_TIMESTAMP
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = excluded.role,
  email_verified = 1,
  email_verified_at = COALESCE(users.email_verified_at, CURRENT_TIMESTAMP),
  failed_login_attempts = 0,
  locked_until = NULL,
  updated_at = CURRENT_TIMESTAMP;

-- Moderator — kolejka komentarzy (A6).
INSERT INTO users (email, password_hash, name, role, bio, email_verified, email_verified_at)
VALUES (
  'moderator@izbica24.pl',
  'pbkdf2$210000$dXKvOLOhpv8HvI2VKPs0Zw$zUQbrsQuRTn29Rz2IZA0rKMNbliFvOANrvufjfwUpcs',
  'Moderator komentarzy',
  'moderator',
  'Konto moderatora — kolejka zgloszen i komentarzy czytelnikow.',
  1,
  CURRENT_TIMESTAMP
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = excluded.role,
  email_verified = 1,
  email_verified_at = COALESCE(users.email_verified_at, CURRENT_TIMESTAMP),
  failed_login_attempts = 0,
  locked_until = NULL,
  updated_at = CURRENT_TIMESTAMP;
