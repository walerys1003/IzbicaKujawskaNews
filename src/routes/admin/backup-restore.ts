import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { restoreBackup } from '../../lib/backup/restore'

const route = new Hono<AppEnv>()
route.post('/backups/restore', async (c) => {
  const body = await c.req.json<{ payload?: string; secret?: string }>()
  if (!body.payload || !body.secret) return c.json({ error: 'missing_payload_or_secret' }, 400)
  const result = await restoreBackup(c.env, body.payload, body.secret)
  return c.json(result, result.ok ? 200 : 500)
})
export default route
