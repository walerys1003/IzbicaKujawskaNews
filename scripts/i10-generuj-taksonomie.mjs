/**
 * Etap I10 — podmiana stałej SOLECTWA w `src/v4/taxonomy.ts`
 * na listę ustaloną ze źródeł (data/solectwa-osm.json).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO SKRYPT, A NIE RĘCZNA EDYCJA
 * ═══════════════════════════════════════════════════════════════════════
 * Wymieniamy 34 wpisy na 36 innych, z czego 16 starych znika, a 18 nowych
 * dochodzi. Przy ręcznym przepisywaniu wystarczy jedna literówka w slugu,
 * żeby powstała podstrona bez artykułów i bez możliwości dotarcia do niej
 * z listy — awaria cicha, wychodząca po tygodniach.
 *
 * Skrypt bierze slugi z tego samego pliku, z którego generowana jest
 * migracja bazy (0055) i mapa. Trzy miejsca, jedno źródło — nie mogą
 * się rozjechać.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CO Z POLEM `articleCount`
 * ═══════════════════════════════════════════════════════════════════════
 * Stara tablica miała wpisane liczby (12, 8, 15…). Były wymyślone: żaden
 * artykuł w bazie nie ma ustawionego `solectwo_slug` (sprawdzone
 * zapytaniem — 0 wierszy), a mimo to strona pokazywała „Sadłno · 12
 * materiałów". Liczba widoczna przy nazwie wsi to obietnica wobec
 * czytelnika; kliknięcie prowadziło do pustej listy.
 *
 * Ustawiamy 0 dla wszystkich. Liczba ma być wyliczana z bazy, nie wpisana.
 * Zero jest tu informacją prawdziwą: o tych wsiach faktycznie nie ma
 * jeszcze materiałów.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLIK_DANYCH = resolve(KORZEN, 'data/solectwa-osm.json')
const PLIK_TAKSONOMII = resolve(KORZEN, 'src/v4/taxonomy.ts')

const dane = JSON.parse(readFileSync(PLIK_DANYCH, 'utf8'))
const solectwa = dane.punkty.filter((p) => p.solectwo)

if (solectwa.length < 30) {
  console.error('[i10] Za mało sołectw w danych (%d). Przerywam — nie nadpisuję taksonomii.', solectwa.length)
  process.exit(1)
}

const zrodlo = readFileSync(PLIK_TAKSONOMII, 'utf8')

const znacznikStart = 'export const SOLECTWA: Solectwo[] = ['
const iStart = zrodlo.indexOf(znacznikStart)
if (iStart === -1) {
  console.error('[i10] Nie znalazłem stałej SOLECTWA w taxonomy.ts. Przerywam.')
  process.exit(1)
}
const iKoniec = zrodlo.indexOf('\n]', iStart)
if (iKoniec === -1) {
  console.error('[i10] Nie znalazłem końca tablicy SOLECTWA. Przerywam.')
  process.exit(1)
}

const szerokoscSlug = Math.max(...solectwa.map((s) => s.slug.length)) + 3
const wiersze = solectwa
  .map((s) => {
    const slug = `'${s.slug}',`.padEnd(szerokoscSlug + 1)
    const nazwa = `'${s.nazwa}',`
    return `  { slug: ${slug} name: ${nazwa.padEnd(21)} articleCount: 0, lat: ${s.lat}, lon: ${s.lon} },`
  })
  .join('\n')

const naglowek = `export const SOLECTWA: Solectwo[] = [
  // ══════════════════════════════════════════════════════════════════════
  // LISTA GENEROWANA — nie edytuj ręcznie.
  //   node scripts/i10-generuj-taksonomie.mjs
  // Źródło: data/solectwa-osm.json (Wikipedia + OpenStreetMap).
  //
  // Poprzednia zawartość tej tablicy zawierała 16 nazw, które NIE są
  // sołectwami gminy Izbica Kujawska. Trzy z nich leżą w gminach
  // sąsiednich (Bierzyn i Lubomin — Boniewo, Sarnowo — Lubraniec),
  // pozostałych OpenStreetMap nie zna w tym rejonie. Jednocześnie
  // brakowało 18 sołectw istniejących. Szczegóły i sposób weryfikacji:
  // scripts/i10-geokoduj-solectwa.mjs
  //
  // \`articleCount: 0\` jest prawdą — żaden artykuł nie ma jeszcze
  // ustawionego solectwo_slug. Wcześniejsze liczby były wymyślone
  // i obiecywały czytelnikowi materiały, których nie było.
  //
  // Współrzędne: OpenStreetMap, licencja ODbL. Wyświetlając mapę
  // trzeba pokazać „© OpenStreetMap contributors\" — to warunek licencji.
  // ══════════════════════════════════════════════════════════════════════
${wiersze}`

const nowe = zrodlo.slice(0, iStart) + naglowek + zrodlo.slice(iKoniec)

// Rozszerzenie typu Solectwo o współrzędne — mapa (I10) potrzebuje ich
// także w warstwie renderowanej bez zapytania do bazy.
const nowe2 = nowe.replace(
  /(export interface Solectwo \{[^}]*?)(\n\})/,
  (dopasowanie, wnetrze, koniec) => {
    if (wnetrze.includes('lat')) return dopasowanie
    return `${wnetrze}\n  /** Szerokość geograficzna wsi (OpenStreetMap, ODbL). */\n  lat?: number\n  /** Długość geograficzna wsi (OpenStreetMap, ODbL). */\n  lon?: number${koniec}`
  }
)

writeFileSync(PLIK_TAKSONOMII, nowe2, 'utf8')
console.error('[i10] zaktualizowano %s — %d sołectw', PLIK_TAKSONOMII, solectwa.length)
