import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { parseTags, queryAll, type MediaAssetRecord } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10) || 20, 50)
  if (!c.env.DB) return c.json({ query: q, total: 0, items: [], fallback: true })
  const like = `%${q}%`
  const items = await queryAll<MediaAssetRecord>(c.env, `SELECT * FROM media_assets
    WHERE alt LIKE ? OR tags_json LIKE ? OR asset_key LIKE ?
    ORDER BY created_at DESC LIMIT ?`, [like, like, like, limit])
  return c.json({ query: q, total: items.length, items: items.map((item) => ({ ...item, tags: parseTags(item.tags_json) })) })
})

export default route
