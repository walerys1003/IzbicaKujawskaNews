/**
 * POST /api/v1/auth/2fa/enable — rozpoczecie wlaczania 2FA
 *
 * FAZA 1 / A2. Sekret zapisujemy w kolumnie `pending_two_factor_secret`
 * i NIE wlaczamy 2FA od razu. Dopiero poprawny kod z aplikacji (trasa
 * /2fa/verify) przenosi go do `two_factor_secret` i ustawia flage.
 *
 * Kolejnosc ma znaczenie praktyczne: gdyby 2FA wlaczalo sie natychmiast po
 * wygenerowaniu sekretu, uzytkownik ktory nie zdazyl zapisac kodu QR (zamknal
 * karte, blad aparatu) zostalby odciety od wlasnego konta — logowanie
 * wymagaloby kodu, ktorego nie ma z czego wygenerowac.
 *
 * Sekret jest teraz zakodowany w BASE32, zgodnie z formatem otpauth://.
 * Poprzednia wersja zwracala base64url, ktorego zadna aplikacja
 * uwierzytelniajaca nie odczytuje poprawnie — szczegoly w src/lib/auth/totp.ts.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getUserById } from '../../lib/auth/store'
import { generateTotpSecret, otpauthUrl } from '../../lib/auth/totp'

const route = new Hono<AppEnv>()

route.post('/2fa/enable', requireAuth, async (c) => {
  const auth = getAuth(c as never)
  if (!auth) return fail(c, 'unauthorized')
  if (!c.env?.DB) return fail(c, 'database_unavailable')

  const user = await getUserById(c.env, auth.sub)
  if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

  if (user.twoFactorEnabled) {
    return fail(c, 'conflict', 'Uwierzytelnianie dwuskladnikowe jest juz wlaczone. Aby zmienic urzadzenie, najpierw je wylacz.')
  }

  const secret = generateTotpSecret()

  await c.env.DB
    .prepare(`UPDATE users SET pending_two_factor_secret = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`)
    .bind(user.id, secret)
    .run()

  return ok(c, {
    sekret: secret,
    otpauthUrl: otpauthUrl(secret, user.email),
    krokNastepny: 'Zeskanuj kod w aplikacji uwierzytelniajacej, a nastepnie potwierdz szescioznakowym kodem przez POST /api/v1/auth/2fa/verify.',
    uwaga: 'Uwierzytelnianie dwuskladnikowe NIE jest jeszcze aktywne — wlaczy sie po potwierdzeniu kodem.',
  })
})

export default route
