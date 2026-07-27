#!/usr/bin/env node
/**
 * Etap I11 — zastapienie obrazow zewnetrznych zasobami wlasnymi.
 *
 * KONTEKST, KTORY ZMIENIA ZAKRES ZADANIA
 *
 * Audyt policzyl 51 adresow zewnetrznych (45 Unsplash + 4 picsum + 2 MDN).
 * Weryfikacja pokazala, ze WSZYSTKIE znajduja sie w danych pozornych warstwy
 * v3 (`src/data.ts`, `src/data-articles.ts`) oraz w przykladach w schematach
 * walidacji. Zywa skora v4 (`src/v4/content-db.ts`) uzywa wylacznie sciezek
 * lokalnych `/static/img/v4/...`.
 *
 * To NIE zmniejsza wagi problemu. Trasy v3 sa nadal zamontowane w index.tsx
 * (`/tag/:slug`, `/archiwum/wiadomosci/:slug`, `/archiwum/szukaj`,
 * kategorie v3), wiec czytelnik, ktory na nie trafi, pobiera obrazy z serwera
 * Unsplash. Konsekwencje:
 *   • hotlink bez licencji — ryzyko prawne po stronie wydawcy,
 *   • adres IP czytelnika trafia do zewnetrznej firmy bez zgody (RODO),
 *   • zmiana po stronie Unsplash psuje portal bez naszego udzialu.
 *
 * Skrypt podmienia adresy na lokalne, dobierajac obraz po temacie (kategoria
 * lub slowo kluczowe w kontekscie), a nie losowo — losowy przydzial dawalby
 * zdjecie strazy pozarnej przy artykule o bibliotece.
 *
 * Uzycie:  node scripts/i11-usun-obrazy-zewnetrzne.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry-run')

const PLIKI = [
  'src/data.ts',
  'src/data-articles.ts',
  'src/lib/media/gallery-store.ts',
  'src/lib/validation/schemas/media.ts',
  'src/renderer.tsx',
  'src/routes/v1/gallery-create.ts',
]

/** Wzorce adresow zewnetrznych, ktore musza zniknac. */
const WZORCE = [
  /https?:\/\/images\.unsplash\.com\/[^'"`\s)]+/g,
  /https?:\/\/source\.unsplash\.com\/[^'"`\s)]+/g,
  /https?:\/\/(?:www\.)?unsplash\.com\/[^'"`\s)]+/g,
  /https?:\/\/picsum\.photos\/[^'"`\s)]+/g,
  /https?:\/\/(?:interactive-examples\.mdn\.mozilla\.net|developer\.mozilla\.org)\/[^'"`\s)]+/g,
  /https?:\/\/via\.placeholder\.com\/[^'"`\s)]+/g,
  /https?:\/\/placehold\.(?:co|it)\/[^'"`\s)]+/g,
]

/**
 * Mapa tematyczna: slowo w otoczeniu adresu → katalog lokalnych zdjec.
 * Kolejnosc ma znaczenie — pierwsze trafienie wygrywa, wiec bardziej
 * szczegolowe pojecia stoja przed ogolnymi.
 */
const TEMATY = [
  { klucze: ['pozar', 'straz', 'osp', 'wypadek', 'policja', 'sygnale', 'interwencj', 'awari'], katalog: 'nasygnale' },
  { klucze: ['kujawianka', 'mecz', 'sport', 'pilka', 'stadion', 'trening'], katalog: 'v4', prefiks: '04-kujawianka' },
  { klucze: ['sesja', 'rada', 'urzad', 'samorzad', 'burmistrz', 'budzet', 'uchwal'], katalog: 'v4', prefiks: '03-sesja' },
  { klucze: ['szkol', 'edukacj', 'uczen', 'nauczyciel', 'przedszkol', 'konkurs'], katalog: 'edukacja' },
  { klucze: ['zdrowi', 'lekarz', 'przychodni', 'szpital', 'spzoz', 'pielegniar', 'apteka'], katalog: 'zdrowie' },
  { klucze: ['kultur', 'koncert', 'biblioteka', 'mgck', 'teatr', 'wystaw', 'festiwal'], katalog: 'kultura' },
  { klucze: ['histori', 'zabytek', 'megalit', 'wietrzychowic', 'archeolog', 'dzieje', 'piramid'], katalog: 'historia' },
  { klucze: ['inwestycj', 'remont', 'budow', 'droga', 'wodociag', 'kanalizacj', 'ulica'], katalog: 'inwestycje' },
  { klucze: ['srodowisk', 'odpad', 'smiec', 'ekolog', 'powietrz', 'segregacj'], katalog: 'srodowisko' },
  { klucze: ['rolnictw', 'pole', 'zniw', 'plon', 'rzepak', 'traktor', 'gospodarstw', 'arimr'], katalog: 'v4', prefiks: '07-rolnictwo' },
  { klucze: ['ludzi', 'wywiad', 'portret', 'sylwetk', 'mieszkan', 'rozmow'], katalog: 'ludzie' },
  { klucze: ['solectw', 'wies', 'swietlic', 'pasiek', 'sadln', 'blenna'], katalog: 'solectwa' },
  { klucze: ['ogloszen', 'nekrolog', 'praca', 'nieruchomosc', 'sprzedam', 'wynajm'], katalog: 'ogloszenia' },
  { klucze: ['kalendarz', 'wydarzeni', 'impreza', 'zaprosz'], katalog: 'kalendarz' },
  { klucze: ['zycie', 'poradnik', 'dom', 'turystyk', 'pogoda', 'rower'], katalog: 'zycie' },
  { klucze: ['opini', 'komentarz', 'felieton', 'polemik'], katalog: 'opinie' },
  { klucze: ['wiadomosc', 'aktualnosc', 'komunikat', 'informacj'], katalog: 'wiadomosci' },
]

const KATALOG_ZAPASOWY = 'wiadomosci'

/** Wczytanie faktycznie dostepnych plikow — nie zgadujemy nazw. */
const zbierzZasoby = () => {
  const baza = join(ROOT, 'public/static/img')
  const mapa = new Map()
  for (const katalog of readdirSync(baza, { withFileTypes: true })) {
    if (!katalog.isDirectory()) continue
    const pliki = readdirSync(join(baza, katalog.name))
      .filter((f) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
      // .jpg jako zrodlo: <picture> dobierze webp/avif, a .jpg dziala wszedzie
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort()
    if (pliki.length > 0) mapa.set(katalog.name, pliki)
  }
  return mapa
}

const ZASOBY = zbierzZasoby()

/** Licznik per katalog — rozklada zdjecia rownomiernie zamiast powtarzac jedno. */
const licznik = new Map()

const wybierz = (katalog, prefiks) => {
  let pliki = ZASOBY.get(katalog) ?? ZASOBY.get(KATALOG_ZAPASOWY) ?? []
  let uzytyKatalog = ZASOBY.has(katalog) ? katalog : KATALOG_ZAPASOWY
  if (prefiks) {
    const dopasowane = pliki.filter((f) => f.startsWith(prefiks))
    if (dopasowane.length > 0) pliki = dopasowane
  }
  if (pliki.length === 0) return null
  const klucz = `${uzytyKatalog}:${prefiks ?? ''}`
  const i = licznik.get(klucz) ?? 0
  licznik.set(klucz, i + 1)
  return `/static/img/${uzytyKatalog}/${pliki[i % pliki.length]}`
}

/**
 * Kontekst = 400 znakow przed adresem. Tytul, kategoria i slug artykulu
 * znajduja sie w tym samym literale obiektu, wiec to wystarcza, zeby
 * rozpoznac temat bez parsowania TypeScriptu.
 */
const dopasujTemat = (kontekst) => {
  const tekst = kontekst
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
  for (const temat of TEMATY) {
    if (temat.klucze.some((k) => tekst.includes(k))) return temat
  }
  return null
}

let zamienione = 0
let pominiete = 0
const raport = []

for (const relatywna of PLIKI) {
  const sciezka = join(ROOT, relatywna)
  if (!existsSync(sciezka)) {
    raport.push(`  POMINIETO ${relatywna} — plik nie istnieje`)
    continue
  }
  const oryginal = readFileSync(sciezka, 'utf8')
  let tresc = oryginal
  let wPliku = 0

  for (const wzorzec of WZORCE) {
    tresc = tresc.replace(new RegExp(wzorzec.source, 'g'), (dopasowanie, offset, calosc) => {
      const kontekst = calosc.slice(Math.max(0, offset - 400), offset)
      const temat = dopasujTemat(kontekst)
      const zastepstwo = wybierz(temat?.katalog ?? KATALOG_ZAPASOWY, temat?.prefiks)
      if (!zastepstwo) {
        pominiete += 1
        return dopasowanie
      }
      zamienione += 1
      wPliku += 1
      return zastepstwo
    })
  }

  if (wPliku > 0) {
    raport.push(`  ${relatywna}: ${wPliku} adresow`)
    if (!DRY) writeFileSync(sciezka, tresc, 'utf8')
  }
}

console.log(DRY ? '=== TRYB PROBNY (bez zapisu) ===' : '=== ZAPIS WYKONANY ===')
console.log(raport.join('\n') || '  brak zmian')
console.log(`\nZamienionych adresow: ${zamienione}`)
if (pominiete > 0) console.log(`Pominietych (brak zasobu lokalnego): ${pominiete}`)
console.log(`Dostepnych katalogow zdjec: ${ZASOBY.size}, plikow: ${[...ZASOBY.values()].reduce((a, b) => a + b.length, 0)}`)

// Kod wyjscia rozny od zera przy pominieciach — CI ma sie na tym potknac,
// zamiast raportowac sukces przy niedokonczonej podmianie.
process.exit(pominiete > 0 ? 1 : 0)
