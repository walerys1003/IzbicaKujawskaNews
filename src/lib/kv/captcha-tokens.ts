import type { Bindings } from '../../types/env'

export const CAPTCHA_TOKENS_DEFAULT_TTL = 300

export interface CaptchaTokensValue {
  token: string
  ip: string
  createdAt: string
  expiresAt: string
  [key: string]: unknown
}

const PREFIX = 'captcha:'

type EnvWithBinding = Pick<Bindings, 'CAPTCHA_KV'>

/**
 * CaptchaTokensValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<CaptchaTokensValue | null> => {
  try {
    return await env.CAPTCHA_KV.get<CaptchaTokensValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[captcha-tokens.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: CaptchaTokensValue, ttl = CAPTCHA_TOKENS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.CAPTCHA_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[captcha-tokens.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.CAPTCHA_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[captcha-tokens.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.CAPTCHA_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[captcha-tokens.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
