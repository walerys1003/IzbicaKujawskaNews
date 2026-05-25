import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv, Bindings } from '../../types/env'
import { requireAuth } from '../auth/middleware/require-auth'
import type { AuthJwtPayload } from '../auth/helpers/password-utils'
import { deleteJson, getJson, listByPrefix, putJson, upsertCollectionItem } from '../../lib/runtime-kv'

export interface PushSubscriptionRecord {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  userId?: string
  categories: string[]
  segments: string[]
  locale: string
  device: string
  status: 'active' | 'unsubscribed'
  createdAt: string
  updatedAt: string
}

export interface PushPreferenceRecord {
  id: string
  userId: string
  categories: string[]
  breakingOnly: boolean
  quietHours?: { from: string; to: string }
  updatedAt: string
}

export interface PushMessageRecord {
  id: string
  kind: 'broadcast' | 'segment' | 'test' | 'breaking' | 'scheduled'
  title: string
  body: string
  url?: string
  segment?: string
  category?: string
  scheduledFor?: string
  sentAt?: string
  status: 'queued' | 'sent' | 'cancelled'
  delivered: number
  opened: number
  clicked: number
  createdAt: string
  createdBy?: string
}

const route = new Hono<AppEnv>()
const VAPID_FALLBACK = 'BElzbGljYTI0LWRldi12YXBpZC1wdWJsaWMta2V5LXBsYWNlaG9sZGVy'

const subscriberKey = (id: string) => `push:subscriber:${id}`
const preferenceKey = (userId: string) => `push:preference:${userId}`
const messageKey = (id: string) => `push:message:${id}`

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

const listSubscribers = async (env: Bindings) => (await listByPrefix<PushSubscriptionRecord>(env, 'NOTIFICATIONS_KV', 'push:subscriber:'))
  .map((item) => item.value)
  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const listMessages = async (env: Bindings) => (await listByPrefix<PushMessageRecord>(env, 'NOTIFICATIONS_KV', 'push:message:'))
  .map((item) => item.value)
  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

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

const sendMessage = async (env: Bindings, message: PushMessageRecord) => {
  const subscribers = await listSubscribers(env)
  const recipients = subscribers.filter((subscriber) => matchRecipient(subscriber, message))
  const delivered = recipients.length
  const saved = { ...message, delivered, sentAt: new Date().toISOString(), status: 'sent' as const }
  await putJson(env, 'NOTIFICATIONS_KV', messageKey(message.id), saved)
  return { saved, recipients }
}

export const processScheduledPushMessages = async (env: Bindings) => {
  const now = Date.now()
  const messages = await listMessages(env)
  const due = messages.filter((message) => message.status === 'queued' && message.scheduledFor && Date.parse(message.scheduledFor) <= now)
  await Promise.all(due.map((message) => sendMessage(env, message)))
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

route.get('/vapid-public-key', (c) => c.json({ publicKey: c.env.VAPID_PUBLIC_KEY || VAPID_FALLBACK }))

route.post('/subscribe', async (c) => {
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

  await upsertCollectionItem(c.env, 'NOTIFICATIONS_KV', 'push:subscriber:', subscription)
  return c.json({ ok: true, subscriber: subscription }, 201)
})

route.post('/unsubscribe', async (c) => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return c.json({ error: 'missing_id' }, 400)
  const existing = await getJson<PushSubscriptionRecord>(c.env, 'NOTIFICATIONS_KV', subscriberKey(id))
  if (!existing) return c.json({ error: 'subscriber_not_found' }, 404)
  const updated = { ...existing, status: 'unsubscribed' as const, updatedAt: new Date().toISOString() }
  await putJson(c.env, 'NOTIFICATIONS_KV', subscriberKey(id), updated)
  return c.json({ ok: true, subscriber: updated })
})

route.post('/send-broadcast', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
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

  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-segment', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
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

  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length })
})

route.post('/send-test', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const auth = getAuth(c)
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  const subscriptionId = typeof body?.subscriptionId === 'string' ? body.subscriptionId : ''
  const subscribers = await listSubscribers(c.env)
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

  const saved = { ...message, delivered: 1, sentAt: new Date().toISOString(), status: 'sent' as const }
  await putJson(c.env, 'NOTIFICATIONS_KV', messageKey(saved.id), saved)
  return c.json({ ok: true, message: saved, recipient: subscriber.id })
})

route.get('/subscribers', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = await listSubscribers(c.env)
  return c.json({ total: items.length, items })
})

route.get('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const item = await getJson<PushSubscriptionRecord>(c.env, 'NOTIFICATIONS_KV', subscriberKey(c.req.param('id')))
  if (!item) return c.json({ error: 'subscriber_not_found' }, 404)
  return c.json(item)
})

route.delete('/subscribers/:id', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  await deleteJson(c.env, 'NOTIFICATIONS_KV', subscriberKey(c.req.param('id')))
  return c.json({ ok: true, removed: c.req.param('id') })
})

route.post('/preferences', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
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
  await putJson(c.env, 'USER_PREFS_KV', preferenceKey(auth.sub), preference)
  return c.json({ ok: true, preference })
})

route.get('/preferences/:userId', async (c) => {
  const auth = getAuth(c)
  if (!auth) return c.json({ error: 'missing_bearer_token' }, 401)
  const requestedUserId = c.req.param('userId')
  if (auth.sub !== requestedUserId && !['admin', 'editor'].includes(auth.role)) return c.json({ error: 'forbidden' }, 403)
  const preference = await getJson<PushPreferenceRecord>(c.env, 'USER_PREFS_KV', preferenceKey(requestedUserId))
  return c.json(preference ?? { id: requestedUserId, userId: requestedUserId, categories: [], breakingOnly: false, updatedAt: null })
})

route.post('/breaking', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const body = await c.req.json<Record<string, unknown>>().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.body !== 'string') return c.json({ error: 'missing_fields' }, 400)

  const messages = await listMessages(c.env)
  const today = new Date().toISOString().slice(0, 10)
  const breakingCount = messages.filter((message) => message.kind === 'breaking' && message.createdAt.startsWith(today)).length
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
  const result = await sendMessage(c.env, message)
  return c.json({ ok: true, message: result.saved, recipients: result.recipients.length, dailyCount: breakingCount + 1 })
})

route.get('/history', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const items = await listMessages(c.env)
  return c.json({ total: items.length, items })
})

route.get('/stats', async (c) => {
  const authError = ensureAdmin(c)
  if (authError) return authError
  const messages = await listMessages(c.env)
  const totals = messages.reduce((acc, message) => {
    acc.delivered += message.delivered
    acc.opened += message.opened
    acc.clicked += message.clicked
    return acc
  }, { delivered: 0, opened: 0, clicked: 0 })
  return c.json({
    totalMessages: messages.length,
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
  await putJson(c.env, 'NOTIFICATIONS_KV', messageKey(message.id), message)
  return c.json({ ok: true, message })
})

export default route
