import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { deleteKey, getUserById, listSessions, revokeSession, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'

const route = new Hono<AppEnv>()

route.delete('/account', requireAuth, async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const user = await getUserById(c.env, auth.sub)
  if (!user) return c.json({ error: 'user_not_found' }, 404)

  const sessions = await listSessions(c.env, auth.sub)
  await Promise.all(sessions.map((session) => revokeSession(c.env, auth.sub, session.sessionId)))
  await deleteKey(c.env, `auth:user:${user.email.toLowerCase()}`)
  await deleteKey(c.env, `auth:user-id:${user.id}`)

  return c.json({ ok: true, deleted: true, gdpr: 'account_erased' })
})

export default route
