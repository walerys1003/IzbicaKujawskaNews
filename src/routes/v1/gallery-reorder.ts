import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { loadGallery, saveGallery } from '../../lib/media/gallery-store'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ slug?: string; orderedIds?: string[] }>()
  if (!body.slug || !Array.isArray(body.orderedIds)) return c.json({ error: 'slug_and_orderedIds_required' }, 400)
  const gallery = await loadGallery(c.env, body.slug)
  const byId = new Map(gallery.items.map((item) => [item.id, item]))
  gallery.items = body.orderedIds.map((id) => byId.get(id)).filter(Boolean) as typeof gallery.items
  await saveGallery(c.env, gallery)
  return c.json({ ok: true, order: gallery.items.map((item) => item.id) })
})

export default route
