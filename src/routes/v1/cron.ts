/**
 * FAZA 1 / I4b — zadania cykliczne wywoływane po HTTP.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO TEN ENDPOINT ISTNIEJE
 * ══════════════════════════════════════════════════════════════════════════
 * Cloudflare **Pages** nie obsługuje Cron Triggers — to funkcja wyłącznie
 * Workers. Ustalone i zweryfikowane w FAZIE 1:
 *   • bundel poprawnie eksportuje { fetch, scheduled } (sprawdzone
 *     niezależnym importem zbudowanego dist/_worker.js),
 *   • mimo to runtime Pages odrzuca wywołanie /cdn-cgi/handler/scheduled
 *     komunikatem „Handler does not export a scheduled() function”,
 *   • lista funkcji Pages Functions w dokumentacji Cloudflare nie zawiera
 *     pozycji cron/scheduled.
 * Wpis `triggers.crons` w wrangler.jsonc jest zatem na Pages martwy.
 *
 * Rozwiązanie: ta sama logika wystawiona jako chroniony endpoint HTTP.
 * Zewnętrzny harmonogram (GitHub Actions `schedule:` albo osobny mikro-Worker
 * z cronem) wywołuje go cyklicznie. Eksport `scheduled()` w src/index.tsx
 * pozostaje nietknięty — zadziała natychmiast, jeśli cel wdrożenia zostanie
 * przeniesiony z Pages na Workers.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ZABEZPIECZENIE
 * ══════════════════════════════════════════════════════════════════════════
 * Endpoint zmienia dane (publikuje artykuły), więc nie może być otwarty.
 * Wymaga nagłówka `x-cron-secret` zgodnego ze zmienną środowiskową
 * CRON_SECRET. Porównanie jest stałoczasowe, aby nie dać się zaatakować
 * pomiarem czasu odpowiedzi. Brak ustawionego sekretu = odmowa (503),
 * nigdy przepuszczenie — ta sama zasada „fail closed”, którą zastosowano
 * w panelu redakcyjnym.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, ok } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

/** Porównanie stałoczasowe — nie ujawnia liczby zgodnych znaków. */
const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

interface TaskResult {
  task: string
  ok: boolean
  detail?: string
  changes?: number
}

/** Publikacja artykułów, których zaplanowany termin już minął. */
const publishScheduled = async (db: NonNullable<AppEnv['Bindings']['DB']>): Promise<TaskResult> => {
  try {
    const res = await db
      .prepare(
        `UPDATE articles
            SET status = 'published',
                published_at = COALESCE(published_at, scheduled_at),
                updated_at = CURRENT_TIMESTAMP
          WHERE status = 'scheduled'
            AND scheduled_at IS NOT NULL
            AND scheduled_at <= CURRENT_TIMESTAMP
            AND deleted_at IS NULL`,
      )
      .run()
    const changes = (res as { meta?: { changes?: number } }).meta?.changes ?? 0
    return { task: 'publish-scheduled', ok: true, changes }
  } catch (error) {
    return { task: 'publish-scheduled', ok: false, detail: String(error) }
  }
}

/** Usunięcie wygasłych okien licznika limitów oraz starych wpisów błędów. */
const cleanup = async (db: NonNullable<AppEnv['Bindings']['DB']>): Promise<TaskResult[]> => {
  const results: TaskResult[] = []
  try {
    await db.prepare(`DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 day')`).run()
    results.push({ task: 'cleanup-rate-limits', ok: true })
  } catch (error) {
    results.push({ task: 'cleanup-rate-limits', ok: false, detail: String(error) })
  }
  try {
    // Log błędów trzymamy 30 dni — dłużej nie jest przydatny diagnostycznie,
    // a rośnie bez ograniczeń.
    const res = await db.prepare(`DELETE FROM error_log WHERE created_at < datetime('now', '-30 day')`).run()
    results.push({ task: 'cleanup-error-log', ok: true, changes: (res as { meta?: { changes?: number } }).meta?.changes ?? 0 })
  } catch (error) {
    results.push({ task: 'cleanup-error-log', ok: false, detail: String(error) })
  }
  return results
}

/** Odświeżenie znaczników cache danych zewnętrznych. */
const touchCaches = async (env: AppEnv['Bindings']): Promise<TaskResult[]> => {
  const stamp = new Date().toISOString()
  const targets: Array<[string, unknown]> = [
    ['weather', env.WEATHER_KV],
    ['fuel', env.FUEL_KV],
    ['air', env.AIR_KV],
  ]
  const results: TaskResult[] = []
  for (const [name, kv] of targets) {
    if (!kv) {
      results.push({ task: `cache-${name}`, ok: false, detail: 'binding KV niepodłączony' })
      continue
    }
    try {
      await (kv as { put: (k: string, v: string) => Promise<void> }).put('cron:last-run', stamp)
      results.push({ task: `cache-${name}`, ok: true })
    } catch (error) {
      results.push({ task: `cache-${name}`, ok: false, detail: String(error) })
    }
  }
  return results
}

/**
 * POST /api/v1/cron/run?job=frequent|hourly|daily
 *
 *   frequent — odświeżenie cache danych zewnętrznych (odpowiednik crona co 10 minut)
 *   hourly   — publikacja zaplanowanych artykułów  (odpowiednik crona godzinowego)
 *   daily    — hourly + sprzątanie tabel pomocniczych
 */
route.post('/run', async (c) => {
  const expected = c.env?.CRON_SECRET
  if (!expected) {
    console.error('[cron] Odmowa: brak CRON_SECRET w środowisku.')
    return fail(c, 'service_unavailable', 'Zadania cykliczne nie są skonfigurowane (brak CRON_SECRET).')
  }

  const provided = c.req.header('x-cron-secret') || ''
  if (!provided || !timingSafeEqual(provided, expected)) {
    console.warn('[cron] Odmowa: nieprawidłowy sekret.')
    return fail(c, 'unauthorized', 'Nieprawidłowy sekret zadania cyklicznego.')
  }

  const job = (c.req.query('job') || 'hourly').toLowerCase()
  const startedAt = Date.now()
  const results: TaskResult[] = []

  if (job === 'frequent') {
    results.push(...(await touchCaches(c.env)))
  } else if (job === 'hourly' || job === 'daily') {
    const db = c.env?.DB
    if (!db) return fail(c, 'database_unavailable')
    results.push(await publishScheduled(db))
    if (job === 'daily') {
      results.push(...(await cleanup(db)))
      results.push(...(await touchCaches(c.env)))
    }
  } else {
    return fail(c, 'validation_error', 'Nieznane zadanie.', { allowed: ['frequent', 'hourly', 'daily'] })
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`[cron:${job}] zakończono w ${Date.now() - startedAt} ms, niepowodzeń: ${failed.length}`)

  return ok(c, { job, results }, {
    durationMs: Date.now() - startedAt,
    total: results.length,
    failed: failed.length,
  })
})

/** Podgląd konfiguracji — bez sekretu, bez danych wrażliwych. */
route.get('/', (c) =>
  ok(c, {
    powod: 'Cloudflare Pages nie obsługuje Cron Triggers — zadania uruchamia zewnętrzny harmonogram.',
    endpoint: 'POST /api/v1/cron/run?job=frequent|hourly|daily',
    naglowek: 'x-cron-secret: <CRON_SECRET>',
    zadania: {
      frequent: 'odświeżenie cache pogody, paliw i jakości powietrza (co 10 min)',
      hourly: 'publikacja artykułów z minionym scheduled_at (co godzinę)',
      daily: 'hourly + czyszczenie rate_limits i error_log starszego niż 30 dni',
    },
    skonfigurowane: Boolean(c.env?.CRON_SECRET),
  }),
)

export default route
