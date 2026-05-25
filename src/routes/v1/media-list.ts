import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { parseTags, queryAll, type MediaAssetRecord } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '24', 10) || 24, 100)
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0)
  const uploaderId = c.req.query('uploaderId')
  if (!c.env.DB) return c.json({ total: 0, items: [], limit, offset, fallback: true })
  const sql = uploaderId
    ? 'SELECT * FROM media_assets WHERE uploader_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ? OFFSET ?'
  const items = await queryAll<MediaAssetRecord>(c.env, sql, uploaderId ? [uploaderId, limit, offset] : [limit, offset])
  const totalRows = await queryAll<{ count: number }>(c.env, uploaderId ? 'SELECT COUNT(*) as count FROM media_assets WHERE uploader_id = ?' : 'SELECT COUNT(*) as count FROM media_assets', uploaderId ? [uploaderId] : [])
  return c.json({
    total: totalRows[0]?.count || 0,
    limit,
    offset,
    items: items.map((item) => ({ ...item, tags: parseTags(item.tags_json) })),
  })
})

export default route
