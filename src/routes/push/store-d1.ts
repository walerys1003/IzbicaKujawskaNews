/*
  ==========================================================================
  s8 (2026-07-28) — MAGAZYN PUSH PRZENIESIONY Z KV DO D1
  ==========================================================================

  Historia decyzji, uczciwie: etap I8 wybrał KV i uzasadnił to charakterem
  dostępu (klucz + prefiks, brak JOIN-ów). Ta decyzja zostaje ODWRÓCONA
  świadomie, z trzech powodów, których tamto uzasadnienie nie uwzględniało:

  1. Schemat 0036 istniał już w migracji i deklarował D1 jako magazyn.
     Dwa równoległe magazyny — jeden zadeklarowany, drugi działający —
     to stan, który tamten komentarz sam nazywał gwarancją rozjazdu.
     Skoro tabele nie zostaną usunięte (wymaga wglądu w produkcję),
     jedynym trwałym wyjściem jest ich UŻYCIE.

  2. Lista subskrybentów w KV wymaga stronicowania `list()` po prefiksie —
     dziedzictwo limitu 500 usunięto, ale każda wysyłka nadal odczytuje
     N kluczy osobnymi `get`. W D1 to jedno zapytanie `SELECT ... WHERE
     status='active'` z indeksem. Agregaty panelu (statystyki, licznik
     breaking/dzień) w KV wymagają odczytu WSZYSTKICH wiadomości; w D1
     to `SUM()`/`COUNT()`.

  3. Rekord subskrypcji ma pole UNIQUE (endpoint) — KV nie umie wymusić
     unikalności, więc ponowna subskrypcja tej samej przeglądarki pod
     nowym id tworzyła duplikat i podwójne powiadomienie. D1 wymusza to
     ograniczeniem z 0036 (endpoint TEXT NOT NULL UNIQUE) + upsert.

  Kolumny raportu wysyłki (attempted/failed/...) dodaje migracja 0059 —
  schemat 0036 powstał przed naprawą fałszywego raportowania i nie miał
  gdzie ich zapisać.
  ==========================================================================
*/
import type { D1DatabaseLike } from '../../types/env'

export interface PushSubscriptionRecord {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  userId?: string
  categories: string[]
  segments: string[]
  locale: string
  device: string
  status: 'active' | 'unsubscribed'
  createdAt: string
  updatedAt: string
}

export interface PushPreferenceRecord {
  id: string
  userId: string
  categories: string[]
  breakingOnly: boolean
  quietHours?: { from: string; to: string }
  updatedAt: string
}

export interface PushMessageRecord {
  id: string
  kind: 'broadcast' | 'segment' | 'test' | 'breaking' | 'scheduled'
  title: string
  body: string
  url?: string
  segment?: string
  category?: string
  scheduledFor?: string
  sentAt?: string
  status: 'queued' | 'sent' | 'cancelled' | 'failed'
  /** Liczba POTWIERDZEŃ od dostawcy (2xx), nie liczba adresatów. */
  delivered: number
  opened: number
  clicked: number
  createdAt: string
  createdBy?: string
  attempted?: number
  failed?: number
  removedSubscribers?: number
  failureReasons?: Record<string, number>
  failureReason?: string
  failureDetail?: string
}

/* ── mapowanie wierszy D1 ↔ rekordów aplikacji ─────────────────────────── */

interface WierszSubskrybenta {
  id: string
  user_id: string | null
  endpoint: string
  p256dh: string
  auth_key: string
  categories_json: string
  segments_json: string
  locale: string
  device: string
  status: string
  created_at: string
  updated_at: string
}

interface WierszWiadomosci {
  id: string
  kind: string
  title: string
  body: string
  url: string | null
  segment: string | null
  category_slug: string | null
  scheduled_for: string | null
  sent_at: string | null
  status: string
  delivered: number
  opened: number
  clicked: number
  created_by: string | null
  created_at: string
  attempted: number | null
  failed: number | null
  removed_subscribers: number | null
  failure_reasons_json: string | null
  failure_reason: string | null
  failure_detail: string | null
}

interface WierszPreferencji {
  id: string
  user_id: string
  categories_json: string
  breaking_only: number
  quiet_hours_from: string | null
  quiet_hours_to: string | null
  updated_at: string
}

const parsujListe = (json: string | null): string[] => {
  if (!json) return []
  try {
    const wynik = JSON.parse(json)
    return Array.isArray(wynik) ? wynik.map(String) : []
  } catch {
    return []
  }
}

const naSubskrybenta = (w: WierszSubskrybenta): PushSubscriptionRecord => ({
  id: w.id,
  endpoint: w.endpoint,
  keys: { p256dh: w.p256dh, auth: w.auth_key },
  userId: w.user_id ?? undefined,
  categories: parsujListe(w.categories_json),
  segments: parsujListe(w.segments_json),
  locale: w.locale,
  device: w.device,
  status: w.status === 'unsubscribed' ? 'unsubscribed' : 'active',
  createdAt: w.created_at,
  updatedAt: w.updated_at,
})

const naWiadomosc = (w: WierszWiadomosci): PushMessageRecord => ({
  id: w.id,
  kind: w.kind as PushMessageRecord['kind'],
  title: w.title,
  body: w.body,
  url: w.url ?? undefined,
  segment: w.segment ?? undefined,
  category: w.category_slug ?? undefined,
  scheduledFor: w.scheduled_for ?? undefined,
  sentAt: w.sent_at ?? undefined,
  status: w.status as PushMessageRecord['status'],
  delivered: Number(w.delivered ?? 0),
  opened: Number(w.opened ?? 0),
  clicked: Number(w.clicked ?? 0),
  createdAt: w.created_at,
  createdBy: w.created_by ?? undefined,
  attempted: w.attempted ?? undefined,
  failed: w.failed ?? undefined,
  removedSubscribers: w.removed_subscribers ?? undefined,
  failureReasons: w.failure_reasons_json ? (JSON.parse(w.failure_reasons_json) as Record<string, number>) : undefined,
  failureReason: w.failure_reason ?? undefined,
  failureDetail: w.failure_detail ?? undefined,
})

const naPreferencje = (w: WierszPreferencji): PushPreferenceRecord => ({
  id: w.id,
  userId: w.user_id,
  categories: parsujListe(w.categories_json),
  breakingOnly: Boolean(w.breaking_only),
  quietHours: w.quiet_hours_from && w.quiet_hours_to
    ? { from: w.quiet_hours_from, to: w.quiet_hours_to }
    : undefined,
  updatedAt: w.updated_at,
})

/* ── subskrybenci ──────────────────────────────────────────────────────── */

/**
 * Upsert po kluczu głównym `id` ORAZ po `endpoint` (UNIQUE z 0036).
 * `INSERT OR REPLACE` obsługuje oba konflikty jednym mechanizmem SQLite:
 * ta sama przeglądarka subskrybująca ponownie pod nowym id NIE tworzy
 * duplikatu — stary wiersz z tym samym endpointem jest zastępowany.
 * W KV taka gwarancja nie istniała.
 */
export const zapiszSubskrybenta = async (db: D1DatabaseLike, rekord: PushSubscriptionRecord): Promise<void> => {
  await db
    .prepare(
      `INSERT OR REPLACE INTO push_subscribers
         (id, user_id, endpoint, p256dh, auth_key, categories_json, segments_json,
          locale, device, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      rekord.id,
      rekord.userId ?? null,
      rekord.endpoint,
      rekord.keys.p256dh,
      rekord.keys.auth,
      JSON.stringify(rekord.categories),
      JSON.stringify(rekord.segments),
      rekord.locale,
      rekord.device,
      rekord.status,
      rekord.createdAt,
      rekord.updatedAt,
    )
    .run()
}

export const pobierzSubskrybenta = async (db: D1DatabaseLike, id: string): Promise<PushSubscriptionRecord | null> => {
  const wiersz = await db
    .prepare('SELECT * FROM push_subscribers WHERE id = ?')
    .bind(id)
    .first<WierszSubskrybenta>()
  return wiersz ? naSubskrybenta(wiersz) : null
}

export const usunSubskrybenta = async (db: D1DatabaseLike, id: string): Promise<void> => {
  await db.prepare('DELETE FROM push_subscribers WHERE id = ?').bind(id).run()
}

export const listaSubskrybentow = async (db: D1DatabaseLike): Promise<PushSubscriptionRecord[]> => {
  const { results } = await db
    .prepare('SELECT * FROM push_subscribers ORDER BY created_at DESC')
    .all<WierszSubskrybenta>()
  return results.map(naSubskrybenta)
}

/* ── wiadomości ────────────────────────────────────────────────────────── */

export const zapiszWiadomosc = async (db: D1DatabaseLike, rekord: PushMessageRecord): Promise<void> => {
  await db
    .prepare(
      `INSERT OR REPLACE INTO push_messages
         (id, kind, title, body, url, segment, category_slug, scheduled_for, sent_at,
          status, delivered, opened, clicked, created_by, created_at,
          attempted, failed, removed_subscribers, failure_reasons_json,
          failure_reason, failure_detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      rekord.id,
      rekord.kind,
      rekord.title,
      rekord.body,
      rekord.url ?? null,
      rekord.segment ?? null,
      rekord.category ?? null,
      rekord.scheduledFor ?? null,
      rekord.sentAt ?? null,
      rekord.status,
      rekord.delivered,
      rekord.opened,
      rekord.clicked,
      rekord.createdBy ?? null,
      rekord.createdAt,
      rekord.attempted ?? null,
      rekord.failed ?? null,
      rekord.removedSubscribers ?? null,
      rekord.failureReasons ? JSON.stringify(rekord.failureReasons) : null,
      rekord.failureReason ?? null,
      rekord.failureDetail ?? null,
    )
    .run()
}

export const listaWiadomosci = async (db: D1DatabaseLike): Promise<PushMessageRecord[]> => {
  const { results } = await db
    .prepare('SELECT * FROM push_messages ORDER BY created_at DESC')
    .all<WierszWiadomosci>()
  return results.map(naWiadomosc)
}

/** Wiadomości zaplanowane, których termin minął — do wysłania przez cron. */
export const wiadomosciDoWyslania = async (db: D1DatabaseLike, teraz: string): Promise<PushMessageRecord[]> => {
  const { results } = await db
    .prepare(`SELECT * FROM push_messages WHERE status = 'queued' AND scheduled_for IS NOT NULL AND scheduled_for <= ?`)
    .bind(teraz)
    .all<WierszWiadomosci>()
  return results.map(naWiadomosc)
}

/**
 * Agregat statystyk liczony w bazie, nie w pamięci. Poprzednia wersja
 * (KV) odczytywała wszystkie wiadomości i sumowała w JS — koszt rósł
 * liniowo z historią wysyłek.
 */
export const statystykiWiadomosci = async (db: D1DatabaseLike) => {
  const wiersz = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(delivered), 0) AS delivered,
              COALESCE(SUM(opened), 0) AS opened,
              COALESCE(SUM(clicked), 0) AS clicked
         FROM push_messages`,
    )
    .first<{ total: number; delivered: number; opened: number; clicked: number }>()
  return wiersz ?? { total: 0, delivered: 0, opened: 0, clicked: 0 }
}

/** Licznik wiadomości breaking z dzisiaj — limit dzienny 5/dobę. */
export const liczbaBreakingDzisiaj = async (db: D1DatabaseLike, dzien: string): Promise<number> => {
  const wiersz = await db
    .prepare(`SELECT COUNT(*) AS n FROM push_messages WHERE kind = 'breaking' AND created_at LIKE ?`)
    .bind(`${dzien}%`)
    .first<{ n: number }>()
  return Number(wiersz?.n ?? 0)
}

/* ── preferencje ───────────────────────────────────────────────────────── */

export const zapiszPreferencje = async (db: D1DatabaseLike, rekord: PushPreferenceRecord): Promise<void> => {
  await db
    .prepare(
      `INSERT OR REPLACE INTO push_preferences
         (id, user_id, categories_json, breaking_only, quiet_hours_from, quiet_hours_to, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      rekord.id,
      rekord.userId,
      JSON.stringify(rekord.categories),
      rekord.breakingOnly ? 1 : 0,
      rekord.quietHours?.from ?? null,
      rekord.quietHours?.to ?? null,
      rekord.updatedAt,
    )
    .run()
}

export const pobierzPreferencje = async (db: D1DatabaseLike, userId: string): Promise<PushPreferenceRecord | null> => {
  const wiersz = await db
    .prepare('SELECT * FROM push_preferences WHERE user_id = ?')
    .bind(userId)
    .first<WierszPreferencji>()
  return wiersz ? naPreferencje(wiersz) : null
}
