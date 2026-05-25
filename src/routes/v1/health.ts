import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { runHealthChecks } from '../../monitoring/health-check'
import { healthStatusGauge } from '../../monitoring/metrics'
import { buildUptimePayload } from '../../monitoring/uptime-pinger'

const route = new Hono<AppEnv>()

route.get('/healthz', async (c) => {
  const result = await runHealthChecks(c.env)
  healthStatusGauge.set(result.ok ? 1 : 0)
  return c.json(result, result.ok ? 200 : 503)
})

route.get('/readyz', async (c) => {
  const result = await runHealthChecks(c.env)
  return c.json({ ok: result.ok, checks: result.checks.filter((check) => check.name === 'db' || check.name === 'kv') }, result.ok ? 200 : 503)
})

route.get('/uptime', (c) => c.json(buildUptimePayload()))

export default route
