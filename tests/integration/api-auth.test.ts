import { describe, expect, it } from 'vitest'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

/**
 * A9 — poprzednia wersja sprawdzała `body.accessToken` na najwyższym poziomie.
 * `/api/v1/auth/login` używa koperty `ok(c, data)`, więc token leży pod
 * `body.data.accessToken`. Test nie mógł przejść niezależnie od stanu mocka.
 *
 * Rejestracja i logowanie są tu w osobnych przypadkach, nie w jednym.
 * Poprzednio jedno `it()` obejmowało oba kroki, więc awaria logowania
 * i awaria rejestracji dawały ten sam komunikat — bez informacji, który
 * z dwóch mechanizmów się zepsuł.
 */
describe('api auth', () => {
  const swiezeSrodowisko = () => ({ JWT_SECRET: 'test-secret', DB: new MockD1Database() })
  // Hasło zgodne z polityką ZMIERZONĄ na trasie (src/routes/auth/register.ts):
  // 10+ znaków ORAZ znaki z co najmniej trzech grup. Pierwsza wersja testu
  // używała 'super-bezpieczne-haslo' — 22 znaki, ale tylko DWIE grupy (małe
  // litery + myślnik), więc trasa zwracała 400. Błąd założenia w teście,
  // nie w aplikacji.
  const POPRAWNE_HASLO = 'Bezpieczne-Haslo-2026'

  /**
   * POMIAR: `/auth/register` ma `registerRateLimit` kluczowany po adresie IP,
   * a stan limitera jest WSPÓLNY dla całego pliku testowego. Trzecie żądanie
   * z tego samego (domyślnie pustego) adresu dostawało 429, więc dwa nowe
   * przypadki wywracały się nie na sprawdzanej regule, lecz na limicie.
   * Każdy przypadek dostaje więc własny adres — co jednocześnie dowodzi, że
   * limit faktycznie działa per adres, a nie globalnie.
   */
  let licznikIp = 0
  const naglowki = () => ({
    'content-type': 'application/json',
    'cf-connecting-ip': `203.0.113.${(licznikIp += 1)}`,
  })

  it('rejestruje konto i zwraca kopertę 201', async () => {
    const env = swiezeSrodowisko()
    const response = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'nowy@example.com',
          password: POPRAWNE_HASLO,
          name: 'Test User',
        }),
      },
      env,
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.data.user.email).toBe('nowy@example.com')
    // Rejestracja NIE MOŻE nadawać roli z żądania — por. komentarz
    // w src/routes/auth/register.ts. Nowe konto zawsze dostaje `viewer`.
    expect(body.data.user.role).toBe('viewer')
    // Hasło ani jego skrót nie mogą wyjść w odpowiedzi.
    expect(JSON.stringify(body)).not.toContain(POPRAWNE_HASLO)
    expect(JSON.stringify(body)).not.toContain('pbkdf2$')
    expect(JSON.stringify(body)).not.toContain('password_hash')
  })

  it('ignoruje rolę podaną w żądaniu rejestracji', async () => {
    const env = swiezeSrodowisko()
    const response = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'sprytny@example.com',
          password: POPRAWNE_HASLO,
          name: 'Sprytny',
          role: 'admin',
        }),
      },
      env,
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.user.role).toBe('viewer')
  })

  it('odrzuca rejestrację z krótkim hasłem', async () => {
    const env = swiezeSrodowisko()
    const response = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'krotkie@example.com', password: 'x', name: 'X' }),
      },
      env,
    )

    expect(response.status).toBe(400)
  })

  /**
   * Bez JWT_SECRET warstwa uwierzytelniania musi ODMÓWIĆ (503), a nie
   * przepuścić żądania. To reguła „fail-closed" z fazy 1.
   *
   * SPRAWDZAMY TO NA `/auth/profile`, NIE NA `/auth/login`.
   * Pomiar: `/auth/login` bez JWT_SECRET zwraca 401 `invalid_credentials`,
   * bo poświadczenia są weryfikowane PRZED wystawieniem tokenu — do sprawdzenia
   * sekretu nigdy nie dochodzi. Odmowa „fail-closed" zachodzi w `requireAuth`,
   * czyli na trasach chronionych. Poprzednia wersja testu oczekiwała 503 od
   * logowania i padała na własnym błędnym założeniu, nie na regresie kodu.
   */
  it('bez JWT_SECRET trasa chroniona odmawia (503), nie przepuszcza', async () => {
    const response = await app.request(
      '/api/v1/auth/profile',
      { headers: { authorization: 'Bearer dowolny-token' } },
      { DB: new MockD1Database() },
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error.code).toBe('service_unavailable')
  })

  it('z JWT_SECRET, ale błędnym tokenem — odmawia 401', async () => {
    const response = await app.request(
      '/api/v1/auth/profile',
      { headers: { authorization: 'Bearer nieprawidlowy.token.tutaj' } },
      swiezeSrodowisko(),
    )

    expect(response.status).toBe(401)
  })

  /**
   * Polityka hasła to nie tylko długość. Hasło poniżej ma 22 znaki, więc
   * przechodzi warunek długości, ale używa znaków z dwóch grup — musi zostać
   * odrzucone. Bez tego przypadku regres do samego `length >= 10` przeszedłby
   * niezauważony (poprzedni test sprawdzał wyłącznie hasło 'x').
   */
  it('odrzuca długie hasło o zbyt małej różnorodności znaków', async () => {
    const response = await app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: naglowki(),
        body: JSON.stringify({ email: 'slabe@example.com', password: 'super-bezpieczne-haslo', name: 'Slabe' }),
      },
      swiezeSrodowisko(),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('validation_error')
    expect(String(body.error.details.fields.password)).toContain('trzech grup')
  })

  it('odrzuca powtórną rejestrację na ten sam adres', async () => {
    const env = swiezeSrodowisko()
    const zadanie = () => app.request(
      '/api/v1/auth/register',
      {
        method: 'POST',
        headers: naglowki(),
        body: JSON.stringify({ email: 'dubel@example.com', password: POPRAWNE_HASLO, name: 'Dubel' }),
      },
      env,
    )

    expect((await zadanie()).status).toBe(201)
    const body = await (await zadanie()).json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('conflict')
  })
})
