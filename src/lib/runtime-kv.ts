import type { Bindings, KVListResult, KVNamespaceLike } from '../types/env'

export type RuntimeKvBinding =
  | 'APP_KV'
  | 'USER_PREFS_KV'
  | 'NOTIFICATIONS_KV'
  | 'ANALYTICS_BUFFER_KV'
  | 'SEARCH_SUGGESTIONS_KV'

const memoryNamespaces = new Map<string, Map<string, string>>()

const getMemoryNamespace = (name: RuntimeKvBinding): KVNamespaceLike => {
  if (!memoryNamespaces.has(name)) memoryNamespaces.set(name, new Map<string, string>())
  const memory = memoryNamespaces.get(name)!

  return {
    get: async (key: string, type?: 'text' | 'json' | 'arrayBuffer') => {
      const raw = memory.get(key) ?? null
      if (raw === null) return null
      if (type === 'json') return JSON.parse(raw) as unknown
      if (type === 'arrayBuffer') return new TextEncoder().encode(raw).buffer
      return raw
    },
    put: async (key: string, value: string | ArrayBuffer | ArrayBufferView) => {
      if (typeof value === 'string') {
        memory.set(key, value)
        return
      }
      const bytes = value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      memory.set(key, new TextDecoder().decode(bytes))
    },
    delete: async (key: string) => {
      memory.delete(key)
    },
    list: async <Metadata = unknown>(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult<Metadata>> => {
      const prefix = options?.prefix ?? ''
      const limit = options?.limit ?? 100
      const keys = Array.from(memory.keys())
        .filter((key) => key.startsWith(prefix))
        .sort()
        .slice(0, limit)
        .map((name) => ({ name, metadata: null, expiration: null }))
      return { keys, list_complete: true, cursor: '' }
    },
  }
}

export const getRuntimeKv = (env: Bindings, binding: RuntimeKvBinding): KVNamespaceLike => {
  const namespace = env[binding]
  return namespace ?? getMemoryNamespace(binding)
}

export const putJson = async (env: Bindings, binding: RuntimeKvBinding, key: string, value: unknown) => {
  await getRuntimeKv(env, binding).put(key, JSON.stringify(value))
}

export const getJson = async <T>(env: Bindings, binding: RuntimeKvBinding, key: string): Promise<T | null> => {
  const raw = await getRuntimeKv(env, binding).get(key)
  if (!raw) return null
  return JSON.parse(String(raw)) as T
}

export const deleteJson = async (env: Bindings, binding: RuntimeKvBinding, key: string) => {
  await getRuntimeKv(env, binding).delete(key)
}

export const listByPrefix = async <T>(env: Bindings, binding: RuntimeKvBinding, prefix: string): Promise<Array<{ key: string; value: T }>> => {
  const listing = await getRuntimeKv(env, binding).list?.({ prefix, limit: 500 })
  const keys = listing?.keys.map((item) => item.name) ?? []
  const items = await Promise.all(keys.map(async (key) => ({ key, value: await getJson<T>(env, binding, key) })))
  return items.filter((item): item is { key: string; value: T } => item.value !== null)
}

export const upsertCollectionItem = async <T extends { id: string }>(
  env: Bindings,
  binding: RuntimeKvBinding,
  prefix: string,
  item: T,
) => {
  await putJson(env, binding, `${prefix}${item.id}`, item)
  return item
}
