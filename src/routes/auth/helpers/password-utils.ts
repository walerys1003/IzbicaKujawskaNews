import { sign } from 'hono/jwt'
import type { Bindings, KVNamespaceLike } from '../../../types/env'

export type UserRole = 'reader' | 'commenter' | 'author' | 'editor' | 'admin'

export interface StoredUserRecord {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  twoFactorEnabled?: boolean
  twoFactorSecret?: string
  pendingTwoFactorSecret?: string
}

export interface StoredSessionRecord {
  sessionId: string
  userId: string
  email: string
  role: UserRole
  refreshTokenHash: string
  createdAt: string
  expiresAt: string
  lastSeenAt: string
}

export interface StoredApiKeyRecord {
  id: string
  userId: string
  name: string
  scopes: string[]
  tokenHash: string
  createdAt: string
  revokedAt?: string
}

export interface StoredOneTimeToken {
  token: string
  type: 'magic' | 'verify' | 'reset'
  email: string
  userId?: string
  expiresAt: string
  consumedAt?: string
}

export interface AuthJwtPayload {
  sub: string
  email: string
  role: UserRole
  sessionId: string
  exp?: number
  iat?: number
}

const memoryStore = new Map<string, string>()
const encoder = new TextEncoder()

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

const getKvStore = (env: Bindings): KVNamespaceLike => ({
  get: async (key) => {
    if (env.APP_KV) return env.APP_KV.get(key, 'text')
    return memoryStore.get(key) ?? null
  },
  put: async (key, value) => {
    if (env.APP_KV) return env.APP_KV.put(key, typeof value === 'string' ? value : JSON.stringify(value))
    memoryStore.set(key, typeof value === 'string' ? value : JSON.stringify(value))
  },
  delete: async (key) => {
    if (env.APP_KV) return env.APP_KV.delete(key)
    memoryStore.delete(key)
  },
  list: async (options) => {
    if (env.APP_KV?.list) return env.APP_KV.list(options)
    const prefix = options?.prefix ?? ''
    const keys = Array.from(memoryStore.keys())
      .filter((key) => key.startsWith(prefix))
      .slice(0, options?.limit ?? 100)
      .map((name) => ({ name }))
    return { keys, list_complete: true, cursor: '' }
  },
})

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const randomToken = (bytes = 32) => {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes))
  return toBase64Url(buffer)
}

export const hashPassword = async (password: string, salt = randomToken(16), iterations = 120_000) => {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hash = toBase64Url(new Uint8Array(derived))
  return `pbkdf2$${iterations}$${salt}$${hash}`
}

export const verifyPassword = async (password: string, storedHash: string) => {
  const [algorithm, iterationsText, salt, hash] = storedHash.split('$')
  if (algorithm !== 'pbkdf2' || !iterationsText || !salt || !hash) return false
  const candidate = await hashPassword(password, salt, Number(iterationsText))
  return candidate === storedHash
}

export const getUserKey = (email: string) => `auth:user:${email.toLowerCase()}`
export const getUserIdKey = (userId: string) => `auth:user-id:${userId}`
export const getSessionKey = (userId: string, sessionId: string) => `auth:session:${userId}:${sessionId}`
export const getTokenKey = (token: string) => `auth:token:${token}`
export const getApiKeyPrefix = (userId: string) => `auth:api-key:${userId}:`

export const putJson = async (env: Bindings, key: string, value: unknown) => {
  await getKvStore(env).put(key, JSON.stringify(value))
}

export const getJson = async <T>(env: Bindings, key: string): Promise<T | null> => {
  const raw = await getKvStore(env).get(key, 'text')
  return raw ? JSON.parse(String(raw)) as T : null
}

export const deleteKey = async (env: Bindings, key: string) => {
  await getKvStore(env).delete(key)
}

export const listKeys = async (env: Bindings, prefix: string) => {
  const result = await getKvStore(env).list?.({ prefix, limit: 100 })
  return result?.keys.map((key) => key.name) ?? []
}

export const storeUser = async (env: Bindings, user: StoredUserRecord) => {
  await putJson(env, getUserKey(user.email), user)
  await putJson(env, getUserIdKey(user.id), user)
}

export const getUserByEmail = async (env: Bindings, email: string) => getJson<StoredUserRecord>(env, getUserKey(email))
export const getUserById = async (env: Bindings, userId: string) => getJson<StoredUserRecord>(env, getUserIdKey(userId))

export const saveSession = async (env: Bindings, session: StoredSessionRecord) => {
  await putJson(env, getSessionKey(session.userId, session.sessionId), session)
}

export const getSession = async (env: Bindings, userId: string, sessionId: string) =>
  getJson<StoredSessionRecord>(env, getSessionKey(userId, sessionId))

export const revokeSession = async (env: Bindings, userId: string, sessionId: string) => {
  await deleteKey(env, getSessionKey(userId, sessionId))
}

export const listSessions = async (env: Bindings, userId: string) => {
  const keys = await listKeys(env, `auth:session:${userId}:`)
  return Promise.all(keys.map((key) => getJson<StoredSessionRecord>(env, key))).then((items) => items.filter(Boolean) as StoredSessionRecord[])
}

export const saveTokenRecord = async (env: Bindings, record: StoredOneTimeToken) => {
  await putJson(env, getTokenKey(record.token), record)
}

export const getTokenRecord = async (env: Bindings, token: string) => getJson<StoredOneTimeToken>(env, getTokenKey(token))

export const createJwtPair = async (env: Bindings, user: StoredUserRecord, sessionId: string) => {
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET,
  )

  const refreshSecret = randomToken(24)
  const refreshToken = `${sessionId}.${refreshSecret}`
  return { accessToken, refreshToken }
}

export const parseRefreshToken = (refreshToken: string) => {
  const [sessionId, secret] = refreshToken.split('.')
  return sessionId && secret ? { sessionId, secret } : null
}

export const issueSessionForUser = async (env: Bindings, user: StoredUserRecord) => {
  const sessionId = crypto.randomUUID()
  const { accessToken, refreshToken } = await createJwtPair(env, user, sessionId)
  const parsed = parseRefreshToken(refreshToken)
  if (!parsed) throw new Error('invalid_refresh_token')
  await saveSession(env, {
    sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    refreshTokenHash: await sha256Hex(parsed.secret),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    lastSeenAt: new Date().toISOString(),
  })
  return { accessToken, refreshToken, sessionId }
}

export const generateOtpSecret = () => randomToken(20)

const hotp = async (secret: string, counter: number) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(4, counter)
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer))
  const offset = signature[signature.length - 1] & 0x0f
  const binary = ((signature[offset] & 0x7f) << 24) | ((signature[offset + 1] & 0xff) << 16) | ((signature[offset + 2] & 0xff) << 8) | (signature[offset + 3] & 0xff)
  return String(binary % 1_000_000).padStart(6, '0')
}

export const verifyTotp = async (secret: string, code: string, window = 1) => {
  const current = Math.floor(Date.now() / 1000 / 30)
  for (let offset = -window; offset <= window; offset += 1) {
    if (await hotp(secret, current + offset) === code) return true
  }
  return false
}

export const storeApiKey = async (env: Bindings, record: StoredApiKeyRecord) => {
  await putJson(env, `${getApiKeyPrefix(record.userId)}${record.id}`, record)
}

export const listApiKeys = async (env: Bindings, userId: string) => {
  const keys = await listKeys(env, getApiKeyPrefix(userId))
  return Promise.all(keys.map((key) => getJson<StoredApiKeyRecord>(env, key))).then((items) => items.filter(Boolean) as StoredApiKeyRecord[])
}

export const revokeApiKey = async (env: Bindings, userId: string, apiKeyId: string) => {
  await deleteKey(env, `${getApiKeyPrefix(userId)}${apiKeyId}`)
}
