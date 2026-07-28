/**
 * Kontrola kształtu treści tokenu w `src/routes/auth/middleware/require-auth.ts`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO TU JEST SPRAWDZANE I DLACZEGO
 * ══════════════════════════════════════════════════════════════════════════
 * Ten pośrednik weryfikował wyłącznie PODPIS tokenu, a treść rzutował na
 * `AuthJwtPayload` bez sprawdzenia. Podpis dowodzi tylko tego, że treści nie
 * podmienił obcy — NIE tego, że treść zawiera pola, na których opierają się
 * trasy. Token poprawnie podpisany tym samym sekretem, ale bez `sub`,
 * przechodził jako prawidłowy, a `auth.sub` było `undefined`. Trasa
 * wykonywała się „w imieniu nikogo”.
 *
 * Zmierzone na żywym serwerze (nie założone):
 *   • bez kontroli kształtu: GET /api/push/subscribers z tokenem bez `sub`
 *     zwracał 200 i treść {"total":0,"items":[]},
 *   • z kontrolą: 401 {"error":"invalid_token"},
 *   • token poprawny nadal 200 — czyli kontrola nie blokuje zalogowanych.
 *
 * Te trzy przypadki są tu zapisane, żeby ktoś, kto w przyszłości uprości
 * pośrednik z powrotem do rzutowania, dostał czerwony test zamiast cichej
 * regresji uwierzytelniania.
 */

import { describe, it, expect } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

const SEKRET = 'test-secret'
const SCIEZKA = '/api/push/subscribers'

const swiezeSrodowisko = () => ({ JWT_SECRET: SEKRET, DB: new MockD1Database() })

/** Treść tokenu z możliwością pominięcia wybranego pola. */
const tokenBezPola = async (pominiete?: 'sub' | 'email' | 'sessionId' | 'role') => {
  const tresc: Record<string, unknown> = {
    sub: '1',
    email: 'anna@izbica24.pl',
    role: 'admin',
    sessionId: 'sesja-testowa',
    exp: Math.floor(Date.now() / 1000) + 600,
  }
  if (pominiete) delete tresc[pominiete]
  return await sign(tresc, SEKRET)
}

const zapytaj = async (token: string, env: ReturnType<typeof swiezeSrodowisko>): Promise<Response> =>
  await app.request(SCIEZKA, { headers: { Authorization: `Bearer ${token}` } }, env)

describe('requireAuth (warstwa tras auth) — kontrola kształtu treści tokenu', () => {
  it('przepuszcza token z pełną treścią — dowód, że kontrola nie blokuje zalogowanych', async () => {
    const env = swiezeSrodowisko()
    const odpowiedz = await zapytaj(await tokenBezPola(), env)
    expect(odpowiedz.status).toBe(200)
  })

  it('odrzuca poprawnie podpisany token BEZ sub — inaczej trasa działa „w imieniu nikogo”', async () => {
    const env = swiezeSrodowisko()
    const odpowiedz = await zapytaj(await tokenBezPola('sub'), env)
    expect(odpowiedz.status).toBe(401)
    expect(await odpowiedz.json()).toEqual({ error: 'invalid_token' })
  })

  it('odrzuca token BEZ sessionId — to jedyny uchwyt do unieważnienia sesji', async () => {
    const env = swiezeSrodowisko()
    const odpowiedz = await zapytaj(await tokenBezPola('sessionId'), env)
    expect(odpowiedz.status).toBe(401)
  })

  it('odrzuca token BEZ email', async () => {
    const env = swiezeSrodowisko()
    expect((await zapytaj(await tokenBezPola('email'), env)).status).toBe(401)
  })

  it('odrzuca token BEZ role', async () => {
    const env = swiezeSrodowisko()
    expect((await zapytaj(await tokenBezPola('role'), env)).status).toBe(401)
  })

  it('odrzuca sub jako pusty napis — obecność pola nie wystarcza', async () => {
    const env = swiezeSrodowisko()
    const token = await sign(
      { sub: '', email: 'a@b.pl', role: 'admin', sessionId: 's', exp: Math.floor(Date.now() / 1000) + 600 },
      SEKRET,
    )
    expect((await zapytaj(token, env)).status).toBe(401)
  })

  it('odrzuca sub liczbowy — trasy budują na nim napisowe klucze', async () => {
    const env = swiezeSrodowisko()
    const token = await sign(
      { sub: 1, email: 'a@b.pl', role: 'admin', sessionId: 's', exp: Math.floor(Date.now() / 1000) + 600 },
      SEKRET,
    )
    expect((await zapytaj(token, env)).status).toBe(401)
  })

  it('odrzuca token podpisany innym sekretem — kontrola podpisu nadal działa', async () => {
    const env = swiezeSrodowisko()
    const token = await sign(
      { sub: '1', email: 'a@b.pl', role: 'admin', sessionId: 's', exp: Math.floor(Date.now() / 1000) + 600 },
      'inny-sekret',
    )
    expect((await zapytaj(token, env)).status).toBe(401)
  })
})
