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
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list<Metadata = unknown>(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult<Metadata>>
}

export interface AppEnv {
  WEATHER_KV: KVNamespaceLike
  FUEL_KV: KVNamespaceLike
  AIR_KV: KVNamespaceLike
  SESSION_KV: KVNamespaceLike
  RATE_LIMIT_KV: KVNamespaceLike
  PAGES_CACHE_KV: KVNamespaceLike
  FEATURE_FLAGS_KV: KVNamespaceLike
  AB_TESTS_KV: KVNamespaceLike
  RUNTIME_CONFIG_KV: KVNamespaceLike
  USER_PREFS_KV: KVNamespaceLike
  ANALYTICS_BUFFER_KV: KVNamespaceLike
  NOTIFICATIONS_KV: KVNamespaceLike
  CAPTCHA_KV: KVNamespaceLike
  SEARCH_SUGGESTIONS_KV: KVNamespaceLike
  BACKUP_SNAPSHOTS_KV: KVNamespaceLike
}
