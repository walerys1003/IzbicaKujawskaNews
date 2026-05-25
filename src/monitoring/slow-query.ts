export interface SlowQueryEntry {
  id: string
  sql: string
  durationMs: number
  timestamp: string
}

const slowQueries: SlowQueryEntry[] = []

export const recordSlowQuery = (sql: string, durationMs: number) => {
  if (durationMs < 100) return null
  const entry: SlowQueryEntry = { id: crypto.randomUUID(), sql, durationMs, timestamp: new Date().toISOString() }
  slowQueries.unshift(entry)
  if (slowQueries.length > 200) slowQueries.length = 200
  return entry
}

export const withSlowQueryLog = async <T>(sql: string, fn: () => Promise<T>) => {
  const started = Date.now()
  const result = await fn()
  recordSlowQuery(sql, Date.now() - started)
  return result
}

export const listSlowQueries = () => [...slowQueries]
export const clearSlowQueries = () => { slowQueries.length = 0 }
