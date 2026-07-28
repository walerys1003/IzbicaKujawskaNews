/**
 * GET    /api/v1/auth/sessions      — lista aktywnych sesji uzytkownika
 * DELETE /api/v1/auth/sessions/:id  — uniewaznienie wskazanej sesji
 *
 * FAZA 1 / A2. Rejestr sesji zyje w tabeli `user_sessions`, dzieki czemu
 * uzytkownik widzi swoje urzadzenia. KV nie pozwala na przegladanie po
 * uzytkowniku, dlatego poprzednia wersja opierala sie na przeszukiwaniu
 * kluczy z prefiksem — kosztownym i niepelnym (KV listuje z opoznieniem).
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getSession, listSessions, revokeSession } from '../../lib/auth/store'

const route = new Hono<AppEnv>()

route.get('/sessions', requireAuth, async (c) => {
  const auth = getAuth(c)
  if (!auth) return fail(c, 'unauthorized')

  const sessions = await listSessions(c.env, Number(auth.sub))

  return ok(
    c,
    sessions.map((session) => ({
      id: session.id,
      urzadzenie: session.user_agent ?? 'nieznane',
      utworzona: session.created_at,
      ostatnioWidziana: session.last_seen_at,
      wygasa: session.expires_at,
      // Adres IP nie jest zwracany — w bazie lezy wylacznie jego skrot
      // (minimalizacja danych, RODO art. 5 ust. 1 lit. c). Wystarcza on do
      // wykrycia zmiany lokalizacji, nie pozwala odtworzyc adresu.
      biezaca: session.id === auth.sessionId,
    })),
    { total: sessions.length },
  )
})

route.delete('/sessions/:id', requireAuth, async (c) => {
  const auth = getAuth(c)
  if (!auth) return fail(c, 'unauthorized')

  const sessionId = c.req.param('id')
  const session = await getSession(c.env, sessionId)

  // Sprawdzenie wlasciciela jest konieczne: bez niego kazdy zalogowany
  // uzytkownik mogl by wylogowac dowolna osobe, znajac identyfikator sesji.
  // Komunikat jest ten sam dla „nie ma takiej sesji” i „nie twoja sesja”,
  // aby nie ujawniac istnienia sesji innych osob.
  if (!session || session.userId !== Number(auth.sub)) {
    return fail(c, 'not_found', 'Nie znaleziono takiej sesji.')
  }

  await revokeSession(c.env, sessionId)
  return ok(c, { uniewazniono: sessionId, byłaBiezaca: sessionId === auth.sessionId })
})

export default route
