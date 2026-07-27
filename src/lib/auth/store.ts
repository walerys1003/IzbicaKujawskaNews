/**
 * FAZA 1 / A2 — magazyn uzytkownikow i sesji oparty o D1.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO POPRZEDNIE ROZWIAZANIE BYLO WADLIWE
 * ══════════════════════════════════════════════════════════════════════════
 * src/routes/auth/helpers/password-utils.ts trzymal uzytkownikow w KV pod
 * kluczem `auth:user:<email>`, a gdy APP_KV nie bylo podlaczone — w zwyklej
 * mapie w pamieci procesu (`memoryStore`). Konsekwencje:
 *
 *   1. DWA ROZLACZNE ZBIORY UZYTKOWNIKOW. Tabela `users` w D1 (z migracji
 *      0004_seed_admin) byla zupelnie niezalezna od zapisow w KV. Konto
 *      administratora z bazy NIE MOGLO sie zalogowac, bo logowanie szukalo
 *      go w KV. Rejestracja tworzyla konto w KV, ktorego z kolei nie widzial
 *      panel redakcyjny odpytujacy baze.
 *   2. Przy braku APP_KV konta ginely wraz z uspieniem instancji Workera.
 *   3. Brak mozliwosci sensownego wyszukiwania i listowania uzytkownikow
 *      (KV nie ma zapytan), wiec panel „Uzytkownicy” nie mial skad brac danych.
 *
 * Teraz zrodlem prawdy o uzytkownikach jest tabela `users` w D1.
 * SESSION_KV pelni role szybkiego cache sesji (odczyt przy kazdym zadaniu),
 * a tabela `user_sessions` — trwalego rejestru do listowania i uniewazniania.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CZASY ZYCIA TOKENOW (wymog roadmapy, etap A2)
 * ══════════════════════════════════════════════════════════════════════════
 * Wczesniej token dostepu byl wazny 7 DNI (`exp: now + 60*60*24*7`), co przy
 * wycieku oznaczalo tydzien nieograniczonego dostepu bez mozliwosci odciecia.
 *
 *   token dostepu  — 15 minut (krotki, nieodwolywalny, ale szybko wygasa)
 *   token odnowien — 30 dni  (dlugi, ale odwolywalny przez uniewaznienie sesji)
 */

import { sign, verify } from 'hono/jwt'
import type { Bindings } from '../../types/env'
import { toRole, type Role } from './roles'

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60          // 15 minut
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 dni

/** Maksymalna liczba nieudanych prob logowania przed czasowa blokada konta. */
export const MAX_FAILED_LOGINS = 10
export const LOCK_MINUTES = 15

export interface UserRecord {
  id: number
  email: string
  name: string
  role: Role
  passwordHash: string
  avatar?: string | null
  bio?: string | null
  emailVerified: boolean
  twoFactorEnabled: boolean
  twoFactorSecret?: string | null
  pendingTwoFactorSecret?: string | null
  failedLoginAttempts: number
  lockedUntil?: string | null
  createdAt: string
  updatedAt: string
  lastLogin?: string | null
}

export interface SessionRecord {
  id: string
  userId: number
  refreshTokenHash: string
  userAgent?: string | null
  ipHash?: string | null
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  revokedAt?: string | null
}

export interface AccessTokenPayload {
  sub: string
  email: string
  role: Role
  sessionId: string
  typ: 'access'
  iat: number
  exp: number
}

const encoder = new TextEncoder()

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

export const randomToken = (bytes = 32) => toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)))

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

// ══════════════════════════════════════════════════════════════════════════
// Hasla — PBKDF2-SHA256, 210 000 iteracji
// ══════════════════════════════════════════════════════════════════════════
// bcrypt/argon2 nie sa dostepne w Cloudflare Workers (brak natywnych modulow),
// a Web Crypto udostepnia PBKDF2. Liczba iteracji zgodna z zaleceniem OWASP
// dla PBKDF2-HMAC-SHA256 (2023+). Poprzednia wersja uzywala 120 000.

const PBKDF2_ITERATIONS = 210_000

export const hashPassword = async (password: string, salt = randomToken(16), iterations = PBKDF2_ITERATIONS) => {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return `pbkdf2$${iterations}$${salt}$${toBase64Url(new Uint8Array(derived))}`
}

/** Porownanie stalo-czasowe — nie ujawnia liczby zgodnych znakow. */
const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const verifyPassword = async (password: string, storedHash: string) => {
  const [algorithm, iterationsText, salt, hash] = String(storedHash || '').split('$')
  if (algorithm !== 'pbkdf2' || !iterationsText || !salt || !hash) return false
  const candidate = await hashPassword(password, salt, Number(iterationsText))
  return timingSafeEqual(candidate, storedHash)
}

// ══════════════════════════════════════════════════════════════════════════
// Uzytkownicy — zrodlem prawdy jest tabela `users` w D1
// ══════════════════════════════════════════════════════════════════════════

interface UserRow {
  id: number
  email: string
  name: string
  role: string
  password_hash: string
  avatar: string | null
  bio: string | null
  email_verified: number
  two_factor_enabled: number
  two_factor_secret: string | null
  pending_two_factor_secret: string | null
  failed_login_attempts: number
  locked_until: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

const mapUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: toRole(row.role),
  passwordHash: row.password_hash,
  avatar: row.avatar,
  bio: row.bio,
  emailVerified: row.email_verified === 1,
  twoFactorEnabled: row.two_factor_enabled === 1,
  twoFactorSecret: row.two_factor_secret,
  pendingTwoFactorSecret: row.pending_two_factor_secret,
  failedLoginAttempts: row.failed_login_attempts ?? 0,
  lockedUntil: row.locked_until,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastLogin: row.last_login,
})

const USER_COLUMNS = `id, email, name, role, password_hash, avatar, bio,
  email_verified, two_factor_enabled, two_factor_secret, pending_two_factor_secret,
  failed_login_attempts, locked_until, created_at, updated_at, last_login`

export const getUserByEmail = async (env: Bindings, email: string): Promise<UserRecord | null> => {
  if (!env.DB) return null
  const row = await env.DB
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = ?1 AND deleted_at IS NULL`)
    .bind(String(email).trim().toLowerCase())
    .first<UserRow>()
  return row ? mapUser(row) : null
}

export const getUserById = async (env: Bindings, userId: string | number): Promise<UserRecord | null> => {
  if (!env.DB) return null
  const row = await env.DB
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?1 AND deleted_at IS NULL`)
    .bind(Number(userId))
    .first<UserRow>()
  return row ? mapUser(row) : null
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
  role?: Role
  emailVerified?: boolean
}

export const createUser = async (env: Bindings, input: CreateUserInput): Promise<UserRecord> => {
  if (!env.DB) throw new Error('Brak bindingu DB — nie mozna utworzyc konta.')
  const email = input.email.trim().toLowerCase()
  const passwordHash = await hashPassword(input.password)
  const role: Role = input.role ?? 'viewer'

  const result = await env.DB
    .prepare(
      `INSERT INTO users (email, password_hash, name, role, email_verified, email_verified_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(email, passwordHash, input.name.trim(), role, input.emailVerified ? 1 : 0, input.emailVerified ? new Date().toISOString() : null)
    .run()

  const id = (result as { meta?: { last_row_id?: number } }).meta?.last_row_id
  const created = id ? await getUserById(env, id) : await getUserByEmail(env, email)
  if (!created) throw new Error('Konto zostalo zapisane, ale nie udalo sie go odczytac.')
  return created
}

/** Rejestracja nieudanej proby logowania; po MAX_FAILED_LOGINS blokuje konto. */
export const noteFailedLogin = async (env: Bindings, userId: number) => {
  if (!env.DB) return
  await env.DB
    .prepare(
      `UPDATE users
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE
                WHEN failed_login_attempts + 1 >= ?2 THEN datetime('now', '+${LOCK_MINUTES} minutes')
                ELSE locked_until
              END
        WHERE id = ?1`,
    )
    .bind(userId, MAX_FAILED_LOGINS)
    .run()
}

export const noteSuccessfulLogin = async (env: Bindings, userId: number) => {
  if (!env.DB) return
  await env.DB
    .prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?1`)
    .bind(userId)
    .run()
}

export const isAccountLocked = (user: UserRecord): boolean => {
  if (!user.lockedUntil) return false
  return new Date(user.lockedUntil.replace(' ', 'T') + 'Z').getTime() > Date.now()
}

// ══════════════════════════════════════════════════════════════════════════
// Sesje — SESSION_KV jako cache + tabela user_sessions jako rejestr
// ══════════════════════════════════════════════════════════════════════════

const sessionKvKey = (sessionId: string) => `session:${sessionId}`

export const saveSession = async (env: Bindings, session: SessionRecord) => {
  if (env.DB) {
    await env.DB
      .prepare(
        `INSERT INTO user_sessions (id, user_id, refresh_token_hash, user_agent, ip_hash, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(id) DO UPDATE SET
           refresh_token_hash = excluded.refresh_token_hash,
           last_seen_at = CURRENT_TIMESTAMP,
           expires_at = excluded.expires_at`,
      )
      .bind(session.id, session.userId, session.refreshTokenHash, session.userAgent ?? null, session.ipHash ?? null, session.expiresAt)
      .run()
  }

  if (env.SESSION_KV) {
    const ttl = Math.max(60, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
    await env.SESSION_KV.put(sessionKvKey(session.id), JSON.stringify(session), { expirationTtl: ttl })
  }
}

export const getSession = async (env: Bindings, sessionId: string): Promise<SessionRecord | null> => {
  // Najpierw cache — unika odpytywania bazy przy kazdym zadaniu.
  if (env.SESSION_KV) {
    const cached = await env.SESSION_KV.get(sessionKvKey(sessionId))
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SessionRecord
        if (!parsed.revokedAt && new Date(parsed.expiresAt).getTime() > Date.now()) return parsed
      } catch { /* uszkodzony wpis — czytamy z bazy */ }
    }
  }

  if (!env.DB) return null
  const row = await env.DB
    .prepare(
      `SELECT id, user_id, refresh_token_hash, user_agent, ip_hash, created_at, last_seen_at, expires_at, revoked_at
         FROM user_sessions
        WHERE id = ?1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
    )
    .bind(sessionId)
    .first<{
      id: string; user_id: number; refresh_token_hash: string; user_agent: string | null
      ip_hash: string | null; created_at: string; last_seen_at: string; expires_at: string; revoked_at: string | null
    }>()

  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  }
}

export const revokeSession = async (env: Bindings, sessionId: string) => {
  if (env.DB) {
    await env.DB
      .prepare(`UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?1 AND revoked_at IS NULL`)
      .bind(sessionId)
      .run()
  }
  // Usuniecie z cache jest kluczowe — inaczej uniewazniona sesja
  // dzialalaby jeszcze do wygasniecia wpisu w KV.
  if (env.SESSION_KV) await env.SESSION_KV.delete(sessionKvKey(sessionId))
}

export const revokeAllUserSessions = async (env: Bindings, userId: number, exceptSessionId?: string) => {
  if (!env.DB) return 0
  const sessions = await env.DB
    .prepare(`SELECT id FROM user_sessions WHERE user_id = ?1 AND revoked_at IS NULL`)
    .bind(userId)
    .all<{ id: string }>()

  let revoked = 0
  for (const row of sessions.results ?? []) {
    if (exceptSessionId && row.id === exceptSessionId) continue
    await revokeSession(env, row.id)
    revoked += 1
  }
  return revoked
}

export const listSessions = async (env: Bindings, userId: number) => {
  if (!env.DB) return []
  const rows = await env.DB
    .prepare(
      `SELECT id, user_agent, ip_hash, created_at, last_seen_at, expires_at
         FROM user_sessions
        WHERE user_id = ?1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_seen_at DESC`,
    )
    .bind(userId)
    .all<{ id: string; user_agent: string | null; ip_hash: string | null; created_at: string; last_seen_at: string; expires_at: string }>()
  return rows.results ?? []
}

// ══════════════════════════════════════════════════════════════════════════
// Tokeny
// ══════════════════════════════════════════════════════════════════════════

export const createAccessToken = async (env: Bindings, user: UserRecord, sessionId: string) => {
  const now = Math.floor(Date.now() / 1000)
  return sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      sessionId,
      typ: 'access',
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    env.JWT_SECRET,
  )
}

export const verifyAccessToken = async (env: Bindings, token: string): Promise<AccessTokenPayload | null> => {
  try {
    // Algorytm MUSI byc podany jawnie. W tej wersji Hono `verify` bez trzeciego
    // argumentu rzuca JwtAlgorithmRequired, co objawialo sie odrzucaniem
    // swiezo wydanego, poprawnie podpisanego tokenu (401 na kazdej trasie
    // chronionej). Jawne podanie algorytmu jest przy okazji wymogiem
    // bezpieczenstwa: bez niego atakujacy moglby podstawic naglowek
    // alg: 'none' albo wymusic slabszy algorytm.
    const payload = (await verify(token, env.JWT_SECRET, 'HS256')) as unknown as AccessTokenPayload
    if (!payload?.sub || typeof payload.exp !== 'number') return null
    // Token odnowien nie moze byc uzyty jako token dostepu.
    if (payload.typ && payload.typ !== 'access') return null
    return { ...payload, role: toRole(payload.role) }
  } catch {
    return null
  }
}

export const parseRefreshToken = (refreshToken: string) => {
  const [sessionId, secret] = String(refreshToken || '').split('.')
  return sessionId && secret ? { sessionId, secret } : null
}

const hashIp = async (ip: string) => (await sha256Hex(`izbica24:${ip}`)).slice(0, 32)

/**
 * Wydanie nowej pary tokenow wraz z utworzeniem sesji.
 * Zwraca rowniez czas zycia, aby klient wiedzial, kiedy odswiezyc token.
 */
export const issueSession = async (
  env: Bindings,
  user: UserRecord,
  context?: { userAgent?: string; ip?: string },
) => {
  const sessionId = crypto.randomUUID()
  const refreshSecret = randomToken(32)
  const refreshToken = `${sessionId}.${refreshSecret}`

  await saveSession(env, {
    id: sessionId,
    userId: user.id,
    refreshTokenHash: await sha256Hex(refreshSecret),
    userAgent: context?.userAgent?.slice(0, 300) ?? null,
    ipHash: context?.ip ? await hashIp(context.ip) : null,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
  })

  return {
    accessToken: await createAccessToken(env, user, sessionId),
    refreshToken,
    sessionId,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
    tokenType: 'Bearer' as const,
  }
}

/**
 * Odnowienie tokenu dostepu z rotacja tokenu odnowien.
 * Rotacja jest istotna: przechwycony token odnowien staje sie bezuzyteczny,
 * gdy prawowity uzytkownik uzyje swojego (stary skrot przestaje pasowac).
 */
export const rotateSession = async (env: Bindings, refreshToken: string) => {
  const parsed = parseRefreshToken(refreshToken)
  if (!parsed) return { ok: false as const, reason: 'malformed' as const }

  const session = await getSession(env, parsed.sessionId)
  if (!session) return { ok: false as const, reason: 'not_found' as const }

  const providedHash = await sha256Hex(parsed.secret)
  if (!timingSafeEqual(providedHash, session.refreshTokenHash)) {
    // Niezgodny skrot przy istniejacej sesji oznacza probe uzycia
    // przechwyconego lub juz zrotowanego tokenu — uniewazniamy sesje.
    await revokeSession(env, session.id)
    console.warn('[auth] Uniewazniono sesje po probie uzycia nieprawidlowego tokenu odnowien:', session.id)
    return { ok: false as const, reason: 'invalid_secret' as const }
  }

  const user = await getUserById(env, session.userId)
  if (!user) return { ok: false as const, reason: 'user_missing' as const }

  const newSecret = randomToken(32)
  await saveSession(env, {
    ...session,
    refreshTokenHash: await sha256Hex(newSecret),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
  })

  return {
    ok: true as const,
    user,
    accessToken: await createAccessToken(env, user, session.id),
    refreshToken: `${session.id}.${newSecret}`,
    sessionId: session.id,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    tokenType: 'Bearer' as const,
  }
}

/** Publiczna reprezentacja uzytkownika — bez skrotu hasla i sekretu 2FA. */
export const publicUser = (user: UserRecord) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar ?? null,
  bio: user.bio ?? null,
  emailVerified: user.emailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin ?? null,
})
