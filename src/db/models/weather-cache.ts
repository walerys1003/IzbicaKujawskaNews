import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface WeatherCacheRow {
  id: number
  location: string
  temp_c: number | null
  condition: string | null
  icon: string | null
  pressure: number | null
  humidity: number | null
  wind_kmh: number | null
  fetched_at: string
  created_at: string
  updated_at: string
}

export interface WeatherCacheFilters {
  "id"?: unknown
  "id_like"?: unknown
  "location"?: unknown
  "location_like"?: unknown
}

export interface WeatherCacheInsertInput extends Partial<WeatherCacheRow> {}
export interface WeatherCacheUpdateInput extends Partial<WeatherCacheRow> {
  id: number
}

const TABLE = 'weather_cache'
const COLUMNS = ["id", "location", "temp_c", "condition", "icon", "pressure", "humidity", "wind_kmh", "fetched_at", "created_at", "updated_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "location": "location",
}

export async function find(c: DbContext, id: number): Promise<WeatherCacheRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM weather_cache WHERE id = ? LIMIT 1`).bind(id).first<WeatherCacheRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: WeatherCacheFilters = {}): Promise<WeatherCacheRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM weather_cache ${clause} ORDER BY fetched_at DESC, id DESC`).bind(...bindings).all<WeatherCacheRow>()
  return results
}

export async function insert(c: DbContext, input: WeatherCacheInsertInput): Promise<unknown> {
  const record = compactRecord({
    "location": input.location,
    "temp_c": input.temp_c,
    "condition": input.condition,
    "icon": input.icon,
    "pressure": input.pressure,
    "humidity": input.humidity,
    "wind_kmh": input.wind_kmh,
    "fetched_at": input.fetched_at,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('WeatherCacheModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO weather_cache (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: WeatherCacheUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "location": input.location,
    "temp_c": input.temp_c,
    "condition": input.condition,
    "icon": input.icon,
    "pressure": input.pressure,
    "humidity": input.humidity,
    "wind_kmh": input.wind_kmh,
    "fetched_at": input.fetched_at,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('WeatherCacheModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE weather_cache SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM weather_cache WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<WeatherCacheFilters> = {}): Promise<PaginationResult<WeatherCacheRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM weather_cache ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM weather_cache ${clause} ORDER BY fetched_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<WeatherCacheRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const WeatherCacheModel = { find, findAll, insert, update, delete: remove, paginate }
