import type { D1DatabaseLike } from '../../types/env'
import { searchArticlesFts } from './fts-articles'
import { searchOgloszeniaFts } from './fts-ogloszenia'
import { highlightSnippet } from './highlight'
import { logSearchAnalytics } from './search-analytics'

export const globalSearch = async (db: D1DatabaseLike | undefined, query: string, limit = 20) => {
  const [articles, ogloszenia] = await Promise.all([
    searchArticlesFts(db, query, { limit: Math.ceil(limit * 0.5) }),
    searchOgloszeniaFts(db, query, { limit: Math.ceil(limit * 0.3) }),
  ])

  let events: Array<{ source: 'events'; title: string; slug: string; snippet: string; rank: number }> = []
  if (db) {
    const rows = await db
      .prepare('SELECT rowid, title, description, location_name, bm25(events_fts) as rank FROM events_fts WHERE events_fts MATCH ? ORDER BY rank LIMIT ?')
      .bind(`${query}*`, Math.max(1, limit - articles.items.length - ogloszenia.items.length))
      .all<{ rowid: number; title: string; description: string; location_name: string; rank: number }>()
    events = rows.results.map((row) => ({
      source: 'events' as const,
      title: row.title,
      slug: String(row.rowid),
      snippet: highlightSnippet(`${row.description} ${row.location_name}`, query),
      rank: row.rank * 1.1,
    }))
  }

  const items = [
    ...articles.items.map((item) => ({ ...item, source: 'articles' as const, rank: item.rank * 1.4 })),
    ...ogloszenia.items.map((item) => ({ ...item, source: 'ogloszenia' as const, rank: item.rank * 1.2 })),
    ...events,
  ].sort((left, right) => left.rank - right.rank).slice(0, limit)

  await logSearchAnalytics(db, query, items.length, 'global')
  return { total: items.length, items }
}
