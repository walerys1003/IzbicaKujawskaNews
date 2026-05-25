import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { uploadToR2 } from '../../lib/media/r2-upload'
import { extractImageMetadata } from '../../lib/media/image-metadata'
import { generateAltText } from '../../lib/media/alt-text-ai'
import { createPerceptualHash, detectDuplicate } from '../../lib/media/duplicate-detect'
import { insertMediaAsset, parseTags, queryAll, type MediaAssetRecord } from '../../lib/media/db'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.json({ error: 'file_required' }, 400)
  const bytes = await file.arrayBuffer()
  const meta = await extractImageMetadata(bytes, file.type || 'image/jpeg')
  const phash = createPerceptualHash(meta.strippedBytes)
  const existing = c.env.DB ? await queryAll<Pick<MediaAssetRecord, 'phash'>>(c.env, 'SELECT phash FROM media_assets WHERE kind = ? AND phash IS NOT NULL ORDER BY created_at DESC LIMIT 50', ['image']) : []
  const duplicate = detectDuplicate(phash, existing.map((item) => item.phash || '').filter(Boolean))
  if (duplicate.duplicate) return c.json({ error: 'duplicate_media_detected', duplicate }, 409)

  const uploaderId = typeof body.uploaderId === 'string' ? body.uploaderId : 'anonymous'
  const altInput = typeof body.alt === 'string' ? body.alt.trim() : ''
  const tagList = typeof body.tags === 'string' ? parseTags(body.tags) : []
  const upload = await uploadToR2(c.env, { bucket: 'images', filename: file.name, contentType: file.type || 'image/jpeg', body: meta.strippedBytes, customMetadata: { uploaderId } })
  const id = crypto.randomUUID()
  const alt = altInput || await generateAltText(c.env, file.name, tagList.join(', '))

  if (c.env.DB) {
    await insertMediaAsset(c.env, {
      id,
      asset_key: upload.key,
      bucket: upload.binding,
      kind: 'image',
      mime: file.type || 'image/jpeg',
      size: meta.strippedBytes.byteLength,
      width: meta.width,
      height: meta.height,
      alt,
      tags_json: JSON.stringify(tagList),
      phash,
      uploader_id: uploaderId,
    })
  }

  return c.json({ ok: true, id, key: upload.key, bucket: upload.binding, alt, tags: tagList, width: meta.width, height: meta.height, duplicate })
})

export default route
