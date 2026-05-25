export const buildUptimePayload = (service = 'izbica24') => ({
  ok: true,
  service,
  timestamp: new Date().toISOString(),
  unix: Date.now(),
})
