import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { AppEnv } from '../../../types/env'
import type { AuthJwtPayload } from '../helpers/password-utils'

/**
 * Sprawdza, czy tresc tokenu ma pola, na ktorych opieraja sie trasy.
 *
 * `sub`, `email` i `sessionId` musza byc niepustymi napisami — `sub` bo na nim
 * opiera sie „kto to jest”, `sessionId` bo to jedyny uchwyt do uniewaznienia
 * sesji. `role` jest sprawdzana tylko jako napis: rozjazd dwoch zestawow rol
 * (`UserRole` — 5 wartosci, `Role` — 6) jest osobnym, niezalatwionym zadaniem
 * i nie udaje, ze go tu rozstrzygam.
 */
const jestTrescaTokenu = (wartosc: unknown): wartosc is AuthJwtPayload => {
  if (!wartosc || typeof wartosc !== 'object') return false
  const p = wartosc as Record<string, unknown>
  const napis = (v: unknown) => typeof v === 'string' && v.length > 0
  return napis(p.sub) && napis(p.email) && napis(p.sessionId) && typeof p.role === 'string'
}

/**
 * I8 — NAPRAWA DEFEKTU: KAŻDY POPRAWNY TOKEN BYŁ ODRZUCANY
 *
 * ══════════════════════════════════════════════════════════════════════════
 * OBJAW
 * ══════════════════════════════════════════════════════════════════════════
 * Wszystkie trasy chronione tym pośrednikiem zwracały 401 `invalid_token`
 * także przy prawidłowo podpisanym, nieprzedawnionym tokenie.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * PRZYCZYNA (zmierzona, nie zgadnięta)
 * ══════════════════════════════════════════════════════════════════════════
 * Kod wołał `verify(token, c.env.JWT_SECRET)` — BEZ trzeciego argumentu.
 * W Hono 4.12.23 `verify` wymaga jawnego podania algorytmu i przy jego braku
 * RZUCA `JwtAlgorithmRequired: JWT verification requires "alg" option to be
 * specified`. Wyjątek trafiał do `catch` poniżej, gdzie każda przyczyna jest
 * tłumaczona na jednakowe 401 — więc błąd konfiguracyjny był nieodróżnialny
 * od błędnego tokenu i nie dawał żadnego śladu w logach.
 *
 * Pomiar potwierdzający (Hono 4.12.23):
 *   verify(t, 'sekret')          → RZUCA: requires "alg" option
 *   verify(t, 'sekret', 'HS256') → OK
 *
 * Ta sama funkcja jest wołana POPRAWNIE w src/lib/auth/store.ts:390
 * (`verify(token, env.JWT_SECRET, 'HS256')`), co pokazuje, że pominięcie
 * `alg` było przeoczeniem w tym jednym pliku, a nie przyjętą konwencją.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ZASIĘG
 * ══════════════════════════════════════════════════════════════════════════
 * Pośrednik jest używany przez trasy push, analytics i search. Defekt nie
 * osłabiał zabezpieczeń (odmowa dostępu to strona bezpieczna — „fail closed”),
 * ale całkowicie uniemożliwiał korzystanie z tych paneli po zalogowaniu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DODATKOWO: FAIL-CLOSED PRZY BRAKU SEKRETU
 * ══════════════════════════════════════════════════════════════════════════
 * Bez `JWT_SECRET` `verify` również rzucało, dając 401 `invalid_token`.
 * Komunikat sugerował winę klienta, choć powodem był brak konfiguracji
 * serwera. Teraz taki przypadek zwraca 503 z jawnym powodem — zgodnie
 * z zachowaniem pozostałych warstw uwierzytelniania w projekcie.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return c.json({ error: 'missing_bearer_token' }, 401)

  // Brak sekretu to awaria środowiska, nie nieprawidłowy token. Odmawiamy
  // dostępu (fail closed), ale nazywamy przyczynę — inaczej diagnoza wymaga
  // czytania kodu, a redakcja widzi tylko „nieprawidłowy token”.
  if (!c.env?.JWT_SECRET) {
    console.error('[auth] Brak JWT_SECRET — odmowa dostepu (zasada fail closed).')
    return c.json({
      error: 'service_unavailable',
      message: 'Uwierzytelnianie nie jest skonfigurowane na tym środowisku.',
    }, 503)
  }

  try {
    // Algorytm MUSI być podany jawnie — patrz nagłówek pliku.
    // Jawna wartość jest też zabezpieczeniem samym w sobie: pośrednik
    // przyjmuje wyłącznie HS256 i nie da się go nakłonić do zaakceptowania
    // tokenu z podmienionym nagłówkiem `alg` (np. `none`).
    // `verify` zwraca `JWTPayload` (indeks `[key: string]: unknown`), a nie
    // nasz `AuthJwtPayload`. Rzutowanie proste bylo bledem TS2352 („typy nie
    // pokrywaja sie dostatecznie”), a `payload as never` przy `c.set` obchodzil
    // brakujaca deklaracje `Variables` w `AppEnv` — oba juz nie sa potrzebne.
    //
    // Zamiast rzutowac na slepo SPRAWDZAMY kształt. To nie kosmetyka typow:
    // podpis tokenu gwarantuje tylko, ze tresci nie podmienil obcy, NIE ze
    // zawiera pola, ktorych oczekujemy. Token bez `sub` (np. wystawiony przez
    // inna sciezke logowania na tym samym sekrecie) przechodzil dotad jako
    // poprawny, a `auth.sub` bylo `undefined` — czyli trasa dzialala „w imieniu
    // nikogo”. Teraz taki token dostaje 401.
    const payload: unknown = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (!jestTrescaTokenu(payload)) return c.json({ error: 'invalid_token' }, 401)
    c.set('auth', payload)
    await next()
  } catch {
    return c.json({ error: 'invalid_token' }, 401)
  }
})
