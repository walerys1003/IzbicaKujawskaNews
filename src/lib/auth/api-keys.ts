/**
 * FAZA 1 / A2 — klucze API oparte o tabele `api_keys` w D1.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANE BLEDY POPRZEDNIEJ WERSJI
 * ══════════════════════════════════════════════════════════════════════════
 * 1. KLUCZ NIE DAWAL SIE UZYC. Stara trasa zapisywala klucz w KV pod
 *    `auth:apikey:<userId>:<id>`, ale ZADEN kod nie sprawdzal przychodzacych
 *    kluczy — nie istniala funkcja odwrotna, ktora po otrzymaniu naglowka
 *    znalazlaby wlasciciela. Klucze mozna bylo tworzyc i wypisywac,
 *    ale nie sluzyly do niczego.
 *
 * 2. SUROWIEC O NISKIEJ ENTROPII. Token powstawal z dwoch crypto.randomUUID()
 *    ze usunietymi mysnikami. UUID v4 ma 122 bity losowosci, ale zapisany
 *    szesnastkowo wygladal na 256-bitowy — mylace przy ocenie sily. Tutaj
 *    uzywamy 32 losowych bajtow z jawnym prefiksem rozpoznawczym.
 *
 * 3. BRAK PREFIKSU DO IDENTYFIKACJI. Uzytkownik, ktory utworzyl kilka kluczy,
 *    nie mial jak rozpoznac, ktory z nich widzi w konfiguracji zewnetrznego
 *    systemu — pelnej wartosci nie da sie pokazac ponownie. Zapisujemy wiec
 *    `token_prefix` (jawny, nietajny fragment) do wyswietlania na liscie.
 *
 * 4. BRAK TERMINU WAZNOSCI. Klucz raz wydany byl wazny wiecznie.
 */

import type { Bindings } from '../../types/env'
import { randomToken, sha256Hex } from './store'
import type { Role } from './roles'

/** Zakresy, jakie moze miec klucz API. Celowo waskie — klucz nie jest sesja. */
export const API_SCOPES = [
  'incoming:write',   // przyjmowanie zgloszen od czytelnikow (formularze zewnetrzne)
  'articles:read',    // odczyt artykulow, takze nieopublikowanych
  'articles:write',   // tworzenie i aktualizacja artykulow
  'media:write',      // wgrywanie plikow
  'analytics:read',   // odczyt statystyk
] as const

export type ApiScope = (typeof API_SCOPES)[number]

export const isApiScope = (value: unknown): value is ApiScope =>
  typeof value === 'string' && (API_SCOPES as readonly string[]).includes(value)

const KEY_PREFIX = 'izb'

export interface ApiKeySummary {
  id: string
  name: string
  tokenPrefix: string
  scopes: ApiScope[]
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
}

interface ApiKeyRow {
  id: string
  user_id: number
  name: string
  token_prefix: string
  scopes: string
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

const parseScopes = (raw: string): ApiScope[] => {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isApiScope) : []
  } catch {
    return []
  }
}

const mapRow = (row: ApiKeyRow): ApiKeySummary => ({
  id: row.id,
  name: row.name,
  tokenPrefix: row.token_prefix,
  scopes: parseScopes(row.scopes),
  createdAt: row.created_at,
  lastUsedAt: row.last_used_at,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at,
})

const SELECT_COLUMNS = `id, user_id, name, token_prefix, scopes, created_at, last_used_at, expires_at, revoked_at`

export interface CreateApiKeyInput {
  userId: number
  name: string
  scopes: ApiScope[]
  expiresInDays?: number
}

/**
 * Utworzenie klucza. Wartosc jawna zwracana jest TYLKO TERAZ — w bazie lezy
 * wylacznie skrot SHA-256, wiec nawet administrator nie odzyska jej pozniej.
 */
export const createApiKey = async (env: Bindings, input: CreateApiKeyInput) => {
  if (!env.DB) throw new Error('Brak bingingu DB — nie mozna utworzyc klucza API.')

  const id = crypto.randomUUID()
  const secret = randomToken(32)
  const token = `${KEY_PREFIX}_${secret}`
  // Prefiks jawny: rozpoznawalny, ale zbyt krotki, by pomogl w odgadnieciu
  // calosci (8 znakow base64url to ~48 bitow z 256).
  const tokenPrefix = `${KEY_PREFIX}_${secret.slice(0, 8)}`
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
    : null

  await env.DB
    .prepare(`INSERT INTO api_keys (id, user_id, name, token_hash, token_prefix, scopes, expires_at)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
    .bind(id, input.userId, input.name.trim().slice(0, 120), await sha256Hex(token), tokenPrefix, JSON.stringify(input.scopes), expiresAt)
    .run()

  return { id, token, tokenPrefix, scopes: input.scopes, expiresAt }
}

export const listApiKeys = async (env: Bindings, userId: number): Promise<ApiKeySummary[]> => {
  if (!env.DB) return []
  const rows = await env.DB
    .prepare(`SELECT ${SELECT_COLUMNS} FROM api_keys WHERE user_id = ?1 ORDER BY created_at DESC`)
    .bind(userId)
    .all<ApiKeyRow>()
  return (rows.results ?? []).map(mapRow)
}

/** Uniewaznienie klucza. Zwraca false, gdy klucz nie nalezy do uzytkownika. */
export const revokeApiKey = async (env: Bindings, userId: number, keyId: string): Promise<boolean> => {
  if (!env.DB) return false
  const result = await env.DB
    .prepare(`UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP
               WHERE id = ?1 AND user_id = ?2 AND revoked_at IS NULL`)
    .bind(keyId, userId)
    .run()
  return ((result as { meta?: { changes?: number } }).meta?.changes ?? 0) > 0
}

export interface ResolvedApiKey {
  keyId: string
  userId: number
  role: Role
  email: string
  scopes: ApiScope[]
}

/**
 * Rozpoznanie klucza przyslanego w naglowku — funkcja, ktorej w poprzedniej
 * wersji w ogole nie bylo. Bez niej klucze API byly ozdoba.
 *
 * Sprawdzamy jednoczesnie uniewaznienie, termin waznosci i istnienie konta
 * wlasciciela: klucz osoby usunietej z redakcji musi przestac dzialac.
 */
export const resolveApiKey = async (env: Bindings, token: string): Promise<ResolvedApiKey | null> => {
  if (!env.DB || !token || !token.startsWith(`${KEY_PREFIX}_`)) return null

  const row = await env.DB
    .prepare(`SELECT k.id AS key_id, k.user_id, k.scopes, u.email, u.role
                FROM api_keys k
                JOIN users u ON u.id = k.user_id
               WHERE k.token_hash = ?1
                 AND k.revoked_at IS NULL
                 AND (k.expires_at IS NULL OR k.expires_at > CURRENT_TIMESTAMP)
                 AND u.deleted_at IS NULL`)
    .bind(await sha256Hex(token))
    .first<{ key_id: string; user_id: number; scopes: string; email: string; role: string }>()

  if (!row) return null

  // Znacznik uzycia zapisujemy bez oczekiwania na wynik — nie moze opoznic
  // obslugi zadania ani go przerwac, gdy zapis sie nie uda.
  void env.DB
    .prepare(`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?1`)
    .bind(row.key_id)
    .run()
    .catch(() => undefined)

  const { toRole } = await import('./roles')
  return {
    keyId: row.key_id,
    userId: row.user_id,
    role: toRole(row.role),
    email: row.email,
    scopes: parseScopes(row.scopes),
  }
}
