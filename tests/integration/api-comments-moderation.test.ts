import { describe, expect, it } from 'vitest'
import { sign } from 'hono/jwt'
import { app } from '../../src/index'
import { MockD1Database } from '../fixtures/mock-d1'

/**
 * TRASA MODERACJI KOMENTARZY — test integracyjny.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO TEN PLIK POWSTAL
 * ══════════════════════════════════════════════════════════════════════════
 * W poprzednim etapie naprawilem defekt w `src/routes/v1/comments-moderation.ts`:
 * kod czytal `auth?.userId`, a token nie ma pola `userId` (identyfikator siedzi
 * w `sub` jako napis). Kazda decyzja moderacyjna zapisywala wiec
 * `moderated_by = NULL` — moderacja bez sladu, kto ja wykonal.
 *
 * Defekt oslonilem testem jednostkowym `tests/unit/routes/moderator-id.test.ts`,
 * ale test jednostkowy sprawdza tylko funkcje `moderatorId()`. NIE sprawdza,
 * czy trasa faktycznie jej uzywa ani czy wartosc dociera do zapytania UPDATE.
 * Ktos moglby usunac wywolanie z trasy i test jednostkowy nadal by przechodzil.
 * Ten plik zamyka te luke: idzie przez prawdziwy router, prawdziwe middleware
 * uwierzytelniajace i sprawdza zawartosc bazy PO zadaniu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * KAZDE OCZEKIWANIE POCHODZI Z POMIARU, NIE Z ZALOZENIA
 * ══════════════════════════════════════════════════════════════════════════
 * Statusy i kształty odpowiedzi ponizej zostaly najpierw ZMIERZONE sonda na
 * dzialajacej trasie, a potem zapisane jako oczekiwania. Roznica jest istotna:
 * oczekiwanie wymyslone „z glowy” zmusza do naciagania kodu do testu, a nie
 * odwrotnie.
 *
 * Zadne oczekiwanie nie ma postaci `expect(status === 200 || status === 500)`.
 * Taka alternatywa nie moze pasc, wiec nie jest testem — a w tym repozytorium
 * dokladnie taka tautologia ukrywala wyciek adresow e-mail mieszkancow
 * (patrz `tests/integration/api-newsletter.test.ts`).
 */

const swiezeSrodowisko = () => ({ JWT_SECRET: 'test-secret', DB: new MockD1Database() })

const naglowki = { 'content-type': 'application/json' }

/**
 * Token dla wskazanej roli. `sub` to NAPIS — tak wystawia go
 * `src/lib/auth/store.ts:370` (`sub: String(user.id)`). Gdyby test podawal
 * tutaj liczbe, przechodzilby przy zepsutym kodzie produkcyjnym, bo ukrylby
 * wlasnie te niezgodnosc typow, ktora byla zrodlem defektu.
 *
 * `sessionId` musi zgadzac sie z sesja w atrapie — `require-auth` sprawdza
 * istnienie sesji w `user_sessions`, nie tylko podpis tokenu.
 */
const token = async (
  env: { JWT_SECRET: string },
  rola: string,
  sub = '1',
): Promise<string> =>
  sign(
    {
      sub,
      email: 'anna@izbica24.pl',
      role: rola,
      sessionId: 'sesja-testowa',
      typ: 'access',
      exp: Math.floor(Date.now() / 1000) + 600,
    },
    env.JWT_SECRET,
  )

// `app.request` deklaruje `Response | Promise<Response>`, wiec zwracamy przez
// `await` — bez tego zapadka bledow typow slusznie odrzucila ten plik.
const zapytaj = async (
  path: string,
  env: Record<string, unknown>,
  init: RequestInit = {},
): Promise<Response> => await app.request(path, { headers: naglowki, ...init }, env)

interface Koperta<T> {
  ok?: boolean
  data?: T
  meta?: { page?: number; perPage?: number; total?: number; totalPages?: number }
  error?: { code?: string; message?: string; details?: unknown }
}

/**
 * Typowany odczyt koperty. `await response.json()` daje `unknown`, a rzutowanie
 * na `any` wylaczyloby kontrole typow w calym pliku — dokladnie ten mechanizm
 * sprawil, ze parametry typu `.first<T>()` w kodzie produkcyjnym nie mialy
 * zadnego efektu (patrz komentarz w `src/lib/http/envelope.ts`).
 */
const cialo = async <T>(response: Response): Promise<Koperta<T>> =>
  (await response.json()) as Koperta<T>

const SCIEZKA = '/api/v1/comments'

describe('moderacja komentarzy — dostep', () => {
  it('odmawia niezalogowanemu i NIE ujawnia tresci komentarzy', async () => {
    const env = swiezeSrodowisko()
    const response = await zapytaj(SCIEZKA, env)

    expect(response.status).toBe(401)

    // Sam status nie wystarczy: sprawdzamy, ze w odpowiedzi nie ma danych.
    // Adres e-mail autora komentarza to dana osobowa; 401 z dolaczonym
    // adresem bylby wyciekiem mimo „poprawnego” statusu.
    const tresc = await response.text()
    expect(tresc).not.toContain('marek@example.com')
    expect(tresc).not.toContain('Marek Nowak')
  })

  it('odmawia roli bez uprawnienia comment:moderate', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'viewer')
    const response = await zapytaj(SCIEZKA, env, { headers: { ...naglowki, authorization: `Bearer ${jwt}` } })

    expect(response.status).toBe(403)
    const tresc = await response.text()
    expect(tresc).not.toContain('marek@example.com')
  })

  /**
   * KONTROLA SAMEGO TESTU.
   *
   * Bez tego przypadku dwa powyzsze dowodzilyby jedynie, ze trasa jest
   * niedostepna — co bylo by prawda takze wtedy, gdyby byla po prostu
   * zepsuta albo gdyby atrapa nie znala tabeli `user_sessions` (ten wlasnie
   * fałszywy sygnal wystapil w tym repozytorium realnie). Ten przypadek
   * pokazuje, ze blokada wynika z UPRAWNIEN, nie z awarii.
   */
  it('wydaje kolejke moderatorowi — dowod, ze blokada to uprawnienia, nie awaria', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator')
    const response = await zapytaj(SCIEZKA, env, { headers: { ...naglowki, authorization: `Bearer ${jwt}` } })

    expect(response.status).toBe(200)
    const body = await cialo<{ comments: Array<Record<string, unknown>>; counts: Record<string, number> }>(response)
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data?.comments)).toBe(true)
    expect(body.data?.comments.length).toBeGreaterThan(0)
    expect(body.meta?.page).toBe(1)
  })

  it('odrzuca nieznany status w filtrze zamiast go milczaco ignorowac', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator')
    const response = await zapytaj(`${SCIEZKA}?status=nieistniejacy`, env, {
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
    })

    // 400, nie 200 z pusta lista: cichy filtr wygladalby dla moderatora jak
    // „brak zgloszen do moderacji”, wiec komentarze czekalyby niezauwazone.
    expect(response.status).toBe(400)
    const body = await cialo<never>(response)
    expect(body.error?.code).toBe('validation_error')
  })
})

describe('moderacja komentarzy — decyzja', () => {
  it('zapisuje NUMERYCZNY identyfikator moderatora w moderated_by', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator', '42')
    const response = await zapytaj(`${SCIEZKA}/501/moderate`, env, {
      method: 'POST',
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ status: 'approved', reason: 'Wypowiedz rzeczowa.' }),
    })

    expect(response.status).toBe(200)
    const body = await cialo<{ id: number; status: string }>(response)
    expect(body.data?.status).toBe('approved')

    // ISTOTA TEGO TESTU: sprawdzamy stan bazy, nie tylko status odpowiedzi.
    // Przed naprawa trasa odpowiadala rowniez 200, a `moderated_by` bylo NULL.
    const komentarz = env.DB.komentarze.find((k) => k.id === 501)
    expect(komentarz?.status).toBe('approved')
    expect(komentarz?.moderated_by).toBe(42)
    expect(komentarz?.moderated_by).not.toBeNull()
    expect(typeof komentarz?.moderated_by).toBe('number')
  })

  it('odrzuca status poza katalogiem i NIE zmienia komentarza', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator')
    const response = await zapytaj(`${SCIEZKA}/501/moderate`, env, {
      method: 'POST',
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ status: 'zatwierdzone-chyba' }),
    })

    expect(response.status).toBe(400)
    // Odmowa musi byc bezskutkowa. Trasa, ktora zwraca 400 po czesciowym
    // zapisie, zostawia baze w stanie nieprzewidzianym przez zaden kontrakt.
    expect(env.DB.komentarze.find((k) => k.id === 501)?.status).toBe('pending')
    expect(env.DB.komentarze.find((k) => k.id === 501)?.moderated_by).toBeNull()
  })

  it('zwraca 404 dla komentarza, ktorego nie ma', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator')
    const response = await zapytaj(`${SCIEZKA}/999999/moderate`, env, {
      method: 'POST',
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ status: 'approved' }),
    })

    expect(response.status).toBe(404)
    const body = await cialo<never>(response)
    expect(body.error?.code).toBe('not_found')
  })

  it('nie wpuszcza niezalogowanego do decyzji moderacyjnej', async () => {
    const env = swiezeSrodowisko()
    const response = await zapytaj(`${SCIEZKA}/501/moderate`, env, {
      method: 'POST',
      body: JSON.stringify({ status: 'approved' }),
    })

    expect(response.status).toBe(401)
    // Kluczowe: brak skutku. 401 przy dokonanym zapisie oznaczalby, ze
    // kazdy moze moderowac, a komunikat o bledzie jest tylko dekoracja.
    expect(env.DB.komentarze.find((k) => k.id === 501)?.status).toBe('pending')
  })
})

describe('moderacja komentarzy — usuniecie miekkie', () => {
  it('wymaga uprawnienia comment:delete, ktorego autor nie ma', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'author')
    const response = await zapytaj(`${SCIEZKA}/501`, env, {
      method: 'DELETE',
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
    })

    expect(response.status).toBe(403)
    expect(env.DB.komentarze.find((k) => k.id === 501)?.deleted_at).toBeNull()
  })

  it('moderator usuwa miekko — wiersz zostaje, dostaje znacznik i slad moderatora', async () => {
    const env = swiezeSrodowisko()
    const jwt = await token(env, 'moderator', '42')
    const response = await zapytaj(`${SCIEZKA}/501`, env, {
      method: 'DELETE',
      headers: { ...naglowki, authorization: `Bearer ${jwt}` },
    })

    expect(response.status).toBe(200)
    const komentarz = env.DB.komentarze.find((k) => k.id === 501)
    // Usuniecie miekkie, nie fizyczne: wpis moze byc dowodem w sprawie
    // o znieslawienie albo elementem watku.
    expect(komentarz).toBeDefined()
    expect(komentarz?.deleted_at).not.toBeNull()
    expect(komentarz?.moderated_by).toBe(42)
  })
})
