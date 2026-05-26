// SA2: Newsletter router — mounted at /api/v1/newsletter
import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { createNewsletterRepo } from '../../repository'

const route = new Hono<AppEnv>()

route.post('/subscribe', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.subscribe(email)
  return c.json(result, result.ok ? 200 : 409)
})

route.post('/confirm', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  if (!email) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.confirm(email)
  return c.json(result)
})

route.post('/unsubscribe', async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  if (!email) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.unsubscribe(email)
  return c.json(result)
})

route.get('/subscribers', async (c) => {
  const repo = createNewsletterRepo(c.env.DB!)
  const items = await repo.getSubscribers()
  return c.json({ total: items.length, items })
})

export default route
