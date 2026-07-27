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
import { kierunekNaSkrot } from '../../lib/integrations/pogoda'
/**
 * Logika pamięci podręcznej mieszka w `lib/integrations/pogoda-cache.ts`,
 * bo korzysta z niej także renderowanie podstrony /pogoda. Trzymanie jej
 * tutaj oznaczałoby dwie kopie tej samej decyzji — pasek górny i podstrona
 * rozjechałyby się przy pierwszej poprawce TTL-a albo komunikatu.
 */
import {
  IZBICA_KUJAWSKA,
  TTL_POGODA,
  TTL_POWIETRZE,
  pogodaZPamieci,
  powietrzeZPamieci,
} from '../../lib/integrations/pogoda-cache'

const trasy = new Hono<AppEnv>()

// ─────────────────────────────────────────────────────── GET /pogoda

trasy.get('/', async (c) => {
  const wynik = await pogodaZPamieci(c.env?.WEATHER_KV)

  if (!wynik.dane) {
    // Uczciwy brak danych — NIGDY wartości zaszytych w kodzie.
    c.header('cache-control', 'no-store')
    return c.json(
      {
        lokalizacja: IZBICA_KUJAWSKA.nazwa,
        teraz: null,
        prognoza: [],
        zrodlo: 'Open-Meteo',
        blad: wynik.blad,
      },
      503
    )
  }

  // Dane nieświeże cache'ujemy krótko: chcemy szybko wrócić do dostawcy,
  // gdy tylko odzyska sprawność.
  c.header(
    'cache-control',
    wynik.dane.nieswieze ? 'public, max-age=60' : `public, max-age=120, s-maxage=${TTL_POGODA}`
  )
  return c.json(wynik.dane)
})

// ────────────────────────────────────────────── GET /pogoda/powietrze

trasy.get('/powietrze', async (c) => {
  // Osobny namespace: pyły odświeżamy rzadziej i nie chcemy, żeby
  // wygaszenie pogody unieważniało pomiar powietrza.
  const wynik = await powietrzeZPamieci(c.env?.AIR_KV ?? c.env?.WEATHER_KV)

  if (!wynik.dane) {
    c.header('cache-control', 'no-store')
    return c.json(
      { pm10: null, pm25: null, indeksEu: null, ocena: 'brak danych', blad: wynik.blad },
      503
    )
  }

  c.header(
    'cache-control',
    wynik.dane.nieswieze ? 'public, max-age=60' : `public, max-age=300, s-maxage=${TTL_POWIETRZE}`
  )
  return c.json(wynik.dane)
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
  // Ta sama funkcja, co w `/pogoda` — pasek nie może pokazywać innej
  // temperatury niż podstrona prognozy tej samej witryny.
  const wynik = await pogodaZPamieci(c.env?.WEATHER_KV)
  const zrodlo = wynik.dane

  if (!zrodlo?.teraz) {
    c.header('cache-control', 'no-store')
    // `dostepne: false` to prawidłowa odpowiedź, nie awaria portalu:
    // skrypt paska po prostu nie wpisuje nic i pasek zostaje bez pogody.
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
    nieswieze: zrodlo.nieswieze === true,
  })
})

export default trasy
