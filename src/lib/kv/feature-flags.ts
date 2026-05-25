import type { AppEnv } from '../../types/env'

export const FEATURE_FLAGS_DEFAULT_TTL = 3600

export interface FeatureFlagsValue {
  flag: string
  enabled: boolean
  updatedAt: string
  description: string
  [key: string]: unknown
}

const PREFIX = 'feature-flags:'

type EnvWithBinding = Pick<AppEnv, 'FEATURE_FLAGS_KV'>

/**
 * FeatureFlagsValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<FeatureFlagsValue | null> => {
  try {
    return await env.FEATURE_FLAGS_KV.get<FeatureFlagsValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[feature-flags.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: FeatureFlagsValue, ttl = FEATURE_FLAGS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.FEATURE_FLAGS_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[feature-flags.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.FEATURE_FLAGS_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[feature-flags.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.FEATURE_FLAGS_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[feature-flags.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
