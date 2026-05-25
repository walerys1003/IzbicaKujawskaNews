import type { AppEnv } from '../../types/env'

export const RATE_LIMIT_STORE_DEFAULT_TTL = 300

export interface RateLimitStoreValue {
  ip: string
  endpoint: string
  count: number
  windowStart: string
  [key: string]: unknown
}

const PREFIX = 'rate-limit:'

type EnvWithBinding = Pick<AppEnv, 'RATE_LIMIT_KV'>

/**
 * RateLimitStoreValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<RateLimitStoreValue | null> => {
  try {
    return await env.RATE_LIMIT_KV.get<RateLimitStoreValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[rate-limit-store.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: RateLimitStoreValue, ttl = RATE_LIMIT_STORE_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.RATE_LIMIT_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[rate-limit-store.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.RATE_LIMIT_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[rate-limit-store.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.RATE_LIMIT_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[rate-limit-store.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
