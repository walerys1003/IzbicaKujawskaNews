// SA2: Newsletter router — mounted at /api/v1/newsletter
import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { createNewsletterRepo } from '../../repository'
// Etap I9 — ochrona formularzy zapisu na newsletter.
import { turnstileGuard } from '../../middleware/turnstile'

const route = new Hono<AppEnv>()

/**
 * Etap I9 — dlaczego chronione są wszystkie trzy adresy, nie tylko `/subscribe`.
 *
 * `/subscribe` bez ochrony pozwala zapisać dowolny cudzy adres e-mail —
 * skrypt zgłasza tysiąc adresów, każdy dostaje od nas wiadomość
 * potwierdzającą, której nie zamawiał. To my zostajemy uznani za nadawcę
 * spamu i to nasza domena traci reputację u dostawców poczty.
 *
 * `/unsubscribe` bez ochrony pozwala wypisać cudzy adres — ktoś odcina
 * mieszkańca od powiadomień gminy bez jego wiedzy.
 *
 * `/confirm` bez ochrony pozwala zgadywać tokeny potwierdzeń masowo.
 */
route.post('/subscribe', turnstileGuard({ action: 'newsletter-subscribe' }), async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.subscribe(email)
  return c.json(result, result.ok ? 200 : 409)
})

route.post('/confirm', turnstileGuard({ action: 'newsletter-confirm' }), async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  if (!email) return c.json({ error: 'invalid_email' }, 400)
  const repo = createNewsletterRepo(c.env.DB!)
  const result = await repo.confirm(email)
  return c.json(result)
})

route.post('/unsubscribe', turnstileGuard({ action: 'newsletter-unsubscribe' }), async (c) => {
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
