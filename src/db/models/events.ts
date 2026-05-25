import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface EventRow {
  id: number
  slug: string
  title: string
  start_at: string
  end_at: string | null
  location: string | null
  address: string | null
  description: string | null
  organizer: string | null
  category: string | null
  image_r2_key: string | null
  published: number
  free: number
  ticket_url: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  archived_at: string | null
}

export interface EventFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "category"?: unknown
  "category_like"?: unknown
  "published"?: unknown
  "published_like"?: unknown
  "free"?: unknown
  "free_like"?: unknown
}

export interface EventInsertInput extends Partial<EventRow> {}
export interface EventUpdateInput extends Partial<EventRow> {
  id: number
}

const TABLE = 'events'
const COLUMNS = ["id", "slug", "title", "start_at", "end_at", "location", "address", "description", "organizer", "category", "image_r2_key", "published", "free", "ticket_url", "created_at", "updated_at", "deleted_at", "archived_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "category": "category",
  "published": "published",
  "free": "free",
}

export async function find(c: DbContext, id: number): Promise<EventRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM events WHERE id = ? LIMIT 1`).bind(id).first<EventRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: EventFilters = {}): Promise<EventRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM events ${clause} ORDER BY start_at ASC, id DESC`).bind(...bindings).all<EventRow>()
  return results
}

export async function insert(c: DbContext, input: EventInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "start_at": input.start_at,
    "end_at": input.end_at,
    "location": input.location,
    "address": input.address,
    "description": input.description,
    "organizer": input.organizer,
    "category": input.category,
    "image_r2_key": input.image_r2_key,
    "published": toSqlBoolean(input.published),
    "free": toSqlBoolean(input.free),
    "ticket_url": input.ticket_url,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('EventsModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO events (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: EventUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "start_at": input.start_at,
    "end_at": input.end_at,
    "location": input.location,
    "address": input.address,
    "description": input.description,
    "organizer": input.organizer,
    "category": input.category,
    "image_r2_key": input.image_r2_key,
    "published": toSqlBoolean(input.published),
    "free": toSqlBoolean(input.free),
    "ticket_url": input.ticket_url,
    "updated_at": input.updated_at,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('EventsModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE events SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<EventFilters> = {}): Promise<PaginationResult<EventRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM events ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM events ${clause} ORDER BY start_at ASC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<EventRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const EventsModel = { find, findAll, insert, update, delete: remove, paginate }
