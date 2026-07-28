/**
 * Etap A5, czesc galeryjna — cykl create → add → reorder → publish.
 *
 * Wczesniejsze pliki (gallery-create.ts, gallery-add-image.ts,
 * gallery-reorder.ts, gallery-publish.ts) operowaly na module w pamieci
 * (`gallery-store.ts`), wiec kazde zimne uruchomienie izolatu gubilo galerie,
 * a dwa rownolegle zadania widzialy inny stan. Ten modul zapisuje do D1.
 *
 * Montowanie: /api/v1/galleries-admin
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth } from '../../middleware/require-permission'
import { ok, created, fail, requireDb } from '../../lib/http/envelope'
import { createImageSrcSet } from '../../lib/media/image-variants'

const route = new Hono<AppEnv>()

const nowIso = () => new Date().toISOString()

const slugify = (input: string) =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)

const str = (value: unknown, max = 500) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null

interface GalleryRow {
  id: number
  slug: string
  title: string
  description: string | null
  cover_media_id: string | null
  category_slug: string | null
  event_date: string | null
  photographer: string | null
  status: string
  item_count: number
  view_count: number
  created_by: number | null
  published_at: string | null
  created_at: string
  updated_at: string | null
}

interface ItemRow {
  id: number
  media_id: string
  position: number
  caption: string | null
  credit: string | null
  asset_key: string | null
  alt: string | null
  width: number | null
  height: number | null
  mime: string | null
}

const presentGallery = (row: GalleryRow, items: ItemRow[] = []) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  coverMediaId: row.cover_media_id,
  categorySlug: row.category_slug,
  eventDate: row.event_date,
  photographer: row.photographer,
  status: row.status,
  itemCount: row.item_count,
  viewCount: row.view_count,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  url: `/multimedia/galerie/${row.slug}`,
  items: items.map((item) => ({
    id: item.id,
    mediaId: item.media_id,
    position: item.position,
    caption: item.caption,
    credit: item.credit,
    alt: item.alt,
    width: item.width,
    height: item.height,
    mime: item.mime,
    url: item.asset_key ? `/media/${item.asset_key}` : null,
    srcset: item.asset_key ? createImageSrcSet(`/media/${item.asset_key}`) : null,
  })),
})

const ITEM_SQL = `SELECT gi.id, gi.media_id, gi.position, gi.caption, gi.credit,
    m.asset_key, m.alt, m.width, m.height, m.mime
  FROM gallery_items gi
  LEFT JOIN media_assets m ON m.id = gi.media_id
  WHERE gi.gallery_id = ? ORDER BY gi.position ASC`

// ------------------------------------------------------------------- POST /

route.post('/', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const title = str(body.title, 200)
  if (!title) return fail(c, 'validation_error', 'Pole "title" jest wymagane.', 400)

  let slug = str(body.slug, 90) ? slugify(String(body.slug)) : slugify(title)
  if (!slug) slug = `galeria-${Date.now()}`

  // Kolizja slug oznaczalaby, ze nowa galeria nadpisze adres starej —
  // linki wyslane czytelnikom przestalyby prowadzic do zapowiadanej tresci.
  const taken = await db.prepare('SELECT id FROM galleries WHERE slug = ?').bind(slug).first()
  if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const result = await db
    .prepare(
      `INSERT INTO galleries (slug, title, description, category_slug, event_date, photographer, status, created_by, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,'draft',?7,?8,?8)`,
    )
    .bind(
      slug,
      title,
      str(body.description, 2000),
      str(body.categorySlug, 60),
      str(body.eventDate, 30),
      str(body.photographer, 200),
      Number.parseInt(String(getAuth(c)?.sub ?? '0'), 10) || null,
      nowIso(),
    )
    .run()

  const id = Number(result.meta?.last_row_id ?? 0)
  const row = await db.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first<GalleryRow>()
  return created(c, { gallery: row ? presentGallery(row) : null })
})

// ------------------------------------------------------------------- GET /

route.get('/', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const perPage = Math.min(60, Math.max(1, Number.parseInt(c.req.query('perPage') ?? '20', 10) || 20))
  const status = c.req.query('status')

  const where = ['deleted_at IS NULL']
  const binds: unknown[] = []
  if (status && ['draft', 'review', 'published', 'archived'].includes(status)) {
    where.push('status = ?')
    binds.push(status)
  }
  const whereSql = `WHERE ${where.join(' AND ')}`

  const [rows, countRow] = await db.batch([
    db.prepare(`SELECT * FROM galleries ${whereSql} ORDER BY COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage),
    db.prepare(`SELECT COUNT(*) AS total FROM galleries ${whereSql}`).bind(...binds),
  ])

  const total = (countRow.results?.[0] as { total?: number } | undefined)?.total ?? 0
  return ok(
    c,
    { galleries: ((rows.results ?? []) as GalleryRow[]).map((row) => presentGallery(row)) },
    { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  )
})

// ---------------------------------------------------------------- GET /:id

route.get('/:id', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isInteger(id)) return fail(c, 'validation_error', 'Identyfikator musi być liczbą.', 400)

  const [galleryResult, itemsResult] = await db.batch([
    db.prepare('SELECT * FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(id),
    db.prepare(ITEM_SQL).bind(id),
  ])
  const row = (galleryResult.results?.[0] ?? null) as GalleryRow | null
  if (!row) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)

  return ok(c, { gallery: presentGallery(row, (itemsResult.results ?? []) as ItemRow[]) })
})

// -------------------------------------------------------------- PATCH /:id

route.patch('/:id', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  const exists = await db.prepare('SELECT id FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(id).first()
  if (!exists) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const map: Array<[string, unknown]> = [
    ['title', str(body.title, 200)],
    ['description', str(body.description, 2000)],
    ['cover_media_id', str(body.coverMediaId, 60)],
    ['category_slug', str(body.categorySlug, 60)],
    ['event_date', str(body.eventDate, 30)],
    ['photographer', str(body.photographer, 200)],
  ]
  const sets: string[] = []
  const binds: unknown[] = []
  for (const [column, value] of map) {
    if (value !== null) {
      sets.push(`${column} = ?`)
      binds.push(value)
    }
  }
  if (sets.length === 0) return fail(c, 'validation_error', 'Brak pól do aktualizacji.', 400)
  sets.push('updated_at = ?')
  binds.push(nowIso(), id)
  await db.prepare(`UPDATE galleries SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()

  const row = await db.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first<GalleryRow>()
  return ok(c, { gallery: row ? presentGallery(row) : null })
})

// -------------------------------------------------------- POST /:id/items
// Dodanie zdjec. Przyjmuje jedno `mediaId` albo tablice `mediaIds` —
// redaktor wrzuca zwykle kilkadziesiat zdjec z wydarzenia naraz.

route.post('/:id/items', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const gallery = await db.prepare('SELECT id, status FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(galleryId).first<{ id: number; status: string }>()
  if (!gallery) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const rawIds = Array.isArray(body.mediaIds) ? body.mediaIds : body.mediaId ? [body.mediaId] : []
  const mediaIds = rawIds.map(String).filter(Boolean).slice(0, 200)
  if (mediaIds.length === 0) return fail(c, 'validation_error', 'Podaj "mediaId" lub "mediaIds".', 400)

  // Weryfikacja istnienia zasobow przed zapisem. Bez tego galeria zawiera
  // wpisy wskazujace w pustke, a szablon renderuje puste kafle.
  const placeholders = mediaIds.map(() => '?').join(', ')
  const found = await db
    .prepare(`SELECT id, kind FROM media_assets WHERE id IN (${placeholders}) AND deleted_at IS NULL`)
    .bind(...mediaIds)
    .all<{ id: string; kind: string }>()
  const foundIds = new Set((found.results ?? []).map((r) => r.id))
  const missing = mediaIds.filter((id) => !foundIds.has(id))
  if (missing.length === mediaIds.length) {
    return fail(c, 'not_found', `Żaden z podanych zasobów nie istnieje: ${missing.slice(0, 5).join(', ')}.`, 404)
  }

  const already = await db
    .prepare(`SELECT media_id FROM gallery_items WHERE gallery_id = ?`)
    .bind(galleryId)
    .all<{ media_id: string }>()
  const existing = new Set((already.results ?? []).map((r) => r.media_id))

  const maxRow = await db.prepare('SELECT COALESCE(MAX(position), 0) AS maxpos FROM gallery_items WHERE gallery_id = ?').bind(galleryId).first<{ maxpos: number }>()
  let position = (maxRow?.maxpos ?? 0) + 1

  const statements = []
  const added: string[] = []
  const skipped: string[] = []
  for (const mediaId of mediaIds) {
    if (!foundIds.has(mediaId)) {
      skipped.push(mediaId)
      continue
    }
    if (existing.has(mediaId)) {
      skipped.push(mediaId)
      continue
    }
    statements.push(
      db
        .prepare('INSERT INTO gallery_items (gallery_id, media_id, position, created_at) VALUES (?, ?, ?, ?)')
        .bind(galleryId, mediaId, position, nowIso()),
    )
    added.push(mediaId)
    position += 1
  }

  if (statements.length > 0) await db.batch(statements)

  // Okladka ustawiana automatycznie z pierwszego zdjecia — galeria bez
  // okladki wyswietla sie na liscie jako szara plama.
  const gallRow = await db.prepare('SELECT cover_media_id FROM galleries WHERE id = ?').bind(galleryId).first<{ cover_media_id: string | null }>()
  if (!gallRow?.cover_media_id && added.length > 0) {
    await db.prepare('UPDATE galleries SET cover_media_id = ?, updated_at = ? WHERE id = ?').bind(added[0], nowIso(), galleryId).run()
  } else {
    await db.prepare('UPDATE galleries SET updated_at = ? WHERE id = ?').bind(nowIso(), galleryId).run()
  }

  const [galleryResult, itemsResult] = await db.batch([
    db.prepare('SELECT * FROM galleries WHERE id = ?').bind(galleryId),
    db.prepare(ITEM_SQL).bind(galleryId),
  ])

  return created(c, {
    gallery: presentGallery((galleryResult.results?.[0] ?? null) as GalleryRow, (itemsResult.results ?? []) as ItemRow[]),
    added: added.length,
    skipped,
    missing,
  })
})

// ------------------------------------------------------ POST /:id/reorder
// Kolejnosc zdjec w galerii z wydarzenia to narracja — chronologia przebiegu.

route.post('/:id/reorder', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const gallery = await db.prepare('SELECT id FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(galleryId).first()
  if (!gallery) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const order = Array.isArray(body.order) ? body.order.map(String) : []
  if (order.length === 0) return fail(c, 'validation_error', 'Pole "order" musi być tablicą identyfikatorów mediów.', 400)

  const current = await db.prepare('SELECT media_id FROM gallery_items WHERE gallery_id = ?').bind(galleryId).all<{ media_id: string }>()
  const currentIds = new Set((current.results ?? []).map((r) => r.media_id))

  const unknown = order.filter((id) => !currentIds.has(id))
  if (unknown.length) {
    return fail(c, 'validation_error', `Te zasoby nie należą do galerii: ${unknown.slice(0, 5).join(', ')}.`, 400)
  }
  if (order.length !== currentIds.size) {
    return fail(
      c,
      'validation_error',
      `Lista musi zawierać wszystkie ${currentIds.size} pozycji galerii (otrzymano ${order.length}). Częściowa lista zostawiłaby luki w numeracji.`,
      400,
    )
  }

  // UNIQUE(gallery_id, position) uniemozliwia bezposrednie przenumerowanie —
  // pierwsza kolizja przerywa transakcje. Stad przejscie przez wartosci
  // ujemne, ktore nie moga kolidowac z docelowymi.
  const toNegative = order.map((mediaId, index) =>
    db.prepare('UPDATE gallery_items SET position = ? WHERE gallery_id = ? AND media_id = ?').bind(-(index + 1), galleryId, mediaId),
  )
  const toFinal = order.map((mediaId, index) =>
    db.prepare('UPDATE gallery_items SET position = ? WHERE gallery_id = ? AND media_id = ?').bind(index + 1, galleryId, mediaId),
  )
  await db.batch(toNegative)
  await db.batch(toFinal)
  await db.prepare('UPDATE galleries SET updated_at = ? WHERE id = ?').bind(nowIso(), galleryId).run()

  const items = await db.prepare(ITEM_SQL).bind(galleryId).all<ItemRow>()
  return ok(c, { galleryId, reordered: order.length, items: (items.results ?? []).map((i) => ({ mediaId: i.media_id, position: i.position })) })
})

// ------------------------------------------------ DELETE /:id/items/:mediaId

route.delete('/:id/items/:mediaId', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const mediaId = c.req.param('mediaId')

  const item = await db.prepare('SELECT id FROM gallery_items WHERE gallery_id = ? AND media_id = ?').bind(galleryId, mediaId).first()
  if (!item) return fail(c, 'not_found', 'Nie znaleziono pozycji w galerii.', 404)

  await db.prepare('DELETE FROM gallery_items WHERE gallery_id = ? AND media_id = ?').bind(galleryId, mediaId).run()

  // Domkniecie luki w numeracji. Luki same nie psuja wyswietlania, ale
  // psuja reorder, ktory wymaga ciaglej listy.
  const remaining = await db.prepare('SELECT media_id FROM gallery_items WHERE gallery_id = ? ORDER BY position ASC').bind(galleryId).all<{ media_id: string }>()
  const ids = (remaining.results ?? []).map((r) => r.media_id)
  if (ids.length > 0) {
    await db.batch(ids.map((id, i) => db.prepare('UPDATE gallery_items SET position = ? WHERE gallery_id = ? AND media_id = ?').bind(-(i + 1), galleryId, id)))
    await db.batch(ids.map((id, i) => db.prepare('UPDATE gallery_items SET position = ? WHERE gallery_id = ? AND media_id = ?').bind(i + 1, galleryId, id)))
  }

  // Okladka wskazujaca usuniete zdjecie renderuje sie jako pusta ramka.
  const gall = await db.prepare('SELECT cover_media_id FROM galleries WHERE id = ?').bind(galleryId).first<{ cover_media_id: string | null }>()
  if (gall?.cover_media_id === mediaId) {
    await db.prepare('UPDATE galleries SET cover_media_id = ?, updated_at = ? WHERE id = ?').bind(ids[0] ?? null, nowIso(), galleryId).run()
  }

  return ok(c, { galleryId, mediaId, removed: true, remaining: ids.length })
})

// ------------------------------------------------------ POST /:id/publish

route.post('/:id/publish', requireAuth, requirePermission('article:publish'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const gallery = await db
    .prepare('SELECT id, status, item_count, title FROM galleries WHERE id = ? AND deleted_at IS NULL')
    .bind(galleryId)
    .first<{ id: number; status: string; item_count: number; title: string }>()
  if (!gallery) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)

  // Pusta galeria opublikowana to bledna strona na portalu — kafel prowadzi
  // do widoku bez tresci. Tania walidacja, ktora oszczedza wstyd.
  if (gallery.item_count === 0) {
    return fail(c, 'conflict', 'Nie można opublikować galerii bez zdjęć.', 409)
  }

  // Opis alternatywny jest wymogiem ustawy o dostepnosci cyfrowej dla
  // podmiotow publicznych. Portal gminny jest nim objety.
  const withoutAlt = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM gallery_items gi
       LEFT JOIN media_assets m ON m.id = gi.media_id
       WHERE gi.gallery_id = ? AND (m.alt IS NULL OR TRIM(m.alt) = '')`,
    )
    .bind(galleryId)
    .first<{ c: number }>()

  const force = c.req.query('force') === '1'
  if ((withoutAlt?.c ?? 0) > 0 && !force) {
    return fail(
      c,
      'accessibility_warning',
      `${withoutAlt?.c} zdjęć nie ma opisu alternatywnego (wymóg WCAG 2.1 AA). Uzupełnij opisy lub dodaj ?force=1.`,
      409,
    )
  }

  await db
    .prepare("UPDATE galleries SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?")
    .bind(nowIso(), nowIso(), galleryId)
    .run()

  const row = await db.prepare('SELECT * FROM galleries WHERE id = ?').bind(galleryId).first<GalleryRow>()
  return ok(c, {
    gallery: row ? presentGallery(row) : null,
    accessibilityWarnings: withoutAlt?.c ?? 0,
    forced: force && (withoutAlt?.c ?? 0) > 0,
  })
})

// ---------------------------------------------------- POST /:id/unpublish

route.post('/:id/unpublish', requireAuth, requirePermission('article:unpublish'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const gallery = await db.prepare('SELECT id FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(galleryId).first()
  if (!gallery) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)
  await db.prepare("UPDATE galleries SET status = 'draft', updated_at = ? WHERE id = ?").bind(nowIso(), galleryId).run()
  return ok(c, { galleryId, status: 'draft' })
})

// ------------------------------------------------------------ DELETE /:id

route.delete('/:id', requireAuth, requirePermission('media:delete:any'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const galleryId = Number.parseInt(c.req.param('id'), 10)
  const gallery = await db.prepare('SELECT id, status FROM galleries WHERE id = ? AND deleted_at IS NULL').bind(galleryId).first<{ id: number; status: string }>()
  if (!gallery) return fail(c, 'not_found', 'Nie znaleziono galerii.', 404)
  if (gallery.status === 'published' && c.req.query('force') !== '1') {
    return fail(c, 'conflict', 'Galeria jest opublikowana. Najpierw ją wycofaj lub dodaj ?force=1.', 409)
  }
  await db.prepare("UPDATE galleries SET deleted_at = ?, status = 'archived', updated_at = ? WHERE id = ?").bind(nowIso(), nowIso(), galleryId).run()
  return ok(c, { galleryId, deleted: true })
})

export default route
