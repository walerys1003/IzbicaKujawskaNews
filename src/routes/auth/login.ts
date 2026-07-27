/**
 * POST /api/v1/auth/login
 *
 * FAZA 1 / A2 — logowanie przeciwko tabeli `users` w D1.
 *
 * Poprzednia wersja szukala uzytkownika w KV (`auth:user:<email>`), rozlacznie
 * z tabela `users`, wiec konto administratora z migracji 0004_seed_admin
 * nie moglo sie zalogowac. Szczegoly w naglowku src/lib/auth/store.ts.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { loginRateLimit } from '../../middleware/rate-limit'
import {
  getUserByEmail,
  isAccountLocked,
  issueSession,
  noteFailedLogin,
  noteSuccessfulLogin,
  publicUser,
  verifyPassword,
} from '../../lib/auth/store'
import { verifyTotp } from '../../lib/auth/totp'

const route = new Hono<AppEnv>()

route.post(
  '/login',
  loginRateLimit,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const code = body.code ? String(body.code) : undefined
    if (!email || !password) {
      return fail(c, 'validation_error', 'Podaj adres e-mail i haslo.', {
        fields: { email: email ? undefined : 'wymagane', password: password ? undefined : 'wymagane' },
      })
    }
    return { email, password, code }
  }),
  async (c) => {
    if (!c.env?.DB) return fail(c, 'database_unavailable')
    const body = c.req.valid('json')

    const user = await getUserByEmail(c.env, body.email)

    // Ta sama odpowiedz dla nieistniejacego konta i zlego hasla — inaczej
    // roznica komunikatow pozwalalaby ustalic, ktore adresy sa zarejestrowane.
    if (!user) return fail(c, 'invalid_credentials', 'Nieprawidlowy adres e-mail lub haslo.')

    if (isAccountLocked(user)) {
      return fail(c, 'rate_limited', 'Konto jest tymczasowo zablokowane po nieudanych probach logowania. Spróbuj ponownie za kilkanaście minut.', {
        lockedUntil: user.lockedUntil,
      })
    }

    if (!(await verifyPassword(body.password, user.passwordHash))) {
      // Licznik nieudanych prob jest per konto — uzupelnia limit per adres IP.
      // Atak rozproszony z wielu adresow ominie limit IP, ale nie ten licznik.
      await noteFailedLogin(c.env, user.id)
      return fail(c, 'invalid_credentials', 'Nieprawidlowy adres e-mail lub haslo.')
    }

    if (user.twoFactorEnabled) {
      if (!body.code) {
        return fail(c, 'two_factor_required', 'Konto wymaga kodu z aplikacji uwierzytelniajacej.')
      }
      if (!user.twoFactorSecret || !(await verifyTotp(user.twoFactorSecret, body.code))) {
        await noteFailedLogin(c.env, user.id)
        return fail(c, 'invalid_credentials', 'Nieprawidlowy kod uwierzytelniania dwuskladnikowego.')
      }
    }

    const session = await issueSession(c.env, user, {
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? undefined,
    })

    await noteSuccessfulLogin(c.env, user.id)

    return ok(c, {
      tokenType: session.tokenType,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      sessionId: session.sessionId,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      refreshTokenExpiresIn: session.refreshTokenExpiresIn,
      user: publicUser(user),
    })
  },
)

export default route
