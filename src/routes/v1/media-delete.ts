import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { resolveExplicitBucket } from '../../lib/media/r2-upload'

const route = new Hono<AppEnv>()

route.delete('/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const bucketName = (c.req.query('bucket') || 'R2_USER_UPLOADS') as keyof typeof c.env
  const bucket = resolveExplicitBucket(c.env, bucketName as never)
  await bucket.delete(key)
  if (c.env.DB) await c.env.DB.prepare('DELETE FROM media_assets WHERE asset_key = ?').bind(key).run()
  return c.json({ ok: true, key, bucket: String(bucketName) })
})

export default route
