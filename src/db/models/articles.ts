import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface ArticleRow {
  id: number
  slug: string
  title: string
  lead: string
  content_html: string | null
  content_md: string | null
  hero_image_r2_key: string | null
  category_id: number | null
  author_id: number | null
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  view_count: number
  reading_minutes: number
  language: string
  deleted_at: string | null
  archived_at: string | null
}

export interface ArticleFilters {
  "id"?: unknown
  "id_like"?: unknown
  "slug"?: unknown
  "slug_like"?: unknown
  "status"?: unknown
  "status_like"?: unknown
  "category_id"?: unknown
  "category_id_like"?: unknown
  "author_id"?: unknown
  "author_id_like"?: unknown
  "language"?: unknown
  "language_like"?: unknown
}

export interface ArticleInsertInput extends Partial<ArticleRow> {}
export interface ArticleUpdateInput extends Partial<ArticleRow> {
  id: number
}

const TABLE = 'articles'
const COLUMNS = ["id", "slug", "title", "lead", "content_html", "content_md", "hero_image_r2_key", "category_id", "author_id", "status", "published_at", "scheduled_at", "created_at", "updated_at", "view_count", "reading_minutes", "language", "deleted_at", "archived_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "id": "id",
  "slug": "slug",
  "status": "status",
  "category_id": "category_id",
  "author_id": "author_id",
  "language": "language",
}

export async function find(c: DbContext, id: number): Promise<ArticleRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM articles WHERE id = ? LIMIT 1`).bind(id).first<ArticleRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: ArticleFilters = {}): Promise<ArticleRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM articles ${clause} ORDER BY published_at DESC, created_at DESC, id DESC`).bind(...bindings).all<ArticleRow>()
  return results
}

export async function insert(c: DbContext, input: ArticleInsertInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "lead": input.lead,
    "content_html": input.content_html,
    "content_md": input.content_md,
    "hero_image_r2_key": input.hero_image_r2_key,
    "category_id": input.category_id,
    "author_id": input.author_id,
    "status": input.status,
    "published_at": input.published_at,
    "scheduled_at": input.scheduled_at,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
    "view_count": input.view_count,
    "reading_minutes": input.reading_minutes,
    "language": input.language,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ArticlesModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO articles (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: ArticleUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "slug": input.slug,
    "title": input.title,
    "lead": input.lead,
    "content_html": input.content_html,
    "content_md": input.content_md,
    "hero_image_r2_key": input.hero_image_r2_key,
    "category_id": input.category_id,
    "author_id": input.author_id,
    "status": input.status,
    "published_at": input.published_at,
    "scheduled_at": input.scheduled_at,
    "updated_at": input.updated_at,
    "view_count": input.view_count,
    "reading_minutes": input.reading_minutes,
    "language": input.language,
    "deleted_at": input.deleted_at,
    "archived_at": input.archived_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ArticlesModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE articles SET ${assignments} WHERE id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.id).run()
}

async function remove(c: DbContext, id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM articles WHERE id = ?`).bind(id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<ArticleFilters> = {}): Promise<PaginationResult<ArticleRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM articles ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM articles ${clause} ORDER BY published_at DESC, created_at DESC, id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<ArticleRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const ArticlesModel = { find, findAll, insert, update, delete: remove, paginate }
