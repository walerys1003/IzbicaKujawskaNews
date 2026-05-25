import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { getUserByEmail, hashPassword, randomToken, saveTokenRecord, storeUser, type StoredUserRecord } from './helpers/password-utils'

const route = new Hono<AppEnv>()

route.post('/register', validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()
  if (!email.includes('@')) return c.json({ error: 'invalid_email' }, 400)
  if (password.length < 10) return c.json({ error: 'weak_password', minLength: 10 }, 400)
  if (name.length < 2) return c.json({ error: 'invalid_name' }, 400)
  return { email, password, name }
}), async (c) => {
  const body = c.req.valid('json')
  if (await getUserByEmail(c.env, body.email)) return c.json({ error: 'email_already_exists' }, 409)

  const user: StoredUserRecord = {
    id: crypto.randomUUID(),
    email: body.email,
    name: body.name,
    role: 'reader',
    passwordHash: await hashPassword(body.password),
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await storeUser(c.env, user)

  const token = randomToken(24)
  await saveTokenRecord(c.env, {
    token,
    type: 'verify',
    email: user.email,
    userId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  })

  return c.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, verifyUrl: `/api/v1/auth/verify/${token}` }, 201)
})

export default route
