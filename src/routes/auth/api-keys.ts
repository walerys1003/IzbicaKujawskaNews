import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { AppEnv } from '../../types/env'
import { listApiKeys, revokeApiKey, sha256Hex, storeApiKey, type AuthJwtPayload } from './helpers/password-utils'
import { requireAuth } from './middleware/require-auth'
import { requireRole } from './middleware/require-role'

const route = new Hono<AppEnv>()

route.get('/api-keys', requireAuth, requireRole(['author', 'editor', 'admin']), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const items = await listApiKeys(c.env, auth.sub)
  return c.json({ total: items.length, items: items.map((item) => ({ id: item.id, name: item.name, scopes: item.scopes, createdAt: item.createdAt, revokedAt: item.revokedAt })) })
})

route.post('/api-keys', requireAuth, requireRole(['author', 'editor', 'admin']), validator('json', (value, c) => {
  const body = value as Record<string, unknown>
  const name = String(body.name || '').trim()
  const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : []
  if (!name) return c.json({ error: 'missing_name' }, 400)
  return { name, scopes }
}), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const body = c.req.valid('json')
  const plainToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
  const record = {
    id: crypto.randomUUID(),
    userId: auth.sub,
    name: body.name,
    scopes: body.scopes.length ? body.scopes : ['incoming:write'],
    tokenHash: await sha256Hex(plainToken),
    createdAt: new Date().toISOString(),
  }
  await storeApiKey(c.env, record)
  return c.json({ ok: true, apiKey: plainToken, id: record.id, scopes: record.scopes }, 201)
})

route.delete('/api-keys', requireAuth, requireRole(['author', 'editor', 'admin']), validator('json', (value, c) => {
  const id = String((value as Record<string, unknown>).id || '')
  if (!id) return c.json({ error: 'missing_id' }, 400)
  return { id }
}), async (c) => {
  const auth = c.get('auth') as AuthJwtPayload
  const { id } = c.req.valid('json')
  await revokeApiKey(c.env, auth.sub, id)
  return c.json({ ok: true, revoked: id })
})

export default route
