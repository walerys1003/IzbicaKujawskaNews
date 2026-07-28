// ============================================================================
// Unified Bindings — merged from Sandbox 2 (KV) + Sandbox 3 (D1/R2/JWT)
// ============================================================================

// ---------- D1 (Sandbox 3) ----------

/** Metryki zapisu zwracane przez D1 po `run()` / `batch()`. */
export interface D1MetaLike {
  /** Identyfikator wiersza po INSERT — czytany w 7 miejscach w projekcie. */
  last_row_id?: number
  changes?: number
  duration?: number
  rows_read?: number
  rows_written?: number
}

/**
 * Koperta wyniku D1.
 *
 * Wcześniej `run<T>()` było zadeklarowane jako `Promise<T>`, czyli parametr
 * typu opisywał CAŁY wynik, a nie wiersz. Deklaracja była nieprawdziwa: D1
 * zwraca `{ success, meta: { last_row_id, changes }, results? }`. Konsekwencje:
 *
 *  1. Żadne z 142 wywołań `.run()` nie podawało parametru typu (`.run<` = 0
 *     trafień), bo pod tą deklaracją nie dawało się go sensownie podać.
 *  2. Kod czytający identyfikator musiał obchodzić typ rzutowaniem
 *     `(result as { meta?: { last_row_id?: number } })` — trzy takie miejsca.
 *  3. Tam, gdzie rzutowania nie było, `unknown` dawał TS18046 na poprawnym
 *     kodzie (`result.meta?.last_row_id`).
 *
 * Ten typ opisuje to, co D1 faktycznie zwraca, więc `last_row_id` jest
 * dostępne bez rzutowania, a `batch()` zachowuje `.results` na każdej pozycji.
 */
export interface D1ResultLike<T = unknown> {
  results?: T[]
  success?: boolean
  meta?: D1MetaLike
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike
  first<T = unknown>(columnName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1ResultLike<T>>
  all<T = unknown>(): Promise<{ results: T[] }>
  raw<T = unknown>(): Promise<T[]>
}

/**
 * `batch` i `exec` NIE są opcjonalne.
 *
 * Były zadeklarowane jako `batch?` / `exec?`, co opisywało bazę, która może
 * nie mieć transakcji wsadowych. Taka baza w tym projekcie nie istnieje:
 * `batch` jest wywoływane bezwarunkowo w 20 miejscach (m.in. zapis artykułu
 * z wersją, moderacja zbiorcza, indeks wektorowy RAG), `exec` w 9 — a i
 * prawdziwe D1, i atrapa w `tests/fixtures/mock-d1.ts` obie metody mają.
 *
 * Znak `?` powodował wyłącznie fałszywe TS2722 („Cannot invoke an object
 * which is possibly undefined”) na poprawnym kodzie i zachęcał do obchodzenia
 * ich przez `!` albo `?.`. `db.batch?.(statements)` byłoby tu groźne: przy
 * braku metody cicho pomijałoby CAŁY zapis wsadowy i zwracało `undefined`,
 * więc trasa zgłaszałaby sukces bez zapisania czegokolwiek. Deklaracja jest
 * dopasowana do rzeczywistości zamiast zmuszać wywołania do udawania.
 */
export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1ResultLike<T>[]>
  exec(query: string): Promise<unknown>
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

  // FAZA 1 — sekrety i konfiguracja dodane w tej fazie
  /** Sekret zadan cyklicznych (I4b) — Pages nie obsluguje Cron Triggers. */
  CRON_SECRET?: string
  /** Dodatkowe domeny dopuszczone w CORS, rozdzielone przecinkami (A7). */
  CORS_ALLOWED_ORIGINS?: string
  /** 'production' | 'development' — wplywa na dopuszczalne zrodla CORS. */
  ENVIRONMENT?: string

  // AI secrets (Sandbox 5)
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  // ── Web Push (I8) ────────────────────────────────────────────────────
  // Klucz publiczny trafia do przeglądarki przy subskrypcji.
  VAPID_PUBLIC_KEY?: string
  /**
   * Klucz prywatny VAPID (skalar P-256, base64url) — SEKRET.
   * Nie był wcześniej zadeklarowany, więc warstwa wysyłania nie miała czym
   * podpisać powiadomień; `sendMessage` zapisywał `status:'sent'` bez żadnego
   * żądania HTTP. Ustawiać wyłącznie przez `wrangler secret put`, nigdy
   * w wrangler.jsonc (plik idzie do repozytorium).
   */
  VAPID_PRIVATE_KEY?: string
  /** Kontakt administratora w tokenie VAPID: `mailto:` lub `https:` (RFC 8292). */
  VAPID_SUBJECT?: string

  // FAZA 3 / AI1 — dostawca modelu jest konfiguracja, nie decyzja w kodzie.
  // Adres bazowy MUSI byc zmienna: klucz do uslugi zgodnej z API Anthropic,
  // ale pod innym adresem (np. https://code.apipod.ai, Groq, OpenRouter,
  // Ollama, vLLM), nie mial wczesniej gdzie zostac wpisany.
  /** Np. https://code.apipod.ai — bez '/v1'. Brak = api.anthropic.com. */
  ANTHROPIC_BASE_URL?: string
  /** Np. https://api.groq.com/openai/v1. Brak = api.openai.com/v1. */
  OPENAI_BASE_URL?: string
  /** 'anthropic' | 'openai-compatible' | 'workers-ai' — wymusza wybor. */
  AI_DEFAULT_PROVIDER?: string
  /** Nazwa modelu u wybranego dostawcy, np. claude-sonnet-4-20250514. */
  AI_DEFAULT_MODEL?: string
  /** Sol do skrotu adresu IP w rejestrze zdarzen (RODO). */
  IP_HASH_SALT?: string

  // FAZA 4 / I12 — analityka.
  /**
   * Token Cloudflare Web Analytics (panel Cloudflare -> Web Analytics).
   *
   * Brak tokenu = baner zgody NIE jest renderowany i pomiar nie dziala.
   * Jest to zachowanie zamierzone: pytanie o zgode na pomiar, ktorego nie
   * prowadzimy, uczyloby czytelnikow odklikiwania banerow bez czytania.
   *
   * Token jest publiczny (trafia do HTML), wiec nie musi byc sekretem —
   * ale zostaje w konfiguracji srodowiska, bo rozni sie miedzy staging
   * i produkcja, a wpisany w kod trafilby do repozytorium na stale.
   */
  CF_ANALYTICS_TOKEN?: string
  /** Wiazanie Workers AI — wlaczane w wrangler.jsonc. */
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> }

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
