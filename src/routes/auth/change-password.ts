/**
 * POST /api/v1/auth/change-password
 *
 * FAZA 1 / A2.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY BLAD — ZMIANA HASLA NIE ODCINALA NIKOGO
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia wersja zapisywala nowy skrot hasla i konczyla dzialanie. Sesje
 * pozostawaly aktywne, a tokeny — wazne. Uzytkownik, ktory zmienial haslo
 * WLASNIE dlatego, ze podejrzewal przejecie konta, nie osiagal niczego:
 * atakujacy zachowywal dostep do konca zycia swojego tokenu.
 *
 * Teraz zmiana hasla uniewaznia wszystkie pozostale sesje.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getUserById, hashPassword, revokeAllUserSessions, verifyPassword } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.post(
  '/change-password',
  requireAuth,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const oldPassword = String(body.oldPassword ?? '')
    const newPassword = String(body.newPassword ?? '')

    const fields: Record<string, string> = {}
    if (!oldPassword) fields.oldPassword = 'Podaj obecne haslo.'
    if (newPassword.length < 10) fields.newPassword = 'Nowe haslo musi miec co najmniej 10 znakow.'

    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((p) => p.test(newPassword)).length
    if (newPassword && classes < 3) {
      fields.newPassword = 'Nowe haslo musi zawierac znaki z co najmniej trzech grup: male litery, wielkie litery, cyfry, znaki specjalne.'
    }
    if (oldPassword && newPassword && oldPassword === newPassword) {
      fields.newPassword = 'Nowe haslo musi roznic sie od obecnego.'
    }

    if (Object.keys(fields).length) {
      return fail(c, 'validation_error', 'Dane zmiany hasla sa nieprawidlowe.', { fields })
    }
    return { oldPassword, newPassword }
  }),
  async (c) => {
    const auth = getAuth(c)
    if (!auth) return fail(c, 'unauthorized')
    if (!c.env?.DB) return fail(c, 'database_unavailable')

    const body = c.req.valid('json')
    const user = await getUserById(c.env, auth.sub)
    if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

    if (!(await verifyPassword(body.oldPassword, user.passwordHash))) {
      return fail(c, 'invalid_credentials', 'Obecne haslo jest nieprawidlowe.')
    }

    await c.env.DB
      .prepare(`UPDATE users SET password_hash = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`)
      .bind(user.id, await hashPassword(body.newPassword))
      .run()

    // Biezaca sesja zostaje — uzytkownik nie musi logowac sie ponownie
    // w karcie, w ktorej wlasnie zmienil haslo. Wszystkie inne przepadaja.
    const revoked = await revokeAllUserSessions(c.env, user.id, auth.sessionId)

    return ok(c, {
      hasloZmienione: true,
      uniewaznionychSesji: revoked,
      informacja: revoked > 0
        ? `Zmiana hasla zakonczyla ${revoked} innych sesji. Na pozostalych urzadzeniach konieczne bedzie ponowne zalogowanie.`
        : 'Nie bylo innych aktywnych sesji.',
    })
  },
)

export default route
