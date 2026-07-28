/**
 * Etap A5 — pelna warstwa mediow.
 *
 * Poprzedni `media-upload.ts` przyjmowal plik na slowo: `file.type` pochodzil
 * od przegladarki, brak limitu rozmiaru, dedupe tylko po phash z 50 ostatnich
 * rekordow, brak wariantow, brak metadanych licencyjnych, brak galerii.
 * Ten modul zastepuje go w calosci; stary zostaje zamontowany dla zgodnosci.
 *
 * Montowanie: /api/v1/media2
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth } from '../../middleware/require-permission'
import { uploadToR2, sanitizeMediaFilename, resolveMediaBucket, type MediaBucketTarget } from '../../lib/media/r2-upload'
import { extractImageMetadata } from '../../lib/media/image-metadata'
import { createImageVariants, createImageSrcSet } from '../../lib/media/image-variants'
import { createPerceptualHash } from '../../lib/media/duplicate-detect'
import {
  sniffMime,
  contentHash,
  assertSizeAllowed,
  MediaRejected,
  SINGLE_REQUEST_LIMIT,
  type MediaKind,
} from '../../lib/media/mime-sniff'
import { ok, created, fail, requireDb } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

// ---------------------------------------------------------------- pomocnicze

const BUCKET_FOR_KIND: Record<MediaKind, MediaBucketTarget> = {
  image: 'images',
  video: 'videos',
  audio: 'audio',
  document: 'generic',
}

const nowIso = () => new Date().toISOString()

const slugify = (input: string) =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/gi, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || `pozycja-${Date.now()}`

const str = (value: unknown, max = 500) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null

const num = (value: unknown) => {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Publiczny adres zasobu. R2 nie jest wystawiony bezposrednio — wszystko idzie
 * przez /media/:key, bo inaczej zmiana bucketu unieważnia kazdy zapisany adres.
 */
const publicUrl = (key: string) => `/media/${key}`

interface MediaRow {
  id: string
  asset_key: string
  bucket: string
  kind: string
  mime: string
  size: number
  width: number | null
  height: number | null
  alt: string | null
  title: string | null
  caption: string | null
  credit: string | null
  author: string | null
  license: string | null
  license_url: string | null
  source: string | null
  source_url: string | null
  tags_json: string | null
  phash: string | null
  content_hash: string | null
  variants_json: string | null
  focal_x: number | null
  focal_y: number | null
  duration_seconds: number | null
  status: string
  uploader_id: string | null
  created_at: string
  updated_at: string | null
}

const presentMedia = (row: MediaRow) => {
  let tags: string[] = []
  try {
    const parsed = JSON.parse(row.tags_json ?? '[]')
    tags = Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    tags = []
  }
  let variants: Record<string, string> | null = null
  try {
    variants = row.variants_json ? (JSON.parse(row.variants_json) as Record<string, string>) : null
  } catch {
    variants = null
  }
  return {
    id: row.id,
    key: row.asset_key,
    bucket: row.bucket,
    kind: row.kind,
    mime: row.mime,
    size: row.size,
    width: row.width,
    height: row.height,
    alt: row.alt,
    title: row.title,
    caption: row.caption,
    credit: row.credit,
    licensing: {
      author: row.author,
      license: row.license,
      licenseUrl: row.license_url,
      source: row.source,
      sourceUrl: row.source_url,
    },
    tags,
    contentHash: row.content_hash,
    perceptualHash: row.phash,
    variants,
    focal: row.focal_x !== null && row.focal_y !== null ? { x: row.focal_x, y: row.focal_y } : null,
    durationSeconds: row.duration_seconds,
    status: row.status,
    url: publicUrl(row.asset_key),
    srcset: row.kind === 'image' ? createImageSrcSet(publicUrl(row.asset_key)) : null,
    uploaderId: row.uploader_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const MEDIA_COLUMNS = `id, asset_key, bucket, kind, mime, size, width, height, alt, title, caption, credit,
  author, license, license_url, source, source_url, tags_json, phash, content_hash, variants_json,
  focal_x, focal_y, duration_seconds, status, uploader_id, created_at, updated_at`

// ------------------------------------------------------------------- POST /
// Upload pojedynczego pliku (< 100 MB).

route.post('/', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const contentLength = Number.parseInt(c.req.header('content-length') ?? '0', 10)
  if (contentLength > SINGLE_REQUEST_LIMIT) {
    return fail(
      c,
      'payload_too_large',
      `Plik przekracza ${Math.round(SINGLE_REQUEST_LIMIT / 1024 / 1024)} MB. Użyj przesyłania wieloczęściowego: POST /api/v1/media2/multipart/create.`,
      413,
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await c.req.parseBody({ all: false })) as Record<string, unknown>
  } catch {
    return fail(c, 'invalid_multipart', 'Nie udało się odczytać formularza.', 400)
  }

  const file = body.file
  if (!(file instanceof File)) return fail(c, 'file_required', 'Brak pola "file".', 400)
  if (file.size === 0) return fail(c, 'empty_file', 'Przesłany plik jest pusty.', 400)

  const bytes = await file.arrayBuffer()

  let sniffed
  try {
    sniffed = sniffMime(bytes, file.type)
    assertSizeAllowed(sniffed.kind, bytes.byteLength)
  } catch (error) {
    if (error instanceof MediaRejected) {
      return fail(c, error.code, `Plik odrzucony: ${error.code}${error.detail ? ` (${error.detail})` : ''}.`, 415)
    }
    throw error
  }

  // Dedupe po tresci. Wykonywane przed zapisem do R2, zeby nie tworzyc
  // sierocych obiektow, ktore nigdy nie beda wskazane z bazy.
  const hash = await contentHash(bytes)
  const existing = await db
    .prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE content_hash = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(hash)
    .first<MediaRow>()

  if (existing) {
    // 200, nie 409 — z punktu widzenia redaktora operacja sie udala,
    // ma zasob o zadanej tresci. Blad byl fałszywym alarmem.
    return ok(c, {
      media: presentMedia(existing),
      deduplicated: true,
      message: 'Ten plik już istnieje w bibliotece — użyto istniejącego zasobu.',
    })
  }

  // EXIF usuwany zawsze. Zdjecie z telefonu zawiera wspolrzedne GPS domu
  // osoby fotografujacej; publikacja tego jest wyciekiem danych osobowych.
  const meta =
    sniffed.kind === 'image' && sniffed.mime !== 'image/svg+xml'
      ? await extractImageMetadata(bytes, sniffed.mime)
      : { width: null, height: null, strippedBytes: bytes, hasExif: false, mimeType: sniffed.mime }

  const payload = meta.strippedBytes
  const filename = sanitizeMediaFilename(file.name || `plik.${sniffed.extension}`)

  let upload
  try {
    upload = await uploadToR2(c.env, {
      bucket: BUCKET_FOR_KIND[sniffed.kind],
      filename,
      contentType: sniffed.mime,
      body: payload,
      customMetadata: {
        contentHash: hash,
        uploaderId: String(getAuth(c)?.sub ?? 'nieznany'),
        exifStripped: meta.hasExif ? '1' : '0',
      },
    })
  } catch (error) {
    return fail(
      c,
      'storage_unavailable',
      `Magazyn R2 nie jest skonfigurowany: ${error instanceof Error ? error.message : 'nieznany błąd'}.`,
      503,
    )
  }

  const id = crypto.randomUUID()
  const url = publicUrl(upload.key)
  const variants = sniffed.kind === 'image' ? createImageVariants(url) : null
  const phash = sniffed.kind === 'image' ? createPerceptualHash(payload) : null

  const tags = str(body.tags, 400)
  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20) : []

  await db
    .prepare(
      `INSERT INTO media_assets
        (id, asset_key, bucket, kind, mime, size, width, height, alt, title, caption, credit,
         author, license, license_url, source, source_url, tags_json, phash, content_hash,
         variants_json, focal_x, focal_y, duration_seconds, status, uploader_id, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,'ready',?25,?26,?26)`,
    )
    .bind(
      id,
      upload.key,
      upload.binding,
      sniffed.kind,
      sniffed.mime,
      payload.byteLength,
      meta.width,
      meta.height,
      str(body.alt, 300),
      str(body.title, 200),
      str(body.caption, 600),
      str(body.credit, 200),
      str(body.author, 200),
      str(body.license, 100) ?? 'wlasne',
      str(body.licenseUrl, 400),
      str(body.source, 200) ?? 'redakcja izbica24.pl',
      str(body.sourceUrl, 400),
      JSON.stringify(tagList),
      phash,
      hash,
      variants ? JSON.stringify(variants) : null,
      num(body.focalX),
      num(body.focalY),
      num(body.durationSeconds),
      String(getAuth(c)?.sub ?? ''),
      nowIso(),
    )
    .run()

  const row = await db.prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE id = ?`).bind(id).first<MediaRow>()

  return created(c, {
    media: row ? presentMedia(row) : null,
    deduplicated: false,
    declaredMimeMatched: sniffed.declaredMatches,
    exifStripped: meta.hasExif,
  })
})

// ------------------------------------------------------ POST /multipart/create
// Sciezka dla plikow > 100 MB — wideo z sesji rady gminy ma po 300–900 MB.

route.post('/multipart/create', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const filename = str(body.filename, 200)
  const mime = str(body.mime, 100)
  const totalSize = num(body.totalSize)
  const kind = (str(body.kind, 20) ?? 'video') as MediaKind

  if (!filename) return fail(c, 'validation_error', 'Pole "filename" jest wymagane.', 400)
  if (!mime) return fail(c, 'validation_error', 'Pole "mime" jest wymagane.', 400)
  if (!totalSize || totalSize <= 0) return fail(c, 'validation_error', 'Pole "totalSize" musi być liczbą dodatnią.', 400)
  if (!['image', 'video', 'audio', 'document'].includes(kind)) {
    return fail(c, 'validation_error', 'Pole "kind" musi być jednym z: image, video, audio, document.', 400)
  }

  try {
    assertSizeAllowed(kind, totalSize)
  } catch (error) {
    if (error instanceof MediaRejected) return fail(c, error.code, `Rozmiar odrzucony: ${error.detail ?? ''}`, 413)
    throw error
  }

  let resolved
  try {
    resolved = resolveMediaBucket(c.env, BUCKET_FOR_KIND[kind])
  } catch {
    return fail(c, 'storage_unavailable', 'Magazyn R2 nie jest skonfigurowany.', 503)
  }

  const safeName = sanitizeMediaFilename(filename)
  const assetKey = `${resolved.prefix}/${crypto.randomUUID()}-${safeName}`
  const sessionId = crypto.randomUUID()

  // R2 ma wlasne multipart API, ale dostepnosc `createMultipartUpload` zalezy
  // od wersji bindingu. Sesja w D1 dziala w obu przypadkach: gdy natywne API
  // istnieje, zapisujemy jego uploadId; gdy nie — skladamy czesci sami.
  let uploadId: string | null = null
  const bucket = resolved.bucket as unknown as {
    createMultipartUpload?: (key: string, opts?: unknown) => Promise<{ uploadId: string }>
  }
  if (typeof bucket.createMultipartUpload === 'function') {
    try {
      const mpu = await bucket.createMultipartUpload(assetKey, {
        httpMetadata: { contentType: mime, cacheControl: 'public, max-age=31536000, immutable' },
      })
      uploadId = mpu.uploadId
    } catch {
      uploadId = null
    }
  }

  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()

  await db
    .prepare(
      `INSERT INTO media_upload_sessions
        (id, upload_id, asset_key, bucket, filename, mime, total_size, kind, status, uploader_id, created_at, updated_at, expires_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'open',?9,?10,?10,?11)`,
    )
    .bind(
      sessionId,
      uploadId,
      assetKey,
      resolved.binding,
      safeName,
      mime,
      totalSize,
      kind,
      String(getAuth(c)?.sub ?? ''),
      nowIso(),
      expiresAt,
    )
    .run()

  const partSize = 10 * 1024 * 1024
  return created(c, {
    sessionId,
    assetKey,
    bucket: resolved.binding,
    nativeMultipart: !!uploadId,
    recommendedPartSize: partSize,
    expectedParts: Math.ceil(totalSize / partSize),
    expiresAt,
    partUrl: `/api/v1/media2/multipart/${sessionId}/part?partNumber=N`,
    completeUrl: `/api/v1/media2/multipart/${sessionId}/complete`,
  })
})

// -------------------------------------------- PUT /multipart/:sessionId/part

route.put('/multipart/:sessionId/part', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const sessionId = c.req.param('sessionId')
  const partNumber = Number.parseInt(c.req.query('partNumber') ?? '0', 10)
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
    return fail(c, 'validation_error', 'Parametr "partNumber" musi być liczbą 1–10000.', 400)
  }

  const session = await db
    .prepare('SELECT * FROM media_upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first<{
      id: string
      upload_id: string | null
      asset_key: string
      bucket: string
      mime: string
      total_size: number
      received_size: number
      parts_json: string
      status: string
      expires_at: string | null
    }>()

  if (!session) return fail(c, 'not_found', 'Nie znaleziono sesji przesyłania.', 404)
  if (session.status !== 'open') return fail(c, 'conflict', `Sesja ma stan "${session.status}".`, 409)
  if (session.expires_at && session.expires_at < nowIso()) {
    await db.prepare("UPDATE media_upload_sessions SET status = 'expired', updated_at = ? WHERE id = ?").bind(nowIso(), sessionId).run()
    return fail(c, 'gone', 'Sesja przesyłania wygasła.', 410)
  }

  const chunk = await c.req.arrayBuffer()
  if (chunk.byteLength === 0) return fail(c, 'empty_part', 'Część jest pusta.', 400)

  // Czesci trzymamy jako osobne obiekty R2 z sufiksem .part-N.
  // Sklejanie odbywa sie przy complete. To dziala niezaleznie od tego, czy
  // binding wspiera natywne multipart — i jest odtwarzalne po awarii.
  const partKey = `${session.asset_key}.part-${String(partNumber).padStart(5, '0')}`
  try {
    await uploadToR2(c.env, {
      bindingName: session.bucket as never,
      key: partKey,
      filename: partKey,
      contentType: 'application/octet-stream',
      body: chunk,
      customMetadata: { sessionId, partNumber: String(partNumber) },
    })
  } catch (error) {
    return fail(c, 'storage_error', `Nie udało się zapisać części: ${error instanceof Error ? error.message : 'błąd'}.`, 502)
  }

  let parts: Array<{ n: number; size: number; key: string }> = []
  try {
    parts = JSON.parse(session.parts_json) as typeof parts
  } catch {
    parts = []
  }
  parts = parts.filter((p) => p.n !== partNumber)
  parts.push({ n: partNumber, size: chunk.byteLength, key: partKey })
  parts.sort((a, b) => a.n - b.n)

  const receivedSize = parts.reduce((sum, p) => sum + p.size, 0)

  await db
    .prepare('UPDATE media_upload_sessions SET parts_json = ?, part_count = ?, received_size = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(parts), parts.length, receivedSize, nowIso(), sessionId)
    .run()

  return ok(c, {
    sessionId,
    partNumber,
    partSize: chunk.byteLength,
    receivedParts: parts.length,
    receivedSize,
    totalSize: session.total_size,
    progressPercent: session.total_size ? Math.round((receivedSize / session.total_size) * 100) : null,
  })
})

// --------------------------------------- POST /multipart/:sessionId/complete

route.post('/multipart/:sessionId/complete', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const sessionId = c.req.param('sessionId')
  const session = await db
    .prepare('SELECT * FROM media_upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first<{
      id: string
      asset_key: string
      bucket: string
      filename: string
      mime: string
      kind: string
      total_size: number
      received_size: number
      parts_json: string
      status: string
      uploader_id: string | null
    }>()

  if (!session) return fail(c, 'not_found', 'Nie znaleziono sesji przesyłania.', 404)
  if (session.status !== 'open') return fail(c, 'conflict', `Sesja ma stan "${session.status}".`, 409)

  let parts: Array<{ n: number; size: number; key: string }> = []
  try {
    parts = JSON.parse(session.parts_json) as typeof parts
  } catch {
    parts = []
  }
  if (parts.length === 0) return fail(c, 'no_parts', 'Nie przesłano żadnej części.', 400)

  // Numery czesci musza byc ciagle. Luka oznacza, ze plik bylby uszkodzony,
  // a uszkodzone wideo ujawnia sie dopiero u czytelnika.
  const missing: number[] = []
  for (let i = 1; i <= parts[parts.length - 1].n; i += 1) {
    if (!parts.some((p) => p.n === i)) missing.push(i)
  }
  if (missing.length) {
    return fail(c, 'incomplete_upload', `Brakujące części: ${missing.slice(0, 20).join(', ')}.`, 409)
  }

  const bucket = c.env[session.bucket as keyof typeof c.env] as unknown as {
    get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>
    put: (key: string, body: ArrayBuffer, opts?: unknown) => Promise<unknown>
    delete: (key: string) => Promise<unknown>
  } | null

  if (!bucket || typeof bucket.get !== 'function') {
    return fail(c, 'storage_unavailable', `Binding ${session.bucket} nie jest dostępny.`, 503)
  }

  const chunks: Uint8Array[] = []
  let total = 0
  for (const part of parts) {
    const object = await bucket.get(part.key)
    if (!object) return fail(c, 'part_missing_in_storage', `Część ${part.n} nie istnieje w magazynie.`, 409)
    const buf = new Uint8Array(await object.arrayBuffer())
    chunks.push(buf)
    total += buf.byteLength
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  // Weryfikacja sygnatury dopiero teraz — pierwsza czesc sama moze nie
  // zawierac pelnego naglowka, a deklaracja z /create pozostaje niesprawdzona
  // do momentu, w ktorym mamy caly plik.
  let sniffed
  try {
    sniffed = sniffMime(merged.buffer, session.mime)
  } catch (error) {
    await db.prepare("UPDATE media_upload_sessions SET status = 'aborted', updated_at = ? WHERE id = ?").bind(nowIso(), sessionId).run()
    for (const part of parts) await bucket.delete(part.key).catch(() => undefined)
    if (error instanceof MediaRejected) {
      return fail(c, error.code, `Złożony plik odrzucony: ${error.code}${error.detail ? ` (${error.detail})` : ''}.`, 415)
    }
    throw error
  }

  const hash = await contentHash(merged.buffer)
  const duplicate = await db
    .prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE content_hash = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(hash)
    .first<MediaRow>()

  for (const part of parts) await bucket.delete(part.key).catch(() => undefined)

  if (duplicate) {
    await db.prepare("UPDATE media_upload_sessions SET status = 'completed', updated_at = ? WHERE id = ?").bind(nowIso(), sessionId).run()
    return ok(c, { media: presentMedia(duplicate), deduplicated: true, message: 'Plik o tej treści już istnieje.' })
  }

  await bucket.put(session.asset_key, merged.buffer, {
    httpMetadata: { contentType: sniffed.mime, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { contentHash: hash, uploaderId: session.uploader_id ?? '' },
  })

  const id = crypto.randomUUID()
  const url = publicUrl(session.asset_key)
  await db
    .prepare(
      `INSERT INTO media_assets
        (id, asset_key, bucket, kind, mime, size, alt, title, tags_json, content_hash, variants_json,
         status, uploader_id, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'[]',?9,?10,'ready',?11,?12,?12)`,
    )
    .bind(
      id,
      session.asset_key,
      session.bucket,
      sniffed.kind,
      sniffed.mime,
      merged.byteLength,
      null,
      session.filename,
      hash,
      sniffed.kind === 'image' ? JSON.stringify(createImageVariants(url)) : null,
      session.uploader_id,
      nowIso(),
    )
    .run()

  await db.prepare("UPDATE media_upload_sessions SET status = 'completed', updated_at = ? WHERE id = ?").bind(nowIso(), sessionId).run()

  const row = await db.prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE id = ?`).bind(id).first<MediaRow>()
  return created(c, { media: row ? presentMedia(row) : null, deduplicated: false, mergedParts: parts.length })
})

// ---------------------------------- DELETE /multipart/:sessionId (przerwanie)

route.delete('/multipart/:sessionId', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const sessionId = c.req.param('sessionId')
  const session = await db
    .prepare('SELECT bucket, parts_json FROM media_upload_sessions WHERE id = ?')
    .bind(sessionId)
    .first<{ bucket: string; parts_json: string }>()
  if (!session) return fail(c, 'not_found', 'Nie znaleziono sesji.', 404)

  const bucket = c.env[session.bucket as keyof typeof c.env] as unknown as { delete: (key: string) => Promise<unknown> } | null
  if (bucket?.delete) {
    try {
      const parts = JSON.parse(session.parts_json) as Array<{ key: string }>
      for (const part of parts) await bucket.delete(part.key).catch(() => undefined)
    } catch {
      /* brak czesci do usuniecia */
    }
  }
  await db.prepare("UPDATE media_upload_sessions SET status = 'aborted', updated_at = ? WHERE id = ?").bind(nowIso(), sessionId).run()
  return ok(c, { sessionId, aborted: true })
})

// ------------------------------------------------------------------- GET /
// Biblioteka mediow z filtrami.

route.get('/', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const perPage = Math.min(100, Math.max(1, Number.parseInt(c.req.query('perPage') ?? '24', 10) || 24))
  const kind = c.req.query('kind')
  const q = c.req.query('q')?.trim()
  const license = c.req.query('license')
  const missingAlt = c.req.query('missingAlt') === '1'

  const where: string[] = ['deleted_at IS NULL']
  const binds: unknown[] = []
  if (kind && ['image', 'video', 'audio', 'document'].includes(kind)) {
    where.push('kind = ?')
    binds.push(kind)
  }
  if (q) {
    where.push('(alt LIKE ? OR title LIKE ? OR caption LIKE ? OR asset_key LIKE ? OR tags_json LIKE ?)')
    const like = `%${q}%`
    binds.push(like, like, like, like, like)
  }
  if (license) {
    where.push('license = ?')
    binds.push(license)
  }
  // Zasob bez opisu alternatywnego lamie WCAG. Filtr pozwala go znalezc,
  // zamiast czekac na audyt dostepnosci.
  if (missingAlt) where.push("(alt IS NULL OR TRIM(alt) = '')")

  const whereSql = `WHERE ${where.join(' AND ')}`

  const [rows, countRow, stats] = await db.batch([
    db.prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, perPage, (page - 1) * perPage),
    db.prepare(`SELECT COUNT(*) AS total FROM media_assets ${whereSql}`).bind(...binds),
    db.prepare(
      `SELECT kind, COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes
       FROM media_assets WHERE deleted_at IS NULL GROUP BY kind`,
    ),
  ])

  const total = (countRow.results?.[0] as { total?: number } | undefined)?.total ?? 0

  return ok(
    c,
    {
      media: ((rows.results ?? []) as MediaRow[]).map(presentMedia),
      stats: (stats.results ?? []) as Array<{ kind: string; count: number; bytes: number }>,
    },
    { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  )
})

// -------------------------------------------------------------- GET /:id

route.get('/:id', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const row = await db
    .prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE id = ? AND deleted_at IS NULL`)
    .bind(c.req.param('id'))
    .first<MediaRow>()
  if (!row) return fail(c, 'not_found', 'Nie znaleziono zasobu.', 404)

  const uses = await db
    .prepare(
      `SELECT gi.gallery_id AS gallery_id, g.title AS gallery_title
       FROM gallery_items gi JOIN galleries g ON g.id = gi.gallery_id
       WHERE gi.media_id = ? LIMIT 50`,
    )
    .bind(row.id)
    .all<{ gallery_id: number; gallery_title: string }>()

  return ok(c, { media: presentMedia(row), galleries: uses.results ?? [] })
})

// -------------------------------------------------------------- PATCH /:id
// Metadane, w tym licencyjne — bez tego I11 nie ma gdzie zapisac zrodla.

route.patch('/:id', requireAuth, requirePermission('media:upload'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const id = c.req.param('id')
  const exists = await db.prepare('SELECT id FROM media_assets WHERE id = ? AND deleted_at IS NULL').bind(id).first()
  if (!exists) return fail(c, 'not_found', 'Nie znaleziono zasobu.', 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const map: Array<[string, unknown]> = [
    ['alt', str(body.alt, 300)],
    ['title', str(body.title, 200)],
    ['caption', str(body.caption, 600)],
    ['credit', str(body.credit, 200)],
    ['author', str(body.author, 200)],
    ['license', str(body.license, 100)],
    ['license_url', str(body.licenseUrl, 400)],
    ['source', str(body.source, 200)],
    ['source_url', str(body.sourceUrl, 400)],
    ['focal_x', num(body.focalX)],
    ['focal_y', num(body.focalY)],
  ]

  const sets: string[] = []
  const binds: unknown[] = []
  for (const [column, value] of map) {
    if (value !== null && value !== undefined) {
      sets.push(`${column} = ?`)
      binds.push(value)
    }
  }
  if (Array.isArray(body.tags)) {
    sets.push('tags_json = ?')
    binds.push(JSON.stringify(body.tags.map(String).slice(0, 20)))
  }
  if (sets.length === 0) return fail(c, 'validation_error', 'Brak pól do aktualizacji.', 400)

  sets.push('updated_at = ?')
  binds.push(nowIso(), id)
  await db.prepare(`UPDATE media_assets SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()

  const row = await db.prepare(`SELECT ${MEDIA_COLUMNS} FROM media_assets WHERE id = ?`).bind(id).first<MediaRow>()
  return ok(c, { media: row ? presentMedia(row) : null, updatedFields: sets.length - 1 })
})

// -------------------------------------------------------------- DELETE /:id
// Miekkie usuniecie: obiekt R2 zostaje, bo artykul opublikowany moze go
// jeszcze wskazywac, a twarde usuniecie zamienia zdjecie w pusta ramke.

route.delete('/:id', requireAuth, requirePermission('media:delete:any'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db

  const id = c.req.param('id')
  const row = await db.prepare('SELECT asset_key FROM media_assets WHERE id = ? AND deleted_at IS NULL').bind(id).first<{ asset_key: string }>()
  if (!row) return fail(c, 'not_found', 'Nie znaleziono zasobu.', 404)

  const inGalleries = await db
    .prepare('SELECT COUNT(*) AS c FROM gallery_items WHERE media_id = ?')
    .bind(id)
    .first<{ c: number }>()

  const force = c.req.query('force') === '1'
  if ((inGalleries?.c ?? 0) > 0 && !force) {
    return fail(
      c,
      'conflict',
      `Zasób jest użyty w ${inGalleries?.c} galeriach. Dodaj ?force=1, aby usunąć wraz z powiązaniami.`,
      409,
    )
  }

  if (force) await db.prepare('DELETE FROM gallery_items WHERE media_id = ?').bind(id).run()
  await db.prepare("UPDATE media_assets SET deleted_at = ?, status = 'deleted', updated_at = ? WHERE id = ?").bind(nowIso(), nowIso(), id).run()

  return ok(c, { id, deleted: true, removedFromGalleries: force ? inGalleries?.c ?? 0 : 0 })
})

export default route
