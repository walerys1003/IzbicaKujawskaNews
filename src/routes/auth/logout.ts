import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { revokeSession, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.post('/logout', requireAuth, async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  await revokeSession(c.env, auth.sub, auth.sessionId)
  return c.json({ ok: true, sessionId: auth.sessionId })
})

export default route
