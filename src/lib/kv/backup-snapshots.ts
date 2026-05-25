import type { AppEnv } from '../../types/env'

export const BACKUP_SNAPSHOTS_DEFAULT_TTL = 604800

export interface BackupSnapshotsValue {
  database: string
  snapshotPath: string
  sizeBytes: number
  createdAt: string
  [key: string]: unknown
}

const PREFIX = 'backup-snapshots:'

type EnvWithBinding = Pick<AppEnv, 'BACKUP_SNAPSHOTS_KV'>

/**
 * BackupSnapshotsValue wrapper for Cloudflare KV.
 *
 * @example
 * const cached = await get(env, 'sample-key')
 * await set(env, 'sample-key', cachedValue)
 * await kv.delete(env, 'sample-key')
 */
export const get = async (env: EnvWithBinding, key: string): Promise<BackupSnapshotsValue | null> => {
  try {
    return await env.BACKUP_SNAPSHOTS_KV.get<BackupSnapshotsValue>(PREFIX + key, 'json')
  } catch (error) {
    console.warn('[backup-snapshots.ts] get failed', error)
    return null
  }
}

export const set = async (env: EnvWithBinding, key: string, value: BackupSnapshotsValue, ttl = BACKUP_SNAPSHOTS_DEFAULT_TTL): Promise<boolean> => {
  try {
    await env.BACKUP_SNAPSHOTS_KV.put(PREFIX + key, JSON.stringify(value), { expirationTtl: ttl })
    return true
  } catch (error) {
    console.warn('[backup-snapshots.ts] set failed', error)
    return false
  }
}

const remove = async (env: EnvWithBinding, key: string): Promise<boolean> => {
  try {
    await env.BACKUP_SNAPSHOTS_KV.delete(PREFIX + key)
    return true
  } catch (error) {
    console.warn('[backup-snapshots.ts] delete failed', error)
    return false
  }
}

export const list = async (env: EnvWithBinding, prefix = ''): Promise<string[]> => {
  try {
    const result = await env.BACKUP_SNAPSHOTS_KV.list({ prefix: PREFIX + prefix })
    return result.keys.map((entry) => entry.name.replace(PREFIX, ''))
  } catch (error) {
    console.warn('[backup-snapshots.ts] list failed', error)
    return []
  }
}

export default { get, set, delete: remove, list }
