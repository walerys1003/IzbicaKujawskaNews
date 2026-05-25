import { DbContext, PaginationInput, PaginationResult, buildWhere, compactRecord, toSqlBoolean } from './_shared'

export interface ArticleTagRow {
  article_id: number
  tag_id: number
  created_at: string
  updated_at: string
}

export interface ArticleTagFilters {
  "article_id"?: unknown
  "article_id_like"?: unknown
  "tag_id"?: unknown
  "tag_id_like"?: unknown
}

export interface ArticleTagInsertInput extends Partial<ArticleTagRow> {}
export interface ArticleTagUpdateInput extends Partial<ArticleTagRow> {
  article_id: number
  tag_id: number
}

const TABLE = 'article_tags'
const COLUMNS = ["article_id", "tag_id", "created_at", "updated_at"] as const
const SELECT_COLUMNS = COLUMNS.join(', ')
const FILTER_MAP: Record<string, string> = {
  "article_id": "article_id",
  "tag_id": "tag_id",
}

export async function find(c: DbContext, article_id: number, tag_id: number): Promise<ArticleTagRow | null> {
  const row = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM article_tags WHERE article_id = ? AND tag_id = ? LIMIT 1`).bind(article_id, tag_id).first<ArticleTagRow>()
  return row ?? null
}

export async function findAll(c: DbContext, filters: ArticleTagFilters = {}): Promise<ArticleTagRow[]> {
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM article_tags ${clause} ORDER BY article_id DESC, tag_id DESC`).bind(...bindings).all<ArticleTagRow>()
  return results
}

export async function insert(c: DbContext, input: ArticleTagInsertInput): Promise<unknown> {
  const record = compactRecord({
    "article_id": input.article_id,
    "tag_id": input.tag_id,
    "created_at": input.created_at,
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ArticleTagsModel.insert requires at least one field')
  const placeholders = keys.map(() => '?').join(', ')
  return c.env.DB.prepare(`INSERT INTO article_tags (${keys.join(', ')}) VALUES (${placeholders})`).bind(...keys.map((key) => (record as Record<string, unknown>)[key])).run()
}

export async function update(c: DbContext, input: ArticleTagUpdateInput): Promise<unknown> {
  const record = compactRecord({
    "updated_at": input.updated_at,
  })
  const keys = Object.keys(record)
  if (!keys.length) throw new Error('ArticleTagsModel.update requires at least one mutable field')
  const assignments = keys.map((key) => `${key} = ?`).join(', ')
  return c.env.DB.prepare(`UPDATE article_tags SET ${assignments} WHERE article_id = ? AND tag_id = ?`).bind(...keys.map((key) => (record as Record<string, unknown>)[key]), input.article_id, input.tag_id).run()
}

async function remove(c: DbContext, article_id: number, tag_id: number): Promise<unknown> {
  return c.env.DB.prepare(`DELETE FROM article_tags WHERE article_id = ? AND tag_id = ?`).bind(article_id, tag_id).run()
}

export { remove as delete }

export async function paginate(c: DbContext, input: PaginationInput<ArticleTagFilters> = {}): Promise<PaginationResult<ArticleTagRow>> {
  const page = Math.max(1, input.page ?? 1)
  const perPage = Math.min(100, Math.max(1, input.perPage ?? 20))
  const offset = (page - 1) * perPage
  const filters = input.filters ?? {}
  const { clause, bindings } = buildWhere(filters as Record<string, unknown>, FILTER_MAP)
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM article_tags ${clause}`).bind(...bindings).first<{ total: number }>()
  const { results = [] } = await c.env.DB.prepare(`SELECT ${SELECT_COLUMNS} FROM article_tags ${clause} ORDER BY article_id DESC, tag_id DESC LIMIT ? OFFSET ?`).bind(...bindings, perPage, offset).all<ArticleTagRow>()
  const total = Number(countRow?.total ?? 0)
  return {
    items: results,
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export const ArticleTagsModel = { find, findAll, insert, update, delete: remove, paginate }
