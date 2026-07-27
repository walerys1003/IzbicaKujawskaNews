import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll, type VideoRecord } from '../../lib/media/db'
import { fail, ok } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10) || 20, 50)
  // A3: brak bazy to awaria (503), nie pusta lista wideo.
  if (!c.env.DB) return fail(c, 'database_unavailable')
  const items = await queryAll<VideoRecord & { title: string; mime: string; size: number }>(c.env, 'SELECT id, asset_key, stream_url, thumbnail_url, title, duration_seconds, captions_url, created_at, mime, size FROM videos ORDER BY created_at DESC LIMIT ?', [limit])
  return ok(c, items, { total: items.length, limit })
})

export default route
