import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface CommentRow {
  id: number
  article_id: number
  user_id: number | null
  author_name: string | null
  author_email: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  parent_id: number | null
  created_at: string
  updated_at: string
  ip_hash: string | null
  deleted_at: string | null
}

export interface CommentFilters {
  "id"?: unknown
  "id_like"?: unknown
  "article_id"?: unknown
  "article_id_like"?: unknown
  "user_id"?: unknown
  "user_id_like"?: unknown
  "status"?: unknown
  "status_like"?: unknown
  "parent_id"?: unknown
  "parent_id_like"?: unknown
}

export interface CommentInsertInput extends Partial<CommentRow> {}
export interface CommentUpdateInput extends Partial<CommentRow> {
  id: number
}

const TABLE = 'comments'
const COLUMNS = ["id", "article_id", "user_id", "author_name", "author_email", "content", "status", "parent_id", "created_at", "updated_at", "ip_hash", "deleted_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "article_id": "article_id",
  "user_id": "user_id",
  "status": "status",
  "parent_id": "parent_id",
}

export async function find(c: DbContext, id: number): Promise<CommentRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM comments WHERE id = ? LIMIT 1`).bind(id).first<CommentRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: CommentFilters = {}): Promise<CommentRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM comments ${clause} ORDER BY created_at DESC, id DESC`).bind(...bindings).all<CommentRow>()
  return results
}

export async function insert(c: DbContext, input: CommentInsertInput): Promise<unknown> {
  const record = compactRecord({
    "article_id": input.article_id,
    "user_id": input.user_id,
    "author_name": input.author_name,
    "author_email": input.author_email,
    "content": input.content,
    "status": input.status,
    "parent_id": input.parent_id,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "ip_hash": input.ip_hash,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('CommentsModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO comments (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: CommentUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "article_id": input.article_id,
    "user_id": input.user_id,
    "author_name": input.author_name,
    "author_email": input.author_email,
    "content": input.content,
    "status": input.status,
    "parent_id": input.parent_id,
    "updated_at": input.updated_at,
    "ip_hash": input.ip_hash,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('CommentsModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE comments SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM comments WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<CommentFilters> = {}): Promise<PaginationResult<CommentRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM comments ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM comments ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<CommentRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const CommentsModel = { find, findAll, insert, update, delete: remove, paginate }
