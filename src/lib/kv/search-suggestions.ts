import type { Bindings } from '../../types/env'

export const SEARCH_SUGGESTIONS_DEFAULT_TTL = 86400

export interface SearchSuggestionsValue {
  query: string
  suggestions: string[]
  refreshedAt: string
  [key: string]: unknown
}

const PREFIX = 'search-suggestions:'

type EnvWithBinding = Pick<Bindings, 'SEARCH_SUGGESTIONS_KV'>

/**
 * SearchSuggestionsValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<SearchSuggestionsValue | null> => {
  try {
    return await env.SEARCH_SUGGESTIONS_KV.get<SearchSuggestionsValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[search-suggestions.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: SearchSuggestionsValue, ttl = SEARCH_SUGGESTIONS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.SEARCH_SUGGESTIONS_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[search-suggestions.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.SEARCH_SUGGESTIONS_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[search-suggestions.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.SEARCH_SUGGESTIONS_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[search-suggestions.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
