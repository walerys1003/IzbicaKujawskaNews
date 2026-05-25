import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserById, storeUser, verifyTotp, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.post('/2fa/verify', requireAuth, validator('json', (value, c) => {
  const code = String((value as Record<string, unknown>).code || '')
  if (!/^\d{6}$/.test(code)) return c.json({ error: 'invalid_code_format' }, 400)
  return { code }
}), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const { code } = c.req.valid('json')
  const user = await getUserById(c.env, auth.sub)
  if (!user || !user.pendingTwoFactorSecret) return c.json({ error: 'two_factor_not_initialized' }, 404)
  if (!(await verifyTotp(user.pendingTwoFactorSecret, code))) return c.json({ error: 'invalid_two_factor_code' }, 401)
  user.twoFactorSecret = user.pendingTwoFactorSecret
  user.pendingTwoFactorSecret = undefined
  user.twoFactorEnabled = true
  user.updatedAt = new Date().toISOString()
  await storeUser(c.env, user)
  return c.json({ ok: true, twoFactorEnabled: true })
})

export default route
