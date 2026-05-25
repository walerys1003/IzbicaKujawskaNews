import type { D1DatabaseLike } from '../../types/env'
import { highlightSnippet } from './highlight'
import { normalizeSearchTerms } from './polish-stemmer'
import { logSearchAnalytics } from './search-analytics'

export interface ArticleSearchFilters {
  category?: string
  limit?: number
  offset?: number
}

export const searchArticlesFts = async (db: D1DatabaseLike | undefined, query: string, filters: ArticleSearchFilters = {}) => {
  if (!db) return { items: [], total: 0 }
  const terms = normalizeSearchTerms(query)
  const ftsQuery = terms.map((term) => `${term}*`).join(' OR ')
  const limit = filters.limit ?? 10
  const offset = filters.offset ?? 0
  const categoryFilter = filters.category ? ' AND category = ?' : ''
  const sql = `SELECT rowid, slug, title, lede, body, category, bm25(articles_fts) as rank FROM articles_fts WHERE articles_fts MATCH ?${categoryFilter} ORDER BY rank LIMIT ? OFFSET ?`
  const stmt = db.prepare(sql)
  const bound = filters.category
    ? stmt.bind(ftsQuery, filters.category, limit, offset)
    : stmt.bind(ftsQuery, limit, offset)
  const rows = await bound.all<{ rowid: number; slug: string; title: string; lede: string; body: string; category: string; rank: number }>()
  await logSearchAnalytics(db, query, rows.results.length, 'articles')
  return {
    total: rows.results.length,
    items: rows.results.map((row) => ({
      ...row,
      snippet: highlightSnippet(`${row.lede} ${row.body}`, query),
    })),
  }
}
