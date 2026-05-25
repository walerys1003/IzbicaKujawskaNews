import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll, type VideoRecord } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10) || 20, 50)
  if (!c.env.DB) return c.json({ total: 0, items: [], fallback: true })
  const items = await queryAll<VideoRecord & { title: string; mime: string; size: number }>(c.env, 'SELECT id, asset_key, stream_url, thumbnail_url, title, duration_seconds, captions_url, created_at, mime, size FROM videos ORDER BY created_at DESC LIMIT ?', [limit])
  return c.json({ total: items.length, items })
})

export default route
