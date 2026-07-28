import { describe, expect, it } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { fixtureNewsletter } from '../fixtures/seed-data'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DLACZEGO TEN PLIK ZOSTAŁ PRZEPISANY — POPRZEDNIE TESTY NIE MOGŁY PAŚĆ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Poprzednia wersja zawierała trzy asercje bez treści:
 *
 *   expect(response.status === 200 || response.status === 500).toBe(true)
 *   expect(body.ok).toBeDefined()            // dwa razy
 *
 * Pierwsza jest prawdziwa dla obu możliwych wyników — trasa mogła być otwarta
 * albo zepsuta, test przechodził tak samo. Druga sprawdza wyłącznie, że pole
 * ISTNIEJE: `{"ok": false}` przechodzi równie dobrze jak `{"ok": true}`, więc
 * całkowicie nieudane potwierdzenie subskrypcji było raportowane jako sukces.
 *
 * To nie jest kwestia estetyki testów. Tautologia na `/subscribers` UKRYŁA
 * wyciek danych osobowych: adres zwracał pełną listę adresów e-mail
 * mieszkańców KAŻDEMU niezalogowanemu (zmierzone: `200 {"total":0,"items":[]}`
 * bez nagłówka Authorization). Test „przechodził” przez cały czas istnienia
 * tego defektu, bo 200 spełniało jego warunek.
 *
 * ── Zmierzone zachowanie tras (podstawa oczekiwań poniżej) ────────────────
 *
 * Oczekiwania NIE są wymyślone — pochodzą z jednorazowego pomiaru na
 * uruchomionej aplikacji:
 *
 *   POST /subscribe   {email:'a@b.pl'} → 200 {"ok":true,"message":"confirmation_sent"}
 *   POST /subscribe   {email:'x'}      → 400 {"error":"invalid_email"}
 *   POST /confirm     (obcy adres)     → 200 {"ok":true}
 *   POST /unsubscribe (obcy adres)     → 200 {"ok":true}
 *   GET  /subscribers (bez tokenu)     → 401 (po naprawie; wcześniej 200 + dane)
 *
 * ── Uwaga o kształcie odpowiedzi ─────────────────────────────────────────
 *
 * Ten router (`src/routes/newsletter/index.ts`) NIE używa koperty
 * `ok(c, data)`, tylko zwraca `c.json(result)` wprost, więc pola leżą na
 * najwyższym poziomie (`body.ok`, `body.message`), a nie w `body.data`.
 * Testy odzwierciedlają rzeczywistość, a nie kontrakt, który reszta API
 * stosuje — ujednolicenie tego routera to osobna zmiana i wymaga aktualizacji
 * klienta. Gdybym „poprawił” tu asercje na `body.data.ok`, testy zaczęłyby
 * chronić kontrakt, którego ta trasa nie ma.
 */
describe('api newsletter', () => {
  /**
   * Świeża baza dla każdego przypadku. Poprzednia wersja miała JEDNĄ instancję
   * `MockD1Database` wspólną dla całego pliku, więc przypadki widziały skutki
   * poprzedników i ich kolejność miała znaczenie.
   */
  const swiezeSrodowisko = () => ({ JWT_SECRET: 'test-secret', DB: new MockD1Database() })

  const naglowki = { 'content-type': 'application/json' }

  const tokenRedaktora = async (env: { JWT_SECRET: string }) =>
    sign(
      {
        sub: '1',
        email: 'anna@izbica24.pl',
        role: 'editor',
        sessionId: 'sesja-testowa',
        exp: Math.floor(Date.now() / 1000) + 600,
      },
      env.JWT_SECRET,
    )

  const zapytaj = (path: string, env: Record<string, unknown>, init: RequestInit = {}) =>
    app.request(path, { headers: naglowki, ...init }, env)

  /**
   * Kształt odpowiedzi tego routera. `Response.json()` zwraca `unknown`, więc
   * bez tego typu każde `body.ok` byłoby błędem TS18046 — a rzutowanie na
   * `any` wyłączyłoby kontrolę dokładnie tam, gdzie testy mają pilnować pól.
   */
  interface OdpowiedzNewslettera {
    ok?: boolean
    message?: string
    error?: string
    total?: number
    items?: unknown[]
  }

  const cialo = async (response: Response): Promise<OdpowiedzNewslettera> =>
    (await response.json()) as OdpowiedzNewslettera

  // ── zapis ────────────────────────────────────────────────────────────────

  it('przyjmuje zapis i zwraca informację o wysłaniu potwierdzenia', async () => {
    const response = await zapytaj('/api/v1/newsletter/subscribe', swiezeSrodowisko(), {
      method: 'POST',
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    })
    const body = await cialo(response)

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    // Konkretna wartość, nie `toBeDefined()`: zapis MUSI kończyć się etapem
    // potwierdzenia (double opt-in). Gdyby trasa zaczęła od razu potwierdzać
    // subskrypcję, wysyłalibyśmy wiadomości na adresy, których właściciel
    // nigdy nie potwierdził — i to my bylibyśmy nadawcą spamu.
    expect(body.message).toBe('confirmation_sent')
    expect(body.message).not.toBe('confirmed')
  })

  it('odrzuca adres bez znaku @ kodem 400', async () => {
    const response = await zapytaj('/api/v1/newsletter/subscribe', swiezeSrodowisko(), {
      method: 'POST',
      body: JSON.stringify({ email: 'x' }),
    })
    const body = await cialo(response)

    expect(response.status).toBe(400)
    expect(body.error).toBe('invalid_email')
  })

  it('odrzuca zapis bez pola email', async () => {
    const response = await zapytaj('/api/v1/newsletter/subscribe', swiezeSrodowisko(), {
      method: 'POST',
      body: JSON.stringify({}),
    })
    expect(response.status).toBe(400)
  })

  // ── potwierdzenie i wypisanie ────────────────────────────────────────────

  it('potwierdzenie zwraca ok:true, a nie samo „pole istnieje”', async () => {
    const response = await zapytaj('/api/v1/newsletter/confirm', swiezeSrodowisko(), {
      method: 'POST',
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    })
    const body = await cialo(response)

    expect(response.status).toBe(200)
    // Poprzednio: expect(body.ok).toBeDefined() — przechodziło też dla false.
    expect(body.ok).toBe(true)
  })

  it('wypisanie zwraca ok:true', async () => {
    const response = await zapytaj('/api/v1/newsletter/unsubscribe', swiezeSrodowisko(), {
      method: 'POST',
      body: JSON.stringify({ email: fixtureNewsletter.email }),
    })
    const body = await cialo(response)

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('potwierdzenie i wypisanie bez adresu kończy się 400', async () => {
    for (const sciezka of ['/api/v1/newsletter/confirm', '/api/v1/newsletter/unsubscribe']) {
      const response = await zapytaj(sciezka, swiezeSrodowisko(), {
        method: 'POST',
        body: JSON.stringify({}),
      })
      expect(response.status, sciezka).toBe(400)
    }
  })

  // ── lista subskrybentów: dane osobowe ────────────────────────────────────

  /**
   * REGRES BEZPIECZEŃSTWA. Ten przypadek zastępuje tautologię
   * `expect(status === 200 || status === 500).toBe(true)`, która ukryła
   * otwarty dostęp do listy adresów e-mail mieszkańców.
   */
  it('NIE wydaje listy adresów e-mail bez zalogowania', async () => {
    const response = await zapytaj('/api/v1/newsletter/subscribers', swiezeSrodowisko(), {
      method: 'GET',
    })
    const tresc = await response.text()

    expect(response.status).toBe(401)
    // Sam kod odpowiedzi nie wystarcza — liczy się, że dane NIE wyszły.
    expect(tresc).not.toContain('@')
    expect(tresc).not.toContain('items')
  })

  it('NIE wydaje listy przy roli bez uprawnienia newsletter:read', async () => {
    const env = swiezeSrodowisko()
    // `viewer` nie ma w macierzy ROLE_PERMISSIONS żadnego uprawnienia.
    const token = await sign(
      {
        sub: '1',
        email: 'gosc@izbica24.pl',
        role: 'viewer',
        sessionId: 'sesja-testowa',
        exp: Math.floor(Date.now() / 1000) + 600,
      },
      env.JWT_SECRET,
    )

    const response = await zapytaj('/api/v1/newsletter/subscribers', env, {
      method: 'GET',
      headers: { ...naglowki, authorization: `Bearer ${token}` },
    })

    expect([401, 403]).toContain(response.status)
    expect(await response.text()).not.toContain('items')
  })

  /**
   * Kontrola samego testu: dowodzi, że dwa przypadki powyżej blokują z powodu
   * BRAKU UPRAWNIEŃ, a nie dlatego, że trasa jest zepsuta albo nie istnieje.
   * Bez tego przypadku „401 na wszystko” (np. literówka w ścieżce dająca 404,
   * albo trasa rzucająca wyjątek) wyglądałoby jak poprawne zabezpieczenie.
   */
  it('wydaje listę uprawnionemu redaktorowi — dowód, że blokada to uprawnienia, nie awaria', async () => {
    const env = swiezeSrodowisko()
    const response = await zapytaj('/api/v1/newsletter/subscribers', env, {
      method: 'GET',
      headers: { ...naglowki, authorization: `Bearer ${await tokenRedaktora(env)}` },
    })
    const body = await cialo(response)

    expect(response.status).toBe(200)
    expect(body).toHaveProperty('items')
    expect(typeof body.total).toBe('number')
  })
})
