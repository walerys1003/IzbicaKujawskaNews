import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface NewsletterRow {
  id: number
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  token: string | null
  confirmed_at: string | null
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface NewsletterFilters {
  "id"?: unknown
  "id_like"?: unknown
  "email"?: unknown
  "email_like"?: unknown
  "status"?: unknown
  "status_like"?: unknown
  "token"?: unknown
  "token_like"?: unknown
}

export interface NewsletterInsertInput extends Partial<NewsletterRow> {}
export interface NewsletterUpdateInput extends Partial<NewsletterRow> {
  id: number
}

const TABLE = 'newsletters'
const COLUMNS = ["id", "email", "status", "token", "confirmed_at", "unsubscribed_at", "created_at", "updated_at", "deleted_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "email": "email",
  "status": "status",
  "token": "token",
}

export async function find(c: DbContext, id: number): Promise<NewsletterRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM newsletters WHERE id = ? LIMIT 1`).bind(id).first<NewsletterRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: NewsletterFilters = {}): Promise<NewsletterRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM newsletters ${clause} ORDER BY created_at DESC, id DESC`).bind(...bindings).all<NewsletterRow>()
  return results
}

export async function insert(c: DbContext, input: NewsletterInsertInput): Promise<unknown> {
  const record = compactRecord({
    "email": input.email,
    "status": input.status,
    "token": input.token,
    "confirmed_at": input.confirmed_at,
    "unsubscribed_at": input.unsubscribed_at,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('NewslettersModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO newsletters (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: NewsletterUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "email": input.email,
    "status": input.status,
    "token": input.token,
    "confirmed_at": input.confirmed_at,
    "unsubscribed_at": input.unsubscribed_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('NewslettersModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE newsletters SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM newsletters WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<NewsletterFilters> = {}): Promise<PaginationResult<NewsletterRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM newsletters ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM newsletters ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<NewsletterRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const NewslettersModel = { find, findAll, insert, update, delete: remove, paginate }
