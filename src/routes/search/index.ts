import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { ARTICLES, CATEGORIES_MAP } from '../../data-articles'
import { globalSearch } from '../../lib/search/global-search'
import { suggestSpelling } from '../../lib/search/spell-suggest'
import { deleteJson, getJson, listByPrefix, putJson } from '../../lib/runtime-kv'

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
const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const normalizeQuery = (value: string) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char))
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

const highlightSnippet = (text: string, query: string) => {
  const clean = stripHtml(text)
  if (!query) return clean.slice(0, 180)
  const index = clean.toLowerCase().indexOf(query.toLowerCase())
  const start = index >= 0 ? Math.max(0, index - 60) : 0
  const snippet = clean.slice(start, start + 180)
  const safeSnippet = escapeHtml(snippet)
  return safeSnippet.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>')
}

const matches = (haystack: string, needle: string) => normalizeQuery(haystack).includes(normalizeQuery(needle))

export const runSearchQuery = async (env: Bindings, query: string, filters: SearchFilters = {}) => {
  const cleanQuery = query.trim()
  if (!cleanQuery) return { total: 0, items: [] as SearchResultItem[] }

  const fts = await globalSearch(env.DB, cleanQuery, 20).catch(() => ({ total: 0, items: [] as Array<Record<string, unknown>> }))
  if (fts.items.length > 0) {
    return {
      total: fts.items.length,
      items: fts.items.map((item) => ({
        source: 'article' as const,
        slug: String(item.slug),
        title: String(item.title),
        category: typeof item.category === 'string' ? item.category : undefined,
        snippet: typeof item.snippet === 'string' ? item.snippet : '',
        url: String(item.source) === 'events' ? `/kalendarz/${item.slug}` : `/wiadomosci/${item.slug}`,
      })),
    }
  }

  let items: SearchResultItem[] = ARTICLES
    .filter((article) => {
      const combined = [article.title, article.lede, stripHtml(article.body.join(' ')), article.author, ...(article.tags || [])].join(' ')
      if (!matches(combined, cleanQuery)) return false
      if (filters.filter && filters.filter !== 'all' && filters.filter !== article.category) return false
      if (filters.category && article.category !== filters.category) return false
      if (filters.author && article.author !== filters.author) return false
      if (filters.tag && !(article.tags || []).includes(filters.tag)) return false
      return true
    })
    .map((article) => ({
      source: 'article' as const,
      slug: article.slug,
      title: article.title,
      category: article.category,
      author: article.author,
      tags: article.tags,
      publishedAt: article.publishedAt,
      snippet: highlightSnippet(`${article.lede} ${article.body.join(' ')}`, cleanQuery),
      url: `/wiadomosci/${article.slug}`,
    }))

  if (filters.sort === 'latest') items = [...items].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
  if (filters.sort === 'oldest') items = [...items].sort((a, b) => String(a.publishedAt || '').localeCompare(String(b.publishedAt || '')))
  return { total: items.length, items }
}

export const getAutocompleteSuggestions = (query: string) => {
  const clean = normalizeQuery(query)
  if (!clean) return []
  const suggestions = new Set<string>()
  for (const article of ARTICLES) {
    if (normalizeQuery(article.title).includes(clean)) suggestions.add(article.title)
    for (const tag of article.tags || []) {
      if (normalizeQuery(tag).includes(clean)) suggestions.add(tag)
    }
    if (normalizeQuery(article.author).includes(clean)) suggestions.add(article.author)
  }
  return Array.from(suggestions).slice(0, 8)
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
  return c.json({ query: q, filter, total: result.total, items: result.items })
})

route.get('/autocomplete', (c) => {
  const q = c.req.query('q') || ''
  return c.json({ query: q, items: getAutocompleteSuggestions(q) })
})

route.get('/suggestions', async (c) => {
  const items = await getPopularQueries(c.env)
  return c.json({ items: items.slice(0, 8) })
})

route.post('/log', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
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
  const items = (await getPopularQueries(c.env)).filter((item) => item.zeroResultsCount > 0)
  return c.json({ items })
})

route.get('/categories', (c) => {
  const q = c.req.query('q') || ''
  const items = Object.entries(CATEGORIES_MAP)
    .filter(([slug, meta]) => matches(`${slug} ${meta.title} ${meta.description}`, q))
    .map(([slug, meta]) => ({ slug, title: meta.title, description: meta.description, color: meta.color }))
  return c.json({ items })
})

route.get('/authors', (c) => {
  const q = c.req.query('q') || ''
  const items = Array.from(new Set(ARTICLES.map((article) => article.author)))
    .filter((author) => matches(author, q))
    .map((author) => ({ id: encodeURIComponent(author), name: author, articles: ARTICLES.filter((item) => item.author === author).length }))
  return c.json({ items })
})

route.get('/tags', (c) => {
  const q = c.req.query('q') || ''
  const items = Array.from(new Set(ARTICLES.flatMap((article) => article.tags || [])))
    .filter((tag) => matches(tag, q))
    .map((tag) => ({ tag, count: ARTICLES.filter((article) => (article.tags || []).includes(tag)).length }))
  return c.json({ items })
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
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
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

route.get('/spell-check', (c) => {
  const q = c.req.query('q') || ''
  const dictionary = Array.from(new Set([
    ...ARTICLES.map((article) => article.title),
    ...ARTICLES.flatMap((article) => article.tags || []),
    ...Object.values(CATEGORIES_MAP).map((category) => category.title),
  ].map((item) => item.toLowerCase())))
  const suggestion = suggestSpelling(q.toLowerCase(), dictionary)
  return c.json({ query: q, suggestion })
})

export default route
