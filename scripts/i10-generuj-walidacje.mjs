/**
 * Etap I10 — regeneracja stałej SOLECTWA w `src/lib/validation/primitives.ts`
 * z ustalonych danych (data/solectwa-osm.json).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO TA LISTA MA OSOBNY GENERATOR
 * ═══════════════════════════════════════════════════════════════════════
 * W projekcie były TRZY niezależne listy sołectw, każda z inną treścią:
 *
 *   src/v4/taxonomy.ts               34 nazwy (16 nieistniejących)
 *   src/lib/validation/primitives.ts 34 slugi (13 nieistniejących, inne)
 *   src/data.ts                      kolejna wersja
 *
 * Lista w warstwie walidacji jest najgroźniejsza, bo pełni dwie funkcje
 * naraz:
 *
 *   1. `z.enum(SOLECTWA)` — waliduje tag `solectwo` przy zapisie
 *      artykułu. Zawierając nazwy fikcyjne i nie zawierając prawdziwych,
 *      odrzucała poprawne zgłoszenia redakcji („Chociszewo" — błąd
 *      walidacji) i przyjmowała bezsensowne („smolniki" — przechodzi).
 *
 *   2. AI9 — kontrola nazw wymyślonych przez model językowy. Model
 *      generujący tekst o „Smolnikach" przechodził kontrolę, bo slug
 *      był na liście. Narzędzie do wykrywania halucynacji samo
 *      zawierało halucynacje.
 *
 * Stąd generator: obie listy (taksonomia i walidacja) mają wychodzić
 * z jednego pliku danych, a ten z dwóch niezależnych źródeł zewnętrznych.
 *
 * URUCHOMIENIE:
 *   node scripts/i10-generuj-walidacje.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLIK_DANYCH = resolve(KORZEN, 'data/solectwa-osm.json')
const PLIK_DOCELOWY = resolve(KORZEN, 'src/lib/validation/primitives.ts')

const dane = JSON.parse(readFileSync(PLIK_DANYCH, 'utf8'))

// Do walidacji bierzemy wszystkie punkty, także siedzibę gminy:
// „izbica-kujawska" jest poprawną wartością tagu `solectwo`
// (materiał z samego miasta), choć miasto sołectwem nie jest.
const slugi = [...new Set(dane.punkty.map((p) => p.slug))].sort()
const liczbaSolectw = dane.punkty.filter((p) => p.solectwo).length

if (slugi.length < 30) {
  console.error('[i10] Za mało pozycji (%d). Przerywam — nie nadpisuję walidacji.', slugi.length)
  process.exit(1)
}

const zrodlo = readFileSync(PLIK_DOCELOWY, 'utf8')
const iStart = zrodlo.indexOf('export const SOLECTWA = [')
if (iStart === -1) {
  console.error('[i10] Nie znalazłem stałej SOLECTWA w primitives.ts. Przerywam.')
  process.exit(1)
}
const iKoniec = zrodlo.indexOf('] as const', iStart)
if (iKoniec === -1) {
  console.error('[i10] Nie znalazłem końca tablicy. Przerywam.')
  process.exit(1)
}

const blok = `export const SOLECTWA = [
${slugi.map((s) => `  '${s}',`).join('\n')}
] as const`

const nowe = zrodlo.slice(0, iStart) + blok + zrodlo.slice(iKoniec + '] as const'.length)
writeFileSync(PLIK_DOCELOWY, nowe, 'utf8')

console.error('[i10] zaktualizowano %s — %d slugów (%d sołectw + siedziba)',
  PLIK_DOCELOWY, slugi.length, liczbaSolectw)
