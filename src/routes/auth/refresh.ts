/**
 * POST /api/v1/auth/refresh
 *
 * FAZA 1 / A2 — odnowienie tokenu dostepu z rotacja tokenu odnowien.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY BLAD — KLIENT MUSIAL PODAC `userId` W ADRESIE
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia wersja odczytywala identyfikator uzytkownika z parametru zapytania
 *
 *     const userId = String(c.req.query('userId') || '')
 *     if (!userId) return c.json({ error: 'missing_user_id' }, 400)
 *
 * Byly z tym dwa problemy. Praktyczny: klient musial pamietac i przesylac
 * `userId`, choc token odnowien juz zawiera identyfikator sesji — nadmiarowy
 * parametr, ktory laczyl sie z sesja tylko przez zaufanie do klienta.
 * Powazniejszy: identyfikator uzytkownika trafial do adresu URL, a wiec do
 * logow serwera, historii przegladarki i naglowka Referer.
 *
 * Teraz jedynym wejsciem jest token odnowien. Sesja i wlasciciel wynikaja
 * z jego tresci, sprawdzanej po stronie serwera.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { publicUser, rotateSession } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.post(
  '/refresh',
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const refreshToken = String(body.refreshToken ?? '')
    if (!refreshToken) {
      return fail(c, 'validation_error', 'Brak tokenu odnowien.', { fields: { refreshToken: 'wymagane' } })
    }
    return { refreshToken }
  }),
  async (c) => {
    if (!c.env?.DB) return fail(c, 'database_unavailable')
    const { refreshToken } = c.req.valid('json')

    const result = await rotateSession(c.env, refreshToken)

    if (!result.ok) {
      // Wszystkie przypadki niepowodzenia zwracaja 401 z tym samym komunikatem.
      // Rozroznienie 'not_found' od 'invalid_secret' informowaloby atakujacego,
      // czy trafil na istniejacy identyfikator sesji.
      // Powod pozostaje w polu diagnostycznym — przydatnym w logach, a nie
      // ujawniajacym stanu innych sesji.
      return fail(c, 'unauthorized', 'Token odnowien jest nieprawidlowy lub wygasl. Zaloguj sie ponownie.', {
        powod: result.reason,
      })
    }

    return ok(c, {
      tokenType: result.tokenType,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      accessTokenExpiresIn: result.accessTokenExpiresIn,
      user: publicUser(result.user),
    })
  },
)

export default route
