import { describe, expect, it } from 'vitest'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { fixtureComment } from '../fixtures/seed-data'

/**
 * A9 — POPRAWKA KONTRAKTU, NIE „NAPRAWA POD TEST”
 *
 * Poprzednia wersja sprawdzała `response.status === 200` i `body.status`.
 * Pomiar na trasie (src/routes/v1/comments.ts:179) pokazał, że zgłoszenie
 * komentarza kończy się `created(c, {...})`, czyli 201 z kopertą
 * `{ ok, data, meta, requestId }` — status leży pod `body.data.status`.
 *
 * 201 dla utworzonego zasobu jest poprawne i to test był nieaktualny.
 * Gdybyśmy zmienili trasę na 200, „naprawilibyśmy” test kosztem kontraktu
 * HTTP, który reszta API już stosuje.
 *
 * Każdy przypadek dostaje własny adres IP, bo `commentRateLimit` jest wspólny
 * dla całego pliku i kluczowany po adresie — inaczej kolejne przypadki
 * padałyby na 429 zamiast na sprawdzanej regule.
 */
describe('api comments', () => {
  let licznikIp = 0
  const naglowki = () => ({
    'content-type': 'application/json',
    'cf-connecting-ip': `198.51.100.${(licznikIp += 1)}`,
  })
  const swiezeSrodowisko = () => ({ JWT_SECRET: 'test-secret', DB: new MockD1Database() })

  it('przyjmuje komentarz do artykułu i zwraca kopertę 201', async () => {
    const response = await app.request(
      '/api/v1/articles/remont-koscielnej-zakonczony/comments',
      { method: 'POST', headers: naglowki(), body: JSON.stringify(fixtureComment) },
      swiezeSrodowisko(),
    )
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.data.status).toBe('pending_moderation')
    // Komentarz NIE MOŻE trafić od razu do publikacji — moderacja jest
    // wymogiem, a nie ustawieniem. Regres tutaj oznaczałby portal otwarty
    // na spam bez żadnej kontroli.
    expect(body.data.status).not.toBe('published')
    // Adres e-mail zgłaszającego nie może wracać w odpowiedzi.
    expect(JSON.stringify(body)).not.toContain(fixtureComment.email)
  })

  it('odrzuca zgłoszenie do nieistniejącego artykułu', async () => {
    const response = await app.request(
      '/api/v1/comments',
      { method: 'POST', headers: naglowki(), body: JSON.stringify({ ...fixtureComment, articleSlug: 'nie-ma-takiego-artykulu' }) },
      swiezeSrodowisko(),
    )
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(404)
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('not_found')
  })

  it('odrzuca zgłoszenie bez zgody na przetwarzanie danych', async () => {
    const response = await app.request(
      '/api/v1/articles/remont-koscielnej-zakonczony/comments',
      { method: 'POST', headers: naglowki(), body: JSON.stringify({ ...fixtureComment, consent: false }) },
      swiezeSrodowisko(),
    )

    expect(response.status).toBe(400)
  })

  /**
   * Pole-pułapka (honeypot). Trasa celowo odpowiada sukcesem, aby bot nie
   * dowiedział się o wykryciu, ale NIE zapisuje wpisu — stąd `accepted: false`.
   */
  it('cicho odrzuca zgłoszenie z wypełnionym honeypotem', async () => {
    const response = await app.request(
      '/api/v1/articles/remont-koscielnej-zakonczony/comments',
      { method: 'POST', headers: naglowki(), body: JSON.stringify({ ...fixtureComment, website: 'https://spam.example' }) },
      swiezeSrodowisko(),
    )
    const body = await response.json() as Record<string, any>

    expect(response.status).toBe(201)
    expect(body.data.accepted).toBe(false)
  })
})
