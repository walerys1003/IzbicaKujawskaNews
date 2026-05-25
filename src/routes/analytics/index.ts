import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { deleteJson, listByPrefix, putJson } from '../../lib/runtime-kv'
import { ARTICLES } from '../../data-articles'

interface AnalyticsRecordBase {
  id: string
  type: 'pageview' | 'event' | 'session-start' | 'session-end'
  sessionId?: string
  path: string
  articleSlug?: string
  category?: string
  author?: string
  referrer: string
  country: string
  browser: string
  device: 'mobile' | 'tablet' | 'desktop'
  timestamp: string
}

export interface PageviewRecord extends AnalyticsRecordBase {
  type: 'pageview'
  title?: string
}

export interface EventRecord extends AnalyticsRecordBase {
  type: 'event'
  eventName: string
  value?: string
}

export interface SessionRecord {
  id: string
  sessionId: string
  startedAt: string
  endedAt?: string
  country: string
  browser: string
  device: 'mobile' | 'tablet' | 'desktop'
  landingPath: string
}

interface DailyRollup {
  date: string
  pageviews: number
  sessions: number
  uniqueArticles: number
}

const route = new Hono<AppEnv>()
const bufferKey = (id: string) => `analytics:buffer:${id}`
const sessionKey = (id: string) => `analytics:session:${id}`
const rollupKey = (date: string) => `analytics:daily:${date}`

const getAuth = (c: Context<AppEnv>) => c.get('auth') as AuthJwtPayload | undefined

const ensureAdmin = (c: Context<AppEnv>) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  if (!['admin', 'editor'].includes(auth.role)) return c.json({ error: 'forbidden' }, 403)
  return null
}

const inferDevice = (userAgent: string): 'mobile' | 'tablet' | 'desktop' => {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  if (/mobi|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

const inferBrowser = (userAgent: string) => {
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/edg/i.test(userAgent)) return 'Edge'
  if (/chrome/i.test(userAgent)) return 'Chrome'
  if (/safari/i.test(userAgent)) return 'Safari'
  return 'Other'
}

const pickArticleMeta = (slug?: string) => {
  const article = slug ? ARTICLES.find((item) => item.slug === slug) : undefined
  return article
    ? { category: article.category, author: article.author, title: article.title }
    : { category: undefined, author: undefined, title: undefined }
}

const extractBase = (c: Context<AppEnv>, type: AnalyticsRecordBase['type'], body: Record<string, unknown>): AnalyticsRecordBase => {
  const userAgent = c.req.header('User-Agent') || ''
  const articleSlug = typeof body.articleSlug === 'string' ? body.articleSlug : undefined
  const articleMeta = pickArticleMeta(articleSlug)
  return {
    id: crypto.randomUUID(),
    type,
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    path: typeof body.path === 'string' ? body.path : c.req.header('Referer') || '/',
    articleSlug,
    category: typeof body.category === 'string' ? body.category : articleMeta.category,
    author: typeof body.author === 'string' ? body.author : articleMeta.author,
    referrer: typeof body.referrer === 'string' ? body.referrer : (c.req.header('Referer') || 'direct'),
    country: c.req.header('CF-IPCountry') || 'PL',
    browser: inferBrowser(userAgent),
    device: inferDevice(userAgent),
    timestamp: new Date().toISOString(),
  }
}

const getBufferedRecords = async (env: Bindings) => (await listByPrefix<Record<string, unknown>>(env, 'ANALYTICS_BUFFER_KV', 'analytics:buffer:'))
  .map((item) => item.value)
  .sort((left, right) => String(left.timestamp ?? '').localeCompare(String(right.timestamp ?? '')))

const getStoredSessions = async (env: Bindings) => (await listByPrefix<SessionRecord>(env, 'ANALYTICS_BUFFER_KV', 'analytics:session:'))
  .map((item) => item.value)

const getRollups = async (env: Bindings) => (await listByPrefix<DailyRollup>(env, 'ANALYTICS_BUFFER_KV', 'analytics:daily:'))
  .map((item) => item.value)

const parseDate = (value: string | undefined, fallback: number) => value ? Date.parse(value) : fallback

const inRange = (timestamp: string, from?: string, to?: string) => {
  const value = Date.parse(timestamp)
  return value >= parseDate(from, 0) && value <= parseDate(to, Date.now())
}

const periodToWindowMs = (period: string) => {
  if (period === '24h') return 24 * 60 * 60 * 1000
  if (period === '30d') return 30 * 24 * 60 * 60 * 1000
  return 7 * 24 * 60 * 60 * 1000
}

const aggregateCount = <T extends string>(items: T[]) => Object.entries(items.reduce<Record<string, number>>((acc, item) => {
  acc[item] = (acc[item] || 0) + 1
  return acc
}, {})).map(([key, value]) => ({ key, value })).sort((left, right) => right.value - left.value)

const flushRecordsToD1 = async (env: Bindings, records: Record<string, unknown>[]) => {
  if (!env.DB || records.length === 0) return { inserted: 0, skipped: !env.DB }
  let inserted = 0
  for (const record of records) {
    const type = String(record.type || '')
    if (type === 'pageview') {
      await env.DB.prepare(
        'INSERT INTO analytics_pageviews (id, session_id, path, article_slug, category_slug, author_name, referrer, country, browser, device, title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        record.id,
        record.sessionId ?? null,
        record.path,
        record.articleSlug ?? null,
        record.category ?? null,
        record.author ?? null,
        record.referrer,
        record.country,
        record.browser,
        record.device,
        record.title ?? null,
        record.timestamp,
      ).run()
      inserted += 1
    } else if (type === 'event') {
      await env.DB.prepare(
        'INSERT INTO analytics_events (id, session_id, path, article_slug, category_slug, event_name, event_value, referrer, country, browser, device, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        record.id,
        record.sessionId ?? null,
        record.path,
        record.articleSlug ?? null,
        record.category ?? null,
        record.eventName ?? null,
        record.value ?? null,
        record.referrer,
        record.country,
        record.browser,
        record.device,
        record.timestamp,
      ).run()
      inserted += 1
    }
  }
  return { inserted, skipped: false }
}

export const flushAnalyticsBuffer = async (env: Bindings) => {
  const records = await getBufferedRecords(env)
  const pageviews = records.filter((item) => item.type === 'pageview')
  const sessions = await getStoredSessions(env)
  const today = new Date().toISOString().slice(0, 10)
  const rollup: DailyRollup = {
    date: today,
    pageviews: pageviews.length,
    sessions: sessions.filter((item) => item.startedAt.startsWith(today)).length,
    uniqueArticles: new Set(pageviews.map((item) => String(item.articleSlug ?? '')).filter(Boolean)).size,
  }
  await putJson(env, 'ANALYTICS_BUFFER_KV', rollupKey(today), rollup)
  const d1Result = await flushRecordsToD1(env, records)
  await Promise.all(records.map((item) => deleteJson(env, 'ANALYTICS_BUFFER_KV', bufferKey(String(item.id)))))
  return { flushed: records.length, d1Inserted: d1Result.inserted, skipped: d1Result.skipped }
}

route.use('/dashboard', requireAuth)
route.use('/pageviews', requireAuth)
route.use('/top-articles', requireAuth)
route.use('/top-categories', requireAuth)
route.use('/top-referrers', requireAuth)
route.use('/devices', requireAuth)
route.use('/browsers', requireAuth)
route.use('/countries', requireAuth)
route.use('/hourly-traffic', requireAuth)
route.use('/daily-traffic', requireAuth)
route.use('/realtime', requireAuth)
route.use('/article/*', requireAuth)
route.use('/author/*', requireAuth)
route.use('/export.csv', requireAuth)
route.use('/funnel', requireAuth)
route.use('/flush-buffer', requireAuth)

route.post('/pageview', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
  const base = extractBase(c, 'pageview', body)
  const record: PageviewRecord = { ...base, type: 'pageview', title: pickArticleMeta(base.articleSlug).title }
  await putJson(c.env, 'ANALYTICS_BUFFER_KV', bufferKey(record.id), record)
  return c.json({ ok: true, record })
})

route.post('/event', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
  if (typeof body.eventName !== 'string' || !body.eventName) return c.json({ error: 'missing_event_name' }, 400)
  const base = extractBase(c, 'event', body)
  const record: EventRecord = {
    ...base,
    type: 'event',
    eventName: body.eventName,
    value: typeof body.value === 'string' ? body.value : undefined,
  }
  await putJson(c.env, 'ANALYTICS_BUFFER_KV', bufferKey(record.id), record)
  return c.json({ ok: true, record })
})

route.post('/session-start', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
  const userAgent = c.req.header('User-Agent') || ''
  const sessionId = typeof body.sessionId === 'string' && body.sessionId ? body.sessionId : crypto.randomUUID()
  const record: SessionRecord = {
    id: crypto.randomUUID(),
    sessionId,
    startedAt: new Date().toISOString(),
    country: c.req.header('CF-IPCountry') || 'PL',
    browser: inferBrowser(userAgent),
    device: inferDevice(userAgent),
    landingPath: typeof body.path === 'string' ? body.path : '/',
  }
  await putJson(c.env, 'ANALYTICS_BUFFER_KV', sessionKey(sessionId), record)
  return c.json({ ok: true, session: record }, 201)
})

route.post('/session-end', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  if (!sessionId) return c.json({ error: 'missing_session_id' }, 400)
  const existing = await listByPrefix<SessionRecord>(c.env, 'ANALYTICS_BUFFER_KV', sessionKey(sessionId))
  const record = existing[0]?.value
  if (!record) return c.json({ error: 'session_not_found' }, 404)
  const updated = { ...record, endedAt: new Date().toISOString() }
  await putJson(c.env, 'ANALYTICS_BUFFER_KV', sessionKey(sessionId), updated)
  return c.json({ ok: true, session: updated })
})

route.get('/dashboard', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const records = await getBufferedRecords(c.env)
  const pageviews = records.filter((item) => item.type === 'pageview')
  const events = records.filter((item) => item.type === 'event')
  const sessions = await getStoredSessions(c.env)
  return c.json({
    widgets: {
      pageviews: pageviews.length,
      events: events.length,
      sessions: sessions.length,
      activeLast5m: records.filter((item) => Date.now() - Date.parse(String(item.timestamp ?? '')) <= 5 * 60 * 1000).length,
    },
  })
})

route.get('/pageviews', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const from = c.req.query('from')
  const to = c.req.query('to')
  const category = c.req.query('category')
  const items = (await getBufferedRecords(c.env))
    .filter((item) => item.type === 'pageview')
    .filter((item) => inRange(String(item.timestamp ?? ''), from, to))
    .filter((item) => !category || item.category === category)
  return c.json({ total: items.length, items })
})

route.get('/top-articles', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const limit = Math.max(1, Math.min(Number(c.req.query('limit') || '20'), 50))
  const period = c.req.query('period') || '7d'
  const since = Date.now() - periodToWindowMs(period)
  const rows = aggregateCount(
    (await getBufferedRecords(c.env))
      .filter((item) => item.type === 'pageview' && item.articleSlug && Date.parse(String(item.timestamp ?? '')) >= since)
      .map((item) => String(item.articleSlug))
  ).slice(0, limit)
  return c.json({ period, items: rows.map((row) => ({ slug: row.key, views: row.value })) })
})

route.get('/top-categories', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = aggregateCount((await getBufferedRecords(c.env)).map((item) => String(item.category || 'inne')))
  return c.json({ items })
})

route.get('/top-referrers', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = aggregateCount((await getBufferedRecords(c.env)).map((item) => String(item.referrer || 'direct')))
  return c.json({ items })
})

route.get('/devices', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  return c.json({ items: aggregateCount((await getBufferedRecords(c.env)).map((item) => String(item.device || 'desktop'))) })
})

route.get('/browsers', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  return c.json({ items: aggregateCount((await getBufferedRecords(c.env)).map((item) => String(item.browser || 'Other'))) })
})

route.get('/countries', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  return c.json({ items: aggregateCount((await getBufferedRecords(c.env)).map((item) => String(item.country || 'PL'))) })
})

route.get('/hourly-traffic', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const buckets = new Map<string, number>()
  for (const item of await getBufferedRecords(c.env)) {
    const key = String(item.timestamp || '').slice(0, 13) + ':00'
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }
  return c.json({ items: Array.from(buckets.entries()).map(([hour, views]) => ({ hour, views })).sort((a, b) => a.hour.localeCompare(b.hour)) })
})

route.get('/daily-traffic', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const rollups = await getRollups(c.env)
  return c.json({ items: rollups.sort((a, b) => a.date.localeCompare(b.date)) })
})

route.get('/realtime', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = (await getBufferedRecords(c.env))
    .filter((item) => Date.now() - Date.parse(String(item.timestamp ?? '')) <= 5 * 60 * 1000)
    .sort((left, right) => String(right.timestamp ?? '').localeCompare(String(left.timestamp ?? '')))
  return c.json({ total: items.length, items })
})

route.get('/article/:slug', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const slug = c.req.param('slug')
  const items = (await getBufferedRecords(c.env)).filter((item) => item.articleSlug === slug)
  return c.json({ slug, pageviews: items.filter((item) => item.type === 'pageview').length, events: items.filter((item) => item.type === 'event').length, items })
})

route.get('/author/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const author = decodeURIComponent(c.req.param('id'))
  const items = (await getBufferedRecords(c.env)).filter((item) => item.author === author)
  return c.json({ author, views: items.filter((item) => item.type === 'pageview').length, items })
})

route.post('/export.csv', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const rows = (await getBufferedRecords(c.env)).map((item) => [
    item.type,
    item.path,
    item.articleSlug ?? '',
    item.category ?? '',
    item.referrer ?? '',
    item.country ?? '',
    item.browser ?? '',
    item.device ?? '',
    item.timestamp ?? '',
  ])
  const csv = ['type,path,article_slug,category,referrer,country,browser,device,timestamp', ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n')
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', 'attachment; filename="analytics-export.csv"')
  return c.body(csv)
})

route.get('/funnel', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = await getBufferedRecords(c.env)
  const landing = items.filter((item) => item.type === 'pageview' && item.path === '/').length
  const article = items.filter((item) => item.type === 'pageview' && String(item.path || '').startsWith('/wiadomosci/')).length
  const comment = items.filter((item) => item.type === 'event' && item.eventName === 'comment_submit').length
  const subscribe = items.filter((item) => item.type === 'event' && item.eventName === 'newsletter_subscribe').length
  return c.json({ steps: [
    { name: 'landing', count: landing },
    { name: 'article', count: article },
    { name: 'comment', count: comment },
    { name: 'subscription', count: subscribe },
  ] })
})

route.post('/flush-buffer', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const result = await flushAnalyticsBuffer(c.env)
  return c.json({ ok: true, ...result })
})

export default route
