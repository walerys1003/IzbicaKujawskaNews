import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface JobOfferRow {
  id: number
  slug: string
  title: string
  company: string
  location: string | null
  salary_min: number | null
  salary_max: number | null
  type: 'full' | 'part' | 'freelance'
  description: string | null
  contact: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  published: number
  deleted_at: string | null
  archived_at: string | null
}

export interface JobOfferFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "company"?: unknown
  "company_like"?: unknown
  "type"?: unknown
  "type_like"?: unknown
  "published"?: unknown
  "published_like"?: unknown
}

export interface JobOfferInsertInput extends Partial<JobOfferRow> {}
export interface JobOfferUpdateInput extends Partial<JobOfferRow> {
  id: number
}

const TABLE = 'job_offers'
const COLUMNS = ["id", "slug", "title", "company", "location", "salary_min", "salary_max", "type", "description", "contact", "expires_at", "created_at", "updated_at", "published", "deleted_at", "archived_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "company": "company",
  "type": "type",
  "published": "published",
}

export async function find(c: DbContext, id: number): Promise<JobOfferRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM job_offers WHERE id = ? LIMIT 1`).bind(id).first<JobOfferRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: JobOfferFilters = {}): Promise<JobOfferRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM job_offers ${clause} ORDER BY published DESC, created_at DESC, id DESC`).bind(...bindings).all<JobOfferRow>()
  return results
}

export async function insert(c: DbContext, input: JobOfferInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "company": input.company,
    "location": input.location,
    "salary_min": input.salary_min,
    "salary_max": input.salary_max,
    "type": input.type,
    "description": input.description,
    "contact": input.contact,
    "expires_at": input.expires_at,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "published": toSqlBoolean(input.published),
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('JobOffersModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO job_offers (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: JobOfferUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "company": input.company,
    "location": input.location,
    "salary_min": input.salary_min,
    "salary_max": input.salary_max,
    "type": input.type,
    "description": input.description,
    "contact": input.contact,
    "expires_at": input.expires_at,
    "updated_at": input.updated_at,
    "published": toSqlBoolean(input.published),
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('JobOffersModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE job_offers SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM job_offers WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<JobOfferFilters> = {}): Promise<PaginationResult<JobOfferRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM job_offers ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM job_offers ${clause} ORDER BY published DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<JobOfferRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const JobOffersModel = { find, findAll, insert, update, delete: remove, paginate }
