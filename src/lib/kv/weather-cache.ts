import type { Bindings } from '../../types/env'

export const WEATHER_CACHE_DEFAULT_TTL = 900

export interface WeatherCacheValue {
  location: string
  temperatureC: number
  condition: string
  fetchedAt: string
  source: string
  [key: string]: unknown
}

const PREFIX = 'weather:'

type EnvWithBinding = Pick<Bindings, 'WEATHER_KV'>

/**
 * WeatherCacheValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<WeatherCacheValue | null> => {
  try {
    return await env.WEATHER_KV.get<WeatherCacheValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[weather-cache.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: WeatherCacheValue, ttl = WEATHER_CACHE_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.WEATHER_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[weather-cache.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.WEATHER_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[weather-cache.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.WEATHER_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[weather-cache.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
