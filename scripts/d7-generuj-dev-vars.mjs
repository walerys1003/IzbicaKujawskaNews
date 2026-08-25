#!/usr/bin/env node
/**
 * Generator pliku `.dev.vars` dla pracy lokalnej.
 *
 * PO CO
 * -----
 * `wrangler pages dev` czyta sekrety z `.dev.vars`. Plik jest w `.gitignore`,
 * wiec po swiezym klonie repozytorium go nie ma — a brak `JWT_SECRET` objawia
 * sie jako HTTP 503 na `/admin` z komunikatem "brak konfiguracji
 * uwierzytelniania". Przyczyna nie jest oczywista: kod jest poprawny, panel
 * ODMAWIA dostepu celowo (fail-closed), bo nie ma czym podpisac sesji.
 *
 * Ten skrypt zamyka luke miedzy dokumentacja (docs/05-INTEGRACJE.md, etap I3)
 * a stanem katalogu roboczego — jednym poleceniem, bez recznego wklejania
 * wynikow `openssl rand`.
 *
 * DLACZEGO NIE WPISUJEMY SEKRETU NA STALE W KOD
 * ---------------------------------------------
 * Sekret zaszyty w repozytorium jest sekretem publicznym. Tokeny sesji panelu
 * podpisane znana wartoscia da sie podrobic, wiec taki `JWT_SECRET` jest
 * gorszy niz jego brak: brak jest widoczny (503), a slaby sekret wyglada jak
 * dzialajace zabezpieczenie. Dlatego kazde uruchomienie losuje nowe wartosci
 * z `crypto.randomBytes`.
 *
 * BEZPIECZNIKI
 * ------------
 * - istniejacy `.dev.vars` NIE jest nadpisywany bez `--force` (nadpisanie
 *   wylogowaloby wszystkie sesje i skasowaloby recznie wpisane klucze API);
 * - uzupelniane sa tylko WYMAGANE zmienne; opcjonalne zostaja puste, zeby
 *   nie udawac, ze integracja jest skonfigurowana;
 * - plik dostaje prawa 0600 — w sandboksie katalog projektu bywa czytany
 *   przez inne procesy.
 *
 * UZYCIE
 * ------
 *   node scripts/d7-generuj-dev-vars.mjs            # utworz, jesli nie ma
 *   node scripts/d7-generuj-dev-vars.mjs --force    # nadpisz istniejacy
 *   node scripts/d7-generuj-dev-vars.mjs --print    # tylko wypisz na stdout
 */

import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const KATALOG_PROJEKTU = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLIK_DOCELOWY = join(KATALOG_PROJEKTU, '.dev.vars')

const argumenty = process.argv.slice(2)
const force = argumenty.includes('--force')
const tylkoWypisz = argumenty.includes('--print')

/** Losowy szesnastkowy sekret o zadanej liczbie bajtow. */
const sekret = (bajty) => randomBytes(bajty).toString('hex')

/**
 * Zmienne WYMAGANE do uruchomienia panelu redakcyjnego.
 * Kazda ma komentarz wyjasniajacy skutek jej braku — plik `.dev.vars` czyta
 * czlowiek, ktory wlasnie zobaczyl 503 i szuka przyczyny.
 */
const wymagane = () => [
  {
    klucz: 'JWT_SECRET',
    wartosc: sekret(32),
    opis: [
      'Podpis tokenow sesji panelu redakcyjnego (src/lib/auth/panel-session.ts).',
      'Brak tej zmiennej celowo blokuje /admin (HTTP 503, fail-closed) — bez niej',
      'nie ma czym podpisac sesji, a przydzielanie roli admina "na czas developmentu"',
      'otwieralo panel dla kazdego zadania.',
    ],
  },
  {
    klucz: 'IP_HASH_SALT',
    wartosc: sekret(16),
    opis: [
      'Sol do haszowania adresow IP w logach i limitach zadan. Bez niej adresy',
      'zapisuja sie jawnie albo z przewidywalnym haszem, ktory da sie odwrocic',
      'przez sprawdzenie wszystkich adresow IPv4.',
    ],
  },
  {
    klucz: 'ENVIRONMENT',
    wartosc: 'development',
    opis: [
      'Nazwa srodowiska. "development" wlacza podpowiedzi diagnostyczne;',
      'na produkcji musi byc "production".',
    ],
  },
]

/**
 * Zmienne OPCJONALNE — zostawiamy puste. Wypelnienie ich atrapa sprawialoby,
 * ze integracja wyglada na skonfigurowana i zawodzi dopiero przy wywolaniu
 * zewnetrznego API, z bledem trudniejszym do powiazania z przyczyna.
 */
const opcjonalne = [
  { klucz: 'OPENAI_API_KEY', opis: 'Modele jezykowe. Bez klucza trasy AI zwracaja 503.' },
  { klucz: 'ANTHROPIC_API_KEY', opis: 'Alternatywny dostawca modeli jezykowych.' },
  { klucz: 'RESEND_API_KEY', opis: 'Wysylka poczty: newsletter, weryfikacja adresu, reset hasla.' },
  { klucz: 'VAPID_PUBLIC_KEY', opis: 'Powiadomienia push. Generowanie: npx web-push generate-vapid-keys' },
  { klucz: 'VAPID_PRIVATE_KEY', opis: 'Klucz prywatny pary VAPID.' },
  { klucz: 'TURNSTILE_SECRET_KEY', opis: 'Cloudflare Turnstile — ochrona formularzy przed automatami.' },
  { klucz: 'BACKUP_ENCRYPTION_KEY', opis: 'Szyfrowanie kopii zapasowych bazy.' },
]

const zbudujTresc = () => {
  const linie = [
    '# =============================================================================',
    '# .dev.vars — sekrety dla `wrangler pages dev` (TYLKO praca lokalna)',
    '# =============================================================================',
    '#',
    '# Plik wygenerowany przez `npm run dev:secrets`. Jest w .gitignore i NIE moze',
    '# trafic do repozytorium. Wartosci sa losowe i wazne wylacznie na tej maszynie.',
    '#',
    '# Na produkcji sekrety ustawia sie poleceniem:',
    '#   npx wrangler pages secret put JWT_SECRET --project-name izbica24-portal',
    '#',
    `# Wygenerowano: ${new Date().toISOString()}`,
    '# =============================================================================',
    '',
    '',
    '# --- WYMAGANE ----------------------------------------------------------------',
    '',
  ]

  for (const { klucz, wartosc, opis } of wymagane()) {
    for (const wiersz of opis) linie.push(`# ${wiersz}`)
    linie.push(`${klucz}=${wartosc}`, '')
  }

  linie.push(
    '',
    '# --- OPCJONALNE: puste = funkcja wylaczona, nie zepsuta ----------------------',
    '',
  )

  for (const { klucz, opis } of opcjonalne) {
    linie.push(`# ${opis}`, `${klucz}=`, '')
  }

  return linie.join('\n')
}

const tresc = zbudujTresc()

if (tylkoWypisz) {
  process.stdout.write(tresc)
  process.exit(0)
}

if (existsSync(PLIK_DOCELOWY) && !force) {
  const obecny = readFileSync(PLIK_DOCELOWY, 'utf8')
  const maSekret = /^JWT_SECRET=.+$/m.test(obecny)
  console.error(`Plik .dev.vars juz istnieje — nie nadpisuje.`)
  console.error(
    maSekret
      ? '  JWT_SECRET jest ustawiony: panel redakcyjny powinien dzialac.'
      : '  UWAGA: JWT_SECRET jest PUSTY — /admin bedzie zwracac 503.',
  )
  console.error('  Nadpisanie (wyloguje wszystkie sesje): --force')
  process.exit(existsSync(PLIK_DOCELOWY) && !maSekret ? 1 : 0)
}

writeFileSync(PLIK_DOCELOWY, tresc, 'utf8')
chmodSync(PLIK_DOCELOWY, 0o600)

console.log('Zapisano .dev.vars (prawa 0600) z nowo wylosowanymi sekretami.')
console.log('Ustawione: JWT_SECRET, IP_HASH_SALT, ENVIRONMENT')
console.log('')
console.log('Restart serwera, zeby wczytal zmienne:')
console.log('  npm run clean-port && npm run dev:sandbox')
console.log('')
console.log('Konta redakcyjne (migracja 0051, hasla znane publicznie — tylko lokalnie):')
console.log('  admin@izbica24.pl      Izbica24!Admin-2026')
console.log('  redaktor@izbica24.pl   Izbica24!Redaktor-2026')
