import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

const route = new Hono<AppEnv>()
route.get('/backups/download', (c) => c.json({ ok: true, signedUrl: '/downloads/mock-backup.sql.enc', expiresInSeconds: 900 }))
export default route
