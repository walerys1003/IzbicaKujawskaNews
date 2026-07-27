/**
 * Etap I10 — dane dla mapy gminy (punkty sołectw + instytucje).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SKĄD BIORĄ SIĘ WSPÓŁRZĘDNE
 * ═══════════════════════════════════════════════════════════════════════
 * Z tabeli `solectwa`, kolumny `latitude`/`longitude` wypełnione migracją
 * 0055 na podstawie OpenStreetMap (relacja gminy 2643810, TERYT 0418083).
 * Nie ma tu wartości zapisanych w kodzie — gdy redakcja poprawi położenie
 * w panelu, mapa pokaże poprawione.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LICENCJA — TO NIE JEST OPCJONALNE
 * ═══════════════════════════════════════════════════════════════════════
 * Dane OpenStreetMap są na licencji ODbL. Warunkiem użycia jest widoczne
 * oznaczenie „© OpenStreetMap contributors". Dotyczy zarówno kafli mapy,
 * jak i samych współrzędnych. Dlatego pole `licencja` jedzie w każdej
 * odpowiedzi tego endpointu, a komponent mapy je wyświetla — usunięcie
 * go z widoku jest naruszeniem licencji, nie zmianą kosmetyczną.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * GRANICE ZAKRESU (bbox)
 * ═══════════════════════════════════════════════════════════════════════
 * Wyliczamy je z faktycznych punktów, a nie wpisujemy. Gdyby ktoś dodał
 * sołectwo poza dotychczasowym zakresem, mapa i tak je obejmie —
 * przy wpisanych granicach pin wypadłby za kadr i nikt by tego nie
 * zauważył do zgłoszenia od czytelnika.
 */
import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, fail, requireDb } from '../../lib/http/envelope'
import { GMINA } from '../../v4/gmina-fakty'

const trasy = new Hono<AppEnv>()

export interface PunktMapy {
  slug: string
  nazwa: string
  lat: number
  lon: number
  soltys: string | null
  liczbaMaterialow: number
  adres: string
  jestSiedziba: boolean
}

trasy.get('/solectwa', async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  try {
    const wynik = await db
      .prepare(
        `SELECT slug, name, latitude, longitude, soltys, news_count, population
           FROM solectwa
          WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          ORDER BY name COLLATE NOCASE`
      )
      .all<{
        slug: string
        name: string
        latitude: number
        longitude: number
        soltys: string | null
        news_count: number | null
        population: number | null
      }>()

    const wiersze = wynik.results ?? []
    const punkty: PunktMapy[] = wiersze.map((r) => ({
      slug: r.slug,
      nazwa: r.name,
      lat: r.latitude,
      lon: r.longitude,
      soltys: r.soltys,
      liczbaMaterialow: r.news_count ?? 0,
      adres: `/solectwa/${r.slug}`,
      jestSiedziba: r.slug === 'izbica-kujawska',
    }))

    if (punkty.length === 0) {
      // Pusta mapa jest gorsza niż brak mapy: czytelnik widzi kafle bez
      // pinów i wnioskuje, że w gminie nic nie ma. Mówimy wprost.
      return fail(c, 'not_found', 'Brak punktów z ustalonymi współrzędnymi. Uruchom migrację 0055.')
    }

    const lats = punkty.map((p) => p.lat)
    const lons = punkty.map((p) => p.lon)
    const zapas = 0.01 // ~1,1 km — żeby skrajne piny nie leżały na krawędzi kadru

    return ok(c, {
      punkty,
      liczba: punkty.length,
      liczbaSolectw: punkty.filter((p) => !p.jestSiedziba).length,
      srodek: { lat: GMINA.wspolrzedne.szerokosc, lon: GMINA.wspolrzedne.dlugosc },
      zakres: {
        poludnie: Math.min(...lats) - zapas,
        polnoc: Math.max(...lats) + zapas,
        zachod: Math.min(...lons) - zapas,
        wschod: Math.max(...lons) + zapas,
      },
      gmina: {
        nazwa: GMINA.nazwa,
        powiat: GMINA.powiat,
        wojewodztwo: GMINA.wojewodztwo,
        powierzchnia: GMINA.powierzchnia.tekst,
        teryt: GMINA.teryt,
      },
      /** Warunek licencji ODbL — komponent mapy musi to pokazać. */
      licencja: {
        tekst: '© OpenStreetMap contributors',
        url: 'https://www.openstreetmap.org/copyright',
        nazwa: 'ODbL 1.0',
      },
    })
  } catch (blad) {
    console.error('[mapa] odczyt sołectw nieudany', blad)
    return fail(c, 'internal_error', 'Nie udało się pobrać punktów mapy.')
  }
})

export default trasy
