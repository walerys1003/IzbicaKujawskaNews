import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserById, hashPassword, storeUser, verifyPassword, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.post('/change-password', requireAuth, validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  const oldPassword = String(body.oldPassword || '')
  const newPassword = String(body.newPassword || '')
  if (oldPassword.length < 1 || newPassword.length < 10) return c.json({ error: 'invalid_password_payload' }, 400)
  return { oldPassword, newPassword }
}), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const body = c.req.valid('json')
  const user = await getUserById(c.env, auth.sub)
  if (!user) return c.json({ error: 'user_not_found' }, 404)
  if (!(await verifyPassword(body.oldPassword, user.passwordHash))) return c.json({ error: 'invalid_old_password' }, 401)
  user.passwordHash = await hashPassword(body.newPassword)
  user.updatedAt = new Date().toISOString()
  await storeUser(c.env, user)
  return c.json({ ok: true, passwordChanged: true })
})

export default route
