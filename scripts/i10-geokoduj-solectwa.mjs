/**
 * Etap I10 — ustalenie realnej listy sołectw gminy Izbica Kujawska
 * wraz ze współrzędnymi, na podstawie źródeł zewnętrznych.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CO TEN SKRYPT UJAWNIŁ (i dlaczego w ogóle powstał)
 * ═══════════════════════════════════════════════════════════════════════
 * Etap I10 miał tylko nanieść piny na mapę dla 34 sołectw z
 * `src/v4/taxonomy.ts`. Przed wpisaniem współrzędnych sprawdziłem nazwy
 * w OpenStreetMap. Wynik zestawienia:
 *
 *   — 16 z 34 nazw w `taxonomy.ts` NIE jest sołectwami tej gminy,
 *   — 18 realnych sołectw gminy w ogóle w `taxonomy.ts` nie było.
 *
 * Trzy z tych nazw to miejscowości istniejące, ale w SĄSIEDNICH gminach
 * (potwierdzone przez Nominatim):
 *   Bierzyn  → gmina Boniewo
 *   Lubomin  → gmina Boniewo
 *   Sarnowo  → gmina Lubraniec
 * Pozostałych (Sadłno, Cieszyno, Krzeszyn, Rzeźno, Orle, Smarliny,
 * Popowo, Szczerkowo, Konary, Bartłomiejowice) OSM nie zna w tym
 * rejonie w ogóle. Część wygląda na przekręcenie realnych nazw:
 *   „Augustowo\"   ≠ Augustynowo (realne sołectwo)
 *   „Szczerkowo\"  ≠ Szczkowo / Szczkówek (realne miejscowości)
 *   „Dębianki\"    — istnieje, ale NIE ma statusu sołectwa
 *   „Zagrodnica\"  — istnieje jako część Izbicy, NIE jest sołectwem
 *
 * Dlaczego to jest poważne, a nie kosmetyczne: portal informacyjny
 * gminy z zakładką „Sołectwa (34)\" deklaruje wiedzę o podziale
 * administracyjnym. Mieszkaniec Augustynowa nie znajdzie swojej wsi,
 * a znajdzie „Bierzyn\", który należy do Boniewa — czyli portal
 * przypisuje sobie teren obcej gminy. Na mapie (ten etap) byłoby to
 * jeszcze widoczniejsze: pin poza granicą gminy albo pin nigdzie.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ŹRÓDŁA I DLACZEGO DWA
 * ═══════════════════════════════════════════════════════════════════════
 * 1. Wikipedia (pl), „Izbica Kujawska (gmina)\", sekcja „Sołectwa\" —
 *    daje LISTĘ nazw ze statusem sołectwa. Sama nie podaje współrzędnych.
 * 2. OpenStreetMap / Overpass, relacja 2643810 (gmina, TERYT 0418083) —
 *    daje WSPÓŁRZĘDNE i niezależnie potwierdza, że miejscowość leży
 *    w granicach gminy.
 *
 * Zgodność źródeł: wszystkie 36 nazw z listy Wikipedii ma odpowiednik
 * w OSM w granicy gminy — 0 rozbieżności. Przy takiej zgodności dwóch
 * niezależnych źródeł uznaję listę za ustaloną.
 *
 * UWAGA co do liczby: infobox Wikipedii podaje „liczba sołectw = 34\",
 * a wyliczona sekcja zawiera 36 pozycji. Rozbieżność bierze się
 * najpewniej z Błenny: „Błenna\", „Błenna A\" i „Błenna B\" mogą być
 * liczone jako jedno sołectwo lub trzy. NIE zgaduję — zapisujemy 36
 * pozycji, bo każda z nich jest odrębną miejscowością o ustalonym
 * położeniu, a liczbę wyświetlaną na stronie bierzemy z długości
 * tablicy, nie z wpisanej ręcznie stałej. Weryfikacja u źródła
 * (statut gminy / uchwała rady) to zadanie dla redakcji — zostawiam
 * to w postaci wpisu w dokumentacji, nie w postaci wymyślonej liczby.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CZEGO SKRYPT NIE ROBI
 * ═══════════════════════════════════════════════════════════════════════
 * Nie wpisuje nazwisk sołtysów ani liczby mieszkańców. Nazwisko osoby
 * publicznej i liczba ludności to dane, których nie da się odgadnąć,
 * a dla czytelnika wyglądają identycznie jak zweryfikowane. Zostają NULL.
 *
 * URUCHOMIENIE (wymaga sieci):
 *   node scripts/i10-geokoduj-solectwa.mjs
 * Zapisuje: data/solectwa-osm.json  (dane wejściowe do generatora migracji)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KATALOG = dirname(fileURLToPath(import.meta.url))
const KORZEN = resolve(KATALOG, '..')
const WYJSCIE = resolve(KORZEN, 'data/solectwa-osm.json')

/** Relacja granicy gminy w OSM — TERYT 0418083. */
const RELACJA_GMINY = 2643810

/**
 * Lista sołectw z Wikipedii (pl), sekcja „Sołectwa" artykułu
 * „Izbica Kujawska (gmina)". Wpisana tu jawnie, a nie parsowana
 * z artykułu w czasie działania: treść Wikipedii może się zmienić
 * między uruchomieniami, a lista podziału administracyjnego nie
 * powinna zmieniać się przy każdym przebudowaniu strony bez wiedzy
 * redakcji. Zmiana tej listy ma być świadomą zmianą w repozytorium.
 */
const SOLECTWA_WIKIPEDIA = [
  'Augustynowo', 'Błenna', 'Błenna A', 'Błenna B', 'Chociszewo', 'Cieplinki',
  'Ciepliny', 'Długie', 'Gąsiorowo', 'Grochowiska', 'Helenowo', 'Hulanka',
  'Joasin', 'Józefowo', 'Kazanki', 'Kazimierowo', 'Komorowo', 'Mchówek',
  'Mieczysławowo', 'Modzerowo', 'Naczachowo', 'Nowa Wieś', 'Obałki', 'Pasieka',
  'Skarbanowo', 'Sokołowo', 'Szczkówek', 'Ślazewo', 'Śmieły', 'Świętosławice',
  'Świszewy', 'Tymień', 'Wietrzychowice', 'Wiszczelice', 'Wólka Komorowska',
  'Zdzisławin',
]

/** Siedziba gminy — miasto, nie sołectwo, ale musi być na mapie. */
const SIEDZIBA = { nazwa: 'Izbica Kujawska', rodzaj: 'miasto' }

const SERWERY_OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** Normalizacja do porównywania nazw: fałduje polskie litery, w tym „ł". */
const norm = (s) =>
  s.toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

/** Slug URL-owy: te same reguły co w taxonomy.ts, z myślnikiem między wyrazami. */
const slugify = (s) =>
  s.toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const spij = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Zapytanie do Overpass z ponawianiem.
 *
 * Overpass stosuje limit tempa i przy jego przekroczeniu odpowiada
 * HTML-em ze statusem 200 (nie 429), więc o odrzuceniu poznajemy się
 * po treści, nie po kodzie. Odczekanie jest tu konieczne, a nie
 * ostrożnościowe: bez niego skrypt uruchomiony dwa razy pod rząd
 * zawiedzie za drugim razem.
 *
 * Przy powtarzalnych uruchomieniach można podać zrzut z pliku:
 *   OVERPASS_CACHE=/ścieżka/do/pliku.json node scripts/i10-…mjs
 * Wtedy skrypt nie rusza sieci — przydatne w CI, gdzie zależność od
 * cudzego serwera czyniłaby budowanie niepowtarzalnym.
 */
const zapytajOverpass = async (zapytanie) => {
  const zPliku = process.env.OVERPASS_CACHE
  if (zPliku) {
    console.error('[i10] używam zrzutu z pliku: %s (bez zapytania do sieci)', zPliku)
    return JSON.parse(readFileSync(zPliku, 'utf8'))
  }

  let ostatniBlad
  const OCZEKIWANIA = [0, 8000, 25000, 60000]

  for (let proba = 0; proba < OCZEKIWANIA.length; proba++) {
    if (OCZEKIWANIA[proba] > 0) {
      console.error('[i10] limit tempa Overpass — odczekuję %d s (próba %d/%d)',
        OCZEKIWANIA[proba] / 1000, proba + 1, OCZEKIWANIA.length)
      await spij(OCZEKIWANIA[proba])
    }
    for (const serwer of SERWERY_OVERPASS) {
      try {
        const odp = await fetch(serwer, {
          method: 'POST',
          headers: { 'content-type': 'text/plain', 'user-agent': 'izbica24.pl/1.0 (portal gminny)' },
          body: zapytanie,
        })
        const tekst = await odp.text()
        if (!tekst.trimStart().startsWith('{')) {
          ostatniBlad = new Error(`${serwer}: odpowiedź nie jest JSON-em (limit tempa lub awaria)`)
          continue
        }
        return JSON.parse(tekst)
      } catch (blad) {
        ostatniBlad = blad
      }
    }
  }
  throw ostatniBlad ?? new Error('Overpass niedostępny')
}

const main = async () => {
  console.error('[i10] pobieram miejscowości z OSM (relacja %d)…', RELACJA_GMINY)

  const dane = await zapytajOverpass(`[out:json][timeout:90];
rel(${RELACJA_GMINY}); map_to_area->.g;
node["place"](area.g);
out body;`)

  const miejsca = (dane.elements ?? [])
    .filter((e) => e.tags?.name && typeof e.lat === 'number')
    .map((e) => ({ nazwa: e.tags.name, rodzaj: e.tags.place, lat: e.lat, lon: e.lon, osmId: e.id }))

  console.error('[i10] OSM zwrócił %d miejscowości w granicy gminy', miejsca.length)

  const indeks = new Map()
  for (const m of miejsca) {
    // Pierwsze trafienie wygrywa: przy duplikacie nazwy (np. „Zagrodnica"
    // jako hamlet i jako neighbourhood) wybieramy wpis o typie bliższym
    // samodzielnej wsi.
    const klucz = norm(m.nazwa)
    const obecny = indeks.get(klucz)
    const rangaTypu = (t) => ({ village: 0, town: 1, hamlet: 2, isolated_dwelling: 3, farm: 4, neighbourhood: 5 }[t] ?? 9)
    if (!obecny || rangaTypu(m.rodzaj) < rangaTypu(obecny.rodzaj)) indeks.set(klucz, m)
  }

  const wynik = []
  const nieznalezione = []

  for (const nazwa of SOLECTWA_WIKIPEDIA) {
    const trafienie = indeks.get(norm(nazwa))
    if (!trafienie) {
      nieznalezione.push(nazwa)
      continue
    }
    wynik.push({
      slug: slugify(nazwa),
      nazwa,
      lat: Number(trafienie.lat.toFixed(6)),
      lon: Number(trafienie.lon.toFixed(6)),
      rodzajOsm: trafienie.rodzaj,
      osmId: trafienie.osmId,
      solectwo: true,
    })
  }

  const siedziba = indeks.get(norm(SIEDZIBA.nazwa))
  if (siedziba) {
    wynik.unshift({
      slug: slugify(SIEDZIBA.nazwa),
      nazwa: SIEDZIBA.nazwa,
      lat: Number(siedziba.lat.toFixed(6)),
      lon: Number(siedziba.lon.toFixed(6)),
      rodzajOsm: siedziba.rodzaj,
      osmId: siedziba.osmId,
      solectwo: false,
      siedzibaGminy: true,
    })
  }

  if (nieznalezione.length > 0) {
    // Rozbieżność między źródłami zatrzymuje skrypt. Wpisanie części
    // sołectw bez współrzędnych dałoby mapę z dziurami, o których nikt
    // by nie wiedział.
    console.error('[i10] BŁĄD: brak w OSM dla: %s', nieznalezione.join(', '))
    process.exit(1)
  }

  const wszystkieWGranicy = miejsca
    .map((m) => ({ nazwa: m.nazwa, rodzaj: m.rodzaj, lat: m.lat, lon: m.lon }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))

  const paczka = {
    zrodla: {
      listaSolectw: 'Wikipedia (pl), „Izbica Kujawska (gmina)", sekcja Sołectwa',
      wspolrzedne: `OpenStreetMap / Overpass, relacja ${RELACJA_GMINY} (TERYT 0418083)`,
      licencjaOsm: 'ODbL — wymagane oznaczenie „© OpenStreetMap contributors"',
    },
    wygenerowano: new Date().toISOString(),
    liczbaSolectw: wynik.filter((w) => w.solectwo).length,
    punkty: wynik,
    /** Wszystkie miejscowości w granicy — do wyszukiwania i podpowiedzi. */
    wszystkieMiejscowosci: wszystkieWGranicy,
  }

  if (!existsSync(dirname(WYJSCIE))) mkdirSync(dirname(WYJSCIE), { recursive: true })
  writeFileSync(WYJSCIE, JSON.stringify(paczka, null, 2) + '\n', 'utf8')

  console.error('[i10] zapisano %s', WYJSCIE)
  console.error('[i10] sołectw ze współrzędnymi: %d, miejscowości ogółem: %d',
    paczka.liczbaSolectw, wszystkieWGranicy.length)
}

main().catch((blad) => {
  console.error('[i10] nieudane:', blad)
  process.exit(1)
})
