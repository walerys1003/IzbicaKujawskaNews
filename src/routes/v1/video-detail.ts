import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.get('/:id', async (c) => {
  if (!c.env.DB) return c.json({ error: 'db_not_configured' }, 503)
  const rows = await queryAll(c.env, 'SELECT * FROM videos WHERE id = ? LIMIT 1', [c.req.param('id')])
  const item = rows[0] as Record<string, unknown> | undefined
  if (!item) return c.json({ error: 'video_not_found' }, 404)
  return c.json({ ...item, streamUrl: item.stream_url, thumbnailUrl: item.thumbnail_url, captionsUrl: item.captions_url })
})

export default route
