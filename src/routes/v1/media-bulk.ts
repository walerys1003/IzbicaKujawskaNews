import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { resolveExplicitBucket } from '../../lib/media/r2-upload'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ action?: 'delete' | 'tag'; items?: string[]; tags?: string[]; bucket?: string }>()
  const items = Array.isArray(body.items) ? body.items.filter(Boolean) : []
  if (!body.action || items.length === 0) return c.json({ error: 'invalid_bulk_request' }, 400)
  if (body.action === 'delete') {
    const bucket = resolveExplicitBucket(c.env, ((body.bucket || 'R2_USER_UPLOADS') as keyof typeof c.env) as never)
    await Promise.all(items.map((key) => bucket.delete(key)))
    if (c.env.DB) {
      for (const key of items) await c.env.DB.prepare('DELETE FROM media_assets WHERE asset_key = ?').bind(key).run()
    }
    return c.json({ ok: true, action: 'delete', count: items.length })
  }
  if (!c.env.DB) return c.json({ error: 'db_not_configured' }, 503)
  const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : []
  for (const id of items) {
    await c.env.DB.prepare('UPDATE media_assets SET tags_json = ? WHERE id = ? OR asset_key = ?').bind(JSON.stringify(tags), id, id).run()
  }
  return c.json({ ok: true, action: 'tag', count: items.length, tags })
})

export default route
