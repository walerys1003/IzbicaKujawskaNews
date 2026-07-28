/**
 * FAZA 2 / F-panel — sesja panelu redakcyjnego w ciasteczkach.
 *
 * DLACZEGO TEN PLIK MUSIAL POWSTAC
 * ────────────────────────────────
 * `requireAdmin` w src/routes/admin.tsx czytal ciasteczko `admin_token`:
 *
 *     const token = header.startsWith('Bearer ') ? header.slice(7)
 *       : (getCookie(c, 'admin_token') || '')
 *
 * ale ZADNA trasa w projekcie tego ciasteczka nie ustawiala. `POST
 * /api/v1/auth/login` zwraca token w tresci odpowiedzi JSON, co dziala dla
 * klienta programowego, lecz przegladarka nie ma jak go nigdzie zapisac przy
 * zwyklym przejsciu na `/admin`. Nie istniala tez strona logowania panelu.
 *
 * Efekt: panel redakcyjny byl nieosiagalny z przegladarki. Kryterium wyjscia
 * FAZY 2 („Redaktor loguje sie, tworzy artykul…") nie moglo zostac spelnione
 * nie z powodu braku funkcji, ale z powodu braku drzwi.
 *
 * PROBLEM DRUGI: 15 MINUT
 * ───────────────────────
 * Token dostepu zyje 900 sekund (`ACCESS_TOKEN_TTL_SECONDS`). Gdyby panel
 * trzymal w ciasteczku tylko jego, redaktor bylby wylogowywany po kwadransie —
 * czesto w trakcie pisania, z utrata niezapisanej tresci. Dlatego panel trzyma
 * DWA ciasteczka: krotkotrwaly token dostepu i dlugotrwaly token odnowien,
 * a `ensurePanelSession()` odnawia pierwszy w tle.
 *
 * ROTACJA I WYSCIG
 * ────────────────
 * `rotateSession()` wymienia token odnowien przy kazdym uzyciu — przechwycony
 * token staje sie bezuzyteczny, gdy prawowity uzytkownik uzyje swojego. Ma to
 * jednak konsekwencje: dwa rownoczesne zadania z tym samym tokenem odnowien
 * skoncza sie tak, ze jedno wygra, a drugie zobaczy uniewazniony token.
 *
 * Dlatego odnawiamy WYLACZNIE przy zadaniach, ktore prowadza do pelnego
 * przeladowania strony (nawigacja GET i wyslanie formularza POST). Panel jest
 * renderowany po stronie serwera, wiec takie zadania sa sekwencyjne — jedno
 * na przejscie. Zapytania pomocnicze (`fetch` z panelu) przy wygasnietym
 * tokenie dostaja 401 i odswiezaja strone, co uruchamia odnowienie na
 * sciezce nawigacyjnej.
 */

import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { getSession, rotateSession, verifyAccessToken } from './store'
import type { Role } from './roles'
import { toRole } from './roles'

export const PANEL_ACCESS_COOKIE = 'admin_token'
export const PANEL_REFRESH_COOKIE = 'admin_refresh'

/** 30 dni — tyle, ile zyje sesja po stronie serwera. */
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export interface PanelSession {
  userId: number
  email: string
  role: Role
  sessionId: string
}

/**
 * Ustawienia ciasteczek.
 *
 * `httpOnly` — skrypt strony nie ma dostepu do tokenu, wiec luka XSS
 * w panelu nie pozwala go wykrasc.
 * `sameSite: 'Lax'` — ciasteczko nie jedzie z zadaniami inicjowanymi z obcych
 * witryn poza zwykla nawigacja, co odbiera sens atakowi CSRF na formularze
 * POST panelu. 'Strict' zepsulby powrot z zewnetrznego odnosnika do panelu.
 * `secure` — tylko po HTTPS. W piaskownicy lokalnej dziala HTTP, wiec flaga
 * jest warunkowa; na produkcji (`ENVIRONMENT === 'production'`) obowiazkowa.
 */
const cookieOptions = (c: Context, maxAge: number) => {
  const isProduction = (c.env as { ENVIRONMENT?: string } | undefined)?.ENVIRONMENT === 'production'
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax' as const,
    secure: isProduction,
    maxAge,
  }
}

export const setPanelCookies = (
  c: Context,
  tokens: { accessToken: string; refreshToken: string; accessTokenExpiresIn: number },
): void => {
  // Ciasteczko tokenu dostepu zyje o minute dluzej niz sam token. Gdyby zyly
  // rowno, po wygasnieciu przegladarka nie przyslalaby nic i nie dowiedzielibysmy
  // sie, ktora sesje odnowic — minuta zapasu pozwala odczytac `sessionId`
  // z wygasnietego tokenu.
  setCookie(c, PANEL_ACCESS_COOKIE, tokens.accessToken, cookieOptions(c, tokens.accessTokenExpiresIn + 60))
  setCookie(c, PANEL_REFRESH_COOKIE, tokens.refreshToken, cookieOptions(c, REFRESH_COOKIE_MAX_AGE))
}

export const clearPanelCookies = (c: Context): void => {
  deleteCookie(c, PANEL_ACCESS_COOKIE, { path: '/' })
  deleteCookie(c, PANEL_REFRESH_COOKIE, { path: '/' })
}

/**
 * Odczyt sesji panelu z ewentualnym odnowieniem tokenu dostepu.
 *
 * Zwraca `null`, gdy uzytkownik nie jest zalogowany albo sesja przestala
 * istniec (wylogowanie, zmiana hasla, uniewaznienie z innego urzadzenia).
 * Wolant przekierowuje wtedy na strone logowania.
 *
 * @param allowRenew odnawiac token dostepu? `true` tylko dla zadan
 *   nawigacyjnych — patrz naglowek pliku, akapit o wyscigu.
 */
export const ensurePanelSession = async (
  c: Context,
  allowRenew = true,
): Promise<PanelSession | null> => {
  const env = c.env as never
  if (!(c.env as { JWT_SECRET?: string } | undefined)?.JWT_SECRET) return null

  const access = getCookie(c, PANEL_ACCESS_COOKIE) || ''
  const bearer = (c.req.header('authorization') || '').startsWith('Bearer ')
    ? (c.req.header('authorization') as string).slice(7)
    : ''
  const token = bearer || access

  if (token) {
    const payload = await verifyAccessToken(env, token)
    if (payload) {
      // Podpis i termin waznosci sa poprawne — pozostaje sprawdzic, czy sesja
      // nadal istnieje. Bez tego „Wyloguj" nie mialoby natychmiastowego skutku.
      const session = await getSession(env, payload.sessionId)
      if (session) {
        return {
          userId: Number(payload.sub),
          email: payload.email,
          role: toRole(payload.role),
          sessionId: payload.sessionId,
        }
      }
    }
  }

  if (!allowRenew) return null

  const refresh = getCookie(c, PANEL_REFRESH_COOKIE) || ''
  if (!refresh) return null

  const rotated = await rotateSession(env, refresh)
  if (!rotated.ok) {
    // Token odnowien nieważny — czyscimy ciasteczka, zeby przegladarka
    // przestala wysylac bezuzyteczne dane przy kazdym zadaniu.
    clearPanelCookies(c)
    return null
  }

  setPanelCookies(c, {
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    accessTokenExpiresIn: rotated.accessTokenExpiresIn,
  })

  return {
    userId: rotated.user.id,
    email: rotated.user.email,
    role: toRole(rotated.user.role),
    sessionId: rotated.sessionId,
  }
}
