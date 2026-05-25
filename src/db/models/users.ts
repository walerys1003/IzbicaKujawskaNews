import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface UserRow {
  id: number
  email: string
  password_hash: string
  name: string
  role: 'admin' | 'editor' | 'journalist' | 'reader'
  avatar: string | null
  bio: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface UserFilters {
  "id"?: unknown
  "id_like"?: unknown
  "email"?: unknown
  "email_like"?: unknown
  "role"?: unknown
  "role_like"?: unknown
  "name"?: unknown
  "name_like"?: unknown
}

export interface UserInsertInput extends Partial<UserRow> {}
export interface UserUpdateInput extends Partial<UserRow> {
  id: number
}

const TABLE = 'users'
const COLUMNS = ["id", "email", "password_hash", "name", "role", "avatar", "bio", "created_at", "updated_at", "last_login"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "email": "email",
  "role": "role",
  "name": "name",
}

export async function find(c: DbContext, id: number): Promise<UserRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM users WHERE id = ? LIMIT 1`).bind(id).first<UserRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: UserFilters = {}): Promise<UserRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM users ${clause} ORDER BY updated_at DESC, id DESC`).bind(...bindings).all<UserRow>()
  return results
}

export async function insert(c: DbContext, input: UserInsertInput): Promise<unknown> {
  const record = compactRecord({
    "email": input.email,
    "password_hash": input.password_hash,
    "name": input.name,
    "role": input.role,
    "avatar": input.avatar,
    "bio": input.bio,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "last_login": input.last_login,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('UsersModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO users (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: UserUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "email": input.email,
    "password_hash": input.password_hash,
    "name": input.name,
    "role": input.role,
    "avatar": input.avatar,
    "bio": input.bio,
    "updated_at": input.updated_at,
    "last_login": input.last_login,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('UsersModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE users SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<UserFilters> = {}): Promise<PaginationResult<UserRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM users ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM users ${clause} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<UserRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const UsersModel = { find, findAll, insert, update, delete: remove, paginate }
