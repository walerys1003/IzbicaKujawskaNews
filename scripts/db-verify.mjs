#!/usr/bin/env node
/**
 * FAZA 1 / D3 — Weryfikacja spójności schemy D1
 *
 * ZAKRES ZMIENIONY 2026-07-28. Skrypt powstał, by porównywać siedemnaście
 * plików z `src/db/models/` z rzeczywistą schemą bazy. Katalog usunięto
 * (0 importerów, 0 obecności w zbudowanym workerze), więc porównanie modeli
 * zostało wyjęte — patrz komentarz przy sekcji „Kontrola modeli”.
 *
 * Skrypt NIE został usunięty razem z katalogiem, bo pozostałe kontrole
 * dotyczą samej bazy i wykrywają defekty niewidoczne dla kompilatora:
 * wyzwalacze FTS5, więzy integralności, inwentarz tabel i widoków.
 *
 * Skutek, który wystąpił w praktyce: model `events.ts` deklarował
 * kolumnę `location`, a tabela nazywała ją inaczej, więc `INSERT`
 * kończył się błędem SQLite dopiero w czasie działania — u redaktora,
 * nie u programisty.
 *
 * Skrypt porównuje trzy rzeczy:
 *   1. czy tabela z modelu istnieje w bazie;
 *   2. czy każda kolumna z modelu istnieje w tabeli;
 *   3. czy kolumny NOT NULL bez wartości domyślnej są obecne w modelu
 *      (brak takiej kolumny w liście `INSERT` oznacza nieuchronny błąd
 *      przy zapisie, ale ujawniony tylko przy pierwszej próbie).
 *
 * Uruchomienie:  npm run db:verify
 * Kod wyjścia:   0 — zgodne, 1 — znaleziono rozbieżności.
 */

import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DB_NAME = 'izbica24-production'

const RED = '\u001b[31m'
const GREEN = '\u001b[32m'
const YELLOW = '\u001b[33m'
const DIM = '\u001b[2m'
const OFF = '\u001b[0m'

// ─────────────────────────────────────────────────────────────────────────────
// Odczyt schemy z lokalnej bazy D1
// ─────────────────────────────────────────────────────────────────────────────

const d1 = (sql) => {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, '--local', '--command', sql, '--json'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
  )
  // Wrangler dokłada do wyjścia komunikaty spoza JSON; bierzemy pierwszą tablicę.
  const start = out.indexOf('[')
  if (start < 0) throw new Error('Wrangler nie zwrócił danych JSON.')
  return JSON.parse(out.slice(start))[0].results
}

/**
 * Cała schema jednym zapytaniem, przez funkcję tabelaryczną
 * `pragma_table_info`. Wariant naiwny — `PRAGMA table_info(X)` w pętli —
 * ma dwie wady: wykonuje pięćdziesiąt wywołań wranglera (około minuty),
 * a na tabeli wewnętrznej `_cf_METADATA` kończy się błędem
 * `not authorized: SQLITE_AUTH`, bo PRAGMA na tabelach systemowych
 * Cloudflare jest zablokowany.
 */
const schemaRows = d1(`
  SELECT m.name AS tbl, p.name AS col, p.type AS typ,
         p."notnull" AS nn, p.dflt_value AS def, p.pk AS pk
  FROM sqlite_master m
  JOIN pragma_table_info(m.name) p
  WHERE m.type = 'table'
    AND m.name NOT LIKE 'sqlite_%'
    AND m.name NOT LIKE '_cf_%'
    AND m.name <> 'd1_migrations'
  ORDER BY m.name, p.cid
`)

const schema = new Map()
for (const row of schemaRows) {
  if (!schema.has(row.tbl)) schema.set(row.tbl, new Map())
  schema.get(row.tbl).set(row.col, {
    type: row.typ,
    notNull: Number(row.nn) === 1,
    hasDefault: row.def !== null,
    pk: Number(row.pk) > 0,
  })
}

const tables = [...schema.keys()]

// ─────────────────────────────────────────────────────────────────────────────
// Kontrola modeli — USUNIĘTA razem z `src/db/models/`
// ─────────────────────────────────────────────────────────────────────────────
/*
 * Do 2026-07-28 skrypt czytał siedemnaście plików z `src/db/models/` i
 * porównywał zadeklarowane w nich listy kolumn z rzeczywistą schemą D1.
 * Katalog usunięto (0 importerów, 0 obecności w zbudowanym workerze) na
 * wyraźne polecenie właściciela projektu, więc ta część kontroli nie ma już
 * czego sprawdzać. Historia jest w gicie — porównanie modeli można odtworzyć
 * z commita poprzedzającego usunięcie.
 *
 * CO ZOSTAJE I DLACZEGO: pozostałe kontrole dotyczą samej bazy, nie kodu
 * modeli, i wykrywają defekty niewidoczne dla kompilatora:
 *   • spójność wyzwalaczy FTS5 (indeks pełnotekstowy bez wyzwalaczy cicho
 *     przestaje się aktualizować — wyszukiwanie zwraca stare wyniki),
 *   • PRAGMA foreign_key_check (naruszenia więzów integralności),
 *   • inwentarz tabel, widoków i wyzwalaczy.
 * Dlatego skrypt NIE został usunięty razem z katalogiem.
 */

const errors = []
const warnings = []

// ─────────────────────────────────────────────────────────────────────────────
// Wyzwalacze i widoki — inwentarz kontrolny
// ─────────────────────────────────────────────────────────────────────────────

const triggers = d1("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger' ORDER BY tbl_name, name")
const views = d1("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
const ftsTables = tables.filter((t) => t.endsWith('_fts'))

/**
 * Kontrola spójności wyzwalaczy FTS5: każda tabela wirtualna `X_fts`
 * powinna mieć trzy wyzwalacze na tabeli źródłowej `X` (insert, delete,
 * update). Brak choćby jednego oznacza indeks, który po pewnym czasie
 * przestaje odpowiadać treści — wyszukiwarka zwraca wtedy nieistniejące
 * artykuły albo pomija istniejące, w sposób niemożliwy do odtworzenia.
 */
for (const fts of ftsTables) {
  const base = fts.replace(/_fts$/, '')
  if (!schema.has(base)) continue
  const own = triggers.filter((t) => t.tbl_name === base)
  const kinds = { insert: false, delete: false, update: false }
  for (const trigger of own) {
    const sql = trigger.sql ?? ''
    if (!sql.includes(fts)) continue
    if (/AFTER\s+INSERT/i.test(sql)) kinds.insert = true
    if (/AFTER\s+DELETE/i.test(sql)) kinds.delete = true
    if (/AFTER\s+UPDATE/i.test(sql)) kinds.update = true
  }
  const missing = Object.entries(kinds)
    .filter(([, present]) => !present)
    .map(([kind]) => kind)
  if (missing.length) {
    errors.push(
      `Indeks pełnotekstowy \`${fts}\` nie ma wyzwalaczy: ${missing.join(', ')}. ` +
        `Indeks rozjedzie się z tabelą \`${base}\`, a wyszukiwarka zacznie zwracać nieaktualne wyniki.`,
    )
  }
}

// Spójność kluczy obcych — po katastrofie z migracji 0047, gdzie sondowanie
// ALTER TABLE RENAME cicho przepisało klucz obcy tabeli `articles`.
const fkCheck = d1('PRAGMA foreign_key_check')
if (fkCheck.length) {
  errors.push(`PRAGMA foreign_key_check zgłasza ${fkCheck.length} naruszeń więzów integralności.`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Raport
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${DIM}izbica24.pl — weryfikacja schemy D1 (D3)${OFF}`)
console.log(`${DIM}${'─'.repeat(72)}${OFF}`)
console.log(`Tabel w bazie:            ${tables.length}`)
console.log(`Tabel pełnotekstowych:    ${ftsTables.length}`)
console.log(`Widoków:                  ${views.length}`)
console.log(`Wyzwalaczy:               ${triggers.length}`)
console.log(`Naruszeń kluczy obcych:   ${fkCheck.length}`)

if (warnings.length) {
  console.log(`\n${YELLOW}Ostrzeżenia (${warnings.length}) — nie blokują, ale warto przejrzeć:${OFF}`)
  for (const w of warnings) console.log(`  ${YELLOW}·${OFF} ${w}`)
}

if (errors.length) {
  console.log(`\n${RED}Błędy (${errors.length}):${OFF}`)
  for (const e of errors) console.log(`  ${RED}✗${OFF} ${e}`)
  console.log(`\n${RED}Weryfikacja nieudana.${OFF}\n`)
  process.exit(1)
}

console.log(`\n${GREEN}Schema bazy spójna: wyzwalacze FTS5 i więzy integralności bez zarzutu.${OFF}\n`)
