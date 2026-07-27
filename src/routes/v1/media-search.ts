import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { parseTags, queryAll, type MediaAssetRecord } from '../../lib/media/db'
import { fail, ok } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10) || 20, 50)
  // A3: brak bazy to awaria (503), nie pusty wynik wyszukiwania.
  if (!c.env.DB) return fail(c, 'database_unavailable')
  const like = `%${q}%`
  const items = await queryAll<MediaAssetRecord>(c.env, `SELECT * FROM media_assets
    WHERE alt LIKE ? OR tags_json LIKE ? OR asset_key LIKE ?
    ORDER BY created_at DESC LIMIT ?`, [like, like, like, limit])
  return ok(
    c,
    items.map((item) => ({ ...item, tags: parseTags(item.tags_json) })),
    { query: q, total: items.length, limit },
  )
})

export default route
