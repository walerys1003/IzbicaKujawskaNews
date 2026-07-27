import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll } from '../../lib/media/db'
import { fail, ok } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

route.get('/', async (c) => {
  // A3: brak bazy to awaria (503), nie pusta sekcja multimediów.
  if (!c.env.DB) return fail(c, 'database_unavailable')
  const images = await queryAll(c.env, 'SELECT id, asset_key as key, alt as title, created_at, "gallery" as kind FROM media_assets ORDER BY created_at DESC LIMIT 4')
  const videos = await queryAll(c.env, 'SELECT id, asset_key as key, title, created_at, "video" as kind FROM videos ORDER BY created_at DESC LIMIT 3')
  const audios = await queryAll(c.env, 'SELECT id, asset_key as key, title, created_at, "audio" as kind FROM audios ORDER BY created_at DESC LIMIT 3')
  const items = [...images, ...videos, ...audios].sort((a, b) => String((b as Record<string, unknown>).created_at).localeCompare(String((a as Record<string, unknown>).created_at))).slice(0, 10)
  return ok(c, items, { total: items.length })
})

export default route
