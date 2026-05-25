import type { D1DatabaseLike } from '../../types/env'
import { highlightSnippet } from './highlight'
import { normalizeSearchTerms } from './polish-stemmer'
import { logSearchAnalytics } from './search-analytics'

export interface OgloszeniaFilters {
  adType?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  limit?: number
  offset?: number
}

export const searchOgloszeniaFts = async (db: D1DatabaseLike | undefined, query: string, filters: OgloszeniaFilters = {}) => {
  if (!db) return { items: [], total: 0 }
  const terms = normalizeSearchTerms(query)
  const ftsQuery = terms.map((term) => `${term}*`).join(' OR ')
  const limit = filters.limit ?? 10
  const offset = filters.offset ?? 0
  const where: string[] = ['ogloszenia_fts MATCH ?']
  const args: unknown[] = [ftsQuery]
  if (filters.adType) { where.push('ad_type = ?'); args.push(filters.adType) }
  if (filters.location) { where.push('location = ?'); args.push(filters.location) }
  if (typeof filters.minPrice === 'number') { where.push('CAST(price AS REAL) >= ?'); args.push(filters.minPrice) }
  if (typeof filters.maxPrice === 'number') { where.push('CAST(price AS REAL) <= ?'); args.push(filters.maxPrice) }
  const sql = `SELECT rowid, slug, title, excerpt, location, ad_type, price, bm25(ogloszenia_fts) as rank FROM ogloszenia_fts WHERE ${where.join(' AND ')} ORDER BY rank LIMIT ? OFFSET ?`
  const rows = await db.prepare(sql).bind(...args, limit, offset).all<{ rowid: number; slug: string; title: string; excerpt: string; location: string; ad_type: string; price: string; rank: number }>()
  await logSearchAnalytics(db, query, rows.results.length, 'ogloszenia')
  return {
    total: rows.results.length,
    items: rows.results.map((row) => ({ ...row, snippet: highlightSnippet(`${row.title} ${row.excerpt}`, query) })),
  }
}
