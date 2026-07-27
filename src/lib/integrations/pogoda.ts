/**
 * Etap I5 — pogoda i jakość powietrza dla Izbicy Kujawskiej.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CO ZASTĘPUJE
 * ═══════════════════════════════════════════════════════════════════════
 * `GET /api/v1/weather` zwracał wartości zaszyte w kodzie: 14 °C,
 * „częściowe zachmurzenie", prognoza na wt–so z nazwami dni wpisanymi
 * ręcznie. Odpowiedź niosła pole `source: 'mock'`, ale strona główna
 * pokazywała te liczby bez żadnego oznaczenia. Mieszkaniec widział
 * „14 °C" niezależnie od tego, czy był lipiec, czy mróz w styczniu —
 * i nie miał podstaw sądzić, że to nie jest prawdziwy pomiar.
 *
 * Widget pogodowy na portalu lokalnym jest realnie używany: ludzie
 * sprawdzają, czy jechać na dożynki, czy zdąży się z sianokosami.
 * Nieprawdziwa liczba jest tu gorsza niż brak widgetu.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * WSPÓŁRZĘDNE
 * ═══════════════════════════════════════════════════════════════════════
 * Poprzedni kod podawał 52.4214 N, 18.7714 E. W dokumentacji projektu
 * (docs/05-INTEGRACJE.md) figuruje 52.4247 N, 18.7561 E. Różnica to
 * ~1,1 km — dla prognozy w siatce 11 km bez znaczenia, ale trzymamy
 * jedną wartość w jednym miejscu, żeby pogoda i mapa (etap I10) nie
 * wskazywały dwóch różnych punktów jako „Izbica Kujawska".
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DOSTAWCY
 * ═══════════════════════════════════════════════════════════════════════
 * Open-Meteo — prognoza. Bez klucza API, bez limitu dla użytku
 * niekomercyjnego, licencja CC-BY 4.0 (stąd obowiązkowe pole `zrodlo`
 * pokazywane w widgecie — to warunek licencji, nie ozdoba).
 *
 * Open-Meteo Air Quality — pyły PM10/PM2.5 i indeks europejski. Ten sam
 * dostawca, osobny adres.
 *
 * Świadomie NIE używamy IMGW-PIB ani GIOŚ, choć są to źródła urzędowe:
 * IMGW udostępnia stacje synoptyczne, z których najbliższa Izbicy to
 * Toruń albo Poznań (60–90 km) — pomiar z takiej odległości opisuje inną
 * pogodę niż ta za oknem, a przy opadach burzowych bywa wręcz odwrotny.
 * Interpolacja Open-Meteo dla konkretnego punktu jest tu bliższa prawdy.
 * Ostrzeżenia meteorologiczne IMGW to osobna sprawa i osobne zadanie —
 * one obowiązują dla całego powiatu, więc źródło urzędowe jest właściwe.
 */

export const IZBICA_KUJAWSKA = {
  szerokosc: 52.4247,
  dlugosc: 18.7561,
  nazwa: 'Izbica Kujawska',
  powiat: 'włocławski',
  wojewodztwo: 'kujawsko-pomorskie',
  /** Strefa czasowa przekazywana Open-Meteo, żeby doby prognozy pokrywały się z polskim kalendarzem. */
  strefa: 'Europe/Warsaw',
} as const

const ENDPOINT_PROGNOZA = 'https://api.open-meteo.com/v1/forecast'
const ENDPOINT_POWIETRZE = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/** Ile sekund odpowiedź uznajemy za świeżą. */
export const TTL_POGODA = 900 // 15 min — Open-Meteo odświeża model rzadziej
export const TTL_POWIETRZE = 1800 // 30 min

/**
 * Kody pogody WMO w opisie polskim.
 *
 * Open-Meteo zwraca liczbę zgodną z tabelą WMO 4677. Bez tego słownika
 * widget pokazywałby „kod 61" zamiast „lekki deszcz". Opisy są w formie
 * mianownikowej, bo trafiają do widgetu jako samodzielna etykieta.
 */
const KODY_WMO: Record<number, { opis: string; ikona: string }> = {
  0: { opis: 'bezchmurnie', ikona: 'sun' },
  1: { opis: 'przejaśnienia', ikona: 'cloud-sun' },
  2: { opis: 'częściowe zachmurzenie', ikona: 'cloud-sun' },
  3: { opis: 'zachmurzenie całkowite', ikona: 'cloud' },
  45: { opis: 'mgła', ikona: 'smog' },
  48: { opis: 'mgła osadzająca szron', ikona: 'smog' },
  51: { opis: 'mżawka', ikona: 'cloud-drizzle' },
  53: { opis: 'mżawka', ikona: 'cloud-drizzle' },
  55: { opis: 'gęsta mżawka', ikona: 'cloud-drizzle' },
  56: { opis: 'marznąca mżawka', ikona: 'cloud-drizzle' },
  57: { opis: 'gęsta marznąca mżawka', ikona: 'cloud-drizzle' },
  61: { opis: 'lekki deszcz', ikona: 'cloud-rain' },
  63: { opis: 'deszcz', ikona: 'cloud-rain' },
  65: { opis: 'silny deszcz', ikona: 'cloud-showers-heavy' },
  66: { opis: 'marznący deszcz', ikona: 'cloud-rain' },
  67: { opis: 'silny marznący deszcz', ikona: 'cloud-showers-heavy' },
  71: { opis: 'lekkie opady śniegu', ikona: 'snowflake' },
  73: { opis: 'opady śniegu', ikona: 'snowflake' },
  75: { opis: 'silne opady śniegu', ikona: 'snowflake' },
  77: { opis: 'śnieg ziarnisty', ikona: 'snowflake' },
  80: { opis: 'przelotny deszcz', ikona: 'cloud-sun-rain' },
  81: { opis: 'przelotny deszcz', ikona: 'cloud-sun-rain' },
  82: { opis: 'gwałtowny przelotny deszcz', ikona: 'cloud-showers-heavy' },
  85: { opis: 'przelotne opady śniegu', ikona: 'snowflake' },
  86: { opis: 'silne przelotne opady śniegu', ikona: 'snowflake' },
  95: { opis: 'burza', ikona: 'bolt' },
  96: { opis: 'burza z gradem', ikona: 'cloud-bolt' },
  99: { opis: 'silna burza z gradem', ikona: 'cloud-bolt' },
}

const opisKodu = (kod: number) => KODY_WMO[kod] ?? { opis: 'brak danych', ikona: 'question' }

/** Skróty polskich dni tygodnia — indeks 0 = niedziela, jak w ISO getDay(). */
const DNI_SKROT = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'so']

/**
 * Dzień tygodnia z daty ISO — bez `new Date()` w strefie Workera.
 *
 * Worker działa w UTC. `new Date('2026-07-27').getDay()` zwróci dzień
 * poprawnie, ale dla daty z godziną blisko północy przesunięcie strefy
 * zmieniłoby datę o jeden. Algorytm Sakamoto liczy dzień tygodnia
 * z samych liczb roku/miesiąca/dnia, więc żadna strefa go nie dotyczy.
 */
export const dzienTygodnia = (isoData: string): string => {
  const m = isoData.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  const rok = Number.parseInt(m[1], 10)
  const miesiac = Number.parseInt(m[2], 10)
  const dzien = Number.parseInt(m[3], 10)
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const r = miesiac < 3 ? rok - 1 : rok
  const indeks = (r + Math.floor(r / 4) - Math.floor(r / 100) + Math.floor(r / 400) + t[miesiac - 1] + dzien) % 7
  return DNI_SKROT[indeks] ?? ''
}

export interface PogodaTeraz {
  temperatura: number
  odczuwalna: number
  wilgotnosc: number
  wiatr: number
  wiatrPorywy: number | null
  kierunekWiatru: number
  opis: string
  ikona: string
  kodWmo: number
  cisnienie: number | null
  zachmurzenie: number | null
  jestDzien: boolean
  czas: string
}

export interface PogodaDzien {
  data: string
  dzien: string
  tempMin: number
  tempMax: number
  opis: string
  ikona: string
  kodWmo: number
  opadSuma: number
  opadPrawdopodobienstwo: number | null
  wschod: string | null
  zachod: string | null
}

export interface OdpowiedzPogody {
  lokalizacja: string
  wspolrzedne: { szerokosc: number; dlugosc: number }
  teraz: PogodaTeraz | null
  prognoza: PogodaDzien[]
  /** Wymagane przez licencję CC-BY 4.0 Open-Meteo — musi być widoczne w widgecie. */
  zrodlo: string
  zrodloUrl: string
  pobrano: string
  /** `true`, gdy dane pochodzą z pamięci podręcznej, nie ze świeżego zapytania. */
  zCache: boolean
}

interface SurowaProgn {
  current?: Record<string, number | string>
  daily?: Record<string, Array<number | string>>
  hourly?: Record<string, Array<number | string>>
}

const liczba = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : NaN
  return Number.isFinite(n) ? n : null
}

/**
 * Pobranie prognozy z Open-Meteo.
 *
 * Rzuca wyjątkiem przy błędzie sieci lub odpowiedzi — obsługa i decyzja
 * „co pokazać czytelnikowi" należy do warstwy wyżej, która ma dostęp do
 * pamięci podręcznej i może podać dane sprzed 20 minut zamiast pustki.
 */
export const pobierzPogode = async (): Promise<OdpowiedzPogody> => {
  const parametry = new URLSearchParams({
    latitude: String(IZBICA_KUJAWSKA.szerokosc),
    longitude: String(IZBICA_KUJAWSKA.dlugosc),
    timezone: IZBICA_KUJAWSKA.strefa,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'weather_code',
      'surface_pressure',
      'cloud_cover',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_min',
      'temperature_2m_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),
    forecast_days: '7',
  })

  const odp = await fetch(`${ENDPOINT_PROGNOZA}?${parametry}`, {
    headers: { accept: 'application/json' },
    // Cache brzegowy Cloudflare — przy 500 odsłonach strony głównej na godzinę
    // bez tego wysyłalibyśmy 500 zapytań do Open-Meteo po te same dane.
    cf: { cacheTtl: TTL_POGODA, cacheEverything: true },
  } as RequestInit)

  if (!odp.ok) {
    throw new Error(`Open-Meteo odpowiedziało ${odp.status}`)
  }

  const dane = (await odp.json()) as SurowaProgn
  const c = dane.current ?? {}
  const kod = liczba(c.weather_code) ?? 3
  const o = opisKodu(kod)

  const temperatura = liczba(c.temperature_2m)
  const teraz: PogodaTeraz | null =
    temperatura === null
      ? null
      : {
          // Zaokrąglenie do stopnia: podawanie 14,37 °C sugeruje dokładność,
          // której model prognostyczny w siatce 11 km nie ma.
          temperatura: Math.round(temperatura),
          odczuwalna: Math.round(liczba(c.apparent_temperature) ?? temperatura),
          wilgotnosc: Math.round(liczba(c.relative_humidity_2m) ?? 0),
          wiatr: Math.round(liczba(c.wind_speed_10m) ?? 0),
          wiatrPorywy: liczba(c.wind_gusts_10m) === null ? null : Math.round(liczba(c.wind_gusts_10m)!),
          kierunekWiatru: Math.round(liczba(c.wind_direction_10m) ?? 0),
          opis: o.opis,
          ikona: o.ikona,
          kodWmo: kod,
          cisnienie: liczba(c.surface_pressure) === null ? null : Math.round(liczba(c.surface_pressure)!),
          zachmurzenie: liczba(c.cloud_cover) === null ? null : Math.round(liczba(c.cloud_cover)!),
          jestDzien: liczba(c.is_day) === 1,
          czas: String(c.time ?? ''),
        }

  const d = dane.daily ?? {}
  const daty = (d.time ?? []) as string[]
  const prognoza: PogodaDzien[] = daty.map((data, i) => {
    const kodDnia = liczba(d.weather_code?.[i]) ?? 3
    const od = opisKodu(kodDnia)
    return {
      data,
      dzien: dzienTygodnia(data),
      tempMin: Math.round(liczba(d.temperature_2m_min?.[i]) ?? 0),
      tempMax: Math.round(liczba(d.temperature_2m_max?.[i]) ?? 0),
      opis: od.opis,
      ikona: od.ikona,
      kodWmo: kodDnia,
      opadSuma: Math.round((liczba(d.precipitation_sum?.[i]) ?? 0) * 10) / 10,
      opadPrawdopodobienstwo: liczba(d.precipitation_probability_max?.[i]),
      wschod: (d.sunrise?.[i] as string) ?? null,
      zachod: (d.sunset?.[i] as string) ?? null,
    }
  })

  return {
    lokalizacja: IZBICA_KUJAWSKA.nazwa,
    wspolrzedne: { szerokosc: IZBICA_KUJAWSKA.szerokosc, dlugosc: IZBICA_KUJAWSKA.dlugosc },
    teraz,
    prognoza,
    zrodlo: 'Open-Meteo',
    zrodloUrl: 'https://open-meteo.com/',
    pobrano: new Date().toISOString(),
    zCache: false,
  }
}

// ─────────────────────────────────────────────── jakość powietrza

export interface JakoscPowietrza {
  pm10: number | null
  pm25: number | null
  /** Indeks europejski 0–100+, im wyżej, tym gorzej. */
  indeksEu: number | null
  /** Opis słowny wyliczony z PM2.5 wg progów WHO/EEA. */
  ocena: string
  ocenaKolor: string
  /** Ostrzeżenie dla osób wrażliwych — puste, gdy nie jest potrzebne. */
  zalecenie: string | null
  zrodlo: string
  pobrano: string
  zCache: boolean
}

/**
 * Ocena jakości powietrza według PM2.5.
 *
 * Progi zgodne z indeksem europejskim EEA. Zaokrąglanie w dół do progu,
 * nie do najbliższego — przy 25,4 µg/m³ podajemy „umiarkowana", nie
 * „dobra". Zaniżenie oceny jakości powietrza dotyczy zdrowia osób
 * z astmą i dzieci; margines błędu musi działać na ich korzyść.
 */
const ocenPowietrze = (pm25: number | null): { ocena: string; kolor: string; zalecenie: string | null } => {
  if (pm25 === null) return { ocena: 'brak danych', kolor: '#9e9e9e', zalecenie: null }
  if (pm25 <= 10) return { ocena: 'bardzo dobra', kolor: '#50f0e6', zalecenie: null }
  if (pm25 <= 20) return { ocena: 'dobra', kolor: '#50ccaa', zalecenie: null }
  if (pm25 <= 25)
    return {
      ocena: 'umiarkowana',
      kolor: '#f0e641',
      zalecenie: 'Osoby wrażliwe powinny ograniczyć długotrwały wysiłek na zewnątrz.',
    }
  if (pm25 <= 50)
    return {
      ocena: 'niekorzystna',
      kolor: '#ff5050',
      zalecenie: 'Osoby z chorobami układu oddechowego, dzieci i seniorzy — unikajcie wysiłku na zewnątrz.',
    }
  if (pm25 <= 75)
    return {
      ocena: 'zła',
      kolor: '#960032',
      zalecenie: 'Ogranicz przebywanie na zewnątrz. Zamknij okna.',
    }
  return {
    ocena: 'bardzo zła',
    kolor: '#7d2181',
    zalecenie: 'Pozostań w pomieszczeniach. Nie wietrz. Odwołaj zajęcia sportowe na zewnątrz.',
  }
}

export const pobierzPowietrze = async (): Promise<JakoscPowietrza> => {
  const parametry = new URLSearchParams({
    latitude: String(IZBICA_KUJAWSKA.szerokosc),
    longitude: String(IZBICA_KUJAWSKA.dlugosc),
    timezone: IZBICA_KUJAWSKA.strefa,
    current: ['pm10', 'pm2_5', 'european_aqi'].join(','),
  })

  const odp = await fetch(`${ENDPOINT_POWIETRZE}?${parametry}`, {
    headers: { accept: 'application/json' },
    cf: { cacheTtl: TTL_POWIETRZE, cacheEverything: true },
  } as RequestInit)

  if (!odp.ok) throw new Error(`Open-Meteo Air Quality odpowiedziało ${odp.status}`)

  const dane = (await odp.json()) as { current?: Record<string, number> }
  const c = dane.current ?? {}
  const pm25 = liczba(c.pm2_5)
  const ocena = ocenPowietrze(pm25)

  return {
    pm10: liczba(c.pm10) === null ? null : Math.round(liczba(c.pm10)!),
    pm25: pm25 === null ? null : Math.round(pm25 * 10) / 10,
    indeksEu: liczba(c.european_aqi) === null ? null : Math.round(liczba(c.european_aqi)!),
    ocena: ocena.ocena,
    ocenaKolor: ocena.kolor,
    zalecenie: ocena.zalecenie,
    zrodlo: 'Open-Meteo Air Quality (CAMS)',
    pobrano: new Date().toISOString(),
    zCache: false,
  }
}

/** Kierunek wiatru jako skrót polski — do widgetu. */
export const kierunekNaSkrot = (stopnie: number): string => {
  const kierunki = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return kierunki[Math.round(((stopnie % 360) / 45)) % 8] ?? 'N'
}
