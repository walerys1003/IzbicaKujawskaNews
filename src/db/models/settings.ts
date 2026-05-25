import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface SettingRow {
  key: string
  value: string | null
  updated_at: string
}

export interface SettingFilters {
  "key"?: unknown
  "key_like"?: unknown
}

export interface SettingInsertInput extends Partial<SettingRow> {}
export interface SettingUpdateInput extends Partial<SettingRow> {
  key: string
}

const TABLE = 'settings'
const COLUMNS = ["key", "value", "updated_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "key": "key",
}

export async function find(c: DbContext, key: string): Promise<SettingRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM settings WHERE key = ? LIMIT 1`).bind(key).first<SettingRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: SettingFilters = {}): Promise<SettingRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM settings ${clause} ORDER BY key ASC`).bind(...bindings).all<SettingRow>()
  return results
}

export async function insert(c: DbContext, input: SettingInsertInput): Promise<unknown> {
  const record = compactRecord({
    "key": input.key,
    "value": input.value,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('SettingsModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO settings (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: SettingUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "value": input.value,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('SettingsModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE settings SET ${assignments} WHERE key = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.key).run()
}

async function remove(c: DbContext, key: string): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM settings WHERE key = ?`).bind(key).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<SettingFilters> = {}): Promise<PaginationResult<SettingRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM settings ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM settings ${clause} ORDER BY key ASC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<SettingRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const SettingsModel = { find, findAll, insert, update, delete: remove, paginate }
