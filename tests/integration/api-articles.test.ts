import { describe, expect, it } from 'vitest'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

/**
 * A9 — te testy sprawdzały wcześniej `body.items` i `body.slug` na najwyższym
 * poziomie odpowiedzi. Trasy `/api/v1/articles` używają jednak koperty
 * `ok(c, data, meta)` z src/lib/http/envelope.ts, która zwraca:
 *
 *     { ok: true, data: [...], meta: { total, limit, offset, page, pages },
 *       requestId: '…' }
 *
 * Stary kształt (`items` na wierzchu) nie istnieje w tym API od migracji na
 * koperty. Dopasowanie testu do koperty jest tu jedyną uczciwą naprawą —
 * odwrotny zabieg (przywrócenie `items` w trasie) zepsułby panel redakcji
 * i wszystkie pozostałe trasy, które ten kontrakt już honorują.
 *
 * Sprawdzamy też `requestId`: bez niego nie da się powiązać zgłoszenia
 * użytkownika z wpisem w logu, a jest to element kontraktu, nie ozdoba.
 */
describe('api articles', () => {
  it('zwraca listę w kopercie z metadanymi stronicowania', async () => {
    const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }
    const response = await app.request('/api/v1/articles?limit=2', {}, env)
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.meta.limit).toBe(2)
    expect(body.meta.total).toBe(2)
    expect(body.requestId).toBeTruthy()
    // Karta listy nie może wystawiać pól redakcyjnych — lista jest publiczna.
    expect(body.data[0].status).toBeUndefined()
    expect(body.data[0].slug).toBe('remont-koscielnej-zakonczony')
  })

  it('honoruje limit strony', async () => {
    const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }
    const response = await app.request('/api/v1/articles?limit=1', {}, env)
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('zwraca szczegóły artykułu po slugu', async () => {
    const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }
    const response = await app.request('/api/v1/articles/remont-koscielnej-zakonczony', {}, env)
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.data.slug).toBe('remont-koscielnej-zakonczony')
  })

  /**
   * Ten przypadek jest ważniejszy niż wygląda: trasa publiczna MUSI oddawać
   * 404 na artykuł nieistniejący ORAZ na nieopublikowany (por. komentarz
   * w src/routes/v1/articles-public.ts — 403 potwierdzałby istnienie
   * przygotowywanego materiału). Bez tego testu regres w filtrze statusu
   * przeszedłby niezauważony.
   */
  it('zwraca 404 na nieznany slug', async () => {
    const env = { JWT_SECRET: 'test-secret', DB: new MockD1Database() }
    const response = await app.request('/api/v1/articles/nie-ma-takiego-tekstu', {}, env)
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(404)
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('not_found')
  })

  it('nie ujawnia szkicu jako 403', async () => {
    const db = new MockD1Database()
    db.artykuly = [{ ...db.artykuly[0], status: 'draft' }]
    const env = { JWT_SECRET: 'test-secret', DB: db }
    const response = await app.request('/api/v1/articles/remont-koscielnej-zakonczony', {}, env)

    expect(response.status).toBe(404)
  })

  it('zwraca błąd bez podłączonej bazy', async () => {
    const response = await app.request('/api/v1/articles', {}, { JWT_SECRET: 'test-secret' })
    expect(response.status).toBeGreaterThanOrEqual(500)
  })
})
