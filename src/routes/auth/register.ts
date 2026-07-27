/**
 * POST /api/v1/auth/register
 *
 * FAZA 1 / A2 — rejestracja zapisujaca do tabeli `users` w D1.
 *
 * Poprzednia wersja miala trzy wady:
 *   1. zapisywala konto do KV, niewidoczne dla panelu redakcyjnego,
 *   2. nadawala role 'reader' — wartosc, ktorej po migracji 0047 nie ma
 *      (odpowiada jej 'viewer'),
 *   3. nie miala zadnego limitu, wiec jednym skryptem mozna bylo utworzyc
 *      dowolna liczbe kont.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { created, fail } from '../../lib/http/envelope'
import { registerRateLimit } from '../../middleware/rate-limit'
import { createUser, getUserByEmail, publicUser } from '../../lib/auth/store'
import { issueToken } from '../../lib/auth/tokens'
import { stripHtml } from '../../lib/security/sanitize-html'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/**
 * Ocena hasla. Sam warunek dlugosci nie wystarcza — 'aaaaaaaaaa' ma 10 znakow.
 * Wymagamy dlugosci 10+ oraz trzech z czterech klas znakow.
 */
const passwordProblems = (password: string): string[] => {
  const problems: string[] = []
  if (password.length < 10) problems.push('Haslo musi miec co najmniej 10 znakow.')
  if (password.length > 200) problems.push('Haslo nie moze byc dluzsze niz 200 znakow.')

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length
  if (classes < 3) {
    problems.push('Haslo musi zawierac znaki z co najmniej trzech grup: male litery, wielkie litery, cyfry, znaki specjalne.')
  }

  // Najczestsze hasla odrzucamy wprost — kazde z nich przechodziloby powyzsze
  // warunki, a znajduje sie na pierwszych miejscach list uzywanych w atakach.
  const forbidden = ['password10', 'haslo12345', 'qwerty1234', 'izbica2024', 'izbica2025', 'admin12345']
  if (forbidden.includes(password.toLowerCase())) problems.push('To haslo jest zbyt popularne.')

  return problems
}

const route = new Hono<AppEnv>()

route.post(
  '/register',
  registerRateLimit,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const name = stripHtml(String(body.name ?? '').trim(), 120)

    const fields: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(email)) fields.email = 'Podaj poprawny adres e-mail.'
    if (name.length < 2) fields.name = 'Podaj imie i nazwisko (min. 2 znaki).'
    const problems = passwordProblems(password)
    if (problems.length) fields.password = problems.join(' ')

    if (Object.keys(fields).length) {
      return fail(c, 'validation_error', 'Dane rejestracji sa nieprawidlowe.', { fields })
    }
    return { email, password, name }
  }),
  async (c) => {
    if (!c.env?.DB) return fail(c, 'database_unavailable')
    const body = c.req.valid('json')

    if (await getUserByEmail(c.env, body.email)) {
      return fail(c, 'conflict', 'Konto z tym adresem e-mail juz istnieje.')
    }

    // Nowe konto zawsze otrzymuje najnizsza role. Podniesienie uprawnien jest
    // wylacznie decyzja administratora (uprawnienie user:change-role) — pole
    // `role` z zadania jest swiadomie ignorowane, aby rejestracja nie mogla
    // sluzyc do samodzielnego nadania sobie roli redaktora.
    const user = await createUser(c.env, {
      email: body.email,
      name: body.name,
      password: body.password,
      role: 'viewer',
    })

    const verification = await issueToken(c.env, { type: 'verify', email: user.email, userId: user.id })

    return created(c, {
      user: publicUser(user),
      // Docelowo (etap I5) token wychodzi mailem, a nie w odpowiedzi. Do czasu
      // podlaczenia nadawcy zwracamy adres, aby proces dal sie przetestowac.
      verification: {
        url: `/api/v1/auth/verify/${verification.token}`,
        expiresInSeconds: verification.expiresInSeconds,
        uwaga: 'Adres zwracany tymczasowo — po podlaczeniu nadawcy poczty (etap I5) bedzie wysylany mailem.',
      },
    })
  },
)

export default route
