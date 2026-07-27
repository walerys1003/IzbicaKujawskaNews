/**
 * FAZA 1 / A2 — weryfikacja tozsamosci.
 *
 * Poprzednie requireAuth (src/routes/auth/middleware/require-auth.ts)
 * sprawdzalo wylacznie podpis tokenu JWT. Wada: token pozostawal wazny
 * przez CALY okres waznosci (ustawiony wowczas na 7 dni) nawet po
 * wylogowaniu, zmianie hasla czy uniewaznieniu sesji — bo nic nie
 * sprawdzalo, czy sesja jeszcze istnieje. „Wyloguj” bylo iluzja.
 *
 * Teraz: poprawny podpis ORAZ istniejaca, nieuniewazniona sesja.
 * Token dostepu zyje 15 minut, wiec sprawdzenie sesji nie obciaza
 * nadmiernie bazy — dodatkowo pierwszy odczyt idzie do SESSION_KV.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { fail } from '../lib/http/envelope'
import { getSession, verifyAccessToken, getUserById } from '../lib/auth/store'
import { toRole } from '../lib/auth/roles'

/** Wyciagniecie tokenu z naglowka Authorization lub ciasteczka. */
const extractToken = (c: { req: { header: (name: string) => string | undefined } }) => {
  const header = c.req.header('Authorization') || c.req.header('authorization') || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()

  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/(?:^|;\s*)(?:access_token|admin_token)=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Wymaga waznego tokenu i aktywnej sesji.
 * Ustawia w kontekscie `auth` (dane z tokenu) oraz `authUser` (rekord z bazy).
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env?.JWT_SECRET) {
    console.error('[auth] Brak JWT_SECRET — odmowa dostepu (zasada fail closed).')
    return fail(c, 'service_unavailable', 'Uwierzytelnianie nie jest skonfigurowane.')
  }

  const token = extractToken(c as never)
  if (!token) return fail(c, 'unauthorized', 'Wymagane zalogowanie.')

  const payload = await verifyAccessToken(c.env, token)
  if (!payload) return fail(c, 'unauthorized', 'Nieprawidlowy lub wygasly token.')

  // Sprawdzenie sesji — to ono sprawia, ze wylogowanie dziala natychmiast.
  const session = await getSession(c.env, payload.sessionId)
  if (!session) {
    return fail(c, 'unauthorized', 'Sesja zostala zakonczona. Zaloguj sie ponownie.')
  }

  c.set('auth' as never, { ...payload, role: toRole(payload.role) } as never)
  c.set('sessionId' as never, payload.sessionId as never)

  await next()
})

/**
 * Wariant wymagajacy dodatkowo pelnego rekordu uzytkownika z bazy.
 * Uzywany tam, gdzie handler potrzebuje aktualnej roli — token moze
 * zawierac role z chwili logowania, a administrator mogl ja zmienic.
 */
export const requireAuthWithUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env?.JWT_SECRET) {
    return fail(c, 'service_unavailable', 'Uwierzytelnianie nie jest skonfigurowane.')
  }

  const token = extractToken(c as never)
  if (!token) return fail(c, 'unauthorized', 'Wymagane zalogowanie.')

  const payload = await verifyAccessToken(c.env, token)
  if (!payload) return fail(c, 'unauthorized', 'Nieprawidlowy lub wygasly token.')

  const session = await getSession(c.env, payload.sessionId)
  if (!session) return fail(c, 'unauthorized', 'Sesja zostala zakonczona. Zaloguj sie ponownie.')

  const user = await getUserById(c.env, payload.sub)
  if (!user) return fail(c, 'unauthorized', 'Konto nie istnieje lub zostalo usuniete.')

  // Rola z BAZY, nie z tokenu — odebranie uprawnien dziala natychmiast.
  c.set('auth' as never, { ...payload, role: user.role } as never)
  c.set('authUser' as never, user as never)
  c.set('sessionId' as never, payload.sessionId as never)

  await next()
})

/**
 * Rozpoznaje uzytkownika, jesli podal token, ale nie wymaga logowania.
 * Przydatne na trasach publicznych, ktore dla zalogowanych pokazuja wiecej
 * (np. artykul w wersji roboczej widoczny dla jego autora).
 */
export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = extractToken(c as never)
  if (token && c.env?.JWT_SECRET) {
    const payload = await verifyAccessToken(c.env, token)
    if (payload) {
      const session = await getSession(c.env, payload.sessionId)
      if (session) {
        c.set('auth' as never, { ...payload, role: toRole(payload.role) } as never)
        c.set('sessionId' as never, payload.sessionId as never)
      }
    }
  }
  await next()
})
