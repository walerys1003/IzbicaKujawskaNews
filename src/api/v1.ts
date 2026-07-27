// SANDBOX B — task B7-B20: REST API v1 — endpointy backendu
// Hono sub-app mounted at /api/v1 — articles, categories, newsletter (mounted router),
// search (mounted router), incoming (n8n bridge), alerts, weather, fuel, comments, share-count
import { Hono } from 'hono'
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
import newsletterRouter from '../routes/newsletter'
import searchRouter from '../routes/search'
// FAZA 1 / A7 — komentarze z sanityzacją, limitem tempa i realnym zapisem do D1
import commentsRoute from '../routes/v1/comments'
// FAZA 1 / I4b — zadania cykliczne wywoływane przez zewnętrzny harmonogram
import cronRoute from '../routes/v1/cron'
// FAZA 2 / A4 + B4 + D9 — artykuły na D1: odczyt publiczny i pełny cykl życia
import articlesPublicRoute from '../routes/v1/articles-public'
import articlesAdminRoute from '../routes/v1/articles'
import categoriesRoute from '../routes/v1/categories'
// FAZA 2 / B5 — rejestr schematów walidacji jako dokumentacja API
import schemasRoute from '../routes/v1/schemas'
// FAZA 3 / AI1 + AI2 + AI8 + AI10 — dostawca modelu, test polaczenia,
// generowanie strumieniowe i rejestr kosztow
import aiRoute from '../routes/v1/ai'

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

// Komentarze — moduł definiuje własne pełne ścieżki
// (/articles/:slug/comments oraz alias /comments), dlatego montowany w korzeniu.
api.route('/', commentsRoute)
// Zadania cykliczne — POST /api/v1/cron/run, chronione sekretem CRON_SECRET.
api.route('/cron', cronRoute)

// Mount standalone routers (newsletter + search) for D1-backed endpoints
api.route('/newsletter', newsletterRouter)
api.route('/search', searchRouter)

// ============ B7: HEALTH ============
api.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'izbica24-api',
    version: '1.0.0',
    time: new Date().toISOString(),
  })
)

// ════════════════════════════════════════════════════════════════════════════
// FAZA 2 / A4 — artykuly i kategorie czytane z D1
//
// Trasy `/articles` oraz `/categories` czytaly tablice `ARTICLES`
// i `CATEGORIES_MAP` wkompilowane w plik zrodlowy. Skutek: cokolwiek
// redakcja zapisala w bazie, API zwracalo te same 30 tekstow. Publikacja
// nie mogla dzialac, bo nie istniala droga od bazy do odpowiedzi HTTP.
//
// Teraz:
//   • `/articles`       → src/routes/v1/articles-public.ts  (tylko published)
//   • `/admin/articles` → src/routes/v1/articles.ts         (pelny cykl zycia)
//   • `/categories`     → z tabeli `categories` z realnym licznikiem
// ════════════════════════════════════════════════════════════════════════════
api.route('/articles', articlesPublicRoute)
api.route('/admin/articles', articlesAdminRoute)
api.route('/categories', categoriesRoute)
api.route('/schemas', schemasRoute)
api.route('/ai', aiRoute)

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

// ════════════════════════════════════════════════════════════════════════════
// KOMENTARZE — przeniesione do src/routes/v1/comments.ts (FAZA 1 / A7)
//
// Były tu DWIE skopiowane implementacje (`/articles/:slug/comments` i
// `/comments`), które NIE ZAPISYWAŁY komentarza do bazy — zwracały
// zmyślone `c_<timestamp>` i status „pending_moderation”, więc mieszkaniec
// widział potwierdzenie, a treść przepadała i redakcja nie miała czego
// moderować. Nie sanityzowały też treści ani nie ograniczały tempa zgłoszeń.
//
// Zastąpione jednym modułem z walidacją, sanityzacją (profil komentarzowy),
// limitem 3 zgłoszeń na 10 minut, honeypotem i realnym zapisem do D1.
// Montowane niżej: api.route('/', commentsRoute)
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// FAZA 2 — licznik udostepnien
//
// Poprzednia wersja zwracala `Math.random() * 200 + 50`. Redakcja widziala
// w panelu „187 udostepnien” dla tekstu, ktorego nikt nie udostepnil, a przy
// kazdym odswiezeniu strony liczba byla inna. Dane, ktore zmieniaja sie same,
// sa gorsze niz brak danych — na ich podstawie podejmowano by decyzje o tym,
// co promowac na czolowce.
//
// Teraz licznik jest realny: rosnie w `analytics_events`, a odpowiedz podaje
// faktyczna liczbe zdarzen dla tego artykulu.
// ════════════════════════════════════════════════════════════════════════════
api.post('/articles/:slug/share', async (c) => {
  const slug = c.req.param('slug')
  if (!c.env.DB) return c.json({ ok: false, error: { code: 'database_unavailable' } }, 503)

  const article = await c.env.DB.prepare(
    `SELECT id FROM articles WHERE slug = ? AND status = 'published' AND deleted_at IS NULL LIMIT 1`,
  )
    .bind(slug)
    .first<{ id: number }>()
  if (!article) return c.json({ ok: false, error: { code: 'not_found' } }, 404)

  const channel = (await c.req.json().catch(() => ({}))) as { channel?: string }
  const allowed = ['facebook', 'x', 'linkedin', 'whatsapp', 'email', 'link']
  const kanal = allowed.includes(String(channel.channel)) ? String(channel.channel) : 'link'

  // `analytics_events` ma klucz TEXT nadawany przez aplikacje (nie AUTOINCREMENT),
  // a `path` i `event_name` sa NOT NULL — bez nich INSERT zostalby odrzucony.
  await c.env.DB.prepare(
    `INSERT INTO analytics_events (id, path, article_slug, event_name, event_value, referrer)
     VALUES (?, ?, ?, 'share', ?, ?)`,
  )
    .bind(crypto.randomUUID(), `/artykul/${slug}`, slug, kanal, c.req.header('referer') ?? 'direct')
    .run()
    .catch((error) => {
      // Blad telemetrii nie moze wywrocic akcji czytelnika — kliknal
      // „udostepnij”, a nie „zapisz zdarzenie analityczne”.
      console.error('[udostepnienie] nie zapisano zdarzenia:', error)
    })

  const count = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE event_name = 'share' AND article_slug = ?`,
  )
    .bind(slug)
    .first<{ n: number }>()

  return c.json({ ok: true, data: { slug, kanal, shareCount: count?.n ?? 0 } })
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
