import type { Bindings } from '../../types/env'

export const AB_TESTS_DEFAULT_TTL = 2592000

export interface AbTestsValue {
  experiment: string
  variant: string
  assignedAt: string
  visitorId: string
  [key: string]: unknown
}

const PREFIX = 'ab-tests:'

type EnvWithBinding = Pick<Bindings, 'AB_TESTS_KV'>

/**
 * AbTestsValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<AbTestsValue | null> => {
  try {
    return await env.AB_TESTS_KV.get<AbTestsValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[ab-tests.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: AbTestsValue, ttl = AB_TESTS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.AB_TESTS_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[ab-tests.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.AB_TESTS_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[ab-tests.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.AB_TESTS_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[ab-tests.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
