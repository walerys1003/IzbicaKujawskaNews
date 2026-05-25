import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../../../types/env'
import type { UserRole, AuthJwtPayload } from '../helpers/password-utils'

export const requireRole = (roles: UserRole[]) => createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.get('auth') as AuthJwtPayload | undefined
  if (!auth) return c.json({ error: 'unauthenticated' }, 401)
  if (!roles.includes(auth.role)) return c.json({ error: 'forbidden', requiredRoles: roles }, 403)
  await next()
})
