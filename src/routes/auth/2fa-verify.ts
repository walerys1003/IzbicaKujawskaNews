/**
 * POST /api/v1/auth/2fa/verify   — potwierdzenie i wlaczenie 2FA
 * POST /api/v1/auth/2fa/disable  — wylaczenie 2FA (wymaga hasla)
 *
 * FAZA 1 / A2.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getUserById, revokeAllUserSessions, verifyPassword } from '../../lib/auth/store'
import { generateRecoveryCodes, verifyTotp } from '../../lib/auth/totp'
import { sha256Hex } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.post(
  '/2fa/verify',
  requireAuth,
  validator('json', (value, c) => {
    const code = String(((value ?? {}) as Record<string, unknown>).code ?? '').replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) {
      return fail(c, 'validation_error', 'Kod musi sie skladac z szesciu cyfr.', { fields: { code: 'sześć cyfr' } })
    }
    return { code }
  }),
  async (c) => {
    const auth = getAuth(c)
    if (!auth) return fail(c, 'unauthorized')
    if (!c.env?.DB) return fail(c, 'database_unavailable')

    const { code } = c.req.valid('json')
    const user = await getUserById(c.env, auth.sub)
    if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

    if (!user.pendingTwoFactorSecret) {
      return fail(c, 'conflict', 'Najpierw rozpocznij wlaczanie 2FA przez POST /api/v1/auth/2fa/enable.')
    }

    if (!(await verifyTotp(user.pendingTwoFactorSecret, code))) {
      return fail(c, 'invalid_credentials', 'Nieprawidlowy kod. Sprawdz, czy czas na urzadzeniu jest zsynchronizowany.')
    }

    // Kody zapasowe sa jedyna droga powrotu po utracie telefonu. Poprzednia
    // implementacja ich nie przewidywala, co oznaczalo trwala utrate konta.
    // Zapisujemy wylacznie ich skroty — dokladnie jak hasla.
    const recoveryCodes = generateRecoveryCodes(8)
    const hashedCodes = await Promise.all(recoveryCodes.map((codeText) => sha256Hex(codeText)))

    await c.env.DB
      .prepare(`UPDATE users
                   SET two_factor_secret = pending_two_factor_secret,
                       pending_two_factor_secret = NULL,
                       two_factor_enabled = 1,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?1`)
      .bind(user.id)
      .run()

    // Kody zapasowe trafiaja do tabeli auth_tokens jako tokeny typu 'reset'
    // o dlugim terminie — nie wymaga to nowej tabeli, a semantyka jest ta sama:
    // jednorazowy sekret pozwalajacy odzyskac dostep.
    for (const hash of hashedCodes) {
      await c.env.DB
        .prepare(`INSERT OR IGNORE INTO auth_tokens (token_hash, type, user_id, email, expires_at)
                  VALUES (?1, 'reset', ?2, ?3, datetime('now', '+2 years'))`)
        .bind(hash, user.id, user.email)
        .run()
    }

    return ok(c, {
      dwuetapoweWlaczone: true,
      kodyZapasowe: recoveryCodes,
      uwaga: 'Zapisz kody zapasowe w bezpiecznym miejscu. Kazdy dziala jednorazowo i pozwala odzyskac dostep po utracie urzadzenia. Nie beda wyswietlone ponownie.',
    })
  },
)

route.post(
  '/2fa/disable',
  requireAuth,
  validator('json', (value, c) => {
    const password = String(((value ?? {}) as Record<string, unknown>).password ?? '')
    if (!password) {
      return fail(c, 'validation_error', 'Wylaczenie 2FA wymaga podania hasla.', { fields: { password: 'wymagane' } })
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

    // Haslo jest wymagane, bo samo posiadanie waznego tokenu nie wystarcza:
    // gdyby ktos przejal aktywna sesje, mogl by jednym zadaniem zdjac
    // drugi skladnik i utrwalic dostep.
    if (!(await verifyPassword(password, user.passwordHash))) {
      return fail(c, 'invalid_credentials', 'Nieprawidlowe haslo.')
    }

    await c.env.DB
      .prepare(`UPDATE users
                   SET two_factor_enabled = 0,
                       two_factor_secret = NULL,
                       pending_two_factor_secret = NULL,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?1`)
      .bind(user.id)
      .run()

    // Zuzywamy niewykorzystane kody zapasowe — po wylaczeniu 2FA nie maja
    // zastosowania, a pozostawienie ich waznymi bylo by zbednym ryzykiem.
    await c.env.DB
      .prepare(`UPDATE auth_tokens SET consumed_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?1 AND type = 'reset' AND consumed_at IS NULL`)
      .bind(user.id)
      .run()

    // Zmiana ustawien bezpieczenstwa unieważnia pozostale sesje — jesli
    // przejecie konta bylo powodem tej operacji, atakujacy traci dostep.
    const revoked = await revokeAllUserSessions(c.env, user.id, auth.sessionId)

    return ok(c, { dwuetapoweWlaczone: false, uniewaznionychSesji: revoked })
  },
)

export default route
