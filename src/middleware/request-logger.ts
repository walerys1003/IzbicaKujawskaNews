import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { logger } from '../monitoring/logger'
import { httpRequestDurationMs, httpRequestsTotal } from '../monitoring/metrics'

export const requestLoggerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const started = Date.now()
  await next()
  const durationMs = Date.now() - started
  httpRequestsTotal.inc()
  httpRequestDurationMs.observe(durationMs)
  logger.info('request_completed', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
    requestId: c.get('requestId' as never),
  })
})
