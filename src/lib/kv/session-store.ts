import type { Bindings } from '../../types/env'

export const SESSION_STORE_DEFAULT_TTL = 604800

export interface SessionStoreValue {
  userId: string
  email: string
  role: string
  refreshTokenHash: string
  createdAt: string
  [key: string]: unknown
}

const PREFIX = 'session:'

type EnvWithBinding = Pick<Bindings, 'SESSION_KV'>

/**
 * SessionStoreValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<SessionStoreValue | null> => {
  try {
    return await env.SESSION_KV.get<SessionStoreValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[session-store.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: SessionStoreValue, ttl = SESSION_STORE_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.SESSION_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[session-store.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.SESSION_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[session-store.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.SESSION_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[session-store.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
