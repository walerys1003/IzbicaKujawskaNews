import type { Bindings } from '../types/env'

export interface HealthProbeResult {
  name: string
  ok: boolean
  detail: string
}

const pingKv = async (env: Bindings): Promise<HealthProbeResult> => {
  const kv = env.APP_KV || env.RUNTIME_CONFIG_KV || env.WEATHER_KV
  if (!kv) return { name: 'kv', ok: true, detail: 'not_configured' }
  try {
    await kv.get('health:probe')
    return { name: 'kv', ok: true, detail: 'reachable' }
  } catch (error) {
    return { name: 'kv', ok: false, detail: String(error) }
  }
}

const pingDb = async (env: Bindings): Promise<HealthProbeResult> => {
  if (!env.DB) return { name: 'db', ok: true, detail: 'not_configured' }
  try {
    const result = await env.DB.prepare('select 1 as ok').first<{ ok: number }>()
    return { name: 'db', ok: result?.ok === 1, detail: 'reachable' }
  } catch (error) {
    return { name: 'db', ok: false, detail: String(error) }
  }
}

const pingR2 = async (env: Bindings): Promise<HealthProbeResult> => {
  const bucket = env.R2_BACKUPS_DB || env.R2_SITE_SNAPSHOTS || env.R2_EXPORTS_CSV
  if (!bucket) return { name: 'r2', ok: true, detail: 'not_configured' }
  try {
    await bucket.list({ limit: 1 })
    return { name: 'r2', ok: true, detail: 'reachable' }
  } catch (error) {
    return { name: 'r2', ok: false, detail: String(error) }
  }
}

export const runHealthChecks = async (env: Bindings) => {
  const checks = await Promise.all([pingDb(env), pingKv(env), pingR2(env)])
  const ok = checks.every((check) => check.ok)
  return { ok, checks, timestamp: new Date().toISOString() }
}
