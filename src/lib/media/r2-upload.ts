import type { Bindings, R2BucketLike } from '../../types/env'

export type MediaBucketTarget = 'images' | 'videos' | 'audio' | 'generic'

export interface PresignedUploadDescriptor {
  url: string
  method: 'PUT'
  expiresAt: string
  key: string
  bucket: string
  headers: Record<string, string>
}

export interface UploadToR2Options {
  bucket?: MediaBucketTarget
  bindingName?: keyof Bindings
  key?: string
  filename: string
  contentType: string
  body: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string
  customMetadata?: Record<string, string>
}

const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g

export const sanitizeMediaFilename = (filename: string) =>
  filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(SAFE_FILENAME, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'plik.bin'

export const resolveMediaBucket = (env: Bindings, target: MediaBucketTarget = 'generic'): { bucket: R2BucketLike; binding: string; prefix: string } => {
  if (target === 'images' && env.R2_ARTICLES_IMAGES) return { bucket: env.R2_ARTICLES_IMAGES, binding: 'R2_ARTICLES_IMAGES', prefix: 'media/images' }
  if (target === 'videos' && env.R2_ARTICLES_VIDEOS) return { bucket: env.R2_ARTICLES_VIDEOS, binding: 'R2_ARTICLES_VIDEOS', prefix: 'media/videos' }
  if (target === 'audio' && env.R2_PODCAST_AUDIO) return { bucket: env.R2_PODCAST_AUDIO, binding: 'R2_PODCAST_AUDIO', prefix: 'media/audio' }
  if (env.R2_USER_UPLOADS) return { bucket: env.R2_USER_UPLOADS, binding: 'R2_USER_UPLOADS', prefix: 'media/uploads' }
  throw new Error('r2_bucket_not_configured')
}

export const resolveExplicitBucket = (env: Bindings, bindingName: keyof Bindings): R2BucketLike => {
  const bucket = env[bindingName]
  if (!bucket || typeof bucket !== 'object' || !('put' in bucket)) throw new Error(`r2_binding_not_configured:${String(bindingName)}`)
  return bucket as unknown as R2BucketLike
}

export const buildMediaKey = (prefix: string, filename: string) => `${prefix}/${crypto.randomUUID()}-${sanitizeMediaFilename(filename)}`

const hex = (bytes: Uint8Array) => Array.from(bytes).map((item) => item.toString(16).padStart(2, '0')).join('')

const hmac = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return hex(new Uint8Array(sig))
}

export const createPresignedUpload = async (
  env: Bindings,
  filename: string,
  contentType: string,
  target: MediaBucketTarget = 'generic',
  expiresInSeconds = 900,
): Promise<PresignedUploadDescriptor> => {
  const { binding, prefix } = resolveMediaBucket(env, target)
  const key = buildMediaKey(prefix, filename)
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  const payload = `${binding}:${key}:${contentType}:${expiresAt}`
  const secret = env.JWT_SECRET || 'dev-secret'
  const signature = await hmac(secret, payload)
  const search = new URLSearchParams({ bucket: binding, key, contentType, expiresAt, sig: signature })
  return {
    url: `/api/v1/media/upload?${search.toString()}`,
    method: 'PUT',
    expiresAt,
    key,
    bucket: binding,
    headers: { 'content-type': contentType, 'x-izbica-upload-signature': signature },
  }
}

export const uploadToR2 = async (env: Bindings, options: UploadToR2Options) => {
  const resolved = options.bindingName
    ? { bucket: resolveExplicitBucket(env, options.bindingName), binding: String(options.bindingName), prefix: 'media/custom' }
    : resolveMediaBucket(env, options.bucket)
  const key = options.key || buildMediaKey(resolved.prefix, options.filename)
  const result = await resolved.bucket.put(key, options.body, {
    httpMetadata: {
      contentType: options.contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      originalFilename: sanitizeMediaFilename(options.filename),
      ...(options.customMetadata || {}),
    },
  })
  return { key, binding: resolved.binding, object: result }
}
