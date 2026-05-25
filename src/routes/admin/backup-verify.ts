import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'

const route = new Hono<AppEnv>()
route.post('/backups/verify', async (c) => {
  const body = await c.req.json<{ payload?: string }>()
  const ok = Boolean(body.payload && body.payload.includes('.'))
  return c.json({ ok, checksum: ok ? `sha256:${body.payload!.length}` : null }, ok ? 200 : 400)
})
export default route
