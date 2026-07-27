/**
 * GET /api/v1/auth/verify/:token — potwierdzenie adresu e-mail lub logowanie linkiem
 *
 * FAZA 1 / A2.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY BLAD — TOKEN RESETU HASLA POTWIERDZAL ADRES I LOGOWAL
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia wersja odczytywala token BEZ sprawdzania jego rodzaju:
 *
 *     const record = await getTokenRecord(c.env, token)
 *     if (!record) return c.json({ error: 'token_not_found' }, 404)
 *     ...
 *     if (record.type === 'magic') { ...wydaj sesje... }
 *
 * Kazdy token — takze token RESETU HASLA — przechodzil sciezke „potwierdz
 * adres”, a rodzaj sprawdzano tylko po to, by zdecydowac o wydaniu sesji.
 * Token resetu byl wiec zuzywany przez samo otwarcie tego adresu, co
 * unieruchamialo reset hasla, a przy okazji potwierdzalo adres, ktorego
 * nikt nie potwierdzil.
 *
 * Teraz `consumeToken` przyjmuje oczekiwany rodzaj i odrzuca kazdy inny.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { getUserByEmail, issueSession, publicUser } from '../../lib/auth/store'
import { consumeToken } from '../../lib/auth/tokens'

const route = new Hono<AppEnv>()

route.get('/verify/:token', async (c) => {
  if (!c.env?.DB) return fail(c, 'database_unavailable')

  const token = c.req.param('token')
  // Tryb wynika z parametru zapytania i jest weryfikowany wzgledem rodzaju
  // tokenu — token weryfikacyjny nie zaloguje, a token logujacy nie potwierdzi
  // adresu w innym trybie niz wlasny.
  const expected = c.req.query('mode') === 'magic' ? 'magic' : 'verify'

  const result = await consumeToken(c.env, token, expected)

  if (!result.ok) {
    if (result.reason === 'expired') {
      return fail(c, 'conflict', 'Link wygasl. Zamow nowy.')
    }
    if (result.reason === 'wrong_type') {
      return fail(c, 'validation_error', 'Ten link sluzy do innej operacji. Sprawdz, czy uzywasz wlasciwego adresu.')
    }
    return fail(c, 'not_found', 'Link jest nieprawidlowy lub zostal juz wykorzystany.')
  }

  const user = await getUserByEmail(c.env, result.record.email)
  if (!user) return fail(c, 'not_found', 'Konto powiazane z tym linkiem nie istnieje.')

  await c.env.DB
    .prepare(`UPDATE users
                 SET email_verified = 1,
                     email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
                     updated_at = CURRENT_TIMESTAMP
               WHERE id = ?1`)
    .bind(user.id)
    .run()

  if (result.record.type === 'magic') {
    const session = await issueSession(c.env, user, {
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') ?? undefined,
    })
    return ok(c, {
      tryb: 'magic',
      tokenType: session.tokenType,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      user: publicUser({ ...user, emailVerified: true }),
    })
  }

  return ok(c, { adresPotwierdzony: true, email: user.email })
})

export default route
