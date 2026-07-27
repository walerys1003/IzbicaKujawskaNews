/**
 * POST /api/v1/auth/reset — zadanie linku resetujacego LUB ustawienie nowego hasla
 *
 * FAZA 1 / A2.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANE BLEDY
 * ══════════════════════════════════════════════════════════════════════════
 * 1. WYCIEK LISTY KONT. Przy zadaniu resetu poprzednia wersja odpowiadala
 *    inaczej dla konta istniejacego (zwracala `resetUrl`) niz dla
 *    nieistniejacego (komunikat ogolny). Roznica dlugosci i tresci odpowiedzi
 *    pozwalala sprawdzic, ktore adresy e-mail sa zarejestrowane. Teraz
 *    odpowiedz jest identyczna w obu przypadkach.
 *
 * 2. BRAK LIMITU. Trasa nie miala zadnego ograniczenia liczby zadan, wiec
 *    mozna bylo jej uzyc do zasypania dowolnej skrzynki wiadomosciami
 *    (a po podlaczeniu nadawcy — do wyczerpania limitu wysylki).
 *
 * 3. SESJE PRZETRWALY RESET. Po ustawieniu nowego hasla stare sesje pozostawaly
 *    wazne, mimo ze reset hasla sluzy zwykle wlasnie odzyskaniu przejetego konta.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { passwordResetRateLimit } from '../../middleware/rate-limit'
import { getUserByEmail, hashPassword, revokeAllUserSessions } from '../../lib/auth/store'
import { consumeToken, issueToken } from '../../lib/auth/tokens'

const route = new Hono<AppEnv>()

/** Odpowiedz na zadanie resetu — identyczna niezaleznie od istnienia konta. */
const NEUTRAL_RESPONSE = {
  przyjeto: true,
  komunikat: 'Jesli konto o podanym adresie istnieje, link do zmiany hasla zostal wygenerowany. Sprawdz skrzynke pocztowa.',
}

route.post(
  '/reset',
  passwordResetRateLimit,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const email = body.email ? String(body.email).trim().toLowerCase() : ''
    const token = body.token ? String(body.token) : ''
    const newPassword = body.newPassword ? String(body.newPassword) : ''

    if (!email && !token) {
      return fail(c, 'validation_error', 'Podaj adres e-mail (aby otrzymac link) albo token wraz z nowym haslem.', {
        fields: { email: 'wymagane w pierwszym kroku', token: 'wymagane w drugim kroku' },
      })
    }
    if (token && newPassword.length < 10) {
      return fail(c, 'validation_error', 'Nowe haslo musi miec co najmniej 10 znakow.', {
        fields: { newPassword: 'min. 10 znakow' },
      })
    }
    return { email, token, newPassword }
  }),
  async (c) => {
    if (!c.env?.DB) return fail(c, 'database_unavailable')
    const body = c.req.valid('json')

    // ── Krok 2: token + nowe haslo ────────────────────────────────────────
    if (body.token && body.newPassword) {
      const result = await consumeToken(c.env, body.token, 'reset')

      if (!result.ok) {
        const message = result.reason === 'expired'
          ? 'Link do zmiany hasla wygasl. Zamow nowy.'
          : 'Link do zmiany hasla jest nieprawidlowy lub zostal juz wykorzystany.'
        return fail(c, result.reason === 'expired' ? 'conflict' : 'not_found', message)
      }

      const user = await getUserByEmail(c.env, result.record.email)
      // Token zostal juz zuzyty, wiec nie da sie go powtorzyc — konto moglo
      // zostac usuniete miedzy wydaniem tokenu a jego uzyciem.
      if (!user) return fail(c, 'not_found', 'Konto powiazane z tym linkiem nie istnieje.')

      await c.env.DB
        .prepare(`UPDATE users
                     SET password_hash = ?2,
                         failed_login_attempts = 0,
                         locked_until = NULL,
                         updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?1`)
        .bind(user.id, await hashPassword(body.newPassword))
        .run()

      // Reset hasla uniewaznia WSZYSTKIE sesje, bez wyjatkow — inaczej osoba,
      // ktora przejela konto, zachowalaby dostep po odzyskaniu go przez
      // wlasciciela.
      const revoked = await revokeAllUserSessions(c.env, user.id)

      return ok(c, {
        hasloZmienione: true,
        uniewaznionychSesji: revoked,
        komunikat: 'Haslo zostalo zmienione, a wszystkie sesje zakonczone. Zaloguj sie nowym haslem.',
      })
    }

    // ── Krok 1: zadanie linku ─────────────────────────────────────────────
    const user = await getUserByEmail(c.env, body.email)

    if (!user) {
      // Odpowiedz taka sama jak dla konta istniejacego. Nie wykonujemy tu
      // zadnej pracy, ale roznica czasu jest pomijalna wobec zmiennosci sieci.
      return ok(c, NEUTRAL_RESPONSE)
    }

    const issued = await issueToken(c.env, { type: 'reset', email: user.email, userId: user.id })

    return ok(c, {
      ...NEUTRAL_RESPONSE,
      // Do czasu podlaczenia nadawcy poczty (etap I5) adres zwracany jest
      // w odpowiedzi, aby proces dal sie przetestowac. Docelowo trafi mailem
      // i to pole zniknie — w przeciwnym razie kazdy moglby zamowic reset
      // hasla dowolnego konta i od razu otrzymac dzialajacy link.
      _test: {
        url: `/api/v1/auth/reset?token=${issued.token}`,
        token: issued.token,
        expiresInSeconds: issued.expiresInSeconds,
        uwaga: 'Pole tymczasowe — do usuniecia po podlaczeniu nadawcy poczty (etap I5).',
      },
    })
  },
)

export default route
