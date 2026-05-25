import type { AppEnv } from '../../types/env'

export const ANALYTICS_BUFFER_DEFAULT_TTL = 60

export interface AnalyticsBufferValue {
  path: string
  views: number
  windowStart: string
  lastSeenAt: string
  [key: string]: unknown
}

const PREFIX = 'analytics-buffer:'

type EnvWithBinding = Pick<AppEnv, 'ANALYTICS_BUFFER_KV'>

/**
 * AnalyticsBufferValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<AnalyticsBufferValue | null> => {
  try {
    return await env.ANALYTICS_BUFFER_KV.get<AnalyticsBufferValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[analytics-buffer.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: AnalyticsBufferValue, ttl = ANALYTICS_BUFFER_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.ANALYTICS_BUFFER_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[analytics-buffer.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.ANALYTICS_BUFFER_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[analytics-buffer.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.ANALYTICS_BUFFER_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[analytics-buffer.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
