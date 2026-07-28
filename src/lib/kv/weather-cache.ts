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

/*
  Binding KV jest w typach opcjonalny (Bindings deklaruje go jako '?'), bo
  Cloudflare wstrzykuje go dopiero po skonfigurowaniu namespace'u w
  wrangler.jsonc. Kod używał go bezpośrednio, licząc na to, że istnieje.

  Poprzednio ratował to blok try/catch: TypeError z niepodłączonego bindingu
  był łapany i zamieniany na 'false' albo 'null'. Skutek był groźniejszy niż
  awaria — zapis po cichu nie następował, a wywołujący widział tylko wartość
  fałszywą, nieodróżnialną od poprawnego "brak danych". Poniższy helper
  rozróżnia te dwa przypadki i zapisuje w logu, że przyczyną jest KONFIGURACJA,
  a nie dane.
*/
const magazyn = (env: EnvWithBinding) => {
  const kv = env.WEATHER_KV
  if (!kv) {
    console.warn('[weather-cache.ts] Binding WEATHER_KV nie jest podłączony — operacja pominięta. Sprawdź wrangler.jsonc.')
    return null
  }
  return kv
}

/**
 * WeatherCacheValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<WeatherCacheValue | null> => {
  const kv = magazyn(env)
  if (!kv) return null
  try {
    return await kv.get<WeatherCacheValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[weather-cache.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: WeatherCacheValue, ttl = WEATHER_CACHE_DEFAULT_TTL): Promise<boolean> => {
  const kv = magazyn(env)
  if (!kv) return false
  try {
    await kv.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[weather-cache.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  const kv = magazyn(env)
  if (!kv) return false
  try {
    await kv.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[weather-cache.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  const kv = magazyn(env)
  if (!kv?.list) return []
  try {
    const result = await kv.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[weather-cache.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
