/**
 * POST /api/v1/auth/logout          — zakonczenie biezacej sesji
 * POST /api/v1/auth/logout-all      — zakonczenie wszystkich sesji uzytkownika
 *
 * FAZA 1 / A2. Wylogowanie dziala teraz w praktyce: nowe `requireAuth`
 * sprawdza przy kazdym zadaniu, czy sesja nadal istnieje, wiec uniewaznienie
 * jej odcina token natychmiast. Poprzednio token pozostawal wazny do konca
 * swojego czasu zycia (wtedy 7 dni), bo sprawdzano wylacznie podpis.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { revokeAllUserSessions, revokeSession } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.post('/logout', requireAuth, async (c) => {
  const auth = getAuth(c as never)
  if (!auth) return fail(c, 'unauthorized')

  await revokeSession(c.env, auth.sessionId)
  return ok(c, { wylogowano: true, sessionId: auth.sessionId })
})

/**
 * Wylogowanie ze wszystkich urzadzen. Potrzebne, gdy uzytkownik podejrzewa
 * przejecie konta — pojedyncze wylogowanie nie usuwa sesji atakujacego.
 */
route.post('/logout-all', requireAuth, async (c) => {
  const auth = getAuth(c as never)
  if (!auth) return fail(c, 'unauthorized')

  const keepCurrent = c.req.query('keepCurrent') === '1'
  const revoked = await revokeAllUserSessions(
    c.env,
    Number(auth.sub),
    keepCurrent ? auth.sessionId : undefined,
  )

  return ok(c, {
    wylogowano: true,
    uniewaznionychSesji: revoked,
    biezacaSesjaZachowana: keepCurrent,
  })
})

export default route
