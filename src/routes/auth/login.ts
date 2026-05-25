import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserByEmail, issueSessionForUser, verifyPassword, verifyTotp } from './helpers/password-utils'
import { rateLimit } from './middleware/rate-limit'

const route = new Hono<AppEnv>()

route.post('/login', rateLimit(5, 60_000), validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const code = body.code ? String(body.code) : undefined
  if (!email || !password) return c.json({ error: 'missing_credentials' }, 400)
  return { email, password, code }
}), async (c) => {
  const body = c.req.valid('json')
  const user = await getUserByEmail(c.env, body.email)
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return c.json({ error: 'invalid_credentials' }, 401)
  }
  if (user.twoFactorEnabled) {
    if (!body.code) return c.json({ error: 'two_factor_required' }, 428)
    if (!user.twoFactorSecret || !(await verifyTotp(user.twoFactorSecret, body.code))) {
      return c.json({ error: 'invalid_two_factor_code' }, 401)
    }
  }

  const session = await issueSessionForUser(c.env, user)
  return c.json({ ok: true, accessToken: session.accessToken, refreshToken: session.refreshToken, sessionId: session.sessionId, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
})

export default route
