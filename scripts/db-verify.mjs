#!/usr/bin/env node
/**
 * FAZA 1 / D3 — Weryfikacja zgodności modeli z rzeczywistą schemą D1
 *
 * Powód istnienia tego skryptu: siedemnaście plików w `src/db/models/`
 * deklaruje kolumny tabel jako listy łańcuchów znaków w kodzie
 * TypeScript. To znaczy, że rozjazd między modelem a bazą jest
 * NIEWIDOCZNY dla kompilatora — TypeScript sprawdza tylko, czy kod
 * używa nazw obecnych na liście, a nie czy lista odpowiada bazie.
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
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MODELS_DIR = join(ROOT, 'src', 'db', 'models')
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
// Odczyt deklaracji z plików modeli
// ─────────────────────────────────────────────────────────────────────────────

const modelFiles = readdirSync(MODELS_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== '_shared.ts')

const models = []
for (const file of modelFiles) {
  const source = readFileSync(join(MODELS_DIR, file), 'utf8')

  // const TABLE = 'articles'
  const tableMatch = source.match(/const\s+TABLE\s*=\s*['"]([^'"]+)['"]/)
  // const COLUMNS = ["id", "slug", ...] as const
  const columnsMatch = source.match(/const\s+COLUMNS\s*=\s*\[([\s\S]*?)\]\s*as\s+const/)
  /**
   * Tabele wymieniane wprost w zapytaniach SQL. Wzorzec musi wymagać
   * WIELKICH LITER w słowie kluczowym: wariant bez rozróżniania wielkości
   * dawał fałszywy alarm na każdym z piętnastu modeli, bo w komunikacie
   * `throw new Error('ArticlesModel.update requires at least one field')`
   * dopasowywał „update requires” i uznawał `requires` za nazwę tabeli.
   */
  const sqlTables = new Set(
    [...source.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+([a-z_][a-z0-9_]*)/g)].map((m) => m[1].toLowerCase()),
  )

  /**
   * Normalizacja pozycji listy kolumn. Model `real-estate.ts` ma
   * w `COLUMNS` wyrażenie `"transaction" AS transaction`, bo `transaction`
   * jest w SQLite słowem o szczególnym znaczeniu i wymaga cytowania.
   * Bez tej normalizacji parser widział pozycję `\` oraz
   * ` AS transaction` i zgłaszał dwa nieistniejące błędy, a jednocześnie
   * nie wiedział, że kolumna `transaction` JEST obsługiwana.
   */
  const rawColumns = columnsMatch ? [...columnsMatch[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]) : []
  const columns = []
  for (const raw of rawColumns) {
    const unescaped = raw.replace(/\\"/g, '"').trim()
    if (!unescaped) continue
    // `"transaction" AS transaction` → `transaction`
    const aliased = unescaped.match(/\bAS\s+([a-z_][a-z0-9_]*)\s*$/i)
    const name = (aliased ? aliased[1] : unescaped).replace(/^"|"$/g, '').trim()
    if (!name || columns.includes(name)) continue
    columns.push(name)
  }

  models.push({ file, table: tableMatch?.[1] ?? null, columns, sqlTables: [...sqlTables] })
}

// ─────────────────────────────────────────────────────────────────────────────
// Porównanie
// ─────────────────────────────────────────────────────────────────────────────

const errors = []
const warnings = []
let checkedColumns = 0

for (const model of models) {
  if (!model.table) {
    warnings.push(`${model.file}: nie znaleziono deklaracji \`const TABLE = '...'\` — pomijam.`)
    continue
  }

  const tableSchema = schema.get(model.table)
  if (!tableSchema) {
    errors.push(`${model.file}: model odwołuje się do tabeli \`${model.table}\`, której NIE MA w bazie.`)
    continue
  }

  // 1. Kolumny modelu muszą istnieć w tabeli.
  for (const column of model.columns) {
    checkedColumns++
    if (!tableSchema.has(column)) {
      const similar = [...tableSchema.keys()].filter(
        (real) => real.replace(/_/g, '') === column.replace(/_/g, '') || real.includes(column) || column.includes(real),
      )
      errors.push(
        `${model.file}: kolumna \`${model.table}.${column}\` NIE ISTNIEJE w bazie.` +
          (similar.length ? ` Podobne w tabeli: ${similar.join(', ')}.` : ''),
      )
    }
  }

  // 2. Kolumny obowiązkowe (NOT NULL, bez DEFAULT, nie klucz główny)
  //    muszą być obsługiwane przez model — inaczej INSERT zawsze zawiedzie.
  for (const [name, info] of tableSchema) {
    if (info.notNull && !info.hasDefault && !info.pk && !model.columns.includes(name)) {
      errors.push(
        `${model.file}: kolumna \`${model.table}.${name}\` jest NOT NULL bez wartości domyślnej, ` +
          `ale model jej nie zna — każdy INSERT przez ten model zawiedzie.`,
      )
    }
  }

  // 3. Kolumny istniejące w bazie, o których model nie wie — to nie błąd,
  //    ale sygnał, że migracja dodała pole i model został pominięty.
  const unknown = [...tableSchema.keys()].filter((name) => !model.columns.includes(name))
  if (unknown.length) {
    warnings.push(
      `${model.file}: tabela \`${model.table}\` ma kolumny nieobsługiwane przez model: ${unknown.join(', ')}.`,
    )
  }

  // 4. Tabele wymieniane w SQL modelu, których nie ma w bazie.
  for (const sqlTable of model.sqlTables) {
    if (!schema.has(sqlTable) && !['select', 'values'].includes(sqlTable)) {
      errors.push(`${model.file}: zapytanie SQL odwołuje się do tabeli \`${sqlTable}\`, której nie ma w bazie.`)
    }
  }
}

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

console.log(`\n${DIM}izbica24.pl — weryfikacja modeli D1 (D3)${OFF}`)
console.log(`${DIM}${'─'.repeat(72)}${OFF}`)
console.log(`Tabel w bazie:            ${tables.length}`)
console.log(`Tabel pełnotekstowych:    ${ftsTables.length}`)
console.log(`Widoków:                  ${views.length}`)
console.log(`Wyzwalaczy:               ${triggers.length}`)
console.log(`Plików modeli:            ${models.length}`)
console.log(`Sprawdzonych kolumn:      ${checkedColumns}`)
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

console.log(`\n${GREEN}Modele zgodne ze schemą bazy.${OFF}\n`)
