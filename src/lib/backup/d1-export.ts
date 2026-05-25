import type { D1DatabaseLike } from '../../types/env'

export const exportD1ToSql = async (db?: D1DatabaseLike) => {
  if (!db) return '-- no database configured\n'
  const rows = await db.prepare("select name, sql from sqlite_master where type in ('table','index') and name not like 'sqlite_%' order by type, name").all<{ name: string; sql: string }>()
  return (rows.results || []).map((row) => `${row.sql};`).join('\n') + '\n'
}
