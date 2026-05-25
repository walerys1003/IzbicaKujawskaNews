import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface AuditLogRow {
  id: number
  user_id: number | null
  action: string
  entity: string
  entity_id: string | null
  diff: string | null
  ip_hash: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogFilters {
  "id"?: unknown
  "id_like"?: unknown
  "user_id"?: unknown
  "user_id_like"?: unknown
  "action"?: unknown
  "action_like"?: unknown
  "entity"?: unknown
  "entity_like"?: unknown
  "entity_id"?: unknown
  "entity_id_like"?: unknown
}

export interface AuditLogInsertInput extends Partial<AuditLogRow> {}
export interface AuditLogUpdateInput extends Partial<AuditLogRow> {
  id: number
}

const TABLE = 'audit_log'
const COLUMNS = ["id", "user_id", "action", "entity", "entity_id", "diff", "ip_hash", "created_at", "updated_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "user_id": "user_id",
  "action": "action",
  "entity": "entity",
  "entity_id": "entity_id",
}

export async function find(c: DbContext, id: number): Promise<AuditLogRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM audit_log WHERE id = ? LIMIT 1`).bind(id).first<AuditLogRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: AuditLogFilters = {}): Promise<AuditLogRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM audit_log ${clause} ORDER BY created_at DESC, id DESC`).bind(...bindings).all<AuditLogRow>()
  return results
}

export async function insert(c: DbContext, input: AuditLogInsertInput): Promise<unknown> {
  const record = compactRecord({
    "user_id": input.user_id,
    "action": input.action,
    "entity": input.entity,
    "entity_id": input.entity_id,
    "diff": input.diff,
    "ip_hash": input.ip_hash,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('AuditLogModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO audit_log (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: AuditLogUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "user_id": input.user_id,
    "action": input.action,
    "entity": input.entity,
    "entity_id": input.entity_id,
    "diff": input.diff,
    "ip_hash": input.ip_hash,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('AuditLogModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE audit_log SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM audit_log WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<AuditLogFilters> = {}): Promise<PaginationResult<AuditLogRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM audit_log ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM audit_log ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<AuditLogRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const AuditLogModel = { find, findAll, insert, update, delete: remove, paginate }
