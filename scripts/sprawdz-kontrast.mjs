#!/usr/bin/env node
/**
 * F3 / WCAG 1.4.3 — pomiar kontrastu tokenów kolorów.
 *
 * DLACZEGO TO ISTNIEJE JAKO SKRYPT, A NIE JEDNORAZOWE OBLICZENIE
 * ──────────────────────────────────────────────────────────────
 * Audyt z 27.07.2026 znalazł `--c-historia` o kontraście 3,25:1 (norma AA
 * wymaga 4,5:1). Jednorazowa poprawka wartości nie chroni przed powtórzeniem:
 * następna osoba dobierająca kolor działu nie ma jak sprawdzić, czy trafiła
 * w normę — a na oko różnica między 4,2:1 i 4,6:1 jest niewidoczna.
 *
 * Skrypt czyta tokeny WPROST z arkuszy CSS, więc nie da się go oszukać
 * przez zmianę koloru bez zmiany testu. Uruchamiany w CI jako bramka.
 *
 *   node scripts/sprawdz-kontrast.mjs
 *
 * Kod wyjścia: 0 = wszystkie tokeny spełniają normę, 1 = co najmniej jeden nie.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const KATALOG = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Względna luminancja wg WCAG 2.1, wzór 1.4.3. */
const luminancja = (hex) => {
  const c = hex.replace('#', '')
  const pelny = c.length === 3 ? c.split('').map((z) => z + z).join('') : c
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(pelny.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const kontrast = (a, b) => {
  const [jasniejszy, ciemniejszy] = [luminancja(a), luminancja(b)].sort((x, y) => y - x)
  return (jasniejszy + 0.05) / (ciemniejszy + 0.05)
}

/**
 * Wyciąga wartości tokenów z bloku `:root` arkusza.
 * Czytamy plik, a nie listę wpisaną tutaj — inaczej test sprawdzałby
 * swoją własną kopię danych, nie stan projektu.
 */
const wczytajTokeny = (sciezka) => {
  const tresc = readFileSync(join(KATALOG, sciezka), 'utf8')
  const tokeny = {}
  for (const [, nazwa, wartosc] of tresc.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    tokeny[nazwa] = wartosc
  }
  return tokeny
}

/**
 * Tokeny używane jako KOLOR TEKSTU na białym tle albo jako TŁO pod białym
 * tekstem. Norma AA dla tekstu zwykłego to 4,5:1.
 *
 * `--rule` (#e0e0e0) świadomie nie jest tu wymieniony: służy wyłącznie do
 * rysowania linii oddzielających, a dla elementów nietekstowych norma
 * (WCAG 1.4.11) wynosi 3:1 i dotyczy elementów niosących informację —
 * linia dekoracyjna jej nie niesie. Wpisanie go na tę listę wymusiłoby
 * pociemnienie wszystkich obramowań i zmieniło charakter szaty bez zysku
 * dla czytelności.
 */
const DO_SPRAWDZENIA = [
  '--red',
  '--red-dark',
  '--c-news',
  '--c-samorzad',
  '--c-kujawianka',
  '--c-kultura',
  '--c-historia',
  '--c-ludzie',
  '--c-zycie',
  '--c-przeglad',
  '--c-multimedia',
]

const NORMA_AA = 4.5
const BIALY = '#ffffff'

const arkusze = ['public/static/v4/izbica-v4.css', 'public/static/style.css']

let bledy = 0
for (const arkusz of arkusze) {
  const tokeny = wczytajTokeny(arkusz)
  console.log(`\n=== ${arkusz} ===`)
  for (const nazwa of DO_SPRAWDZENIA) {
    const wartosc = tokeny[nazwa]
    if (!wartosc) continue
    const wynik = kontrast(wartosc, BIALY)
    const zdane = wynik >= NORMA_AA
    if (!zdane) bledy++
    console.log(
      `  ${zdane ? '✅' : '❌'} ${nazwa.padEnd(16)} ${wartosc}  ${wynik.toFixed(2)}:1` +
        (zdane ? '' : `  ← wymagane ${NORMA_AA}:1`),
    )
  }
}

if (bledy > 0) {
  console.error(`\n❌ ${bledy} token(ow) nie spelnia normy WCAG 2.1 AA (4,5:1 na bialym tle).`)
  process.exit(1)
}
console.log('\n✅ Wszystkie sprawdzane tokeny spelniaja norme WCAG 2.1 AA.')
