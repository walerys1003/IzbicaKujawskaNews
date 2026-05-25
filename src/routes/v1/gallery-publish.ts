import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { loadGallery, saveGallery } from '../../lib/media/gallery-store'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ slug?: string; published?: boolean }>()
  if (!body.slug) return c.json({ error: 'slug_required' }, 400)
  const gallery = await loadGallery(c.env, body.slug)
  gallery.published = body.published !== false
  await saveGallery(c.env, gallery)
  return c.json({ ok: true, gallery })
})

export default route
