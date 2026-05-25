import type { ErrorHandler } from 'hono'
import type { AppEnv } from '../types/env'
import { captureException } from '../monitoring/error-tracker'
import { logger } from '../monitoring/logger'

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  const event = captureException(error, { path: c.req.path })
  logger.error('request_failed', { path: c.req.path, errorId: event.id })
  return c.json({ error: 'internal_error', eventId: event.id }, 500)
}
