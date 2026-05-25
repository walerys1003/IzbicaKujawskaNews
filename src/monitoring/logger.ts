export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

const logs: LogEntry[] = []
const MAX_LOGS = 500

export const createLogEntry = (level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry => ({
  id: crypto.randomUUID(),
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
})

export const pushLog = (entry: LogEntry) => {
  logs.unshift(entry)
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS
  return entry
}

export const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => pushLog(createLogEntry(level, message, context))
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}

export const getLogs = (level?: LogLevel): LogEntry[] => level ? logs.filter((entry) => entry.level === level) : [...logs]
export const clearLogs = () => { logs.length = 0 }
export const serializeLog = (entry: LogEntry): string => JSON.stringify(entry)
