import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserById, storeUser, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.get('/profile', requireAuth, async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const user = await getUserById(c.env, auth.sub)
  if (!user) return c.json({ error: 'user_not_found' }, 404)
  return c.json({ id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, twoFactorEnabled: Boolean(user.twoFactorEnabled) })
})

route.put('/profile', requireAuth, validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  const name = body.name ? String(body.name).trim() : undefined
  if (name !== undefined && name.length < 2) return c.json({ error: 'invalid_name' }, 400)
  return { name }
}), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const body = c.req.valid('json')
  const user = await getUserById(c.env, auth.sub)
  if (!user) return c.json({ error: 'user_not_found' }, 404)
  if (body.name) user.name = body.name
  user.updatedAt = new Date().toISOString()
  await storeUser(c.env, user)
  return c.json({ ok: true, profile: { id: user.id, email: user.email, name: user.name, role: user.role } })
})

export default route
