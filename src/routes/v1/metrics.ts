import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { renderPrometheus } from '../../monitoring/metrics'

const route = new Hono<AppEnv>()
route.get('/metrics', (c) => c.text(renderPrometheus(), 200, { 'Content-Type': 'text/plain; version=0.0.4' }))
export default route
