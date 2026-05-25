import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { createJwtPair, getSession, getUserById, parseRefreshToken, revokeSession, saveSession, sha256Hex } from './helpers/password-utils'

const route = new Hono<AppEnv>()

route.post('/refresh', validator('json', (value, c) => {
  const refreshToken = String((value as Record<string, unknown>).refreshToken || '')
  if (!refreshToken) return c.json({ error: 'missing_refresh_token' }, 400)
  return { refreshToken }
}), async (c) => {
  const { refreshToken } = c.req.valid('json')
  const parsed = parseRefreshToken(refreshToken)
  if (!parsed) return c.json({ error: 'invalid_refresh_token' }, 400)

  const userId = String(c.req.query('userId') || '')
  if (!userId) return c.json({ error: 'missing_user_id' }, 400)

  const session = await getSession(c.env, userId, parsed.sessionId)
  const user = await getUserById(c.env, userId)
  if (!session || !user) return c.json({ error: 'session_not_found' }, 404)
  if (session.refreshTokenHash !== await sha256Hex(parsed.secret)) return c.json({ error: 'refresh_token_mismatch' }, 401)

  const pair = await createJwtPair(c.env, user, parsed.sessionId)
  const nextParsed = parseRefreshToken(pair.refreshToken)
  if (!nextParsed) return c.json({ error: 'invalid_refresh_token' }, 500)

  await revokeSession(c.env, userId, parsed.sessionId)
  await saveSession(c.env, { ...session, refreshTokenHash: await sha256Hex(nextParsed.secret), lastSeenAt: new Date().toISOString() })
  return c.json({ ok: true, accessToken: pair.accessToken, refreshToken: pair.refreshToken, sessionId: parsed.sessionId })
})

export default route
