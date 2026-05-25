import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  if (!c.env.DB) return c.json({ items: [], fallback: true })
  const images = await queryAll(c.env, 'SELECT id, asset_key as key, alt as title, created_at, "gallery" as kind FROM media_assets ORDER BY created_at DESC LIMIT 4')
  const videos = await queryAll(c.env, 'SELECT id, asset_key as key, title, created_at, "video" as kind FROM videos ORDER BY created_at DESC LIMIT 3')
  const audios = await queryAll(c.env, 'SELECT id, asset_key as key, title, created_at, "audio" as kind FROM audios ORDER BY created_at DESC LIMIT 3')
  const items = [...images, ...videos, ...audios].sort((a, b) => String((b as Record<string, unknown>).created_at).localeCompare(String((a as Record<string, unknown>).created_at))).slice(0, 10)
  return c.json({ total: items.length, items })
})

export default route
