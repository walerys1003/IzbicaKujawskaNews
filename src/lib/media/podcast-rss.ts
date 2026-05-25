import type { AudioRecord } from './db'

const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const buildPodcastRss = (slug: string, title: string, items: Array<AudioRecord & { enclosureUrl: string; description?: string }>) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${xml(title)}</title>
    <link>https://izbica24.pl/api/v1/podcast/${slug}/feed.xml</link>
    <language>pl-PL</language>
    <description>Podcast portalu Izbica24</description>
    <itunes:author>Izbica24</itunes:author>
    <itunes:summary>Aktualności audio, rozmowy i relacje z gminy Izbica Kujawska.</itunes:summary>
    ${items.map((item) => `<item>
      <guid>${xml(item.id)}</guid>
      <title>${xml(item.title)}</title>
      <description>${xml(item.description || item.title)}</description>
      <enclosure url="${xml(item.enclosureUrl)}" type="audio/mpeg" />
      <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
    </item>`).join('\n')}
  </channel>
</rss>`
