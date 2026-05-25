import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface RealEstateRow {
  id: number
  slug: string
  title: string
  type: 'dom' | 'mieszkanie' | 'dzialka' | 'lokal'
  transaction: 'sprzedaz' | 'wynajem'
  price: number | null
  area_m2: number | null
  rooms: number | null
  location: string | null
  photo_r2_keys: string | null
  description: string | null
  contact: string | null
  expires_at: string | null
  published: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  archived_at: string | null
}

export interface RealEstateFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "type"?: unknown
  "type_like"?: unknown
  "transaction"?: unknown
  "transaction_like"?: unknown
  "published"?: unknown
  "published_like"?: unknown
}

export interface RealEstateInsertInput extends Partial<RealEstateRow> {}
export interface RealEstateUpdateInput extends Partial<RealEstateRow> {
  id: number
}

const TABLE = 'real_estate'
const COLUMNS = ["id", "slug", "title", "type", "transaction", "price", "area_m2", "rooms", "location", "photo_r2_keys", "description", "contact", "expires_at", "published", "created_at", "updated_at", "deleted_at", "archived_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "type": "type",
  "transaction": "transaction",
  "published": "published",
}

export async function find(c: DbContext, id: number): Promise<RealEstateRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM real_estate WHERE id = ? LIMIT 1`).bind(id).first<RealEstateRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: RealEstateFilters = {}): Promise<RealEstateRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM real_estate ${clause} ORDER BY published DESC, created_at DESC, id DESC`).bind(...bindings).all<RealEstateRow>()
  return results
}

export async function insert(c: DbContext, input: RealEstateInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "type": input.type,
    "transaction": input.transaction,
    "price": input.price,
    "area_m2": input.area_m2,
    "rooms": input.rooms,
    "location": input.location,
    "photo_r2_keys": input.photo_r2_keys,
    "description": input.description,
    "contact": input.contact,
    "expires_at": input.expires_at,
    "published": toSqlBoolean(input.published),
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('RealEstateModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO real_estate (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: RealEstateUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "type": input.type,
    "transaction": input.transaction,
    "price": input.price,
    "area_m2": input.area_m2,
    "rooms": input.rooms,
    "location": input.location,
    "photo_r2_keys": input.photo_r2_keys,
    "description": input.description,
    "contact": input.contact,
    "expires_at": input.expires_at,
    "published": toSqlBoolean(input.published),
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('RealEstateModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE real_estate SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM real_estate WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<RealEstateFilters> = {}): Promise<PaginationResult<RealEstateRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM real_estate ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM real_estate ${clause} ORDER BY published DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<RealEstateRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const RealEstateModel = { find, findAll, insert, update, delete: remove, paginate }
