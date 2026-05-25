import type { Bindings } from '../../types/env'

export interface GalleryItem {
  id: string
  imageUrl: string
  caption: string
  credit?: string
  lat?: number
  lng?: number
  takenAt?: string
  beforeUrl?: string
  afterUrl?: string
}

export interface GalleryRecord {
  id: string
  slug: string
  title: string
  description: string
  coverImage: string
  published: boolean
  createdAt: string
  items: GalleryItem[]
}

const keyOf = (slug: string) => `gallery:${slug}`

const demoGallery = (slug: string): GalleryRecord => ({
  id: crypto.randomUUID(),
  slug,
  title: `Galeria / ${slug}`,
  description: 'Pokaz slajdów dla portalu Izbica24',
  coverImage: 'https://picsum.photos/seed/izbica-gallery/1200/800',
  published: true,
  createdAt: new Date().toISOString(),
  items: [1, 2, 3, 4].map((index) => ({
    id: crypto.randomUUID(),
    imageUrl: `https://picsum.photos/seed/izbica-gallery-${index}/1200/800`,
    caption: `Kadr ${index} z galerii ${slug}`,
    credit: 'Izbica24 demo',
    takenAt: new Date(Date.now() - index * 86400000).toISOString(),
    lat: 52.42 + index * 0.001,
    lng: 18.77 + index * 0.001,
  })),
})

export const loadGallery = async (env: Bindings, slug: string): Promise<GalleryRecord> => {
  const raw = await env.APP_KV?.get(keyOf(slug), 'json') as GalleryRecord | null
  return raw || demoGallery(slug)
}

export const saveGallery = async (env: Bindings, record: GalleryRecord) => {
  if (!env.APP_KV) return record
  await env.APP_KV.put(keyOf(record.slug), JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 30 })
  return record
}
