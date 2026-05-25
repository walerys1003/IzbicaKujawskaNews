import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { loadGallery, saveGallery } from '../../lib/media/gallery-store'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ slug?: string; imageUrl?: string; caption?: string }>()
  if (!body.slug || !body.imageUrl) return c.json({ error: 'slug_and_imageUrl_required' }, 400)
  const gallery = await loadGallery(c.env, body.slug)
  gallery.items.push({ id: crypto.randomUUID(), imageUrl: body.imageUrl, caption: body.caption || 'Nowe zdjęcie' })
  await saveGallery(c.env, gallery)
  return c.json({ ok: true, count: gallery.items.length, gallery })
})

export default route
