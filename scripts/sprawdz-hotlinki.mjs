#!/usr/bin/env node
/**
 * Etap I11 — regula CI blokujaca hotlinki do zewnetrznych zasobow graficznych.
 *
 * Podmiana 51 adresow jednorazowo nie rozwiazuje problemu: nastepny redaktor
 * albo nastepna sesja pracy nad kodem wklei kolejny adres z Unsplash, bo tak
 * jest szybciej. Bez automatycznej bramki wracamy do stanu wyjsciowego w
 * ciagu kilku tygodni.
 *
 * Skrypt konczy sie kodem 1, gdy znajdzie zabroniony adres w kodzie zrodlowym.
 * Uruchamiany w GitHub Actions oraz recznie:  npm run check:hotlinks
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const KATALOGI = ['src', 'public/static/js', 'public/static']
const ROZSZERZENIA = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html'])

const POMIJANE = [
  'node_modules',
  'dist',
  '.wrangler',
  '.git',
  'public/static/img',
  'public/static/images',
  'public/downloads',
]

/**
 * Domeny zabronione dla zasobow osadzanych w stronie.
 *
 * Uwaga o zakresie: blokujemy HOSTING OBRAZOW, nie kazda domene zewnetrzna.
 * CDN bibliotek (cdn.jsdelivr.net, cdn.tailwindcss.com) jest dopuszczony,
 * bo skrypt biblioteki nie jest utworem chronionym w tym sensie i nie
 * przekazuje adresu IP czytelnika w celu profilowania tresci.
 */
const ZABRONIONE = [
  { wzorzec: /images\.unsplash\.com/i, powod: 'Unsplash — hotlink bez licencji i przekazanie IP czytelnika' },
  { wzorzec: /source\.unsplash\.com/i, powod: 'Unsplash (source) — hotlink bez licencji' },
  { wzorzec: /picsum\.photos/i, powod: 'picsum.photos — zasob zastepczy, nie moze trafic na produkcje' },
  { wzorzec: /via\.placeholder\.com/i, powod: 'placeholder.com — zasob zastepczy' },
  { wzorzec: /placehold\.(co|it)/i, powod: 'placehold — zasob zastepczy' },
  { wzorzec: /interactive-examples\.mdn\.mozilla\.net/i, powod: 'MDN — zasoby przykladowe, hotlink zabroniony regulaminem' },
  { wzorzec: /loremflickr\.com/i, powod: 'LoremFlickr — zasob zastepczy' },
  { wzorzec: /dummyimage\.com/i, powod: 'dummyimage — zasob zastepczy' },
  { wzorzec: /i\.imgur\.com/i, powod: 'Imgur — hotlink zabroniony regulaminem' },
  { wzorzec: /gettyimages\.[a-z.]+/i, powod: 'Getty Images — licencja komercyjna, uzycie bez umowy jest naruszeniem' },
  { wzorzec: /shutterstock\.com/i, powod: 'Shutterstock — licencja komercyjna' },
  { wzorzec: /alamy\.com/i, powod: 'Alamy — licencja komercyjna' },
  { wzorzec: /istockphoto\.com/i, powod: 'iStock — licencja komercyjna' },
  { wzorzec: /stock\.adobe\.com/i, powod: 'Adobe Stock — licencja komercyjna' },
]

/**
 * Wyjatki. Kazdy wymaga uzasadnienia w komentarzu — lista bez uzasadnien
 * rozrasta sie, az reguła przestaje cokolwiek blokowac.
 */
const WYJATKI = [
  // Skrypt podmieniajacy adresy MUSI zawierac wzorce, ktorych szuka.
  'scripts/i11-usun-obrazy-zewnetrzne.mjs',
  // Ten plik zawiera liste zabronionych domen z definicji.
  'scripts/sprawdz-hotlinki.mjs',
  // Dokumentacja audytu cytuje znalezione adresy jako dowod.
  'docs/',
  'TODO-590.md',
  'TODO-590-AUDYT.md',
]

const czyPominac = (sciezka) => {
  const rel = relative(ROOT, sciezka).replace(/\\/g, '/')
  if (POMIJANE.some((p) => rel === p || rel.startsWith(`${p}/`))) return true
  if (WYJATKI.some((w) => rel === w || rel.startsWith(w))) return true
  return false
}

const zbierzPliki = (katalog, wynik = []) => {
  let wpisy
  try {
    wpisy = readdirSync(katalog, { withFileTypes: true })
  } catch {
    return wynik
  }
  for (const wpis of wpisy) {
    const pelna = join(katalog, wpis.name)
    if (czyPominac(pelna)) continue
    if (wpis.isDirectory()) {
      zbierzPliki(pelna, wynik)
    } else if (ROZSZERZENIA.has(extname(wpis.name))) {
      wynik.push(pelna)
    }
  }
  return wynik
}

const naruszenia = []
let sprawdzonych = 0

for (const katalog of KATALOGI) {
  const pelny = join(ROOT, katalog)
  try {
    statSync(pelny)
  } catch {
    continue
  }
  for (const plik of zbierzPliki(pelny)) {
    sprawdzonych += 1
    const linie = readFileSync(plik, 'utf8').split('\n')
    linie.forEach((linia, index) => {
      for (const reguła of ZABRONIONE) {
        if (reguła.wzorzec.test(linia)) {
          naruszenia.push({
            plik: relative(ROOT, plik).replace(/\\/g, '/'),
            linia: index + 1,
            powod: reguła.powod,
            fragment: linia.trim().slice(0, 120),
          })
        }
      }
    })
  }
}

console.log(`[hotlinki] Sprawdzono plikow: ${sprawdzonych}`)

if (naruszenia.length === 0) {
  console.log('[hotlinki] ✅ Brak zabronionych adresow zewnetrznych.')
  process.exit(0)
}

console.error(`\n[hotlinki] ❌ Znaleziono ${naruszenia.length} zabronionych adresow:\n`)
for (const n of naruszenia) {
  console.error(`  ${n.plik}:${n.linia}`)
  console.error(`    Powod: ${n.powod}`)
  console.error(`    Kod:   ${n.fragment}\n`)
}
console.error('Zasoby graficzne musza pochodzic z /static/img/... lub z R2 (/media/...).')
console.error('Powod: hotlink to uzycie utworu bez licencji oraz przekazanie adresu IP')
console.error('czytelnika zewnetrznej firmie bez jego zgody (RODO, art. 6).')
process.exit(1)
