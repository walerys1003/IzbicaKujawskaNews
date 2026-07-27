/**
 * FAZA 1 / A3 + B7 — centralny handler błędów.
 *
 * Poprzednia wersja zwracała `{ error: 'internal_error', eventId }` dla
 * KAŻDEGO błędu — także dla sytuacji, które błędem serwera nie były
 * (brak uprawnień, nieprawidłowe dane wejściowe). Klient dostawał 500
 * tam, gdzie należało mu się 400 albo 403, a zdarzenie ginęło w pamięci
 * procesu, bo nic nie zapisywało go do bazy.
 *
 * Nowa wersja:
 *   1. rozpoznaje `ApiError` i mapuje go na właściwy status z katalogu,
 *   2. rozpoznaje `HTTPException` z Hono (rzucane m.in. przez walidatory),
 *   3. wszystko pozostałe traktuje jako 500 — ale komunikat techniczny
 *      zostaje po stronie serwera, klient dostaje wyłącznie requestId,
 *   4. zapisuje zdarzenie do tabeli `error_log` z tym samym requestId
 *      (B7) — zapis jest „best effort”, jego awaria nigdy nie może
 *      przykryć błędu pierwotnego.
 */

import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types/env'
import { captureException } from '../monitoring/error-tracker'
import { logger } from '../monitoring/logger'
import { ApiError, type ErrorCode, messageForCode } from '../lib/http/errors'
import { getRequestId } from '../lib/http/envelope'
// FAZA 4 / I12 — dziennik błędów zapisywał dotąd PEŁNY adres IP klienta
// (kolumna error_log.ip, migracja 0046). Adres IP jest daną osobową, a do
// diagnostyki wystarczy sieć: „192.0.2.0” pozwala odróżnić awarię jednego
// łącza od globalnej, nie wskazując urządzenia.
import { anonymizeIp, clientIp } from '../lib/privacy/ip-anonymize'

/** Mapowanie statusu HTTP na kod z katalogu — dla wyjątków spoza ApiError. */
const codeForStatus = (status: number): ErrorCode => {
  switch (status) {
    case 400: return 'validation_error'
    case 401: return 'unauthorized'
    case 403: return 'forbidden'
    case 404: return 'not_found'
    case 405: return 'method_not_allowed'
    case 409: return 'conflict'
    case 413: return 'payload_too_large'
    case 415: return 'unsupported_media_type'
    case 428: return 'two_factor_required'
    case 429: return 'rate_limited'
    case 501: return 'not_implemented'
    case 502: return 'upstream_error'
    case 503: return 'service_unavailable'
    default: return 'internal_error'
  }
}

/**
 * Zapis zdarzenia do tabeli `error_log`.
 * Świadomie bez `await` po stronie wywołującego dla ścieżek 4xx — nie
 * chcemy opóźniać odpowiedzi. Błąd samego zapisu jest połykany, bo
 * nieosiągalna baza jest często właśnie przyczyną błędu pierwotnego.
 */
const persistError = async (
  db: AppEnv['Bindings']['DB'] | undefined,
  entry: {
    id: string
    requestId: string
    level: string
    message: string
    stack?: string
    path: string
    method: string
    status: number
    code: string
    userAgent?: string
    ip?: string
  },
) => {
  if (!db) return
  try {
    await db
      .prepare(
        `INSERT INTO error_log (id, level, message, stack, path, request_id, method, status, code, user_agent, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        entry.id,
        entry.level,
        entry.message.slice(0, 2000),
        entry.stack ? entry.stack.slice(0, 8000) : null,
        entry.path,
        entry.requestId,
        entry.method,
        entry.status,
        entry.code,
        entry.userAgent ? entry.userAgent.slice(0, 500) : null,
        entry.ip ?? null,
      )
      .run()
  } catch (writeError) {
    console.error('[error-log] Nie udało się zapisać zdarzenia do bazy:', writeError)
  }
}

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  const requestId = getRequestId(c)
  const path = c.req.path
  const method = c.req.method
  const isApi = path.startsWith('/api/')

  // ── 1. Rozpoznanie rodzaju błędu ──────────────────────────────────────
  let status: number
  let code: ErrorCode
  let clientMessage: string
  let details: unknown

  if (error instanceof ApiError) {
    status = error.status
    code = error.code
    clientMessage = error.message
    details = error.details
  } else if (error instanceof HTTPException) {
    status = error.status
    code = codeForStatus(error.status)
    // Komunikat z HTTPException bywa techniczny — dla 5xx go nie ujawniamy.
    clientMessage = status < 500 ? (error.message || messageForCode(code)) : messageForCode(code)
  } else {
    status = 500
    code = 'internal_error'
    clientMessage = messageForCode('internal_error')
  }

  // ── 2. Log po stronie serwera — TU trafia pełna treść ─────────────────
  const event = captureException(error, { path, level: status >= 500 ? 'fatal' : 'error' })
  logger.error('request_failed', { path, method, status, code, requestId, errorId: event.id })
  if (status >= 500) {
    console.error(`[${requestId}] ${method} ${path} → ${status} ${code}`, error instanceof Error ? error.stack : error)
  }

  // ── 3. Utrwalenie w error_log (B7) ────────────────────────────────────
  const persist = persistError(c.env?.DB, {
    id: event.id,
    requestId,
    level: status >= 500 ? 'fatal' : 'error',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    path,
    method,
    status,
    code,
    userAgent: c.req.header('user-agent'),
    // Skracamy, a nie haszujemy: dziennik błędów czyta człowiek i musi móc
    // ocenić zasięg awarii. Skrót SHA-256 byłby tu bezużyteczny.
    ip: anonymizeIp(clientIp((nazwa) => c.req.header(nazwa))),
  })
  // Na Workers zapis dokańczamy w tle, żeby nie wydłużać odpowiedzi.
  if (typeof c.executionCtx?.waitUntil === 'function') {
    try { c.executionCtx.waitUntil(persist) } catch { /* poza kontekstem żądania */ }
  }

  // ── 4. Odpowiedź w jednolitej kopercie ────────────────────────────────
  c.header('x-request-id', requestId)

  if (isApi) {
    return c.json(
      {
        ok: false,
        error: { code, message: clientMessage, ...(details === undefined ? {} : { details }) },
        requestId,
      },
      status as never,
    )
  }

  // Trasy stron: czytelny HTML zamiast surowego JSON-a.
  return c.html(
    `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Błąd ${status} — izbica24.pl</title>
<style>
 body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f4f4f4;color:#0a0a0a;margin:0;
      display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
 .box{max-width:560px;background:#fff;padding:40px;border-top:6px solid #d6121a;box-shadow:0 2px 20px rgba(0,0,0,.08)}
 h1{font-size:56px;margin:0 0 8px;color:#d6121a;letter-spacing:-2px}
 p{line-height:1.6;margin:0 0 16px}
 code{background:#f4f4f4;padding:2px 6px;font-size:12px;color:#666}
 a{color:#d6121a;font-weight:600;text-decoration:none}
</style></head><body><div class="box">
 <h1>${status}</h1>
 <p>${clientMessage}</p>
 <p>Jeśli problem się powtarza, przekaż redakcji ten identyfikator zgłoszenia:<br><code>${requestId}</code></p>
 <p><a href="/">← Wróć na stronę główną</a></p>
</div></body></html>`,
    status as never,
  )
}
