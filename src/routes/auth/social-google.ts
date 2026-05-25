import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

const route = new Hono<AppEnv>()
route.get('/social/google', (c) => c.json({ ok: false, provider: 'google', status: 'todo', message: 'OAuth Google placeholder — do podpięcia po utworzeniu credentials.' }, 501))
export default route
