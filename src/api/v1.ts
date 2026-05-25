// SANDBOX B — task B7-B20: REST API v1 — endpointy backendu
// Hono sub-app mounted at /api/v1 — articles, categories, search, newsletter,
// incoming (n8n bridge), alerts, weather, fuel, comments, share-count
import { Hono } from 'hono'
import { ARTICLES, CATEGORIES_MAP, findArticle, articlesByCategory, searchArticles } from '../data-articles'
import type { AppEnv } from '../types/env'
import registerRoute from '../routes/auth/register'
import loginRoute from '../routes/auth/login'
import logoutRoute from '../routes/auth/logout'
import refreshRoute from '../routes/auth/refresh'
import magicLinkRoute from '../routes/auth/magic-link'
import verifyEmailRoute from '../routes/auth/verify-email'
import resetPasswordRoute from '../routes/auth/reset-password'
import changePasswordRoute from '../routes/auth/change-password'
import profileRoute from '../routes/auth/profile'
import deleteAccountRoute from '../routes/auth/delete-account'
import twoFactorEnableRoute from '../routes/auth/2fa-enable'
import twoFactorVerifyRoute from '../routes/auth/2fa-verify'
import socialGoogleRoute from '../routes/auth/social-google'
import socialFacebookRoute from '../routes/auth/social-facebook'
import apiKeysRoute from '../routes/auth/api-keys'
import sessionsRoute from '../routes/auth/sessions'

import mediaUploadRoute from '../routes/v1/media-upload'
import mediaListRoute from '../routes/v1/media-list'
import mediaDeleteRoute from '../routes/v1/media-delete'
import mediaTagRoute from '../routes/v1/media-tag'
import mediaSearchRoute from '../routes/v1/media-search'
import mediaBulkRoute from '../routes/v1/media-bulk'
import videoUploadRoute from '../routes/v1/video-upload'
import videoListRoute from '../routes/v1/video-list'
import videoDetailRoute from '../routes/v1/video-detail'
import audioUploadRoute from '../routes/v1/audio-upload'
import podcastFeedRoute from '../routes/v1/podcast-feed'
import multimediaRecentRoute from '../routes/v1/multimedia-recent'
import galleriesPublicRoute from '../routes/v1/galleries-public'
import galleryCreateRoute from '../routes/v1/gallery-create'
import galleryAddImageRoute from '../routes/v1/gallery-add-image'
import galleryReorderRoute from '../routes/v1/gallery-reorder'
import galleryPublishRoute from '../routes/v1/gallery-publish'

const api = new Hono<AppEnv>()

api.route('/auth', registerRoute)
api.route('/auth', loginRoute)
api.route('/auth', logoutRoute)
api.route('/auth', refreshRoute)
api.route('/auth', magicLinkRoute)
api.route('/auth', verifyEmailRoute)
api.route('/auth', resetPasswordRoute)
api.route('/auth', changePasswordRoute)
api.route('/auth', profileRoute)
api.route('/auth', deleteAccountRoute)
api.route('/auth', twoFactorEnableRoute)
api.route('/auth', twoFactorVerifyRoute)
api.route('/auth', socialGoogleRoute)
api.route('/auth', socialFacebookRoute)
api.route('/auth', apiKeysRoute)
api.route('/auth', sessionsRoute)

api.route('/media/upload', mediaUploadRoute)
api.route('/media/list', mediaListRoute)
api.route('/media/delete', mediaDeleteRoute)
api.route('/media/tag', mediaTagRoute)
api.route('/media/search', mediaSearchRoute)
api.route('/media/bulk', mediaBulkRoute)
api.route('/videos/upload', videoUploadRoute)
api.route('/videos/list', videoListRoute)
api.route('/videos/detail', videoDetailRoute)
api.route('/audio/upload', audioUploadRoute)
api.route('/podcast', podcastFeedRoute)
api.route('/multimedia/recent', multimediaRecentRoute)
api.route('/galleries', galleriesPublicRoute)
api.route('/galleries/create', galleryCreateRoute)
api.route('/galleries/add-image', galleryAddImageRoute)
api.route('/galleries/reorder', galleryReorderRoute)
api.route('/galleries/publish', galleryPublishRoute)

// ============ B7: HEALTH ============
api.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'izbica24-api',
    version: '1.0.0',
    time: new Date().toISOString(),
  })
)

// ============ B8: LIST ARTICLES ============
api.get('/articles', (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
  const offset = parseInt(c.req.query('offset') || '0')
  const category = c.req.query('category')

  let results = category ? articlesByCategory(category) : ARTICLES
  const total = results.length
  results = results.slice(offset, offset + limit)

  return c.json({
    total,
    limit,
    offset,
    items: results.map(a => ({
      slug: a.slug,
      category: a.category,
      categoryColor: a.categoryColor,
      title: a.title,
      lede: a.lede,
      author: a.author,
      publishedAt: a.publishedAt,
      readingMinutes: a.readingMinutes,
      heroImage: a.heroImage,
      tags: a.tags,
      url: `/wiadomosci/${a.slug}`,
    })),
  })
})

// ============ B9: ARTICLE DETAIL ============
api.get('/articles/:slug', (c) => {
  const slug = c.req.param('slug')
  const a = findArticle(slug)
  if (!a) return c.json({ error: 'article_not_found', slug }, 404)
  return c.json(a)
})

// ============ B10: CATEGORIES ============
api.get('/categories', (c) =>
  c.json({
    total: Object.keys(CATEGORIES_MAP).length,
    items: Object.entries(CATEGORIES_MAP).map(([slug, data]) => ({
      slug,
      ...data,
      count: articlesByCategory(slug).length,
    })),
  })
)

// ============ B11: CATEGORY DETAIL ============
api.get('/categories/:slug', (c) => {
  const slug = c.req.param('slug')
  const cat = CATEGORIES_MAP[slug]
  if (!cat) return c.json({ error: 'category_not_found', slug }, 404)
  const articles = articlesByCategory(slug)
  return c.json({
    slug,
    ...cat,
    count: articles.length,
    articles: articles.map(a => ({
      slug: a.slug,
      title: a.title,
      publishedAt: a.publishedAt,
    })),
  })
})

// ============ B12: SEARCH ============
api.get('/search', (c) => {
  const q = c.req.query('q') || ''
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50)
  const items = searchArticles(q).slice(0, limit)
  return c.json({
    query: q,
    total: items.length,
    items: items.map(a => ({
      slug: a.slug,
      title: a.title,
      lede: a.lede,
      category: a.category,
      publishedAt: a.publishedAt,
      url: `/wiadomosci/${a.slug}`,
    })),
  })
})

// ============ B13: NEWSLETTER SUBSCRIBE ============
api.post('/newsletter/subscribe', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; consent?: boolean }>()
    const email = (body.email || '').trim().toLowerCase()
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    if (!emailRegex.test(email)) {
      return c.json({ error: 'invalid_email', detail: 'Nieprawidłowy adres e-mail.' }, 400)
    }
    if (body.consent !== true) {
      return c.json({ error: 'consent_required', detail: 'Wymagana zgoda RODO.' }, 400)
    }
    // Mock: w produkcji → KV.put / D1 INSERT / Resend API
    return c.json({
      ok: true,
      email,
      status: 'pending_confirmation',
      message: 'Wysłaliśmy link aktywacyjny na podany adres.',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return c.json({ error: 'bad_request' }, 400)
  }
})

// ============ B14: NEWSLETTER UNSUBSCRIBE ============
api.get('/newsletter/unsubscribe', (c) => {
  const token = c.req.query('token')
  if (!token || token.length < 16) return c.json({ error: 'invalid_token' }, 400)
  return c.json({ ok: true, message: 'Wypisano z newslettera.' })
})

// ============ B15: ALERTS (Awarie/utrudnienia) ============
api.get('/alerts', (c) =>
  c.json({
    updatedAt: new Date().toISOString(),
    summary: { ok: 2, warn: 2, high: 0 },
    items: [
      { id: 'al-1', kind: 'prad', status: 'ok',   title: 'Brak planowanych wyłączeń', source: 'Energa', updated: '06:00' },
      { id: 'al-2', kind: 'woda', status: 'warn', title: 'Płukanie sieci — Smolsk, Naczachowo', source: 'ZGK', window: '25.05 · 9:00–13:00' },
      { id: 'al-3', kind: 'cieplo', status: 'ok', title: 'Sezon grzewczy zakończony', source: 'MEC' },
      { id: 'al-4', kind: 'internet', status: 'warn', title: 'Słaby zasięg LTE — Modzerowo', source: 'T-Mobile/Plus', reported: '24.05' },
    ],
  })
)

// ============ B16: ROADS / TRAFFIC ============
api.get('/roads', (c) =>
  c.json({
    updatedAt: new Date().toISOString(),
    items: [
      { id: 'r-1', road: 'DK62', severity: 'high', desc: 'Remont nawierzchni Izbica–Lubraniec', km: '18+200', until: '5 czerwca' },
      { id: 'r-2', road: 'S10',  severity: 'med',  desc: 'Utrudnienia węzeł Włocławek-Wschód', when: 'po 16:00' },
      { id: 'r-3', road: 'DW270', severity: 'ok',  desc: 'Otwarte bez utrudnień' },
      { id: 'r-4', road: 'PKS',  severity: 'med',  desc: 'Linia Izbica–Włocławek — opóźnienia 10–15 min' },
    ],
  })
)

// ============ B17: WEATHER ============
api.get('/weather', (c) =>
  c.json({
    location: 'Izbica Kujawska',
    coords: { lat: 52.4214, lon: 18.7714 },
    current: { temp: 14, condition: 'częściowe zachmurzenie', humidity: 68, wind: 12 },
    forecast: [
      { day: 'wt', tempMin: 9, tempMax: 16, icon: 'cloud-sun' },
      { day: 'śr', tempMin: 11, tempMax: 19, icon: 'sun' },
      { day: 'cz', tempMin: 12, tempMax: 21, icon: 'sun' },
      { day: 'pt', tempMin: 13, tempMax: 18, icon: 'cloud-rain' },
      { day: 'so', tempMin: 11, tempMax: 17, icon: 'cloud' },
    ],
    source: 'mock', updatedAt: new Date().toISOString(),
  })
)

// ============ B18: FUEL PRICES ============
api.get('/fuel', (c) =>
  c.json({
    updatedAt: new Date().toISOString(),
    stations: [
      { name: 'Orlen Izbica', pb95: 6.49, on: 6.59, lpg: 3.19, trend: { pb95: 'down', on: 'flat' } },
      { name: 'Circle K Włocławek', pb95: 6.51, on: 6.61, lpg: 3.21, trend: { pb95: 'up' } },
      { name: 'BP Brześć Kujawski', pb95: 6.47, on: 6.57, lpg: 3.17, trend: { pb95: 'down' } },
      { name: 'Shell Włocławek-Płd.', pb95: 6.55, on: 6.63, lpg: 3.25, trend: { pb95: 'flat' } },
    ],
  })
)

// ============ B19: INCOMING (n8n → izbica24 bridge) ============
api.post('/incoming', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  try {
    const body = await c.req.json<{ source?: string; payload?: any }>()
    if (!body.source || !body.payload) {
      return c.json({ error: 'missing_fields', required: ['source', 'payload'] }, 400)
    }
    // Mock: tu n8n → kolejka publikacji w WordPress lub do D1
    return c.json({
      ok: true,
      received: { source: body.source, items: Array.isArray(body.payload) ? body.payload.length : 1 },
      queueId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return c.json({ error: 'bad_request' }, 400)
  }
})

// ============ B20: COMMENT SUBMIT ============
api.post('/articles/:slug/comments', async (c) => {
  const slug = c.req.param('slug')
  const a = findArticle(slug)
  if (!a) return c.json({ error: 'article_not_found' }, 404)
  try {
    const body = await c.req.json<{ name?: string; email?: string; text?: string; consent?: boolean }>()
    if (!body.name || !body.text || !body.email) {
      return c.json({ error: 'missing_fields', required: ['name', 'email', 'text'] }, 400)
    }
    if (body.text.length < 10 || body.text.length > 2000) {
      return c.json({ error: 'text_length', detail: 'Komentarz: 10–2000 znaków.' }, 400)
    }
    if (body.consent !== true) {
      return c.json({ error: 'consent_required' }, 400)
    }
    return c.json({
      ok: true,
      commentId: `c_${Date.now()}`,
      status: 'pending_moderation',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return c.json({ error: 'bad_request' }, 400)
  }
})

// ============ B20b: COMMENT SUBMIT (alias endpoint /comments) ============
api.post('/comments', async (c) => {
  try {
    const body = await c.req.json<{ articleSlug?: string; name?: string; email?: string; text?: string; consent?: boolean }>()
    if (!body.articleSlug) return c.json({ error: 'missing_fields', required: ['articleSlug'] }, 400)
    const article = findArticle(body.articleSlug)
    if (!article) return c.json({ error: 'article_not_found' }, 404)
    if (!body.name || !body.text || !body.email) {
      return c.json({ error: 'missing_fields', required: ['name', 'email', 'text'] }, 400)
    }
    if (body.text.length < 10 || body.text.length > 2000) {
      return c.json({ error: 'text_length', detail: 'Komentarz: 10–2000 znaków.' }, 400)
    }
    if (body.consent !== true) {
      return c.json({ error: 'consent_required' }, 400)
    }
    return c.json({
      ok: true,
      commentId: `c_${Date.now()}`,
      status: 'pending_moderation',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return c.json({ error: 'bad_request' }, 400)
  }
})

// ============ B21: SHARE COUNT ============
api.post('/articles/:slug/share', async (c) => {
  const slug = c.req.param('slug')
  const a = findArticle(slug)
  if (!a) return c.json({ error: 'article_not_found' }, 404)
  // Mock: w produkcji → KV INCREMENT
  const fake = Math.floor(Math.random() * 200) + 50
  return c.json({ slug, shareCount: fake, ts: new Date().toISOString() })
})

// ============ B22: RAG SEARCH ============
api.get('/rag/search', (c) => {
  const q = c.req.query('q') || ''
  if (q.length < 3) return c.json({ error: 'query_too_short', minLength: 3 }, 400)
  return c.json({
    query: q,
    results: [
      { chunkId: 'doc1-c12', score: 0.847, source: 'README.md', snippet: 'Wynik z bazy wiedzy projektu...' },
      { chunkId: 'doc2-c08', score: 0.712, source: 'plan.md', snippet: 'Inny wynik...' },
    ],
    elapsedMs: 42,
  })
})

// ============ B23: COMMUNITY EVENTS ============
api.get('/events', (c) => {
  const week = c.req.query('week')
  return c.json({
    week: week || 'current',
    items: [
      { day: 'PN', date: '25.05', title: 'Sesja KGW Sadłno', time: '17:00', loc: 'Sadłno, świetlica' },
      { day: 'WT', date: '26.05', title: 'Spotkanie OSP', time: '18:00', loc: 'Izbica, remiza' },
      { day: 'ŚR', date: '27.05', title: 'Sesja Rady Miejskiej', time: '18:00', loc: 'UMiG, sala konferencyjna' },
      { day: 'CZ', date: '28.05', title: 'Wernisaż MGCK — fotografia', time: '17:30', loc: 'MGCK Izbica' },
      { day: 'PT', date: '29.05', title: 'Koncert w bibliotece', time: '19:00', loc: 'Biblioteka MGCK' },
      { day: 'SO', date: '30.05', title: 'Mecz Kujawianka–Polonia', time: '17:00', loc: 'Stadion Izbica' },
      { day: 'ND', date: '31.05', title: 'Festyn rodzinny w Mchówku', time: '14:00', loc: 'Mchówek, świetlica' },
    ],
  })
})

// ============ B24: DUTY PHARMACY ============
api.get('/duty', (c) =>
  c.json({
    date: '25 maja 2026',
    pharmacy: { name: 'Apteka Pod Wagą', address: 'ul. Rynek 4, Izbica Kujawska', phone: '54 287 12 34', hours: '8:00–22:00' },
    doctor: { name: 'Dr Maria Kowalska', practice: 'NZOZ Centrum', phone: '54 287 56 78' },
    osp: { unit: 'OSP Izbica', phone: '998 / 54 287 99 11' },
  })
)

export default api
