import type { Bindings } from '../../types/env'

export const CONFIG_RUNTIME_DEFAULT_TTL = 3600

export interface ConfigRuntimeValue {
  key: string
  value: string
  updatedAt: string
  scope: string
  [key: string]: unknown
}

const PREFIX = 'runtime-config:'

type EnvWithBinding = Pick<Bindings, 'RUNTIME_CONFIG_KV'>

/**
 * ConfigRuntimeValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<ConfigRuntimeValue | null> => {
  try {
    return await env.RUNTIME_CONFIG_KV.get<ConfigRuntimeValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[config-runtime.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: ConfigRuntimeValue, ttl = CONFIG_RUNTIME_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.RUNTIME_CONFIG_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[config-runtime.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.RUNTIME_CONFIG_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[config-runtime.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.RUNTIME_CONFIG_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[config-runtime.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
