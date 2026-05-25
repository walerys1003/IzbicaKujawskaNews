import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

const route = new Hono<AppEnv>()
route.get('/social/facebook', (c) => c.json({ ok: false, provider: 'facebook', status: 'todo', message: 'OAuth Facebook placeholder — do podpięcia po utworzeniu credentials.' }, 501))
export default route
