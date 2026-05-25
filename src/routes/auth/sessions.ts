import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { listSessions, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.get('/sessions', requireAuth, async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const sessions = await listSessions(c.env, auth.sub)
  return c.json({ total: sessions.length, items: sessions })
})

export default route
