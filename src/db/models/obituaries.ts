import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface ObituaryRow {
  id: number
  slug: string
  deceased_name: string
  born: string | null
  died: string | null
  funeral_date: string | null
  funeral_place: string | null
  photo_r2_key: string | null
  content: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  family_contact_hash: string | null
  deleted_at: string | null
  archived_at: string | null
}

export interface ObituaryFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "deceased_name"?: unknown
  "deceased_name_like"?: unknown
}

export interface ObituaryInsertInput extends Partial<ObituaryRow> {}
export interface ObituaryUpdateInput extends Partial<ObituaryRow> {
  id: number
}

const TABLE = 'obituaries'
const COLUMNS = ["id", "slug", "deceased_name", "born", "died", "funeral_date", "funeral_place", "photo_r2_key", "content", "published_at", "created_at", "updated_at", "family_contact_hash", "deleted_at", "archived_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "deceased_name": "deceased_name",
}

export async function find(c: DbContext, id: number): Promise<ObituaryRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM obituaries WHERE id = ? LIMIT 1`).bind(id).first<ObituaryRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: ObituaryFilters = {}): Promise<ObituaryRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM obituaries ${clause} ORDER BY published_at DESC, created_at DESC, id DESC`).bind(...bindings).all<ObituaryRow>()
  return results
}

export async function insert(c: DbContext, input: ObituaryInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "deceased_name": input.deceased_name,
    "born": input.born,
    "died": input.died,
    "funeral_date": input.funeral_date,
    "funeral_place": input.funeral_place,
    "photo_r2_key": input.photo_r2_key,
    "content": input.content,
    "published_at": input.published_at,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "family_contact_hash": input.family_contact_hash,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ObituariesModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO obituaries (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: ObituaryUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "deceased_name": input.deceased_name,
    "born": input.born,
    "died": input.died,
    "funeral_date": input.funeral_date,
    "funeral_place": input.funeral_place,
    "photo_r2_key": input.photo_r2_key,
    "content": input.content,
    "published_at": input.published_at,
    "updated_at": input.updated_at,
    "family_contact_hash": input.family_contact_hash,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ObituariesModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE obituaries SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM obituaries WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<ObituaryFilters> = {}): Promise<PaginationResult<ObituaryRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM obituaries ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM obituaries ${clause} ORDER BY published_at DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<ObituaryRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const ObituariesModel = { find, findAll, insert, update, delete: remove, paginate }
