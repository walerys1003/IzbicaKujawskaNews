import type { Bindings } from '../../types/env'

export const USER_PREFS_DEFAULT_TTL = 31536000

export interface UserPrefsValue {
  userId: string
  theme: string
  fontScale: number
  updatedAt: string
  [key: string]: unknown
}

const PREFIX = 'user-prefs:'

type EnvWithBinding = Pick<Bindings, 'USER_PREFS_KV'>

/**
 * UserPrefsValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<UserPrefsValue | null> => {
  try {
    return await env.USER_PREFS_KV.get<UserPrefsValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[user-prefs.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: UserPrefsValue, ttl = USER_PREFS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.USER_PREFS_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[user-prefs.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.USER_PREFS_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[user-prefs.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.USER_PREFS_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[user-prefs.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
