/**
 * POST /api/v1/auth/magic — logowanie linkiem wysylanym na adres e-mail
 *
 * FAZA 1 / A2.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY BLAD — TRASA SLUZYLA DO SPRAWDZANIA, KTO MA KONTO
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia wersja zwracala 404 `user_not_found` dla nieznanego adresu,
 * a 200 z linkiem dla znanego. Bez zadnego limitu i bez uwierzytelnienia
 * stanowilo to wygodne narzedzie do ustalenia, ktore adresy e-mail sa
 * zarejestrowane w portalu — wystarczylo przepuscic liste adresow.
 *
 * Teraz odpowiedz jest identyczna w obu przypadkach, a trasa objeta limitem.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { passwordResetRateLimit } from '../../middleware/rate-limit'
import { getUserByEmail } from '../../lib/auth/store'
import { issueToken } from '../../lib/auth/tokens'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

const route = new Hono<AppEnv>()

route.post(
  '/magic',
  passwordResetRateLimit,
  validator('json', (value, c) => {
    const email = String(((value ?? {}) as Record<string, unknown>).email ?? '').trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      return fail(c, 'validation_error', 'Podaj poprawny adres e-mail.', { fields: { email: 'nieprawidlowy format' } })
    }
    return { email }
  }),
  async (c) => {
    if (!c.env?.DB) return fail(c, 'database_unavailable')
    const { email } = c.req.valid('json')

    const neutral = {
      przyjeto: true,
      komunikat: 'Jesli konto o podanym adresie istnieje, link logujacy zostal wyslany. Link jest wazny 15 minut.',
    }

    const user = await getUserByEmail(c.env, email)
    if (!user) return ok(c, neutral)

    const issued = await issueToken(c.env, { type: 'magic', email: user.email, userId: user.id })

    return ok(c, {
      ...neutral,
      _test: {
        url: `/api/v1/auth/verify/${issued.token}?mode=magic`,
        expiresInSeconds: issued.expiresInSeconds,
        uwaga: 'Pole tymczasowe — do usuniecia po podlaczeniu nadawcy poczty (etap I5).',
      },
    })
  },
)

export default route
