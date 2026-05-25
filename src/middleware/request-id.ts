import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { resolveTraceContext } from '../monitoring/tracing'

export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const trace = resolveTraceContext(c.req.raw.headers)
  c.set('requestId', trace.requestId as never)
  await next()
  c.header('x-request-id', trace.requestId)
})
