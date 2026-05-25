import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { getLogs } from '../../monitoring/logger'

const route = new Hono<AppEnv>()
route.get('/logs', (c) => c.json({ items: getLogs(c.req.query('level') as any) }))
export default route
