import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { listErrors } from '../../monitoring/error-tracker'

const route = new Hono<AppEnv>()
route.get('/errors', (c) => c.json({ items: listErrors() }))
export default route
