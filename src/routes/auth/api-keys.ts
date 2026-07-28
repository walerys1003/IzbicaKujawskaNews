/**
 * GET    /api/v1/auth/api-keys      — lista kluczy uzytkownika
 * POST   /api/v1/auth/api-keys      — utworzenie klucza
 * DELETE /api/v1/auth/api-keys/:id  — uniewaznienie klucza
 *
 * FAZA 1 / A2 + B3. Zamiast listy rol (`requireRole(['author','editor','admin'])`)
 * trasa deklaruje UPRAWNIENIE. Klucz API pozwala pisac przez API, wiec
 * wymagamy uprawnienia do tworzenia artykulow.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { created, fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth, requirePermission } from '../../middleware/require-permission'
import { API_SCOPES, createApiKey, isApiScope, listApiKeys, revokeApiKey, type ApiScope } from '../../lib/auth/api-keys'

const route = new Hono<AppEnv>()

route.get('/api-keys', requireAuth, requirePermission('article:create'), async (c) => {
  const auth = getAuth(c)
  if (!auth) return fail(c, 'unauthorized')

  const items = await listApiKeys(c.env, Number(auth.sub))
  return ok(
    c,
    items.map((item) => ({
      id: item.id,
      nazwa: item.name,
      // Pelnej wartosci klucza nie da sie pokazac ponownie — w bazie jest
      // wylacznie skrot. Prefiks sluzy do rozpoznania, ktory to klucz.
      prefiks: item.tokenPrefix,
      zakresy: item.scopes,
      utworzony: item.createdAt,
      ostatnioUzyty: item.lastUsedAt,
      wygasa: item.expiresAt,
      uniewazniony: item.revokedAt,
      aktywny: !item.revokedAt && (!item.expiresAt || new Date(item.expiresAt) > new Date()),
    })),
    { total: items.length },
  )
})

route.post(
  '/api-keys',
  requireAuth,
  requirePermission('article:create'),
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const name = String(body.name ?? '').trim()
    const rawScopes = Array.isArray(body.scopes) ? body.scopes : []
    const expiresInDays = body.expiresInDays === undefined ? 365 : Number(body.expiresInDays)

    const fields: Record<string, string> = {}
    if (name.length < 3) fields.name = 'Podaj nazwe klucza (min. 3 znaki) — ulatwi rozpoznanie go pozniej.'

    const unknown = rawScopes.map(String).filter((scope) => !isApiScope(scope))
    if (unknown.length) fields.scopes = `Nieznane zakresy: ${unknown.join(', ')}. Dozwolone: ${API_SCOPES.join(', ')}.`

    if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 730) {
      fields.expiresInDays = 'Waznosc klucza musi wynosic od 1 do 730 dni.'
    }

    if (Object.keys(fields).length) {
      return fail(c, 'validation_error', 'Dane klucza sa nieprawidlowe.', { fields })
    }

    const scopes = (rawScopes.map(String).filter(isApiScope) as ApiScope[])
    return { name, scopes: scopes.length ? scopes : (['incoming:write'] as ApiScope[]), expiresInDays }
  }),
  async (c) => {
    const auth = getAuth(c)
    if (!auth) return fail(c, 'unauthorized')
    if (!c.env?.DB) return fail(c, 'database_unavailable')

    const body = c.req.valid('json')
    const result = await createApiKey(c.env, {
      userId: Number(auth.sub),
      name: body.name,
      scopes: body.scopes,
      expiresInDays: body.expiresInDays,
    })

    return created(c, {
      id: result.id,
      // Jedyny moment, w ktorym klucz jest widoczny.
      klucz: result.token,
      prefiks: result.tokenPrefix,
      zakresy: result.scopes,
      wygasa: result.expiresAt,
      uwaga: 'Zapisz klucz teraz — nie bedzie mozliwe ponowne wyswietlenie go.',
    })
  },
)

/**
 * Identyfikator w sciezce, nie w ciele zadania. Poprzednia wersja wymagala
 * `DELETE` z cialem JSON, co czesc klientow HTTP i posrednikow pomija lub
 * odrzuca — RFC 9110 nie definiuje znaczenia ciala w DELETE.
 */
route.delete('/api-keys/:id', requireAuth, requirePermission('article:create'), async (c) => {
  const auth = getAuth(c)
  if (!auth) return fail(c, 'unauthorized')

  const revoked = await revokeApiKey(c.env, Number(auth.sub), c.req.param('id'))
  if (!revoked) return fail(c, 'not_found', 'Nie znaleziono aktywnego klucza o tym identyfikatorze.')

  return ok(c, { uniewazniono: c.req.param('id') })
})

export default route
