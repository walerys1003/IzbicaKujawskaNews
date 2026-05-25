import type { D1DatabaseLike } from '../../types/env'

export const importSqlToD1 = async (db: D1DatabaseLike | undefined, sql: string) => {
  if (!db) return { ok: false, statements: 0 }
  const statements = sql.split(/;\s*\n?/).map((statement) => statement.trim()).filter(Boolean)
  for (const statement of statements) {
    await db.prepare(statement).run()
  }
  return { ok: true, statements: statements.length }
}
