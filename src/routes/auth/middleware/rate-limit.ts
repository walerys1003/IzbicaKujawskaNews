import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../../../types/env'

const bucket = new Map<string, number[]>()

export const rateLimit = (limit = 5, windowMs = 60_000) => createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown'
  const key = `${c.req.path}:${ip}`
  const now = Date.now()
  const hits = (bucket.get(key) || []).filter((stamp) => now - stamp < windowMs)
  if (hits.length >= limit) {
    return c.json({ error: 'rate_limited', limit, retryAfterSeconds: Math.ceil(windowMs / 1000) }, 429)
  }
  hits.push(now)
  bucket.set(key, hits)
  await next()
})
