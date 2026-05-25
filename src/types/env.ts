// ============================================================================
// Unified Bindings — merged from Sandbox 2 (KV) + Sandbox 3 (D1/R2/JWT)
// ============================================================================

// ---------- D1 (Sandbox 3) ----------
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

// ---------- KV (merged Sandbox 2 + Sandbox 3) ----------
export interface KVListKey<Metadata = unknown> {
  name: string
  expiration?: number | null
  metadata?: Metadata | null
}

export interface KVListResult<Metadata = unknown> {
  keys: KVListKey<Metadata>[]
  list_complete: boolean
  cursor?: string
}

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  get<T>(key: string, type: 'json'): Promise<T | null>
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer'): Promise<any>
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView,
    options?: {
      expiration?: number
      expirationTtl?: number
      metadata?: Record<string, unknown>
    }
  ): Promise<void>
  delete(key: string): Promise<void>
  list?<Metadata = unknown>(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<KVListResult<Metadata>>
}

// ---------- R2 (Sandbox 3) ----------
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
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
    options?: {
      httpMetadata?: Record<string, string>
      customMetadata?: Record<string, string>
    }
  ): Promise<R2ObjectLike | null>
  get(key: string): Promise<R2ObjectLike | null>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: R2ObjectLike[]
    truncated: boolean
    cursor?: string
  }>
}

// ---------- Unified Bindings ----------
export interface Bindings {
  // D1
  DB?: D1DatabaseLike

  // Auth secrets (Sandbox 3)
  JWT_SECRET: string

  // AI secrets (Sandbox 5)
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string

  // Generic KV (Sandbox 3)
  APP_KV?: KVNamespaceLike

  // Specialized KV namespaces (Sandbox 2)
  WEATHER_KV?: KVNamespaceLike
  FUEL_KV?: KVNamespaceLike
  AIR_KV?: KVNamespaceLike
  SESSION_KV?: KVNamespaceLike
  RATE_LIMIT_KV?: KVNamespaceLike
  PAGES_CACHE_KV?: KVNamespaceLike
  FEATURE_FLAGS_KV?: KVNamespaceLike
  AB_TESTS_KV?: KVNamespaceLike
  RUNTIME_CONFIG_KV?: KVNamespaceLike
  USER_PREFS_KV?: KVNamespaceLike
  ANALYTICS_BUFFER_KV?: KVNamespaceLike
  NOTIFICATIONS_KV?: KVNamespaceLike
  CAPTCHA_KV?: KVNamespaceLike
  SEARCH_SUGGESTIONS_KV?: KVNamespaceLike
  BACKUP_SNAPSHOTS_KV?: KVNamespaceLike

  // R2 buckets (Sandbox 3)
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

// AppEnv is the Hono context wrapper: { Bindings: Bindings }
// Use with: new Hono<AppEnv>()
export type AppEnv = { Bindings: Bindings }
