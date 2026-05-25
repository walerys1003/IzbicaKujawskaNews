export interface D1Result<T = unknown> {
  results?: T[]
  success?: boolean
  meta?: Record<string, unknown>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<D1Result>
  raw<T = unknown[]>(): Promise<T[]>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>
  exec(query: string): Promise<unknown>
}

export interface VectorizeMatch {
  id: string
  score: number
  metadata?: Record<string, unknown>
}

export interface VectorizeIndex {
  upsert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<unknown>
  deleteByIds(ids: string[]): Promise<unknown>
  query(vector: number[], options?: { topK?: number; filter?: Record<string, unknown>; returnMetadata?: boolean | 'all'; namespace?: string }): Promise<{ matches: VectorizeMatch[] }>
}

export interface AppBindings {
  DB: D1Database
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  VECTORIZE_INDEX?: VectorizeIndex
  R2_BUCKET?: unknown
  CACHE_KV?: unknown
}
