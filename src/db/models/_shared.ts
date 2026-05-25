export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>
  run(): Promise<unknown>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
}

export interface DbContext {
  env: {
    DB: D1Database
  }
}

export interface PaginationInput<TFilters extends Record<string, unknown> = Record<string, unknown>> {
  page?: number
  perPage?: number
  filters?: TFilters
}

export interface PaginationResult<TRow> {
  items: TRow[]
  page: number
  perPage: number
  total: number
  totalPages: number
}

export const toSqlBoolean = (value: unknown): number | null => {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value ? 1 : 0
  return Number(Boolean(value))
}

export const compactRecord = <T extends Record<string, unknown>>(record: T): Partial<T> => {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as Partial<T>
}

export const escapeLike = (value: string): string => value.replace(/[\%_]/g, (m) => '\' + m)

export const buildWhere = (
  filters: Record<string, unknown>,
  allowed: Record<string, string>,
): { clause: string; bindings: unknown[] } => {
  const conditions: string[] = []
  const bindings: unknown[] = []

  for (const [key, rawValue] of Object.entries(filters)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue
    const column = allowed[key]
    if (!column) continue

    if (typeof rawValue === 'string' && key.endsWith('_like')) {
      conditions.push(`${column} LIKE ? ESCAPE '\'`)
      bindings.push(`%${escapeLike(rawValue)}%`)
      continue
    }

    conditions.push(`${column} = ?`)
    bindings.push(rawValue)
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    bindings,
  }
}
