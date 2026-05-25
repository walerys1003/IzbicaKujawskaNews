import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { getLogs } from '../../monitoring/logger'

const route = new Hono<AppEnv>()
route.get('/backups', (c) => c.json({ items: getLogs('info').filter((entry) => entry.message === 'backup_created') }))
export default route
