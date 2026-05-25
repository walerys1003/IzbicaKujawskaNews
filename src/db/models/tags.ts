import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface TagRow {
  id: number
  slug: string
  name: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TagFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "name"?: unknown
  "name_like"?: unknown
}

export interface TagInsertInput extends Partial<TagRow> {}
export interface TagUpdateInput extends Partial<TagRow> {
  id: number
}

const TABLE = 'tags'
const COLUMNS = ["id", "slug", "name", "created_at", "updated_at", "deleted_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "name": "name",
}

export async function find(c: DbContext, id: number): Promise<TagRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM tags WHERE id = ? LIMIT 1`).bind(id).first<TagRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: TagFilters = {}): Promise<TagRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM tags ${clause} ORDER BY name ASC`).bind(...bindings).all<TagRow>()
  return results
}

export async function insert(c: DbContext, input: TagInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "name": input.name,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('TagsModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO tags (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: TagUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "name": input.name,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('TagsModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE tags SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<TagFilters> = {}): Promise<PaginationResult<TagRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM tags ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM tags ${clause} ORDER BY name ASC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<TagRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const TagsModel = { find, findAll, insert, update, delete: remove, paginate }
