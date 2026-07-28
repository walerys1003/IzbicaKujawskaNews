import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'
import { sign } from 'hono/jwt'
import { wygenerujKluczeVapid } from '../../src/lib/push/webpush'

/**
 * I8 — DOWÓD, ŻE PANEL NIE RAPORTUJE JUŻ FIKCJI
 *
 * Testy w tym pliku pilnują jednej rzeczy: pola `delivered` i `status` muszą
 * odzwierciedlać ODPOWIEDZI DOSTAWCY, a nie długość listy subskrybentów.
 *
 * Poprzedni `sendMessage` ustawiał `delivered = recipients.length` i
 * `status:'sent'` bez wykonania żądania HTTP — więc panel pokazywał
 * „dostarczono 12”, gdy nikt nic nie dostał. Przypadki poniżej padłyby na
 * tamtej wersji kodu; to jest ich jedyny cel.
 *
 * KV jest tu podstawione w pamięci, bo `NOTIFICATIONS_KV` w sandboksie nie
 * istnieje, a bez niego trasy nie miałyby gdzie zapisać subskrybentów.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * UWAGA O PIERWSZEJ WERSJI TEGO PLIKU — TESTY PRZECHODZIŁY PRÓŻNO
 * ══════════════════════════════════════════════════════════════════════════
 * Trasy wysyłkowe są chronione `requireAuth`, a ja wołałem je BEZ tokenu.
 * Zamiast tego napisałem furtkę:
 *
 *     if (odp.status === 401 || odp.status === 403) { ...; return }
 *
 * Efekt: „5 passed", z czego TRZY przypadki kończyły się na `return`, nie
 * sprawdzając niczego o wysyłce. Pomiar (diagnostyka jednorazowa) pokazał
 * `STATUS BEZ TOKENU = 401 {"error":"missing_bearer_token"}` — czyli
 * dokładnie ten sam defekt, który zarzucałem testom newslettera
 * (`expect(status === 200 || status === 500)` nie może paść).
 *
 * Teraz każdy przypadek podpisuje prawdziwy token JWT tym samym sekretem,
 * co środowisko testowe, więc trasa jest faktycznie wykonywana, a asercje
 * o `delivered`/`status` naprawdę coś chronią.
 */

interface WpisKv { value: string }

class PamiecKV {
  private dane = new Map<string, WpisKv>()

  async get(key: string) {
    return this.dane.get(key)?.value ?? null
  }

  async put(key: string, value: string) {
    this.dane.set(key, { value })
  }

  async delete(key: string) {
    this.dane.delete(key)
  }

  async list({ prefix = '' } = {}) {
    const keys = [...this.dane.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name }))
    return { keys, list_complete: true, cursor: undefined }
  }

  get rozmiar() {
    return this.dane.size
  }

  klucze() {
    return [...this.dane.keys()]
  }
}

describe('api push — realna wysyłka zamiast fałszywego raportu', () => {
  let oryginalnyFetch: typeof globalThis.fetch
  let zadaniaDoDostawcy: string[]
  let odpowiedzDostawcy: () => Response

  beforeEach(() => {
    oryginalnyFetch = globalThis.fetch
    zadaniaDoDostawcy = []
    odpowiedzDostawcy = () => new Response('', { status: 201 })

    globalThis.fetch = (async (wejscie: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof wejscie === 'string' ? wejscie : wejscie instanceof URL ? wejscie.toString() : (wejscie as Request).url
      // Przechwytujemy WYŁĄCZNIE ruch do serwerów push; reszta idzie dalej.
      if (url.includes('push.example')) {
        zadaniaDoDostawcy.push(url)
        return odpowiedzDostawcy()
      }
      return oryginalnyFetch(wejscie as never, init)
    }) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = oryginalnyFetch
  })

  const srodowisko = async (zKluczami = true) => {
    const kv = new PamiecKV()
    const klucze = await wygenerujKluczeVapid()
    return {
      env: {
        JWT_SECRET: 'test-secret',
        DB: new MockD1Database(),
        NOTIFICATIONS_KV: kv as never,
        ...(zKluczami
          ? {
              VAPID_PUBLIC_KEY: klucze.publiczny,
              VAPID_PRIVATE_KEY: klucze.prywatny,
              VAPID_SUBJECT: 'mailto:kontakt@izbica24.pl',
            }
          : {}),
      },
      kv,
    }
  }

  /** Prawidłowe klucze P-256 subskrybenta — inaczej szyfrowanie odrzuci wpis. */
  const kluczeSubskrybenta = {
    p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  }

  /**
   * Token redaktora podpisany tym samym sekretem, którego używa środowisko.
   * Bez niego `requireAuth` zwraca 401 i cała asercja o wysyłce jest martwa.
   */
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

  const zasubskrybuj = async (env: Record<string, unknown>, id: string) =>
    app.request(
      '/api/push/subscribe',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          endpoint: `https://push.example.net/wpush/${id}`,
          keys: kluczeSubskrybenta,
          categories: ['wiadomosci'],
          segments: ['homepage'],
        }),
      },
      env,
    )

  it('bez kluczy VAPID zwraca 503 na klucz publiczny', async () => {
    const { env } = await srodowisko(false)
    const odp = await app.request('/api/push/vapid-public-key', {}, env)
    expect(odp.status).toBe(503)
  })

  it('przyjmuje subskrypcję i zapisuje ją w KV', async () => {
    const { env, kv } = await srodowisko()
    const odp = await zasubskrybuj(env, 'sub-1')
    expect(odp.status).toBe(201)
    expect(kv.klucze()).toContain('push:subscriber:sub-1')
  })

  /**
   * NAJWAŻNIEJSZY PRZYPADEK CAŁEGO PLIKU.
   * Dwóch subskrybentów, dostawca odpowiada 201 → `delivered` musi być 2
   * ORAZ muszą polecieć dwa prawdziwe żądania HTTP. Stara wersja dawała
   * `delivered: 2` przy ZERO żądaniach — i tego właśnie ten test nie wypuści.
   */
  it('liczy dostarczenia na podstawie odpowiedzi dostawcy, po realnych żądaniach', async () => {
    const { env } = await srodowisko()
    await zasubskrybuj(env, 'sub-1')
    await zasubskrybuj(env, 'sub-2')

    const odp = await app.request(
      '/api/push/send-broadcast',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await tokenRedaktora(env)}`,
        },
        body: JSON.stringify({ title: 'Uwaga', body: 'Treść powiadomienia', url: '/' }),
      },
      env,
    )

    expect(odp.status).toBe(200)
    const body = await odp.json()

    // Dwa subskrybenty = DWA prawdziwe żądania HTTP. Stara wersja kodu
    // raportowała `delivered: 2` przy ZERO żądaniach — to tego pilnujemy.
    expect(zadaniaDoDostawcy).toHaveLength(2)
    expect(body.message.delivered).toBe(2)
    expect(body.message.attempted).toBe(2)
    expect(body.message.status).toBe('sent')
  })

  it('nie zgłasza dostarczenia, gdy dostawca odrzuca wszystkie żądania', async () => {
    const { env } = await srodowisko()
    await zasubskrybuj(env, 'sub-1')
    odpowiedzDostawcy = () => new Response('unauthorized', { status: 401 })

    const odp = await app.request(
      '/api/push/send-broadcast',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await tokenRedaktora(env)}`,
        },
        body: JSON.stringify({ title: 'Uwaga', body: 'Treść' }),
      },
      env,
    )

    const body = await odp.json()
    expect(zadaniaDoDostawcy).toHaveLength(1)
    expect(body.message.delivered).toBe(0)
    // Zero dostarczeń przy niepustej liście adresatów to PORAŻKA, nie 'sent'.
    expect(body.message.status).toBe('failed')
    expect(body.message.failureReasons).toHaveProperty('odrzucone_uwierzytelnienie')
  })

  /**
   * Odmowa autoryzacji sprawdzana JAWNIE, jako własny przypadek — a nie
   * jako gałąź `if` w teście o wysyłce. Tak brak tokenu nie może już
   * wyciszyć asercji o `delivered`.
   */
  it('bez tokenu nie wysyła niczego', async () => {
    const { env } = await srodowisko()
    await zasubskrybuj(env, 'sub-1')

    const odp = await app.request(
      '/api/push/send-broadcast',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Uwaga', body: 'Treść' }),
      },
      env,
    )

    expect(odp.status).toBe(401)
    expect(zadaniaDoDostawcy).toHaveLength(0)
  })

  it('bez kluczy VAPID zapisuje porażkę, nie „sent"', async () => {
    const { env } = await srodowisko(false)
    await zasubskrybuj(env, 'sub-1')

    const odp = await app.request(
      '/api/push/send-broadcast',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await tokenRedaktora(env as { JWT_SECRET: string })}`,
        },
        body: JSON.stringify({ title: 'Uwaga', body: 'Treść' }),
      },
      env,
    )
    const body = await odp.json()

    // Środowisko bez sekretów NIE MOŻE udawać, że wysłało powiadomienia.
    expect(zadaniaDoDostawcy).toHaveLength(0)
    expect(body.message.status).toBe('failed')
    expect(body.message.delivered).toBe(0)
    expect(body.message.failureReason).toBe('brak_konfiguracji_vapid')
  })

  it('usuwa subskrypcję odrzuconą kodem 410', async () => {
    const { env, kv } = await srodowisko()
    await zasubskrybuj(env, 'martwa')
    expect(kv.klucze()).toContain('push:subscriber:martwa')

    odpowiedzDostawcy = () => new Response('', { status: 410 })

    const odp = await app.request(
      '/api/push/send-broadcast',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${await tokenRedaktora(env)}`,
        },
        body: JSON.stringify({ title: 'x', body: 'y' }),
      },
      env,
    )
    const body = await odp.json()

    // Martwy wpis MUSI zniknąć — inaczej lista rośnie o subskrypcje, które
    // nigdy nic nie odbiorą, a każda wysyłka marnuje na nie żądanie.
    expect(kv.klucze()).not.toContain('push:subscriber:martwa')
    expect(body.message.removedSubscribers).toBe(1)
    expect(body.message.delivered).toBe(0)
  })
})
