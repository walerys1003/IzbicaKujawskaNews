/**
 * GET  /api/v1/auth/profile — dane zalogowanego uzytkownika
 * PUT  /api/v1/auth/profile — zmiana nazwy, biogramu, awatara
 *
 * FAZA 1 / A2. Dane pochodza z tabeli `users`, nie z KV.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { getAuth } from '../../middleware/require-permission'
import { getUserById, publicUser } from '../../lib/auth/store'
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from '../../lib/auth/roles'
import { stripHtml } from '../../lib/security/sanitize-html'

const route = new Hono<AppEnv>()

route.get('/profile', requireAuth, async (c) => {
  const auth = getAuth(c as never)
  if (!auth) return fail(c, 'unauthorized')

  const user = await getUserById(c.env, auth.sub)
  if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

  return ok(c, {
    ...publicUser(user),
    // Klient (panel redakcyjny) potrzebuje listy uprawnien, aby ukrywac
    // przyciski operacji niedostepnych dla danej roli. Ukrycie przycisku nie
    // jest zabezpieczeniem — kazda trasa zapisu sprawdza uprawnienie po
    // stronie serwera — ale poprawia czytelnosc panelu.
    opisRoli: ROLE_DESCRIPTIONS[user.role],
    uprawnienia: ROLE_PERMISSIONS[user.role],
    biezacaSesja: auth.sessionId,
  })
})

route.put(
  '/profile',
  requireAuth,
  validator('json', (value, c) => {
    const body = (value ?? {}) as Record<string, unknown>
    const fields: Record<string, string> = {}

    // stripHtml, nie sanitizeHtml: imie i biogram to tekst, a nie tresc
    // formatowana. Poprzednia wersja zapisywala nazwe bez zadnego
    // przetworzenia, wiec `<img onerror=...>` w polu „imie” trafialby
    // do naglowka artykulu i stopki komentarzy.
    const name = body.name === undefined ? undefined : stripHtml(String(body.name).trim(), 120)
    const bio = body.bio === undefined ? undefined : stripHtml(String(body.bio).trim(), 1_000)
    const avatar = body.avatar === undefined ? undefined : String(body.avatar).trim().slice(0, 500)

    if (name !== undefined && name.length < 2) fields.name = 'Nazwa musi miec co najmniej 2 znaki.'

    // Awatar przyjmujemy wylacznie jako klucz w R2 lub sciezke wewnetrzna.
    // Pelny adres zewnetrzny oznaczalby obraz hotlinkowany — zakazany
    // etapem I11 i dajacy obcemu serwerowi adresy IP naszych czytelnikow.
    if (avatar !== undefined && avatar !== '' && !/^(\/|[a-z0-9][a-z0-9/_-]*\.(webp|avif|jpg|jpeg|png))$/i.test(avatar)) {
      fields.avatar = 'Awatar musi byc sciezka wewnetrzna lub kluczem pliku w magazynie (bez adresow zewnetrznych).'
    }

    if (Object.keys(fields).length) {
      return fail(c, 'validation_error', 'Dane profilu sa nieprawidlowe.', { fields })
    }
    return { name, bio, avatar }
  }),
  async (c) => {
    const auth = getAuth(c as never)
    if (!auth) return fail(c, 'unauthorized')
    if (!c.env?.DB) return fail(c, 'database_unavailable')

    const body = c.req.valid('json')
    const user = await getUserById(c.env, auth.sub)
    if (!user) return fail(c, 'not_found', 'Nie znaleziono konta.')

    // Aktualizujemy tylko pola faktycznie przeslane — COALESCE zostawia
    // wartosc dotychczasowa, gdy parametr jest pusty.
    await c.env.DB
      .prepare(`UPDATE users
                   SET name = COALESCE(?2, name),
                       bio = COALESCE(?3, bio),
                       avatar = COALESCE(?4, avatar),
                       updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?1`)
      .bind(user.id, body.name ?? null, body.bio ?? null, body.avatar ?? null)
      .run()

    const updated = await getUserById(c.env, user.id)
    return ok(c, { zapisano: true, profil: updated ? publicUser(updated) : publicUser(user) })
  },
)

export default route
