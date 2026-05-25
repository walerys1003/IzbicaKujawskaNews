import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { exportD1ToSql } from '../../lib/backup/d1-export'
import { encryptBackup } from '../../lib/backup/encrypt'
import { logger } from '../../monitoring/logger'

const route = new Hono<AppEnv>()
route.post('/backups', async (c) => {
  const secret = c.req.header('x-backup-secret') || 'development-secret'
  const sql = await exportD1ToSql(c.env.DB)
  const encrypted = await encryptBackup(sql, secret)
  logger.info('backup_created', { bytes: encrypted.length })
  return c.json({ ok: true, size: encrypted.length, payload: encrypted })
})
export default route
