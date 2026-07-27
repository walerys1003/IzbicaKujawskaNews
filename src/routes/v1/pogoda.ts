/**
 * Etap I5 — trasy HTTP dla pogody i jakości powietrza.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO OSOBNA WARSTWA NAD `lib/integrations/pogoda.ts`
 * ═══════════════════════════════════════════════════════════════════════
 * `pobierzPogode()` rzuca wyjątkiem, gdy Open-Meteo nie odpowie. To jest
 * właściwe zachowanie biblioteki — nie ma ona pojęcia, co pokazać
 * czytelnikowi. Decyzja należy tutaj i brzmi tak:
 *
 *   1. Jeśli w KV leży odpowiedź świeższa niż TTL — podaj ją, nie ruszaj
 *      Open-Meteo. Strona główna ma kilkaset odsłon na godzinę; bez tego
 *      każda z nich byłaby zapytaniem do zewnętrznej usługi po te same
 *      liczby.
 *   2. Jeśli KV jest puste albo przedawnione — zapytaj Open-Meteo, zapisz.
 *   3. Jeśli Open-Meteo padło, a w KV jest cokolwiek, choćby sprzed
 *      dwóch godzin — podaj to z jawnym znacznikiem wieku. Prognoza
 *      sprzed dwóch godzin jest dla rolnika użyteczna. Komunikat „błąd
 *      usługi\" nie jest.
 *   4. Jeśli padło i KV jest puste — 503 z uczciwą informacją. NIE
 *      podstawiamy wartości zaszytych w kodzie. Właśnie z tego powodu
 *      ten etap istnieje: mieszkaniec widział „14 °C\" w styczniu.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO KV, GDY `fetch` ma już `cf.cacheTtl`
 * ═══════════════════════════════════════════════════════════════════════
 * Cache brzegowy Cloudflare jest per-lokalizacja (per-kolo) i nie ma
 * gwarancji trwałości — może zostać wyrzucony w każdej chwili. KV jest
 * wspólne dla wszystkich kolokacji i to ono realizuje punkt 3: przy
 * awarii Open-Meteo cache brzegowy nie pomoże, bo wygasł, a KV trzyma
 * ostatnią udaną odpowiedź bez limitu czasu (osobny klucz „ostatnia\").
 */
import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import {
  IZBICA_KUJAWSKA,
  TTL_POGODA,
  TTL_POWIETRZE,
  pobierzPogode,
  pobierzPowietrze,
  kierunekNaSkrot,
  type OdpowiedzPogody,
  type JakoscPowietrza,
} from '../../lib/integrations/pogoda'

const trasy = new Hono<AppEnv>()

/** Klucz świeżej odpowiedzi (z TTL). */
const KLUCZ_POGODA = 'pogoda:izbica'
/** Klucz „ostatnia udana\" — bez TTL, ratunek przy awarii dostawcy. */
const KLUCZ_POGODA_AWARIA = 'pogoda:izbica:ostatnia'
const KLUCZ_POWIETRZE = 'powietrze:izbica'
const KLUCZ_POWIETRZE_AWARIA = 'powietrze:izbica:ostatnia'

/**
 * Odczyt z KV odporny na brak bindingu.
 *
 * `WEATHER_KV` jest w typach opcjonalne i w środowisku lokalnym bez
 * skonfigurowanego namespace'u faktycznie go nie ma. Brak cache'a nie
 * może wywracać widgetu pogodowego — degradujemy do zapytania na żywo.
 */
const czytajKv = async <T>(kv: unknown, klucz: string): Promise<T | null> => {
  if (!kv || typeof (kv as { get?: unknown }).get !== 'function') return null
  try {
    const surowe = await (kv as { get: (k: string, t: string) => Promise<unknown> }).get(klucz, 'json')
    return (surowe as T) ?? null
  } catch (blad) {
    console.warn('[pogoda] odczyt KV nieudany', klucz, blad)
    return null
  }
}

const pisz2Kv = async (kv: unknown, klucz: string, wartosc: unknown, ttl?: number): Promise<void> => {
  if (!kv || typeof (kv as { put?: unknown }).put !== 'function') return
  try {
    const opcje = ttl ? { expirationTtl: ttl } : undefined
    await (kv as { put: (k: string, v: string, o?: unknown) => Promise<unknown> }).put(
      klucz,
      JSON.stringify(wartosc),
      opcje
    )
  } catch (blad) {
    console.warn('[pogoda] zapis KV nieudany', klucz, blad)
  }
}

/** Wiek zapisu w minutach — liczony z pola `pobrano`, bez zależności od zegara klienta. */
const wiekMinut = (pobrano: string): number | null => {
  const t = Date.parse(pobrano)
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.round((Date.now() - t) / 60000))
}

// ─────────────────────────────────────────────────────── GET /pogoda

trasy.get('/', async (c) => {
  const kv = c.env?.WEATHER_KV

  // 1. świeże z KV
  const swieze = await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA)
  if (swieze?.teraz) {
    c.header('cache-control', `public, max-age=120, s-maxage=${TTL_POGODA}`)
    return c.json({ ...swieze, zCache: true, wiekMinut: wiekMinut(swieze.pobrano) })
  }

  // 2. zapytanie do dostawcy
  try {
    const dane = await pobierzPogode()
    // Zapis pod dwoma kluczami: świeżym (z TTL) i awaryjnym (bez TTL).
    await Promise.all([
      pisz2Kv(kv, KLUCZ_POGODA, dane, TTL_POGODA),
      pisz2Kv(kv, KLUCZ_POGODA_AWARIA, dane),
    ])
    c.header('cache-control', `public, max-age=120, s-maxage=${TTL_POGODA}`)
    return c.json({ ...dane, wiekMinut: 0 })
  } catch (blad) {
    console.error('[pogoda] Open-Meteo niedostępne', blad)

    // 3. ratunek: ostatnia udana odpowiedź, jawnie oznaczona jako nieświeża
    const stare = await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA_AWARIA)
    if (stare?.teraz) {
      c.header('cache-control', 'public, max-age=60')
      return c.json({
        ...stare,
        zCache: true,
        nieswieze: true,
        wiekMinut: wiekMinut(stare.pobrano),
        ostrzezenie: 'Dane z pamięci podręcznej — serwis pogodowy chwilowo nie odpowiada.',
      })
    }

    // 4. uczciwy brak danych — nigdy wartości zaszyte w kodzie
    c.header('cache-control', 'no-store')
    return c.json(
      {
        lokalizacja: IZBICA_KUJAWSKA.nazwa,
        teraz: null,
        prognoza: [],
        zrodlo: 'Open-Meteo',
        blad: 'Serwis pogodowy nie odpowiada. Nie pokazujemy danych zastępczych.',
      },
      503
    )
  }
})

// ────────────────────────────────────────────── GET /pogoda/powietrze

trasy.get('/powietrze', async (c) => {
  // Osobny namespace: pyły odświeżamy rzadziej i nie chcemy, żeby
  // wygaszenie pogody unieważniało pomiar powietrza.
  const kv = c.env?.AIR_KV ?? c.env?.WEATHER_KV

  const swieze = await czytajKv<JakoscPowietrza>(kv, KLUCZ_POWIETRZE)
  if (swieze && swieze.pm25 !== undefined) {
    c.header('cache-control', `public, max-age=300, s-maxage=${TTL_POWIETRZE}`)
    return c.json({ ...swieze, zCache: true, wiekMinut: wiekMinut(swieze.pobrano) })
  }

  try {
    const dane = await pobierzPowietrze()
    await Promise.all([
      pisz2Kv(kv, KLUCZ_POWIETRZE, dane, TTL_POWIETRZE),
      pisz2Kv(kv, KLUCZ_POWIETRZE_AWARIA, dane),
    ])
    c.header('cache-control', `public, max-age=300, s-maxage=${TTL_POWIETRZE}`)
    return c.json({ ...dane, wiekMinut: 0 })
  } catch (blad) {
    console.error('[pogoda] Air Quality niedostępne', blad)
    const stare = await czytajKv<JakoscPowietrza>(kv, KLUCZ_POWIETRZE_AWARIA)
    if (stare) {
      c.header('cache-control', 'public, max-age=60')
      return c.json({
        ...stare,
        zCache: true,
        nieswieze: true,
        wiekMinut: wiekMinut(stare.pobrano),
        ostrzezenie: 'Dane z pamięci podręcznej — serwis pomiarowy chwilowo nie odpowiada.',
      })
    }
    c.header('cache-control', 'no-store')
    return c.json(
      {
        pm10: null,
        pm25: null,
        indeksEu: null,
        ocena: 'brak danych',
        blad: 'Serwis pomiarowy nie odpowiada.',
      },
      503
    )
  }
})

// ──────────────────────────────────────── GET /pogoda/pasek (topbar)

/**
 * Skrócona odpowiedź dla paska górnego: temperatura, ikona, kierunek wiatru.
 *
 * Pasek jest na każdej podstronie. Pełna odpowiedź `/pogoda` to ~4 kB
 * (7 dni prognozy); pasek potrzebuje ~80 bajtów. Osobna trasa oszczędza
 * transfer na urządzeniach mobilnych, gdzie widget prognozy i tak się nie
 * mieści.
 */
trasy.get('/pasek', async (c) => {
  const kv = c.env?.WEATHER_KV
  const zrodlo =
    (await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA)) ??
    (await (async () => {
      try {
        const dane = await pobierzPogode()
        await Promise.all([
          pisz2Kv(kv, KLUCZ_POGODA, dane, TTL_POGODA),
          pisz2Kv(kv, KLUCZ_POGODA_AWARIA, dane),
        ])
        return dane
      } catch {
        return await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA_AWARIA)
      }
    })())

  if (!zrodlo?.teraz) {
    c.header('cache-control', 'no-store')
    return c.json({ dostepne: false }, 503)
  }

  c.header('cache-control', `public, max-age=300, s-maxage=${TTL_POGODA}`)
  return c.json({
    dostepne: true,
    temperatura: zrodlo.teraz.temperatura,
    opis: zrodlo.teraz.opis,
    ikona: zrodlo.teraz.ikona,
    wiatr: zrodlo.teraz.wiatr,
    kierunek: kierunekNaSkrot(zrodlo.teraz.kierunekWiatru),
    lokalizacja: zrodlo.lokalizacja,
    zrodlo: zrodlo.zrodlo,
  })
})

export default trasy
