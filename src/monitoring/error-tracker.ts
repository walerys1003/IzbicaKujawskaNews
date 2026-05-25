export interface ErrorEvent {
  id: string
  message: string
  stack?: string
  path?: string
  timestamp: string
  level: 'error' | 'fatal'
}

const errors: ErrorEvent[] = []
const MAX_ERRORS = 200

export const captureException = (error: unknown, context?: { path?: string; level?: 'error' | 'fatal' }) => {
  const event: ErrorEvent = {
    id: crypto.randomUUID(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    path: context?.path,
    timestamp: new Date().toISOString(),
    level: context?.level ?? 'error',
  }
  errors.unshift(event)
  if (errors.length > MAX_ERRORS) errors.length = MAX_ERRORS
  return event
}

export const listErrors = () => [...errors]
export const clearErrors = () => { errors.length = 0 }
export const toSentryEnvelope = (event: ErrorEvent) => JSON.stringify({ event_id: event.id, message: event.message, level: event.level, timestamp: event.timestamp })
