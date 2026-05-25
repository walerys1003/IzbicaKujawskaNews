import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { saveGallery, type GalleryRecord } from '../../lib/media/gallery-store'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.json<{ slug?: string; title?: string; description?: string; coverImage?: string }>()
  if (!body.slug || !body.title) return c.json({ error: 'slug_and_title_required' }, 400)
  const gallery: GalleryRecord = {
    id: crypto.randomUUID(),
    slug: body.slug,
    title: body.title,
    description: body.description || '',
    coverImage: body.coverImage || 'https://picsum.photos/seed/gallery-cover/1200/800',
    published: false,
    createdAt: new Date().toISOString(),
    items: [],
  }
  await saveGallery(c.env, gallery)
  return c.json({ ok: true, gallery })
})

export default route
