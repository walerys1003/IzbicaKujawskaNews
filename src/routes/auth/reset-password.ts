import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { deleteKey, getTokenKey, getTokenRecord, getUserByEmail, hashPassword, randomToken, saveTokenRecord, storeUser } from './helpers/password-utils'

const route = new Hono<AppEnv>()

route.post('/reset', validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  return {
    email: body.email ? String(body.email).trim().toLowerCase() : '',
    token: body.token ? String(body.token) : '',
    newPassword: body.newPassword ? String(body.newPassword) : '',
  }
}), async (c) => {
  const body = c.req.valid('json')

  if (body.token && body.newPassword) {
    const record = await getTokenRecord(c.env, body.token)
    if (!record || record.type !== 'reset') return c.json({ error: 'invalid_reset_token' }, 404)
    if (new Date(record.expiresAt).getTime() < Date.now()) return c.json({ error: 'reset_token_expired' }, 410)
    const user = await getUserByEmail(c.env, record.email)
    if (!user) return c.json({ error: 'user_not_found' }, 404)
    user.passwordHash = await hashPassword(body.newPassword)
    user.updatedAt = new Date().toISOString()
    await storeUser(c.env, user)
    await deleteKey(c.env, getTokenKey(body.token))
    return c.json({ ok: true, passwordReset: true })
  }

  if (!body.email) return c.json({ error: 'missing_email' }, 400)
  const user = await getUserByEmail(c.env, body.email)
  if (!user) return c.json({ ok: true, message: 'Jeśli konto istnieje, link resetujący został wygenerowany.' })
  const token = randomToken(24)
  await saveTokenRecord(c.env, { token, type: 'reset', email: user.email, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString() })
  return c.json({ ok: true, resetUrl: `/api/v1/auth/reset?token=${token}`, expiresInSeconds: 1800 })
})

export default route
