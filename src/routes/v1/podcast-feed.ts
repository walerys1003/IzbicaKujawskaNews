/**
 * Etap A5, czesc podcastowa — kanal RSS zgodny ze specyfikacja Apple Podcasts.
 *
 * Poprzedni `podcast-rss.ts` (22 linie) skladal kilka pol tekstem, bez
 * przestrzeni nazw itunes, bez `<enclosure length>`, bez GUID. Taki kanal
 * odrzuca zarowno Apple Podcasts, jak i Spotify — publikacja bylaby pozorna.
 *
 * Montowanie: /api/v1/podcast
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth } from '../../middleware/require-permission'
import { ok, created, fail, requireDb } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

const nowIso = () => new Date().toISOString()

const CHANNEL = {
  title: 'izbica24.pl — podcast gminny',
  description:
    'Rozmowy, relacje i komentarze z gminy Izbica Kujawska. Sesje rady, wydarzenia kulturalne, sport i sprawy mieszkańców — w formie do słuchania.',
  language: 'pl-PL',
  author: 'Redakcja izbica24.pl',
  email: 'redakcja@izbica24.pl',
  category: 'News',
  subcategory: 'Local News',
  ownerName: 'Redakcja izbica24.pl',
  explicit: 'false',
  copyright: `© ${new Date().getUTCFullYear()} izbica24.pl`,
  artwork: '/static/podcast-cover.jpg',
}

/**
 * Ucieczka znakow XML. Polski tytul z cudzyslowem („Kujawianka" — awans)
 * bez tego rozwala parser czytnika i kanal przestaje sie wczytywac w calosci,
 * nie tylko na jednym odcinku.
 */
const xml = (value: string | null | undefined) =>
  (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** CDATA dla opisow, ktore moga zawierac znaczniki HTML. */
const cdata = (value: string | null | undefined) => `<![CDATA[${(value ?? '').replace(/]]>/g, ']]&gt;')}]]>`

/**
 * RFC 822 — jedyny format daty, ktory czytniki podcastowe akceptuja.
 * ISO 8601 jest ignorowany i odcinek nie pojawia sie na liscie.
 * Bez `new Date()` na tekscie z bazy: Worker pracuje w UTC, a data w bazie
 * jest lokalna, wiec konwersja przez Date przesuwalaby godzine publikacji.
 */
const DNI = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MIESIACE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const rfc822 = (value: string | null | undefined) => {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value)
  if (!match) return ''
  const [, y, mo, d, h, mi, s] = match
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? '0')))
  const day = DNI[date.getUTCDay()]
  return `${day}, ${d} ${MIESIACE[Number(mo) - 1]} ${y} ${h}:${mi}:${s ?? '00'} +0200`
}

/** HH:MM:SS — format wymagany przez itunes:duration. */
const hhmmss = (seconds: number | null | undefined) => {
  if (!seconds || seconds <= 0) return ''
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

interface EpisodeRow {
  id: number
  slug: string
  title: string
  description: string | null
  media_id: string | null
  audio_url: string | null
  audio_size: number | null
  audio_mime: string
  duration_seconds: number | null
  season: number
  episode_number: number | null
  explicit: number
  transcript_text: string | null
  article_id: number | null
  status: string
  published_at: string | null
  created_at: string
  asset_key?: string | null
  asset_size?: number | null
  asset_mime?: string | null
}

const EPISODE_SQL = `SELECT p.*, m.asset_key, m.size AS asset_size, m.mime AS asset_mime
  FROM podcast_episodes p LEFT JOIN media_assets m ON m.id = p.media_id
  WHERE p.deleted_at IS NULL`

const audioHref = (row: EpisodeRow, origin: string) => {
  if (row.audio_url) return row.audio_url.startsWith('http') ? row.audio_url : `${origin}${row.audio_url}`
  if (row.asset_key) return `${origin}/media/${row.asset_key}`
  return ''
}

const presentEpisode = (row: EpisodeRow) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  mediaId: row.media_id,
  audioUrl: row.audio_url ?? (row.asset_key ? `/media/${row.asset_key}` : null),
  audioSize: row.audio_size ?? row.asset_size ?? null,
  audioMime: row.audio_mime ?? row.asset_mime ?? 'audio/mpeg',
  durationSeconds: row.duration_seconds,
  durationLabel: hhmmss(row.duration_seconds),
  season: row.season,
  episodeNumber: row.episode_number,
  explicit: row.explicit === 1,
  hasTranscript: !!row.transcript_text,
  articleId: row.article_id,
  status: row.status,
  publishedAt: row.published_at,
  url: `/multimedia/podcast/${row.slug}`,
})

// ------------------------------------------------------------- GET /feed.xml
// Publiczny kanal. Bez uwierzytelniania — to jest sens istnienia RSS.

route.get('/feed.xml', async (c) => {
  const db = c.env.DB
  const origin = new URL(c.req.url).origin

  let episodes: EpisodeRow[] = []
  if (db) {
    const result = await db
      .prepare(`${EPISODE_SQL} AND p.status = 'published' ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 300`)
      .all<EpisodeRow>()
    episodes = result.results ?? []
  }

  const items = episodes
    .map((row) => {
      const href = audioHref(row, origin)
      // Odcinek bez pliku audio nie jest odcinkiem. Pominiecie jest lepsze
      // niz <enclosure url=""> — pusty enclosure uniewaznia caly kanal.
      if (!href) return ''
      const length = row.audio_size ?? row.asset_size ?? 0
      const mime = row.audio_mime ?? row.asset_mime ?? 'audio/mpeg'
      return `    <item>
      <title>${xml(row.title)}</title>
      <link>${xml(`${origin}/multimedia/podcast/${row.slug}`)}</link>
      <guid isPermaLink="false">izbica24-podcast-${row.id}</guid>
      <pubDate>${rfc822(row.published_at ?? row.created_at)}</pubDate>
      <description>${cdata(row.description)}</description>
      <itunes:summary>${cdata(row.description)}</itunes:summary>
      <itunes:author>${xml(CHANNEL.author)}</itunes:author>
      <itunes:explicit>${row.explicit === 1 ? 'true' : 'false'}</itunes:explicit>
${row.duration_seconds ? `      <itunes:duration>${hhmmss(row.duration_seconds)}</itunes:duration>\n` : ''}${row.season ? `      <itunes:season>${row.season}</itunes:season>\n` : ''}${row.episode_number ? `      <itunes:episode>${row.episode_number}</itunes:episode>\n` : ''}      <enclosure url="${xml(href)}" length="${length}" type="${xml(mime)}" />
    </item>`
    })
    .filter(Boolean)
    .join('\n')

  const lastBuild = rfc822(episodes[0]?.published_at ?? episodes[0]?.created_at ?? nowIso())

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(CHANNEL.title)}</title>
    <link>${xml(`${origin}/multimedia/podcast`)}</link>
    <atom:link href="${xml(`${origin}/api/v1/podcast/feed.xml`)}" rel="self" type="application/rss+xml" />
    <description>${cdata(CHANNEL.description)}</description>
    <language>${CHANNEL.language}</language>
    <copyright>${xml(CHANNEL.copyright)}</copyright>
    <generator>izbica24.pl</generator>
${lastBuild ? `    <lastBuildDate>${lastBuild}</lastBuildDate>\n` : ''}    <itunes:author>${xml(CHANNEL.author)}</itunes:author>
    <itunes:summary>${cdata(CHANNEL.description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>${CHANNEL.explicit}</itunes:explicit>
    <itunes:image href="${xml(`${origin}${CHANNEL.artwork}`)}" />
    <itunes:owner>
      <itunes:name>${xml(CHANNEL.ownerName)}</itunes:name>
      <itunes:email>${xml(CHANNEL.email)}</itunes:email>
    </itunes:owner>
    <itunes:category text="${xml(CHANNEL.category)}">
      <itunes:category text="${xml(CHANNEL.subcategory)}" />
    </itunes:category>
${items}
  </channel>
</rss>
`

  return new Response(feed, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      // 15 minut. Czytniki odpytuja czesto; krotszy cache obciaza baze bez
      // korzysci, dluzszy opoznia pojawienie sie nowego odcinka.
      'cache-control': 'public, max-age=900',
      'x-episode-count': String(episodes.length),
    },
  })
})

/**
 * Zgodnosc wstecz. Poprzednia wersja tego modulu wystawiala kanal pod
 * `/podcast/:slug/feed.xml`, gdzie `:slug` oznaczal serie (tabela `audios`,
 * kolumna `podcast_slug`). Adresy tego kanalu mogly trafic do czytnikow
 * podcastowych, ktore odpytuja je latami — usuniecie trasy oznaczaloby 404
 * bez zadnego sygnalu dla subskrybenta. Trasa przekierowuje na kanal glowny.
 */
route.get('/:series/feed.xml', (c) => {
  const url = new URL(c.req.url)
  url.pathname = '/api/v1/podcast/feed.xml'
  return c.redirect(url.toString(), 301)
})

// -------------------------------------------------------- GET /episodes (pub.)

route.get('/episodes', async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const perPage = Math.min(50, Math.max(1, Number.parseInt(c.req.query('perPage') ?? '20', 10) || 20))

  const [rows, countRow] = await db.batch([
    db.prepare(`${EPISODE_SQL} AND p.status = 'published' ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT ? OFFSET ?`).bind(perPage, (page - 1) * perPage),
    db.prepare("SELECT COUNT(*) AS total FROM podcast_episodes WHERE status = 'published' AND deleted_at IS NULL"),
  ])
  const total = (countRow.results?.[0] as { total?: number } | undefined)?.total ?? 0

  return ok(
    c,
    { episodes: ((rows.results ?? []) as EpisodeRow[]).map(presentEpisode), channel: CHANNEL },
    { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  )
})

// ----------------------------------------------------- GET /episodes/:slug

route.get('/episodes/:slug', async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const row = await db.prepare(`${EPISODE_SQL} AND p.slug = ? AND p.status = 'published'`).bind(c.req.param('slug')).first<EpisodeRow>()
  if (!row) return fail(c, 'not_found', 'Nie znaleziono odcinka.', 404)
  return ok(c, { episode: presentEpisode(row), transcript: row.transcript_text })
})

// ------------------------------------------------------------- POST /episodes

route.post('/episodes', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  if (!title) return fail(c, 'validation_error', 'Pole "title" jest wymagane.', 400)

  const mediaId = typeof body.mediaId === 'string' ? body.mediaId : null
  const audioUrl = typeof body.audioUrl === 'string' ? body.audioUrl : null
  if (!mediaId && !audioUrl) {
    return fail(c, 'validation_error', 'Podaj "mediaId" (zasób z biblioteki) lub "audioUrl" (adres zewnętrzny).', 400)
  }

  if (mediaId) {
    const asset = await db.prepare("SELECT id, kind FROM media_assets WHERE id = ? AND deleted_at IS NULL").bind(mediaId).first<{ id: string; kind: string }>()
    if (!asset) return fail(c, 'not_found', 'Nie znaleziono zasobu audio.', 404)
    if (asset.kind !== 'audio') {
      return fail(c, 'validation_error', `Zasób ma rodzaj "${asset.kind}", a odcinek wymaga pliku audio.`, 400)
    }
  }

  let slug =
    (typeof body.slug === 'string' ? body.slug : title)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/gi, 'l')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 90) || `odcinek-${Date.now()}`
  const taken = await db.prepare('SELECT id FROM podcast_episodes WHERE slug = ?').bind(slug).first()
  if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const result = await db
    .prepare(
      `INSERT INTO podcast_episodes
        (slug, title, description, media_id, audio_url, audio_size, audio_mime, duration_seconds,
         season, episode_number, explicit, transcript_text, article_id, status, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'draft',?14,?14)`,
    )
    .bind(
      slug,
      title,
      typeof body.description === 'string' ? body.description.slice(0, 5000) : null,
      mediaId,
      audioUrl,
      typeof body.audioSize === 'number' ? body.audioSize : null,
      typeof body.audioMime === 'string' ? body.audioMime : 'audio/mpeg',
      typeof body.durationSeconds === 'number' ? Math.round(body.durationSeconds) : null,
      typeof body.season === 'number' ? body.season : 1,
      typeof body.episodeNumber === 'number' ? body.episodeNumber : null,
      body.explicit === true ? 1 : 0,
      typeof body.transcript === 'string' ? body.transcript.slice(0, 200_000) : null,
      typeof body.articleId === 'number' ? body.articleId : null,
      nowIso(),
    )
    .run()

  const id = Number(result.meta?.last_row_id ?? 0)
  const row = await db.prepare(`${EPISODE_SQL} AND p.id = ?`).bind(id).first<EpisodeRow>()
  return created(c, { episode: row ? presentEpisode(row) : null })
})

// ----------------------------------------------- POST /episodes/:id/publish

route.post('/episodes/:id/publish', requireAuth, requirePermission('article:publish'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  const row = await db.prepare(`${EPISODE_SQL} AND p.id = ?`).bind(id).first<EpisodeRow>()
  if (!row) return fail(c, 'not_found', 'Nie znaleziono odcinka.', 404)

  // Bez rozmiaru pliku czytnik nie potrafi pokazac paska postepu ani pobrac
  // odcinka do odsluchu offline — enclosure length jest obowiazkowe.
  const size = row.audio_size ?? row.asset_size ?? 0
  if (!size && !row.audio_url) {
    return fail(c, 'conflict', 'Brak rozmiaru pliku audio — kanał RSS wymaga atrybutu length w enclosure.', 409)
  }

  await db
    .prepare("UPDATE podcast_episodes SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?")
    .bind(nowIso(), nowIso(), id)
    .run()

  const updated = await db.prepare(`${EPISODE_SQL} AND p.id = ?`).bind(id).first<EpisodeRow>()
  return ok(c, { episode: updated ? presentEpisode(updated) : null, feedUrl: '/api/v1/podcast/feed.xml' })
})

// ----------------------------------------------------- PATCH /episodes/:id

route.patch('/episodes/:id', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  const exists = await db.prepare('SELECT id FROM podcast_episodes WHERE id = ? AND deleted_at IS NULL').bind(id).first()
  if (!exists) return fail(c, 'not_found', 'Nie znaleziono odcinka.', 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const map: Array<[string, unknown]> = [
    ['title', typeof body.title === 'string' ? body.title.trim().slice(0, 200) : null],
    ['description', typeof body.description === 'string' ? body.description.slice(0, 5000) : null],
    ['duration_seconds', typeof body.durationSeconds === 'number' ? Math.round(body.durationSeconds) : null],
    ['episode_number', typeof body.episodeNumber === 'number' ? body.episodeNumber : null],
    ['season', typeof body.season === 'number' ? body.season : null],
    ['transcript_text', typeof body.transcript === 'string' ? body.transcript.slice(0, 200_000) : null],
  ]
  const sets: string[] = []
  const binds: unknown[] = []
  for (const [column, value] of map) {
    if (value !== null) {
      sets.push(`${column} = ?`)
      binds.push(value)
    }
  }
  if (typeof body.explicit === 'boolean') {
    sets.push('explicit = ?')
    binds.push(body.explicit ? 1 : 0)
  }
  if (sets.length === 0) return fail(c, 'validation_error', 'Brak pól do aktualizacji.', 400)
  sets.push('updated_at = ?')
  binds.push(nowIso(), id)
  await db.prepare(`UPDATE podcast_episodes SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()

  const row = await db.prepare(`${EPISODE_SQL} AND p.id = ?`).bind(id).first<EpisodeRow>()
  return ok(c, { episode: row ? presentEpisode(row) : null })
})

export default route
