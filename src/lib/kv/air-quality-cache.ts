import type { AppEnv } from '../../types/env'

export const AIR_QUALITY_CACHE_DEFAULT_TTL = 1800

export interface AirQualityCacheValue {
  station: string
  aqi: number
  pm10: number
  pm25: number
  fetchedAt: string
  [key: string]: unknown
}

const PREFIX = 'air:'

type EnvWithBinding = Pick<AppEnv, 'AIR_KV'>

/**
 * AirQualityCacheValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<AirQualityCacheValue | null> => {
  try {
    return await env.AIR_KV.get<AirQualityCacheValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[air-quality-cache.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: AirQualityCacheValue, ttl = AIR_QUALITY_CACHE_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.AIR_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[air-quality-cache.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.AIR_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[air-quality-cache.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.AIR_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[air-quality-cache.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
