/**
 * Trasy /api/search — WSZYSTKIE czytają z D1 (FTS5), nie z mocka.
 *
 * Historia: do 2026-07-28 ten plik importował statyczną tablicę ARTICLES
 * z data-articles.ts. Skutek zmierzony: autocomplete zwracał tytuły,
 * których nie było w bazie, a artykuł opublikowany w panelu nie istniał
 * dla wyszukiwarki. Warstwa FTS (search-service.ts) była gotowa i używana
 * przez stronę /szukaj — API jej nie używało. Teraz oba wejścia
 * (strona i API) korzystają z tego samego indeksu articles_szukaj.
 *
 * ZACHOWANIE PRZY BRAKU BAZY: search-service degraduje się do pustych
 * wyników z polem `zrodlo`/`ostrzezenie` — trasa przekazuje to dalej,
 * żeby degradacja była widoczna w diagnostyce, a nie ukryta.
 */
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { szukaj, podpowiedzi, zapytaniaBezWynikow } from '../../lib/search/search-service'
import { suggestSpelling } from '../../lib/search/spell-suggest'
import { adresArtykuluZBazy } from '../../v4/mapowanie-kategorii'
import { deleteJson, getJson, listByPrefix, putJson } from '../../lib/runtime-kv'
import { readJsonObject } from '../../lib/http/envelope'

export interface SearchResultItem {
  source: 'article' | 'category' | 'author' | 'tag'
  slug: string
  title: string
  category?: string
  author?: string
  tags?: string[]
  publishedAt?: string
  snippet: string
  url: string
}

export interface SearchFilters {
  filter?: string
  category?: string
  author?: string
  tag?: string
  from?: string
  to?: string
  sort?: 'relevance' | 'latest' | 'oldest'
}

interface SavedSearchRecord {
  id: string
  userId: string
  query: string
  filters: SearchFilters
  createdAt: string
}

interface QueryLogRecord {
  query: string
  normalized: string
  hits: number
  lastSeenAt: string
  zeroResultsCount: number
}

const route = new Hono<AppEnv>()
const normalizeQuery = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const savedKey = (userId: string, id: string) => `search:saved:${userId}:${id}`
const queryKey = (normalized: string) => `search:query:${normalized}`
const defaultSuggestions = ['kujawianka', 'sesja rady', 'wietrzychowice', 'mgck', 'inwestycje', 'osp', 'dopłaty', 'spzoz']

const getAuth = (c: Context<AppEnv>) => c.get('auth') as AuthJwtPayload | undefined

const ensureAdmin = (c: Context<AppEnv>) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  if (!['admin', 'editor'].includes(auth.role)) return c.json({ error: 'forbidden' }, 403)
  return null
}

/**
 * Wspólna ścieżka zapytania: FTS5 w D1 przez search-service.
 * Filtry `filter`/`category` mapują się na kategorię bazy; `sort` inne niż
 * relevance sortuje wynik strony (FTS zwraca wg bm25).
 */
export const runSearchQuery = async (env: Bindings, query: string, filters: SearchFilters = {}) => {
  const cleanQuery = query.trim()
  if (!cleanQuery) return { total: 0, items: [] as SearchResultItem[], zrodlo: 'puste' as const }

  const kategoria = filters.category || (filters.filter && filters.filter !== 'all' ? filters.filter : undefined)
  const odp = await szukaj(env.DB as never, cleanQuery, { kategoria, naStrone: 20 })

  let items: SearchResultItem[] = odp.wyniki.map((w) => ({
    source: 'article' as const,
    slug: w.slug,
    title: w.title,
    category: w.categorySlug ?? undefined,
    publishedAt: w.publishedAt ?? undefined,
    snippet: w.fragment ?? w.lead.slice(0, 180),
    url: adresArtykuluZBazy({ category_slug: w.categorySlug, subcategory_slug: w.subcategorySlug, slug: w.slug }),
  }))

  if (filters.sort === 'latest') items = [...items].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
  if (filters.sort === 'oldest') items = [...items].sort((a, b) => String(a.publishedAt || '').localeCompare(String(b.publishedAt || '')))
  return { total: odp.total, items, zrodlo: odp.zrodlo, ostrzezenie: odp.ostrzezenie }
}

/** Autouzupełnianie z indeksu FTS — tytuły opublikowanych artykułów z D1. */
export const getAutocompleteSuggestions = async (env: Bindings, query: string) => {
  const clean = normalizeQuery(query)
  if (!clean) return []
  const wyniki = await podpowiedzi(env.DB as never, query, 8)
  return wyniki.map((w) => w.title)
}

const getPopularQueries = async (env: Bindings) => {
  const stored = (await listByPrefix<QueryLogRecord>(env, 'SEARCH_SUGGESTIONS_KV', 'search:query:')).map((item) => item.value)
  if (stored.length === 0) {
    return defaultSuggestions.map((query, index) => ({ query, hits: defaultSuggestions.length - index, zeroResultsCount: 0, lastSeenAt: new Date().toISOString() }))
  }
  return stored.sort((a, b) => b.hits - a.hits)
}

export const logSearchQuery = async (env: Bindings, query: string, hits: number) => {
  const normalized = normalizeQuery(query)
  if (!normalized) return null
  const current = await getJson<QueryLogRecord>(env, 'SEARCH_SUGGESTIONS_KV', queryKey(normalized))
  const next: QueryLogRecord = {
    query,
    normalized,
    hits: (current?.hits || 0) + 1,
    lastSeenAt: new Date().toISOString(),
    zeroResultsCount: (current?.zeroResultsCount || 0) + (hits === 0 ? 1 : 0),
  }
  await putJson(env, 'SEARCH_SUGGESTIONS_KV', queryKey(normalized), next)
  return next
}

route.use('/saved', requireAuth)
route.use('/saved/*', requireAuth)
route.use('/zero-results', requireAuth)

route.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const filter = c.req.query('filter') || undefined
  const result = await runSearchQuery(c.env, q, { filter })
  return c.json({ query: q, filter, total: result.total, items: result.items, zrodlo: result.zrodlo })
})

route.get('/autocomplete', async (c) => {
  const q = c.req.query('q') || ''
  return c.json({ query: q, items: await getAutocompleteSuggestions(c.env, q) })
})

route.get('/suggestions', async (c) => {
  const items = await getPopularQueries(c.env)
  return c.json({ items: items.slice(0, 8) })
})

route.post('/log', async (c) => {
  const body = await readJsonObject(c)
  const query = typeof body.query === 'string' ? body.query : ''
  if (!query) return c.json({ error: 'missing_query' }, 400)
  const hits = typeof body.hits === 'number' ? body.hits : 0
  const entry = await logSearchQuery(c.env, query, hits)
  return c.json({ ok: true, entry })
})

route.get('/trending', async (c) => {
  const since = Date.now() - 24 * 60 * 60 * 1000
  const items = (await getPopularQueries(c.env)).filter((item) => Date.parse(item.lastSeenAt) >= since)
  return c.json({ items: items.slice(0, 10) })
})

route.get('/zero-results', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  // Dziennik zapytań bez wyników prowadzi teraz D1 (tabela search_queries)
  // — to samo źródło, do którego pisze search-service. KV zostaje jako
  // uzupełnienie dla starych wpisów.
  const zBazy = await zapytaniaBezWynikow(c.env.DB as never)
  if (zBazy.length > 0) return c.json({ items: zBazy })
  const items = (await getPopularQueries(c.env)).filter((item) => item.zeroResultsCount > 0)
  return c.json({ items })
})

route.get('/categories', async (c) => {
  const q = c.req.query('q') || ''
  if (!c.env.DB) return c.json({ items: [] })
  const like = `%${q.replace(/[%_]/g, '')}%`
  const rows = await c.env.DB
    .prepare(`SELECT slug, name, description, color_hex FROM categories WHERE name LIKE ?1 OR slug LIKE ?1 OR IFNULL(description,'') LIKE ?1 ORDER BY order_index LIMIT 30`)
    .bind(like)
    .all<{ slug: string; name: string; description: string | null; color_hex: string | null }>()
  return c.json({ items: (rows.results ?? []).map((r) => ({ slug: r.slug, title: r.name, description: r.description ?? '', color: r.color_hex ?? '' })) })
})

route.get('/authors', async (c) => {
  const q = c.req.query('q') || ''
  if (!c.env.DB) return c.json({ items: [] })
  const like = `%${q.replace(/[%_]/g, '')}%`
  const rows = await c.env.DB
    .prepare(
      `SELECT u.id, u.name, COUNT(a.id) AS articles
       FROM users u
       JOIN articles a ON a.author_id = u.id AND a.deleted_at IS NULL AND a.status = 'published'
       WHERE u.name LIKE ?1 AND u.deleted_at IS NULL
       GROUP BY u.id ORDER BY articles DESC LIMIT 30`,
    )
    .bind(like)
    .all<{ id: number; name: string; articles: number }>()
  return c.json({ items: (rows.results ?? []).map((r) => ({ id: String(r.id), name: r.name, articles: r.articles })) })
})

route.get('/tags', async (c) => {
  const q = c.req.query('q') || ''
  if (!c.env.DB) return c.json({ items: [] })
  const like = `%${q.replace(/[%_]/g, '')}%`
  const rows = await c.env.DB
    .prepare(
      `SELECT t.name AS tag, COUNT(at.article_id) AS count
       FROM tags t
       LEFT JOIN article_tags at ON at.tag_id = t.id
       WHERE (t.name LIKE ?1 OR t.slug LIKE ?1) AND t.deleted_at IS NULL
       GROUP BY t.id ORDER BY count DESC LIMIT 30`,
    )
    .bind(like)
    .all<{ tag: string; count: number }>()
  return c.json({ items: rows.results ?? [] })
})

route.get('/advanced', async (c) => {
  const result = await runSearchQuery(c.env, c.req.query('q') || '', {
    filter: c.req.query('filter') || undefined,
    category: c.req.query('category') || undefined,
    author: c.req.query('author') || undefined,
    tag: c.req.query('tag') || undefined,
    from: c.req.query('from') || undefined,
    to: c.req.query('to') || undefined,
    sort: (c.req.query('sort') as SearchFilters['sort']) || 'relevance',
  })
  return c.json(result)
})

route.post('/saved', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const body = await readJsonObject(c)
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return c.json({ error: 'missing_query' }, 400)
  const filters = typeof body.filters === 'object' && body.filters ? body.filters as SearchFilters : {}
  const record: SavedSearchRecord = { id: crypto.randomUUID(), userId: auth.sub, query, filters, createdAt: new Date().toISOString() }
  await putJson(c.env, 'USER_PREFS_KV', savedKey(auth.sub, record.id), record)
  return c.json({ ok: true, record }, 201)
})

route.get('/saved', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const items = (await listByPrefix<SavedSearchRecord>(c.env, 'USER_PREFS_KV', `search:saved:${auth.sub}:`)).map((item) => item.value)
  return c.json({ total: items.length, items })
})

route.delete('/saved/:id', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  await deleteJson(c.env, 'USER_PREFS_KV', savedKey(auth.sub, c.req.param('id')))
  return c.json({ ok: true, removed: c.req.param('id') })
})

route.get('/spell-check', async (c) => {
  const q = c.req.query('q') || ''
  if (!c.env.DB || !q) return c.json({ query: q, suggestion: null })
  // Słownik z żywych danych: tytuły opublikowanych artykułów + tagi + kategorie.
  const [tytuly, tagi, kategorie] = await Promise.all([
    c.env.DB.prepare(`SELECT title AS w FROM articles WHERE deleted_at IS NULL AND status='published' LIMIT 500`).all<{ w: string }>(),
    c.env.DB.prepare(`SELECT name AS w FROM tags WHERE deleted_at IS NULL LIMIT 500`).all<{ w: string }>(),
    c.env.DB.prepare(`SELECT name AS w FROM categories LIMIT 100`).all<{ w: string }>(),
  ])
  const dictionary = Array.from(new Set(
    [...(tytuly.results ?? []), ...(tagi.results ?? []), ...(kategorie.results ?? [])].map((r) => r.w.toLowerCase()),
  ))
  const suggestion = suggestSpelling(q.toLowerCase(), dictionary)
  return c.json({ query: q, suggestion })
})

export default route
