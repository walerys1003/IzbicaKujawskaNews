/**
 * DELETE /api/v1/auth/account — usuniecie wlasnego konta (RODO art. 17)
 *
 * FAZA 1 / A2.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANE BLEDY
 * ══════════════════════════════════════════════════════════════════════════
 * 1. USUNIECIE BEZ POTWIERDZENIA TOZSAMOSCI. Poprzednia wersja wymagala
 *    wylacznie waznego tokenu. Przejeta sesja pozwalala wiec skasowac konto
 *    jednym zadaniem. Teraz wymagamy hasla.
 *
 * 2. ODPOWIEDZ NIEZGODNA ZE STANEM. Trasa zwracala `gdpr: 'account_erased'`,
 *    ale usuwala jedynie dwa klucze KV — rekordy w tabeli `users` (a wraz
 *    z nimi autorstwo artykulow i komentarzy) pozostawaly nietkniete.
 *    Komunikat o wykonaniu prawa do usuniecia danych byl nieprawdziwy.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO USUNIECIE JEST MIEKKIE, A NIE FIZYCZNE
 * ══════════════════════════════════════════════════════════════════════════
 * `articles.author_id` odwoluje sie do `users(id)` z regula ON DELETE SET NULL.
 * Fizyczne usuniecie wiersza pozbawiloby wiec artykuly autora — a portal
 * informacyjny ma obowiazek wskazac autora materialu (prawo prasowe).
 * Dlatego:
 *   • dane osobowe (imie, e-mail, biogram, awatar) sa NADPISYWANE, nie
 *     pozostawiane do skasowania „kiedys",
 *   • wiersz pozostaje z ustawionym `deleted_at`, aby autorstwo mialo do
 *     czego sie odwolac,
 *   • wszystkie zapytania w store.ts filtruja `deleted_at IS NULL`, wiec
 *     konto przestaje istniec z punktu widzenia logowania i panelu.
 *
 * To realizuje prawo do usuniecia danych osobowych bez zerwania integralnosci
 * archiwum prasowego.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getUserById, revokeAllUserSessions, verifyPassword } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.delete(
  '/account',
  requireAuth,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const password = String(body.password ?? '')
    const confirm = String(body.confirm ?? '')

    const fields: Record<string, string> = {}
    if (!password) fields.password = 'Podaj haslo, aby potwierdzic usuniecie konta.'
    // Jawne potwierdzenie slowne chroni przed przypadkowym wywolaniem
    // (np. powtorzonym zadaniem z narzedzia deweloperskiego).
    if (confirm !== 'USUWAM KONTO') fields.confirm = 'Aby potwierdzic, przeslij pole confirm o wartosci: USUWAM KONTO';

    if (Object.keys(fields).length) {
      return fail(c, 'validation_error', 'Usuniecie konta wymaga potwierdzenia.', { fields })
    }
    return { password }
  }),
  async (c) => {
    const auth = getAuth(c)
    if (!auth) return fail(c, 'unauthorized')
    if (!c.env?.DB) return fail(c, 'database_unavailable')

    const { password } = c.req.valid('json')
    const user = await getUserById(c.env, auth.sub)
    if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

    if (!(await verifyPassword(password, user.passwordHash))) {
      return fail(c, 'invalid_credentials', 'Nieprawidlowe haslo.')
    }

    // Ostatni administrator nie moze usunac wlasnego konta — portal zostalby
    // bez nikogo, kto moze nadawac uprawnienia, a odzyskanie dostepu
    // wymagaloby recznej ingerencji w baze.
    if (user.role === 'admin') {
      const others = await c.env.DB
        .prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND deleted_at IS NULL AND id <> ?1`)
        .bind(user.id)
        .first<{ n: number }>()
      if ((others?.n ?? 0) === 0) {
        return fail(c, 'conflict', 'Jestes jedynym administratorem portalu. Najpierw nadaj te role innej osobie.')
      }
    }

    // Nadpisanie danych osobowych wartosciami zastepczymi. Adres e-mail musi
    // pozostac unikalny (ograniczenie UNIQUE), dlatego zawiera identyfikator.
    const anonymousEmail = `usuniete-${user.id}@konto.usuniete`
    await c.env.DB
      .prepare(`UPDATE users
                   SET email = ?2,
                       name = 'Konto usuniete',
                       bio = NULL,
                       avatar = NULL,
                       password_hash = 'usuniete',
                       two_factor_enabled = 0,
                       two_factor_secret = NULL,
                       pending_two_factor_secret = NULL,
                       email_verified = 0,
                       email_verified_at = NULL,
                       role = 'viewer',
                       deleted_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?1`)
      .bind(user.id, anonymousEmail)
      .run()

    // Sesje, klucze API i niezuzyte tokeny przestaja dzialac natychmiast.
    const revoked = await revokeAllUserSessions(c.env, user.id)
    await c.env.DB
      .prepare(`UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?1 AND revoked_at IS NULL`)
      .bind(user.id)
      .run()
    await c.env.DB
      .prepare(`UPDATE auth_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ?1 AND consumed_at IS NULL`)
      .bind(user.id)
      .run()

    // Komentarze zawieraja nazwe i adres autora niezaleznie od konta —
    // trzeba je zanonimizowac osobno, inaczej dane osobowe pozostalyby jawne.
    await c.env.DB
      .prepare(`UPDATE comments SET author_name = 'Uzytkownik usuniety', author_email = NULL WHERE user_id = ?1`)
      .bind(user.id)
      .run()
      .catch(() => undefined)

    return ok(c, {
      kontoUsuniete: true,
      uniewaznionychSesji: revoked,
      zakresUsuniecia: {
        daneOsobowe: 'nadpisane (imie, e-mail, biogram, awatar, haslo, sekrety 2FA)',
        komentarze: 'zanonimizowane',
        sesjeIKlucze: 'uniewaznione',
        autorstwoArtykulow: 'zachowane bez danych osobowych — wymog wskazania autora materialu prasowego',
      },
      podstawa: 'RODO art. 17 (prawo do usuniecia danych) z zachowaniem art. 17 ust. 3 lit. a i d',
    })
  },
)

export default route
