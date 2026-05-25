import type { AppEnv } from '../../types/env'

export const FUEL_CACHE_DEFAULT_TTL = 3600

export interface FuelCacheValue {
  station: string
  pb95: number
  diesel: number
  lpg: number
  fetchedAt: string
  [key: string]: unknown
}

const PREFIX = 'fuel:'

type EnvWithBinding = Pick<AppEnv, 'FUEL_KV'>

/**
 * FuelCacheValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<FuelCacheValue | null> => {
  try {
    return await env.FUEL_KV.get<FuelCacheValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[fuel-cache.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: FuelCacheValue, ttl = FUEL_CACHE_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.FUEL_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[fuel-cache.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.FUEL_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[fuel-cache.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.FUEL_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[fuel-cache.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
