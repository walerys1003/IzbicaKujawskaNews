import type { D1DatabaseLike, D1PreparedStatementLike } from '../../src/types/env'

interface QueryLogEntry { sql: string; params: unknown[] }

type QueryHandler = (params: unknown[]) => unknown

class MockStatement implements D1PreparedStatementLike {
  private params: unknown[] = []

  constructor(private readonly sql: string, private readonly handlers: Map<string, QueryHandler>, private readonly log: QueryLogEntry[]) {}

  bind(...values: unknown[]): D1PreparedStatementLike {
    this.params = values
    return this
  }

  async first<T = unknown>(): Promise<T | null> {
    const result = await this.resolve()
    return (Array.isArray(result) ? result[0] : result) as T | null
  }

  async run<T = unknown>(): Promise<T> {
    await this.resolve()
    return { success: true } as T
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const result = await this.resolve()
    return { results: Array.isArray(result) ? result as T[] : result ? [result as T] : [] }
  }

  async raw<T = unknown>(): Promise<T[]> {
    const result = await this.resolve()
    return Array.isArray(result) ? result as T[] : result ? [result as T] : []
  }

  private async resolve() {
    this.log.push({ sql: this.sql, params: this.params })
    const normalized = this.sql.toLowerCase().replace(/\s+/g, ' ').trim()
    for (const [needle, handler] of this.handlers.entries()) {
      if (normalized.includes(needle)) return handler(this.params)
    }
    if (normalized.includes('select 1 as ok')) return { ok: 1 }
    if (normalized.includes('sqlite_master')) return [{ name: 'articles', sql: 'CREATE TABLE articles (id TEXT PRIMARY KEY)' }]
    return []
  }
}

export class MockD1Database implements D1DatabaseLike {
  public readonly log: QueryLogEntry[] = []
  private readonly handlers = new Map<string, QueryHandler>()

  on(queryNeedle: string, handler: QueryHandler) {
    this.handlers.set(queryNeedle.toLowerCase(), handler)
    return this
  }

  prepare(query: string): D1PreparedStatementLike {
    return new MockStatement(query, this.handlers, this.log)
  }

  async batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]> {
    const results: T[] = []
    for (const statement of statements) results.push(await statement.run<T>())
    return results
  }

  async exec(_query: string): Promise<unknown> {
    return { success: true }
  }
}
