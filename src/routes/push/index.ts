/*
  ==========================================================================
  s8 (2026-07-28) — MAGAZYN PUSH: D1 (tabele z migracji 0036 + 0059)
  ==========================================================================

  Ten plik używał NOTIFICATIONS_KV jako jedynego źródła prawdy (decyzja
  etapu I8), podczas gdy migracja 0036 deklarowała tabele push_* w D1 —
  które stały puste. Dwa magazyny, jeden zadeklarowany, drugi działający,
  to gwarancja rozjazdu przy pierwszym raporcie z bazy.

  Decyzja I8 została odwrócona — uzasadnienie w src/routes/push/store-d1.ts
  (skrót: UNIQUE na endpoint eliminuje duplikaty subskrypcji, których KV
  nie umiał wymusić; lista aktywnych to jeden SELECT z indeksem zamiast
  stronicowania po prefiksie; agregaty panelu liczone w SQL zamiast
  odczytu całej historii do pamięci).

  Co znika wraz z KV:
  - pole `listaUcieta` — istniało, bo `list()` w KV mógł zwrócić listę
    niekompletną (limit 500, kursor bez postępu). SELECT w D1 zwraca
    całość albo błąd; stan „po cichu ucięte" nie występuje.
  - klucze push:subscriber:/push:message:/push:preference: — dane żyją
    w push_subscribers / push_messages / push_preferences.

  Zasady raportowania wysyłki (z I8) obowiązują bez zmian:
  1. Brak kluczy VAPID → status 'failed', delivered 0, jawny powód.
  2. `delivered` = wyłącznie potwierdzenia 2xx od dostawcy.
  3. Subskrypcje odrzucone 404/410 są usuwane z bazy.
  ==========================================================================
*/
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings, D1DatabaseLike } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { kluczeVapidZeSrodowiska, wyslijPowiadomienie, type PowodNiepowodzenia } from '../../lib/push/webpush'
import {
  liczbaBreakingDzisiaj,
  listaSubskrybentow,
  listaWiadomosci,
  pobierzPreferencje,
  pobierzSubskrybenta,
  statystykiWiadomosci,
  usunSubskrybenta,
  wiadomosciDoWyslania,
  zapiszPreferencje,
  zapiszSubskrybenta,
  zapiszWiadomosc,
  type PushMessageRecord,
  type PushPreferenceRecord,
  type PushSubscriptionRecord,
} from './store-d1'

// Re-eksport typów: konsumenci importowali je z tego modułu przed migracją.
export type { PushMessageRecord, PushPreferenceRecord, PushSubscriptionRecord }

/** Wynik wysyłki do jednego subskrybenta — z jego identyfikatorem. */
interface WynikSubskrybenta {
  subscriberId: string
  dostarczone: boolean
  status?: number
  doUsuniecia: boolean
  powod?: PowodNiepowodzenia
  komunikat?: string
}

const route = new Hono<AppEnv>()

const jsonError = (message: string, status = 400) => new Response(JSON.stringify({ error: message }), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})

const normalizeList = (value: unknown): string[] => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : []

const inferDevice = (userAgent: string) => {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  if (/mobi|android/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

const getAuth = (c: Context<AppEnv>) => c.get('auth') as AuthJwtPayload | undefined

const ensureAdmin = (c: Context<AppEnv>) => {
  const auth = getAuth(c)
  if (!auth) return jsonError('missing_bearer_token', 401)
  if (!['admin', 'editor'].includes(auth.role)) return jsonError('forbidden', 403)
  return null
}

/**
 * Baza jest warunkiem działania każdej trasy push. Brak bindingu to błąd
 * konfiguracji środowiska, zgłaszany jawnie jako 503 — a nie udawanie
 * pustej listy subskrybentów, które wyglądałoby jak brak odbiorców.
 */
const bazaAlboNull = (env: Bindings): D1DatabaseLike | null => env.DB ?? null

const matchRecipient = (subscriber: PushSubscriptionRecord, message: Pick<PushMessageRecord, 'kind' | 'segment' | 'category'>) => {
  if (subscriber.status !== 'active') return false
  if (message.kind === 'broadcast') return true
  if (message.kind === 'test') return true
  if (message.kind === 'segment') {
    return Boolean(message.segment && (subscriber.segments.includes(message.segment) || subscriber.categories.includes(message.segment)))
  }
  if (message.kind === 'breaking') return true
  if (message.kind === 'scheduled') {
    if (!message.segment && !message.category) return true
    return Boolean(message.segment && subscriber.segments.includes(message.segment)) || Boolean(message.category && subscriber.categories.includes(message.category))
  }
  return false
}

/**
 * REALNA WYSYŁKA WEB PUSH (zasady z etapu I8 — patrz komentarz nagłówkowy).
 * `delivered` liczy odpowiedzi 2xx OD DOSTAWCY, nie adresatów na liście.
 */
const sendMessage = async (db: D1DatabaseLike, env: Bindings, message: PushMessageRecord) => {
  const subscribers = await listaSubskrybentow(db)
  const recipients = subscribers.filter((subscriber) => matchRecipient(subscriber, message))

  const kluczeVapid = kluczeVapidZeSrodowiska(env)

  // ── Brak konfiguracji: zapisujemy porażkę, nie sukces ─────────────────
  if (!kluczeVapid) {
    const saved: PushMessageRecord = {
      ...message,
      delivered: 0,
      status: 'failed',
      sentAt: new Date().toISOString(),
      failureReason: 'brak_konfiguracji_vapid',
      failureDetail: 'Brak VAPID_PUBLIC_KEY lub VAPID_PRIVATE_KEY — powiadomienia nie zostały wysłane.',
      attempted: recipients.length,
    }
    await zapiszWiadomosc(db, saved)
    console.error('[push] Wysyłka przerwana: brak kluczy VAPID w środowisku.')
    return { saved, recipients, wyniki: [] as WynikSubskrybenta[] }
  }

  const tresc = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/',
    messageId: message.id,
  })

  // Wysyłka równoległa, ale w partiach — Workers ma limit jednoczesnych
  // połączeń wychodzących (6 na żądanie w planie darmowym), a `Promise.all`
  // po tysiącu subskrybentów kończyłby się odrzuceniem części połączeń,
  // raportowanym potem jako awaria sieci.
  const ROZMIAR_PARTII = 5
  const wyniki: WynikSubskrybenta[] = []

  for (let i = 0; i < recipients.length; i += ROZMIAR_PARTII) {
    const partia = recipients.slice(i, i + ROZMIAR_PARTII)
    const wynikiPartii = await Promise.all(
      partia.map(async (subscriber) => {
        const wynik = await wyslijPowiadomienie(
          { endpoint: subscriber.endpoint, keys: subscriber.keys },
          tresc,
          kluczeVapid,
          { pilnosc: message.kind === 'breaking' ? 'high' : 'normal' },
        )
        return { subscriberId: subscriber.id, ...wynik }
      }),
    )
    wyniki.push(...wynikiPartii)
  }

  // ── Usunięcie trwale nieważnych subskrypcji (404/410 od dostawcy) ─────
  const doUsuniecia = wyniki.filter((w) => w.doUsuniecia).map((w) => w.subscriberId)
  for (const id of doUsuniecia) {
    await usunSubskrybenta(db, id)
  }

  const delivered = wyniki.filter((w) => w.dostarczone).length
  const nieudane = wyniki.length - delivered

  // Zestawienie powodów niepowodzeń — redakcja musi wiedzieć, CZY to jej
  // problem (zły klucz, za duża treść) czy dostawcy (limit, awaria).
  const powody = wyniki
    .filter((w) => !w.dostarczone)
    .reduce<Record<string, number>>((acc, w) => {
      const powod = w.powod ?? 'nieznany'
      acc[powod] = (acc[powod] ?? 0) + 1
      return acc
    }, {})

  const saved: PushMessageRecord = {
    ...message,
    delivered,
    attempted: recipients.length,
    failed: nieudane,
    removedSubscribers: doUsuniecia.length,
    failureReasons: Object.keys(powody).length ? powody : undefined,
    sentAt: new Date().toISOString(),
    // 'sent' tylko wtedy, gdy cokolwiek faktycznie doszło. Zero dostarczeń
    // przy niepustej liście adresatów to porażka, nie wysłana wiadomość.
    status: delivered > 0 ? 'sent' : recipients.length === 0 ? 'sent' : 'failed',
  }

  await zapiszWiadomosc(db, saved)

  if (nieudane > 0) {
    console.warn(`[push] ${message.id}: dostarczono ${delivered}/${recipients.length}, powody:`, powody)
  }

  return { saved, recipients, wyniki }
}

export const processScheduledPushMessages = async (env: Bindings) => {
  const db = bazaAlboNull(env)
  if (!db) return { processed: 0 }
  const due = await wiadomosciDoWyslania(db, new Date().toISOString())
  await Promise.all(due.map((message) => sendMessage(db, env, message)))
  return { processed: due.length }
}

route.use('/send-broadcast', requireAuth)
route.use('/send-segment', requireAuth)
route.use('/send-test', requireAuth)
route.use('/subscribers', requireAuth)
route.use('/subscribers/*', requireAuth)
route.use('/breaking', requireAuth)
route.use('/history', requireAuth)
route.use('/stats', requireAuth)
route.use('/schedule', requireAuth)
route.use('/preferences', requireAuth)
route.use('/preferences/*', requireAuth)

// Klucz publiczny VAPID musi pochodzić wyłącznie ze środowiska.
// Brak konfiguracji jest zgłaszany jawnie jako 503 (nie placeholder).
route.get('/vapid-public-key', (c) => {
  const publicKey = c.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return c.json({
      error: 'push_not_configured',
      message: 'Powiadomienia push nie są skonfigurowane na tym środowisku (brak VAPID_PUBLIC_KEY).',
    }, 503)
  }
  return c.json({ publicKey })
})

route.post('/subscribe', async (c) => {
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.endpoint !== 'string') return c.json({ error: 'invalid_subscription' }, 400)

  const auth = getAuth(c)
  const now = new Date().toISOString()
  const subscription: PushSubscriptionRecord = {
    id: typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID(),
    endpoint: body.endpoint,
    keys: {
      p256dh: String((body as { keys?: Record<string, unknown> }).keys?.p256dh ?? ''),
      auth: String((body as { keys?: Record<string, unknown> }).keys?.auth ?? ''),
    },
    userId: auth?.sub || (typeof body.userId === 'string' ? body.userId : undefined),
    categories: normalizeList(body.categories),
    segments: normalizeList(body.segments),
    locale: typeof body.locale === 'string' ? body.locale : 'pl-PL',
    device: typeof body.device === 'string' ? body.device : inferDevice(c.req.header('User-Agent') || ''),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  await zapiszSubskrybenta(db, subscription)
  return c.json({ ok: true, subscriber: subscription }, 201)
})

route.post('/unsubscribe', async (c) => {
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return c.json({ error: 'missing_id' }, 400)
  const existing = await pobierzSubskrybenta(db, id)
  if (!existing) return c.json({ error: 'subscriber_not_found' }, 404)
  const updated = { ...existing, status: 'unsubscribed' as const, updatedAt: new Date().toISOString() }
  await zapiszSubskrybenta(db, updated)
  return c.json({ ok: true, subscriber: updated })
})

route.post('/send-broadcast', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string') return c.json({ error: 'missing_fields' }, 400)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'broadcast',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }

  const result = await sendMessage(db, c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-segment', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string' || typeof body.segment !== 'string') {
    return c.json({ error: 'missing_fields' }, 400)
  }

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'segment',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    segment: body.segment,
    category: typeof body.category === 'string' ? body.category : undefined,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }

  const result = await sendMessage(db, c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-test', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const auth = getAuth(c)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const subscriptionId = typeof body?.subscriptionId === 'string' ? body.subscriptionId : ''
  const subscribers = await listaSubskrybentow(db)
  const subscriber = subscriptionId
    ? subscribers.find((item) => item.id === subscriptionId)
    : subscribers.find((item) => item.userId === auth?.sub)
  if (!subscriber) return c.json({ error: 'subscriber_not_found' }, 404)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'test',
    title: typeof body?.title === 'string' ? body.title : 'Test powiadomienia izbica24.pl',
    body: typeof body?.body === 'string' ? body.body : 'To jest test Web Push z panelu redakcyjnego.',
    url: typeof body?.url === 'string' ? body.url : '/',
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: auth?.sub,
  }

  // Test powiadomień to trasa, na której redakcja sprawdza konfigurację —
  // fałszywy sukces tutaj kosztuje najwięcej (utwierdza, że wysyłka działa).
  const kluczeVapid = kluczeVapidZeSrodowiska(c.env)
  if (!kluczeVapid) {
    return c.json({
      error: 'push_not_configured',
      message: 'Brak VAPID_PUBLIC_KEY lub VAPID_PRIVATE_KEY — nie można wysłać powiadomienia testowego.',
    }, 503)
  }

  const wynik = await wyslijPowiadomienie(
    { endpoint: subscriber.endpoint, keys: subscriber.keys },
    JSON.stringify({ title: message.title, body: message.body, url: message.url || '/', messageId: message.id }),
    kluczeVapid,
  )

  if (wynik.doUsuniecia) {
    await usunSubskrybenta(db, subscriber.id)
  }

  const saved: PushMessageRecord = {
    ...message,
    delivered: wynik.dostarczone ? 1 : 0,
    attempted: 1,
    failed: wynik.dostarczone ? 0 : 1,
    removedSubscribers: wynik.doUsuniecia ? 1 : 0,
    sentAt: new Date().toISOString(),
    status: wynik.dostarczone ? 'sent' : 'failed',
    failureReason: wynik.dostarczone ? undefined : wynik.powod,
    failureDetail: wynik.dostarczone ? undefined : wynik.komunikat,
  }
  await zapiszWiadomosc(db, saved)

  // Kod HTTP odzwierciedla rzeczywisty wynik — 200 przy niepowodzeniu kazałby
  // panelowi pokazać sukces niezależnie od treści odpowiedzi.
  return c.json(
    {
      ok: wynik.dostarczone,
      message: saved,
      recipient: subscriber.id,
      dostawca: { status: wynik.status, powod: wynik.powod, komunikat: wynik.komunikat },
    },
    wynik.dostarczone ? 200 : 502,
  )
})

route.get('/subscribers', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const items = await listaSubskrybentow(db)
  return c.json({ total: items.length, items })
})

route.get('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const item = await pobierzSubskrybenta(db, c.req.param('id'))
  if (!item) return c.json({ error: 'subscriber_not_found' }, 404)
  return c.json(item)
})

route.delete('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  await usunSubskrybenta(db, c.req.param('id'))
  return c.json({ ok: true, removed: c.req.param('id') })
})

route.post('/preferences', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const preference: PushPreferenceRecord = {
    id: auth.sub,
    userId: auth.sub,
    categories: normalizeList(body?.categories),
    breakingOnly: Boolean(body?.breakingOnly),
    quietHours: typeof body?.quietHours === 'object' && body?.quietHours
      ? {
          from: String((body.quietHours as Record<string, unknown>).from ?? '22:00'),
          to: String((body.quietHours as Record<string, unknown>).to ?? '07:00'),
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  }
  await zapiszPreferencje(db, preference)
  return c.json({ ok: true, preference })
})

route.get('/preferences/:userId', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const requestedUserId = c.req.param('userId')
  if (auth.sub !== requestedUserId && !['admin', 'editor'].includes(auth.role)) return c.json({ error: 'forbidden' }, 403)
  const preference = await pobierzPreferencje(db, requestedUserId)
  return c.json(preference ?? { id: requestedUserId, userId: requestedUserId, categories: [], breakingOnly: false, updatedAt: null })
})

route.post('/breaking', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string') return c.json({ error: 'missing_fields' }, 400)

  const today = new Date().toISOString().slice(0, 10)
  const breakingCount = await liczbaBreakingDzisiaj(db, today)
  if (breakingCount >= 5) return c.json({ error: 'breaking_daily_limit_reached', limit: 5 }, 429)

  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'breaking',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    category: typeof body.category === 'string' ? body.category : undefined,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }
  const result = await sendMessage(db, c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length, dailyCount: breakingCount + 1 })
})

route.get('/history', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const items = await listaWiadomosci(db)
  return c.json({ total: items.length, items })
})

route.get('/stats', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const totals = await statystykiWiadomosci(db)
  return c.json({
    totalMessages: totals.total,
    delivered: totals.delivered,
    opened: totals.opened,
    clicked: totals.clicked,
    openRate: totals.delivered ? Number((totals.opened / totals.delivered).toFixed(4)) : 0,
    ctr: totals.delivered ? Number((totals.clicked / totals.delivered).toFixed(4)) : 0,
  })
})

route.post('/schedule', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const db = bazaAlboNull(c.env)
  if (!db) return c.json({ error: 'database_unavailable' }, 503)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string' || typeof body.scheduledFor !== 'string') {
    return c.json({ error: 'missing_fields' }, 400)
  }
  const message: PushMessageRecord = {
    id: crypto.randomUUID(),
    kind: 'scheduled',
    title: body.title,
    body: body.body,
    url: typeof body.url === 'string' ? body.url : '/',
    segment: typeof body.segment === 'string' ? body.segment : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    scheduledFor: body.scheduledFor,
    status: 'queued',
    delivered: 0,
    opened: 0,
    clicked: 0,
    createdAt: new Date().toISOString(),
    createdBy: getAuth(c)?.sub,
  }
  await zapiszWiadomosc(db, message)
  return c.json({ ok: true, message })
})

export default route
