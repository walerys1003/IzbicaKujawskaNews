import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { queryAll, type AudioRecord } from '../../lib/media/db'
import { buildPodcastRss } from '../../lib/media/podcast-rss'

const route = new Hono<AppEnv>()

route.get('/:slug/feed.xml', async (c) => {
  const slug = c.req.param('slug')
  const items = c.env.DB
    ? await queryAll<AudioRecord & { title: string }>(c.env, 'SELECT id, asset_key, title, duration_seconds, waveform_json, transcript_text, podcast_slug, created_at FROM audios WHERE podcast_slug = ? ORDER BY created_at DESC LIMIT 50', [slug])
    : []
  const rss = buildPodcastRss(slug, `Podcast Izbica24 / ${slug}`, items.map((item) => ({ ...item, enclosureUrl: `/r2/audio/${item.asset_key}`, description: item.transcript_text || item.title })))
  return c.body(rss, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8' })
})

export default route
