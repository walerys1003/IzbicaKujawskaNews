import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserByEmail, randomToken, saveTokenRecord } from './helpers/password-utils'

const route = new Hono<AppEnv>()

route.post('/magic', validator('json', (value, c) => {
  const email = String((value as Record<string, unknown>).email || '').trim().toLowerCase()
  if (!email.includes('@')) return c.json({ error: 'invalid_email' }, 400)
  return { email }
}), async (c) => {
  const { email } = c.req.valid('json')
  const user = await getUserByEmail(c.env, email)
  if (!user) return c.json({ error: 'user_not_found' }, 404)
  const token = randomToken(24)
  await saveTokenRecord(c.env, { token, type: 'magic', email, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString() })
  return c.json({ ok: true, magicUrl: `/api/v1/auth/verify/${token}?mode=magic`, expiresInSeconds: 900 })
})

export default route
