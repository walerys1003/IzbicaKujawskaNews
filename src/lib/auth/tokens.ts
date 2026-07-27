/**
 * FAZA 1 / A2 — jednorazowe tokeny: weryfikacja adresu, reset hasla, magic link.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO NIE ZOSTAWIONO POPRZEDNIEGO ROZWIAZANIA
 * ══════════════════════════════════════════════════════════════════════════
 * password-utils.ts zapisywal tokeny w KV pod kluczem `auth:token:<token>` —
 * czyli JAWNA WARTOSC TOKENU BYLA CZESCIA KLUCZA, a caly rekord lezal w KV
 * w postaci odczytywalnej. Kto uzyskal dostep do przestrzeni KV (np. przez
 * kopie zapasowa albo blad w innym module korzystajacym z tego samego
 * bindingu), mogl wypisac wszystkie aktywne tokeny resetu hasla polecenieniem
 * `list({ prefix: 'auth:token:' })` i przejac dowolne konto.
 *
 * Tutaj przechowujemy wylacznie SKROT SHA-256 tokenu. Wartosc jawna istnieje
 * tylko w wiadomosci wyslanej do uzytkownika. Kopia bazy nie pozwala odtworzyc
 * tokenu, bo funkcja skrotu jest jednokierunkowa.
 *
 * Drugi naprawiony blad: stare tokeny nigdy nie byly oznaczane jako zuzyte —
 * usuwane byly dopiero po udanym wykorzystaniu, a przy bledzie w dalszej
 * czesci obslugi pozostawaly wazne. Tutaj `consumeToken` ustawia
 * `consumed_at` w tym samym zapytaniu, ktore token odczytuje warunkiem
 * `consumed_at IS NULL`, wiec powtorne uzycie jest niemozliwe.
 */

import type { Bindings } from '../../types/env'
import { randomToken, sha256Hex } from './store'

export type AuthTokenType = 'verify' | 'reset' | 'magic'

/** Czas zycia poszczegolnych rodzajow tokenow (w sekundach). */
export const TOKEN_TTL_SECONDS: Record<AuthTokenType, number> = {
  verify: 60 * 60 * 24, // 24 h — uzytkownik moze potwierdzic adres nastepnego dnia
  reset: 60 * 30,       // 30 min — okno na zmiane hasla ma byc krotkie
  magic: 60 * 15,       // 15 min — link logujacy jest de facto haslem
}

export interface IssuedToken {
  token: string
  type: AuthTokenType
  expiresAt: string
  expiresInSeconds: number
}

/**
 * Wydanie nowego tokenu. Zwraca wartosc JAWNA — jedyny moment, w ktorym jest
 * ona dostepna. Do bazy trafia wylacznie skrot.
 */
export const issueToken = async (
  env: Bindings,
  input: { type: AuthTokenType; email: string; userId?: number | null },
): Promise<IssuedToken> => {
  if (!env.DB) throw new Error('Brak bindingu DB — nie mozna wydac tokenu.')

  const token = randomToken(32)
  const ttl = TOKEN_TTL_SECONDS[input.type]
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

  // Wydanie nowego tokenu tego samego rodzaju uniewaznia poprzednie.
  // Bez tego uzytkownik, ktory kilka razy kliknal „zapomnialem hasla”,
  // mialby jednoczesnie kilka waznych linkow resetujacych.
  await env.DB
    .prepare(`UPDATE auth_tokens SET consumed_at = CURRENT_TIMESTAMP
               WHERE email = ?1 AND type = ?2 AND consumed_at IS NULL`)
    .bind(input.email.toLowerCase(), input.type)
    .run()

  await env.DB
    .prepare(`INSERT INTO auth_tokens (token_hash, type, user_id, email, expires_at)
              VALUES (?1, ?2, ?3, ?4, ?5)`)
    .bind(await sha256Hex(token), input.type, input.userId ?? null, input.email.toLowerCase(), expiresAt)
    .run()

  return { token, type: input.type, expiresAt, expiresInSeconds: ttl }
}

export interface ConsumedToken {
  type: AuthTokenType
  email: string
  userId: number | null
}

export type ConsumeResult =
  | { ok: true; record: ConsumedToken }
  | { ok: false; reason: 'not_found' | 'expired' | 'wrong_type' }

/**
 * Odczyt i JEDNOCZESNE zuzycie tokenu.
 *
 * Kolejnosc ma znaczenie dla bezpieczenstwa: najpierw oznaczamy token jako
 * zuzyty (UPDATE z warunkiem `consumed_at IS NULL`), potem odczytujemy dane.
 * Gdyby bylo odwrotnie, dwa rownoczesne zadania z tym samym tokenem mogloby
 * przejsc oba — SQLite serializuje zapisy, wiec przy tej kolejnosci drugie
 * zadanie zobaczy `changes = 0` i zostanie odrzucone.
 */
export const consumeToken = async (
  env: Bindings,
  token: string,
  expectedType?: AuthTokenType,
): Promise<ConsumeResult> => {
  if (!env.DB) return { ok: false, reason: 'not_found' }

  const tokenHash = await sha256Hex(token)

  const row = await env.DB
    .prepare(`SELECT type, email, user_id, expires_at, consumed_at
                FROM auth_tokens WHERE token_hash = ?1`)
    .bind(tokenHash)
    .first<{ type: string; email: string; user_id: number | null; expires_at: string; consumed_at: string | null }>()

  if (!row || row.consumed_at) return { ok: false, reason: 'not_found' }
  if (expectedType && row.type !== expectedType) return { ok: false, reason: 'wrong_type' }

  // Data w SQLite jest zapisana bez strefy — dopisujemy 'Z', bo caly system
  // operuje na czasie UTC (CURRENT_TIMESTAMP w SQLite to UTC).
  const expiresMs = new Date(row.expires_at.replace(' ', 'T').replace(/Z?$/, 'Z')).getTime()
  if (Number.isFinite(expiresMs) && expiresMs < Date.now()) return { ok: false, reason: 'expired' }

  const claim = await env.DB
    .prepare(`UPDATE auth_tokens SET consumed_at = CURRENT_TIMESTAMP
               WHERE token_hash = ?1 AND consumed_at IS NULL`)
    .bind(tokenHash)
    .run()

  const changes = (claim as { meta?: { changes?: number } }).meta?.changes ?? 0
  if (changes === 0) return { ok: false, reason: 'not_found' }

  return { ok: true, record: { type: row.type as AuthTokenType, email: row.email, userId: row.user_id } }
}

/** Usuniecie tokenow wygaslych i zuzytych — wywolywane przez zadanie cron. */
export const purgeExpiredTokens = async (env: Bindings) => {
  if (!env.DB) return 0
  const result = await env.DB
    .prepare(`DELETE FROM auth_tokens
               WHERE expires_at < datetime('now')
                  OR consumed_at < datetime('now', '-7 day')`)
    .run()
  return (result as { meta?: { changes?: number } }).meta?.changes ?? 0
}
