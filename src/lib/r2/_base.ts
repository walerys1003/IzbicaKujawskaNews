import type { R2BucketLike } from '../../types/env'

export interface R2ValidationConfig {
  binding: string
  prefix: string
  maxFileSize: number
  allowedMimeTypes: string[]
  defaultCacheControl?: string
}

export interface R2UploadMetadata {
  contentType?: string
  filename?: string
  cacheControl?: string
  customMetadata?: Record<string, string>
}

export interface R2ListResult<T = unknown> {
  items: T[]
  cursor?: string
  truncated: boolean
}

export interface R2Handler {
  readonly config: R2ValidationConfig
  generateKey: (prefix: string, filename: string) => string
  upload: (bucket: R2BucketLike, key: string, file: Blob | ArrayBuffer | ArrayBufferView | ReadableStream | string, metadata?: R2UploadMetadata) => Promise<unknown>
  get: (bucket: R2BucketLike, key: string) => Promise<unknown>
  delete: (bucket: R2BucketLike, key: string) => Promise<void>
  list: (bucket: R2BucketLike, prefix?: string, cursor?: string, limit?: number) => Promise<R2ListResult>
  getSignedUrl: (key: string, expiresIn?: number, secret?: string) => Promise<string>
}

const SAFE_FILENAME = /[^a-zA-Z0-9._-]+/g

export const sanitizeFilename = (filename: string) =>
  filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(SAFE_FILENAME, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

export const generateKey = (prefix: string, filename: string) => {
  const safeName = sanitizeFilename(filename || 'file.bin') || 'file.bin'
  return `${prefix.replace(/^\/+|\/+$/g, '')}/${crypto.randomUUID()}-${safeName}`
}

export const inferMimeType = (input: Blob | ArrayBuffer | ArrayBufferView | ReadableStream | string, explicit?: string) => {
  if (explicit) return explicit
  if (typeof Blob !== 'undefined' && input instanceof Blob) return input.type || 'application/octet-stream'
  return 'application/octet-stream'
}

export const assertMimeType = (mimeType: string, config: R2ValidationConfig) => {
  if (!config.allowedMimeTypes.includes(mimeType)) {
    throw new Error(`mime_not_allowed:${mimeType}`)
  }
}

export const assertFileSize = async (
  input: Blob | ArrayBuffer | ArrayBufferView | ReadableStream | string,
  config: R2ValidationConfig,
) => {
  let size = 0
  if (typeof input === 'string') size = new TextEncoder().encode(input).byteLength
  else if (typeof Blob !== 'undefined' && input instanceof Blob) size = input.size
  else if (input instanceof ArrayBuffer) size = input.byteLength
  else if (ArrayBuffer.isView(input)) size = input.byteLength
  else size = 0

  if (size > config.maxFileSize) {
    throw new Error(`file_too_large:${size}`)
  }
}

const hex = (bytes: Uint8Array) => Array.from(bytes).map((v) => v.toString(16).padStart(2, '0')).join('')

const signPayload = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return hex(new Uint8Array(sig))
}

export const createR2Handler = (config: R2ValidationConfig): R2Handler => ({
  config,
  generateKey,
  async upload(bucket, key, file, metadata = {}) {
    const contentType = inferMimeType(file, metadata.contentType)
    assertMimeType(contentType, config)
    await assertFileSize(file, config)

    return bucket.put(key, file as Blob, {
      httpMetadata: {
        contentType,
        cacheControl: metadata.cacheControl || config.defaultCacheControl || 'public, max-age=3600',
      },
      customMetadata: {
        originalFilename: metadata.filename || 'upload.bin',
        ...(metadata.customMetadata || {}),
      },
    })
  },
  async get(bucket, key) {
    return bucket.get(key)
  },
  async delete(bucket, key) {
    await bucket.delete(key)
  },
  async list(bucket, prefix = config.prefix, cursor, limit = 100) {
    const result = await bucket.list({ prefix, cursor, limit })
    return {
      items: result.objects,
      cursor: result.cursor,
      truncated: result.truncated,
    }
  },
  async getSignedUrl(key, expiresIn = 3600, secret = 'dev-r2-secret') {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
    const payload = `${config.binding}:${key}:${expiresAt}`
    const signature = await signPayload(payload, secret)
    const qs = new URLSearchParams({ key, expires: String(expiresAt), sig: signature, bucket: config.binding })
    return `/api/v1/r2/signed?${qs.toString()}`
  },
})
