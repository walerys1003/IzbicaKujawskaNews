import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface CategoryRow {
  id: number
  slug: string
  name: string
  parent_id: number | null
  color_hex: string | null
  icon: string | null
  order_index: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface CategoryFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "parent_id"?: unknown
  "parent_id_like"?: unknown
  "name"?: unknown
  "name_like"?: unknown
}

export interface CategoryInsertInput extends Partial<CategoryRow> {}
export interface CategoryUpdateInput extends Partial<CategoryRow> {
  id: number
}

const TABLE = 'categories'
const COLUMNS = ["id", "slug", "name", "parent_id", "color_hex", "icon", "order_index", "description", "created_at", "updated_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "parent_id": "parent_id",
  "name": "name",
}

export async function find(c: DbContext, id: number): Promise<CategoryRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM categories WHERE id = ? LIMIT 1`).bind(id).first<CategoryRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: CategoryFilters = {}): Promise<CategoryRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM categories ${clause} ORDER BY order_index ASC, id ASC`).bind(...bindings).all<CategoryRow>()
  return results
}

export async function insert(c: DbContext, input: CategoryInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "name": input.name,
    "parent_id": input.parent_id,
    "color_hex": input.color_hex,
    "icon": input.icon,
    "order_index": input.order_index,
    "description": input.description,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('CategoriesModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO categories (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: CategoryUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "name": input.name,
    "parent_id": input.parent_id,
    "color_hex": input.color_hex,
    "icon": input.icon,
    "order_index": input.order_index,
    "description": input.description,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('CategoriesModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE categories SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<CategoryFilters> = {}): Promise<PaginationResult<CategoryRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM categories ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM categories ${clause} ORDER BY order_index ASC, id ASC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<CategoryRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const CategoriesModel = { find, findAll, insert, update, delete: remove, paginate }
