import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { AppEnv } from '../../../types/env'
import type { AuthJwtPayload } from '../helpers/password-utils'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return c.json({ error: 'missing_bearer_token' }, 401)

  try {
    const payload = await verify(token, c.env.JWT_SECRET) as AuthJwtPayload
    c.set('auth', payload as never)
    await next()
  } catch {
    return c.json({ error: 'invalid_token' }, 401)
  }
})
