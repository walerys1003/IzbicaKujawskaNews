export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike
  first<T = unknown>(columnName?: string): Promise<T | null>
  run<T = unknown>(): Promise<T>
  all<T = unknown>(): Promise<{ results: T[] }>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
  batch?<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]>
  exec?(query: string): Promise<unknown>
}

export interface KVNamespaceLike {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer'): Promise<any>
  put(key: string, value: string | ArrayBuffer | ArrayBufferView, options?: {
    expiration?: number
    expirationTtl?: number
    metadata?: Record<string, unknown>
  }): Promise<void>
  delete(key: string): Promise<void>
  list?(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: Array<{ name: string; metadata?: unknown; expiration?: number }>
    list_complete: boolean
    cursor?: string
  }>
}

export interface R2ObjectLike {
  key: string
  size: number
  etag?: string
  version?: string
  uploaded?: Date
  httpEtag?: string
  checksums?: Record<string, unknown>
  httpMetadata?: Record<string, string>
  customMetadata?: Record<string, string>
  body?: ReadableStream | null
  arrayBuffer?: () => Promise<ArrayBuffer>
  text?: () => Promise<string>
  json?: <T = unknown>() => Promise<T>
}

export interface R2BucketLike {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob, options?: {
    httpMetadata?: Record<string, string>
    customMetadata?: Record<string, string>
  }): Promise<R2ObjectLike | null>
  get(key: string): Promise<R2ObjectLike | null>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: R2ObjectLike[]
    truncated: boolean
    cursor?: string
  }>
}

export interface Bindings {
  DB?: D1DatabaseLike
  APP_KV?: KVNamespaceLike
  JWT_SECRET: string

  R2_ARTICLES_IMAGES?: R2BucketLike
  R2_ARTICLES_VIDEOS?: R2BucketLike
  R2_USER_AVATARS?: R2BucketLike
  R2_OGLOSZENIA_PHOTOS?: R2BucketLike
  R2_GALERIE_PHOTOS?: R2BucketLike
  R2_PDF_ARCHIVE?: R2BucketLike
  R2_PODCAST_AUDIO?: R2BucketLike
  R2_VIDEO_THUMBNAILS?: R2BucketLike
  R2_BACKUPS_DB?: R2BucketLike
  R2_SITE_SNAPSHOTS?: R2BucketLike
  R2_LOGOS_PARTNERS?: R2BucketLike
  R2_INFOGRAPHICS?: R2BucketLike
  R2_BADGES_ICONS?: R2BucketLike
  R2_FONTS_CUSTOM?: R2BucketLike
  R2_AI_GENERATED?: R2BucketLike
  R2_SOCIAL_CARDS?: R2BucketLike
  R2_EMAIL_ATTACHMENTS?: R2BucketLike
  R2_USER_UPLOADS?: R2BucketLike
  R2_MODERATION_QUEUE?: R2BucketLike
  R2_EXPORTS_CSV?: R2BucketLike
}

export type AppEnv = { Bindings: Bindings }
