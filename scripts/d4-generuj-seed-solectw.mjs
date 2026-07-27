/**
 * Etap D4 (seed) + przygotowanie I10 — generowanie SQL dla 34 sołectw.
 *
 * Lista sołectw jest już zapisana w jednym miejscu: src/v4/taxonomy.ts
 * (stała SOLECTWA). Ten skrypt CZYTA ją i z niej generuje SQL, zamiast
 * przepisywać nazwy ręcznie do pliku .sql.
 *
 * Dlaczego to ma znaczenie: przy 34 nazwach z polskimi znakami (Mchówek,
 * Świętosławice, Bartłomiejowice, Wólka Komorowska) ręczne przepisanie
 * gwarantuje literówkę, a literówka w nazwie sołectwa jest szczególnie
 * kosztowna — etap AI9 ma sprawdzać nazwy miejscowości w tekstach
 * artykułów właśnie względem tej tabeli. Błędna nazwa w bazie oznacza
 * albo fałszywe ostrzeżenie przy każdym poprawnym artykule, albo
 * przepuszczanie prawdziwego błędu. Jedno źródło prawdy usuwa ten problem.
 *
 * Uruchomienie:
 *   node scripts/d4-generuj-seed-solectw.mjs > migrations/0053_seed_solectwa.sql
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const KATALOG = dirname(fileURLToPath(import.meta.url))
const PLIK_TAKSONOMII = join(KATALOG, '..', 'src', 'v4', 'taxonomy.ts')

const zrodlo = readFileSync(PLIK_TAKSONOMII, 'utf8')

// Wyciągamy wyłącznie blok SOLECTWA — nie parsujemy całego pliku, bo
// zawiera też kategorie i tagi o tym samym kształcie obiektu.
const blok = zrodlo.match(/export const SOLECTWA: Solectwo\[\] = \[([\s\S]*?)\n\]/)
if (!blok) {
  console.error('BŁĄD: nie znaleziono bloku SOLECTWA w src/v4/taxonomy.ts.')
  console.error('Jeśli stała została przeniesiona lub zmieniła nazwę, popraw ten skrypt —')
  console.error('nie wpisuj nazw sołectw ręcznie do pliku SQL.')
  process.exit(1)
}

const solectwa = [...blok[1].matchAll(/\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*articleCount:\s*(\d+)\s*\}/g)].map(
  (m) => ({ slug: m[1], name: m[2], articleCount: Number.parseInt(m[3], 10) }),
)

if (solectwa.length !== 34) {
  console.error(`BŁĄD: odczytano ${solectwa.length} sołectw, oczekiwano 34.`)
  console.error('Gmina Izbica Kujawska ma 34 sołectwa. Rozbieżność oznacza, że')
  console.error('albo lista w taxonomy.ts jest niekompletna, albo wyrażenie')
  console.error('dopasowujące w tym skrypcie przestało pasować do jej zapisu.')
  process.exit(1)
}

/**
 * Sołtysi — pola celowo NULL.
 *
 * Nie wpisujemy wymyślonych nazwisk. Sołtys to funkcja publiczna konkretnej
 * osoby; wygenerowane nazwisko na stronie gminnej to nieprawdziwa informacja
 * o rzeczywistej osobie, którą mieszkańcy wzięliby za prawdziwą i pod którą
 * próbowaliby się zgłaszać ze sprawami. Pole zostaje puste do czasu
 * uzupełnienia z wykazu Urzędu Miejskiego w Izbicy Kujawskiej.
 */

/**
 * Współrzędne — potrzebne w etapie I10 (mapa sołectw).
 *
 * Wpisane są WYŁĄCZNIE współrzędne samej Izbicy Kujawskiej (52.4247 N,
 * 18.7561 E), która jest udokumentowana. Dla pozostałych 33 miejscowości
 * pola pozostają NULL — przybliżone albo zgadnięte współrzędne postawiłyby
 * pinezkę wsi w cudzym polu lub w innej gminie, a czytelnik traktuje
 * pozycję na mapie jako fakt. Kolumny powstają teraz, żeby I10 mógł je
 * tylko uzupełnić danymi z rejestru PRNG/OSM, bez kolejnej migracji.
 */
const WSPOLRZEDNE = {
  // slug: [szerokosc, dlugosc]
}

const esc = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const numOrNull = (v) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : 'NULL')

const linie = []
linie.push('-- =====================================================================')
linie.push('-- 0053 — seed 34 sołectw gminy Izbica Kujawska + kolumny dla mapy (I10)')
linie.push('--')
linie.push('-- PLIK GENEROWANY. Nie edytuj ręcznie.')
linie.push('-- Źródło nazw: src/v4/taxonomy.ts (stała SOLECTWA).')
linie.push('-- Ponowne wygenerowanie:')
linie.push('--   node scripts/d4-generuj-seed-solectw.mjs > migrations/0053_seed_solectwa.sql')
linie.push('--')
linie.push('-- Pola `soltys`, `latitude` i `longitude` są celowo NULL — patrz komentarz')
linie.push('-- w skrypcie generującym. Nie wypełniaj ich danymi przybliżonymi.')
linie.push('-- =====================================================================')
linie.push('')
linie.push('-- Kolumny pod mapę sołectw (etap I10) oraz opis miejscowości.')
linie.push('ALTER TABLE solectwa ADD COLUMN latitude REAL;')
linie.push('ALTER TABLE solectwa ADD COLUMN longitude REAL;')
linie.push('ALTER TABLE solectwa ADD COLUMN population INTEGER;')
linie.push('ALTER TABLE solectwa ADD COLUMN area_ha REAL;')
linie.push('ALTER TABLE solectwa ADD COLUMN description TEXT;')
linie.push('ALTER TABLE solectwa ADD COLUMN updated_at DATETIME;')
linie.push('')
linie.push('-- INSERT OR IGNORE, bo migracja może zostać uruchomiona na bazie,')
linie.push('-- w której redakcja już dopisała sołectwo ręcznie — nadpisanie')
linie.push('-- skasowałoby wtedy wpisane nazwisko sołtysa.')
linie.push('INSERT OR IGNORE INTO solectwa (slug, name, soltys, news_count, latitude, longitude) VALUES')

const wiersze = solectwa.map((s, i) => {
  const wsp = WSPOLRZEDNE[s.slug] ?? [null, null]
  const przecinek = i === solectwa.length - 1 ? ';' : ','
  return `  (${esc(s.slug)}, ${esc(s.name)}, NULL, ${s.articleCount}, ${numOrNull(wsp[0])}, ${numOrNull(wsp[1])})${przecinek}`
})
linie.push(...wiersze)
linie.push('')
linie.push('CREATE INDEX IF NOT EXISTS idx_solectwa_name ON solectwa(name);')
linie.push('')
linie.push(`-- Wygenerowano ${solectwa.length} sołectw.`)

process.stdout.write(linie.join('\n') + '\n')
process.stderr.write(`OK — wygenerowano ${solectwa.length} sołectw z src/v4/taxonomy.ts\n`)
