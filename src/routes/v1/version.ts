import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

const route = new Hono<AppEnv>()
const COMMIT = 'cf12bdb'
const BUILD_TIME = '2026-05-25T00:00:00.000Z'

route.get('/version', (c) => c.json({ commit: COMMIT, buildTime: BUILD_TIME, runtime: 'cloudflare-pages+hono' }))
export default route
