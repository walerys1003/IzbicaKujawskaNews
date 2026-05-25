import type { Bindings, D1DatabaseLike } from '../../types/env'

export interface MediaAssetRecord {
  id: string
  asset_key: string
  bucket: string
  kind: string
  mime: string
  size: number
  width: number | null
  height: number | null
  alt: string | null
  tags_json: string | null
  phash: string | null
  uploader_id: string | null
  created_at: string
}

export interface VideoRecord {
  id: string
  asset_key: string
  stream_url: string | null
  thumbnail_url: string | null
  title: string
  duration_seconds: number | null
  captions_url: string | null
  created_at: string
}

export interface AudioRecord {
  id: string
  asset_key: string
  title: string
  duration_seconds: number | null
  waveform_json: string | null
  transcript_text: string | null
  podcast_slug: string | null
  created_at: string
}

export const getDb = (env: Bindings): D1DatabaseLike => {
  if (!env.DB) throw new Error('db_not_configured')
  return env.DB
}

export const json = <T>(value: T) => JSON.stringify(value)

export const parseTags = (input: string | null | undefined) => {
  if (!input) return [] as string[]
  try {
    const parsed = JSON.parse(input) as unknown
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return input.split(',').map((item) => item.trim()).filter(Boolean)
  }
}

export const insertMediaAsset = async (env: Bindings, asset: Omit<MediaAssetRecord, 'created_at'> & { created_at?: string }) => {
  const db = getDb(env)
  await db.prepare(`INSERT INTO media_assets (id, asset_key, bucket, kind, mime, size, width, height, alt, tags_json, phash, uploader_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(asset.id, asset.asset_key, asset.bucket, asset.kind, asset.mime, asset.size, asset.width, asset.height, asset.alt, asset.tags_json, asset.phash, asset.uploader_id, asset.created_at || new Date().toISOString())
    .run()
}

export const queryAll = async <T>(env: Bindings, sql: string, bindings: unknown[] = []) => {
  const db = getDb(env)
  const result = await db.prepare(sql).bind(...bindings).all<T>()
  return result.results
}
