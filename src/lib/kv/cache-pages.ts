import type { AppEnv } from '../../types/env'

export const CACHE_PAGES_DEFAULT_TTL = 300

export interface CachePagesValue {
  path: string
  html: string
  renderedAt: string
  etag: string
  [key: string]: unknown
}

const PREFIX = 'page-cache:'

type EnvWithBinding = Pick<AppEnv, 'PAGES_CACHE_KV'>

/**
 * CachePagesValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<CachePagesValue | null> => {
  try {
    return await env.PAGES_CACHE_KV.get<CachePagesValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[cache-pages.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: CachePagesValue, ttl = CACHE_PAGES_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.PAGES_CACHE_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[cache-pages.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.PAGES_CACHE_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[cache-pages.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.PAGES_CACHE_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[cache-pages.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
