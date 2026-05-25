import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { parseTags, queryAll } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  if (!c.env.DB) return c.json({ error: 'db_not_configured' }, 503)
  const body = await c.req.json<{ id?: string; key?: string; tags?: string[] | string }>()
  const selector = body.id ? { sql: 'SELECT tags_json FROM media_assets WHERE id = ?', value: body.id } : { sql: 'SELECT tags_json FROM media_assets WHERE asset_key = ?', value: body.key }
  if (!selector.value) return c.json({ error: 'id_or_key_required' }, 400)
  const existing = await queryAll<{ tags_json: string | null }>(c.env, selector.sql, [selector.value])
  const nextTags = Array.from(new Set([...
    parseTags(existing[0]?.tags_json),
    ...(Array.isArray(body.tags) ? body.tags : parseTags(body.tags || '')),
  ].map((item) => item.trim()).filter(Boolean)))
  await c.env.DB.prepare(body.id ? 'UPDATE media_assets SET tags_json = ? WHERE id = ?' : 'UPDATE media_assets SET tags_json = ? WHERE asset_key = ?').bind(JSON.stringify(nextTags), selector.value).run()
  return c.json({ ok: true, tags: nextTags })
})

export default route
