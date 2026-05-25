import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { listSlowQueries } from '../../monitoring/slow-query'

const route = new Hono<AppEnv>()
route.get('/slow-queries', (c) => c.json({ items: listSlowQueries() }))
export default route
