import type { D1DatabaseLike } from '../../types/env'
import { normalizeSearchTerms } from './polish-stemmer'

export interface SearchAnalyticsEntry {
  query: string
  normalizedQuery: string
  resultCount: number
  source: string
}

export const logSearchAnalytics = async (db: D1DatabaseLike | undefined, query: string, resultCount: number, source = 'global') => {
  if (!db) return { skipped: true }
  const normalizedQuery = normalizeSearchTerms(query).join(' ')
  await db
    .prepare('INSERT INTO search_analytics (query, normalized_query, result_count, source) VALUES (?, ?, ?, ?)')
    .bind(query, normalizedQuery, resultCount, source)
    .run()
  return { ok: true }
}

export const getTopQueries = async (db: D1DatabaseLike | undefined, limit = 20) => {
  if (!db) return []
  const rows = await db
    .prepare(`SELECT normalized_query as query, COUNT(*) as hits FROM search_analytics GROUP BY normalized_query ORDER BY hits DESC LIMIT ${Math.max(1, limit)}`)
    .all<{ query: string; hits: number }>()
  return rows.results
}
