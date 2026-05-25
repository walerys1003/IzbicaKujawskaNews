import type { Bindings } from '../../types/env'
import { decryptBackup } from './encrypt'
import { importSqlToD1 } from './d1-import'

export const restoreBackup = async (env: Bindings, encryptedSql: string, secret: string) => {
  const sql = await decryptBackup(encryptedSql, secret)
  const imported = await importSqlToD1(env.DB, sql)
  return { ok: imported.ok, statements: imported.statements }
}
