import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { deleteKey, getTokenKey, getTokenRecord, getUserByEmail, issueSessionForUser, storeUser } from './helpers/password-utils'

const route = new Hono<AppEnv>()

route.get('/verify/:token', async (c) => {
  const token = c.req.param('token')
  const record = await getTokenRecord(c.env, token)
  if (!record) return c.json({ error: 'token_not_found' }, 404)
  if (new Date(record.expiresAt).getTime() < Date.now()) return c.json({ error: 'token_expired' }, 410)

  const user = await getUserByEmail(c.env, record.email)
  if (!user) return c.json({ error: 'user_not_found' }, 404)

  user.emailVerified = true
  user.updatedAt = new Date().toISOString()
  await storeUser(c.env, user)
  await deleteKey(c.env, getTokenKey(token))

  if (record.type === 'magic') {
    const session = await issueSessionForUser(c.env, user)
    return c.json({ ok: true, mode: 'magic', accessToken: session.accessToken, refreshToken: session.refreshToken, sessionId: session.sessionId })
  }

  return c.json({ ok: true, emailVerified: true, email: user.email })
})

export default route
