import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface MediaRow {
  id: number
  r2_key: string
  mime: string
  size_bytes: number
  width: number | null
  height: number | null
  alt: string | null
  caption: string | null
  credit: string | null
  uploaded_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface MediaFilters {
  "id"?: unknown
  "id_like"?: unknown
  "r2_key"?: unknown
  "r2_key_like"?: unknown
  "mime"?: unknown
  "mime_like"?: unknown
  "uploaded_by"?: unknown
  "uploaded_by_like"?: unknown
}

export interface MediaInsertInput extends Partial<MediaRow> {}
export interface MediaUpdateInput extends Partial<MediaRow> {
  id: number
}

const TABLE = 'media'
const COLUMNS = ["id", "r2_key", "mime", "size_bytes", "width", "height", "alt", "caption", "credit", "uploaded_by", "created_at", "updated_at", "deleted_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "r2_key": "r2_key",
  "mime": "mime",
  "uploaded_by": "uploaded_by",
}

export async function find(c: DbContext, id: number): Promise<MediaRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM media WHERE id = ? LIMIT 1`).bind(id).first<MediaRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: MediaFilters = {}): Promise<MediaRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM media ${clause} ORDER BY created_at DESC, id DESC`).bind(...bindings).all<MediaRow>()
  return results
}

export async function insert(c: DbContext, input: MediaInsertInput): Promise<unknown> {
  const record = compactRecord({
    "r2_key": input.r2_key,
    "mime": input.mime,
    "size_bytes": input.size_bytes,
    "width": input.width,
    "height": input.height,
    "alt": input.alt,
    "caption": input.caption,
    "credit": input.credit,
    "uploaded_by": input.uploaded_by,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('MediaModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO media (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: MediaUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "r2_key": input.r2_key,
    "mime": input.mime,
    "size_bytes": input.size_bytes,
    "width": input.width,
    "height": input.height,
    "alt": input.alt,
    "caption": input.caption,
    "credit": input.credit,
    "uploaded_by": input.uploaded_by,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('MediaModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE media SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM media WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<MediaFilters> = {}): Promise<PaginationResult<MediaRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM media ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM media ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<MediaRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const MediaModel = { find, findAll, insert, update, delete: remove, paginate }
