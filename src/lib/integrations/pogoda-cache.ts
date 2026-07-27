/**
 * Etap I5 — wspólna warstwa pamięci podręcznej dla pogody i powietrza.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO TEN PLIK POWSTAŁ
 * ═══════════════════════════════════════════════════════════════════════
 * Ta sama czterostopniowa decyzja („świeże z KV → dostawca → stare z KV →
 * uczciwy brak") jest potrzebna w DWÓCH miejscach:
 *
 *   • w trasie API `/api/v1/pogoda` — dla paska górnego i klientów HTTP,
 *   • przy renderowaniu podstrony `/pogoda` — bo tam pogoda jest treścią
 *     strony i musi przyjść w pierwszym żądaniu.
 *
 * Skopiowanie jej do obu miejsc gwarantowałoby rozjechanie się zachowań:
 * pierwsza poprawka progu, TTL-a albo komunikatu trafiłaby tylko do
 * jednego z nich, a czytelnik zobaczyłby inne dane w pasku i inne na
 * podstronie tej samej witryny.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO PODSTRONA NIE ODPYTUJE WŁASNEGO API PRZEZ `fetch`
 * ═══════════════════════════════════════════════════════════════════════
 * Worker wywołujący własny endpoint po HTTP zużywa jedno z ograniczonych
 * podzapytań (subrequest), przechodzi całą warstwę pośredniczącą i dokłada
 * kilkadziesiąt milisekund — po to tylko, by ostatecznie sięgnąć do KV,
 * do którego ma dostęp bezpośrednio. Strona woła więc tę funkcję,
 * a nie swój własny adres.
 */
import {
  IZBICA_KUJAWSKA,
  TTL_POGODA,
  TTL_POWIETRZE,
  pobierzPogode,
  pobierzPowietrze,
  type OdpowiedzPogody,
  type JakoscPowietrza,
} from './pogoda'

/** Klucz świeżej odpowiedzi (z TTL). */
export const KLUCZ_POGODA = 'pogoda:izbica'
/**
 * Klucz „ostatnia udana" — świadomie BEZ TTL.
 *
 * To on realizuje ratunek przy awarii dostawcy. Cache brzegowy Cloudflare
 * (`cf.cacheTtl`) nie może pełnić tej roli: jest per-kolokacja i może
 * zostać wyrzucony w każdej chwili, więc dokładnie wtedy, gdy Open-Meteo
 * przestanie odpowiadać, może być pusty.
 */
export const KLUCZ_POGODA_AWARIA = 'pogoda:izbica:ostatnia'
export const KLUCZ_POWIETRZE = 'powietrze:izbica'
export const KLUCZ_POWIETRZE_AWARIA = 'powietrze:izbica:ostatnia'

/**
 * Odczyt z KV odporny na brak bindingu.
 *
 * `WEATHER_KV` jest w typach opcjonalne i w środowisku lokalnym bez
 * skonfigurowanego namespace'u faktycznie go nie ma. Brak pamięci
 * podręcznej nie może wywracać pogody — degradujemy do zapytania na żywo.
 */
export const czytajKv = async <T>(kv: unknown, klucz: string): Promise<T | null> => {
  if (!kv || typeof (kv as { get?: unknown }).get !== 'function') return null
  try {
    const surowe = await (kv as { get: (k: string, t: string) => Promise<unknown> }).get(
      klucz,
      'json'
    )
    return (surowe as T) ?? null
  } catch (blad) {
    console.warn('[pogoda] odczyt KV nieudany', klucz, blad)
    return null
  }
}

export const pisz2Kv = async (
  kv: unknown,
  klucz: string,
  wartosc: unknown,
  ttl?: number
): Promise<void> => {
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

/**
 * Wiek zapisu w minutach — liczony z pola `pobrano` zapisanego przez
 * serwer, nie z zegara przeglądarki. Zegar klienta bywa przestawiony
 * o godziny, a wtedy „dane sprzed 3 minut" pokazywałyby się jako
 * sprzed dwóch dni.
 */
export const wiekMinut = (pobrano: string): number | null => {
  const t = Date.parse(pobrano)
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.round((Date.now() - t) / 60000))
}

/** Wynik z informacją o pochodzeniu — strona i API opisują to samo. */
export interface WynikPogody {
  dane: (OdpowiedzPogody & { zCache?: boolean; nieswieze?: boolean; wiekMinut?: number | null; ostrzezenie?: string }) | null
  /** Komunikat dla czytelnika, gdy `dane === null`. */
  blad?: string
  /** Kod HTTP proponowany dla odpowiedzi API. */
  status: 200 | 503
}

export interface WynikPowietrza {
  dane: (JakoscPowietrza & { zCache?: boolean; nieswieze?: boolean; wiekMinut?: number | null; ostrzezenie?: string }) | null
  blad?: string
  status: 200 | 503
}

/**
 * Czterostopniowa decyzja dla prognozy — jedyne miejsce, w którym jest zapisana.
 *
 *   1. świeże w KV       → podaj, nie ruszaj dostawcy,
 *   2. brak/przedawnione → zapytaj Open-Meteo, zapisz pod DWA klucze,
 *   3. dostawca padł     → podaj ostatnią udaną odpowiedź z jawnym wiekiem,
 *   4. padł i KV puste   → przyznaj brak danych.
 *
 * Punkt 4 jest sensem całego etapu: poprzednio w tym miejscu widniała
 * liczba wpisana na stałe w szablonie, więc portal pokazywał „18 °C"
 * także w mrozie.
 */
export const pogodaZPamieci = async (kv: unknown): Promise<WynikPogody> => {
  const swieze = await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA)
  if (swieze?.teraz) {
    return { dane: { ...swieze, zCache: true, wiekMinut: wiekMinut(swieze.pobrano) }, status: 200 }
  }

  try {
    const dane = await pobierzPogode()
    await Promise.all([
      pisz2Kv(kv, KLUCZ_POGODA, dane, TTL_POGODA),
      pisz2Kv(kv, KLUCZ_POGODA_AWARIA, dane),
    ])
    return { dane: { ...dane, wiekMinut: 0 }, status: 200 }
  } catch (blad) {
    console.error('[pogoda] Open-Meteo niedostępne', blad)

    const stare = await czytajKv<OdpowiedzPogody>(kv, KLUCZ_POGODA_AWARIA)
    if (stare?.teraz) {
      return {
        dane: {
          ...stare,
          zCache: true,
          nieswieze: true,
          wiekMinut: wiekMinut(stare.pobrano),
          ostrzezenie: 'Dane z pamięci podręcznej — serwis pogodowy chwilowo nie odpowiada.',
        },
        status: 200,
      }
    }

    return {
      dane: null,
      blad: 'Serwis pogodowy nie odpowiada. Nie pokazujemy danych zastępczych.',
      status: 503,
    }
  }
}

export const powietrzeZPamieci = async (kv: unknown): Promise<WynikPowietrza> => {
  const swieze = await czytajKv<JakoscPowietrza>(kv, KLUCZ_POWIETRZE)
  if (swieze && swieze.pm25 !== undefined) {
    return { dane: { ...swieze, zCache: true, wiekMinut: wiekMinut(swieze.pobrano) }, status: 200 }
  }

  try {
    const dane = await pobierzPowietrze()
    await Promise.all([
      pisz2Kv(kv, KLUCZ_POWIETRZE, dane, TTL_POWIETRZE),
      pisz2Kv(kv, KLUCZ_POWIETRZE_AWARIA, dane),
    ])
    return { dane: { ...dane, wiekMinut: 0 }, status: 200 }
  } catch (blad) {
    console.error('[pogoda] Air Quality niedostępne', blad)
    const stare = await czytajKv<JakoscPowietrza>(kv, KLUCZ_POWIETRZE_AWARIA)
    if (stare) {
      return {
        dane: {
          ...stare,
          zCache: true,
          nieswieze: true,
          wiekMinut: wiekMinut(stare.pobrano),
          ostrzezenie: 'Dane z pamięci podręcznej — serwis pomiarowy chwilowo nie odpowiada.',
        },
        status: 200,
      }
    }
    return { dane: null, blad: 'Serwis pomiarowy nie odpowiada.', status: 503 }
  }
}

export { IZBICA_KUJAWSKA, TTL_POGODA, TTL_POWIETRZE }
