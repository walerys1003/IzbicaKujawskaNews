import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { generateOtpSecret, getUserById, storeUser, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.post('/2fa/enable', requireAuth, async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const user = await getUserById(c.env, auth.sub)
  if (!user) return c.json({ error: 'user_not_found' }, 404)
  const secret = generateOtpSecret()
  user.pendingTwoFactorSecret = secret
  user.updatedAt = new Date().toISOString()
  await storeUser(c.env, user)
  return c.json({ ok: true, secret, otpauthUrl: `otpauth://totp/izbica24:${encodeURIComponent(user.email)}?secret=${encodeURIComponent(secret)}&issuer=izbica24` })
})

export default route
