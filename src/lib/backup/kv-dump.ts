import type { Bindings, KVNamespaceLike } from '../../types/env'

const KV_KEYS: Array<keyof Bindings> = ['APP_KV','WEATHER_KV','FUEL_KV','AIR_KV','SESSION_KV','RATE_LIMIT_KV','PAGES_CACHE_KV','FEATURE_FLAGS_KV','AB_TESTS_KV','RUNTIME_CONFIG_KV','USER_PREFS_KV','ANALYTICS_BUFFER_KV','NOTIFICATIONS_KV','CAPTCHA_KV','SEARCH_SUGGESTIONS_KV','BACKUP_SNAPSHOTS_KV']

export const dumpKvNamespaces = async (env: Bindings) => {
  const dump: Record<string, string[]> = {}
  for (const key of KV_KEYS) {
    const kv = env[key] as KVNamespaceLike | undefined
    const list = kv?.list ? await kv.list({ limit: 100 }) : undefined
    if (list) dump[String(key)] = list.keys.map((item) => item.name)
  }
  return { createdAt: new Date().toISOString(), dump }
}
