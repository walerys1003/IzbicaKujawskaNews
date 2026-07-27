/**
 * FAZA 1 / A3 — Jednolita koperta odpowiedzi API
 *
 * Przed tą zmianą każda z ~150 tras odpowiadała własnym kształtem JSON:
 * raz `{ items: [...] }`, raz `{ ok: true, data }`, raz gołą tablicą,
 * a błędy raz jako `{ error: 'x' }`, raz jako `{ message: 'x' }`.
 * Klient (frontend, aplikacja mobilna, integrator) nie mógł napisać
 * jednej funkcji obsługującej odpowiedź.
 *
 * Od teraz obowiązują dokładnie dwa kształty:
 *
 *   sukces  → { "ok": true,  "data": <cokolwiek>, "meta": {...}?, "requestId": "..." }
 *   błąd    → { "ok": false, "error": { "code": "...", "message": "..." }, "requestId": "..." }
 *
 * `requestId` jest obecny ZAWSZE — w obu kształtach i w nagłówku
 * `x-request-id`. To on łączy odpowiedź widzianą przez klienta z wpisem
 * w tabeli `error_log` i w logu serwera.
 *
 * Zgodność wsteczna: helpery nie modyfikują tras, które jeszcze ich nie
 * używają. Migracja tras odbywa się stopniowo, plik po pliku.
 */

import type { Context } from 'hono'
import { ERROR_CATALOG, type ErrorCode, messageForCode, statusForCode } from './errors'

export interface PageMeta {
  total?: number
  limit?: number
  offset?: number
  page?: number
  pages?: number
  [key: string]: unknown
}

export interface SuccessEnvelope<T> {
  ok: true
  data: T
  meta?: PageMeta
  requestId: string
}

export interface ErrorEnvelope {
  ok: false
  error: {
    code: ErrorCode
    message: string
    /** Wyłącznie dane bezpieczne dla klienta, np. lista pól, które nie przeszły walidacji. */
    details?: unknown
  }
  requestId: string
}

/** Odczyt identyfikatora żądania ustawionego przez `requestIdMiddleware`. */
export const getRequestId = (c: Context): string => {
  const fromContext = c.get('requestId' as never) as string | undefined
  if (fromContext) return fromContext
  const fromHeader = c.req.header('x-request-id')
  if (fromHeader) return fromHeader
  return crypto.randomUUID()
}

/**
 * Odpowiedź sukcesu.
 *
 *   return ok(c, articles, { total, limit, offset })
 */
export const ok = <T>(c: Context, data: T, meta?: PageMeta, status = 200) => {
  const requestId = getRequestId(c)
  c.header('x-request-id', requestId)
  const body: SuccessEnvelope<T> = meta
    ? { ok: true, data, meta, requestId }
    : { ok: true, data, requestId }
  return c.json(body, status as never)
}

/** Odpowiedź sukcesu dla nowo utworzonego zasobu (201). */
export const created = <T>(c: Context, data: T, meta?: PageMeta) => ok(c, data, meta, 201)

/** Odpowiedź „przyjęto do przetworzenia” (202) — np. zadanie w kolejce. */
export const accepted = <T>(c: Context, data: T, meta?: PageMeta) => ok(c, data, meta, 202)

/**
 * Odpowiedź błędu z katalogu.
 *
 *   return fail(c, 'not_found')
 *   return fail(c, 'validation_error', 'Pole e-mail jest wymagane.', { field: 'email' })
 */
/**
 * Czwarty argument przyjmuje albo dane szczegółowe, albo goły status HTTP.
 *
 * Wywołania `fail(c, 'storage_unavailable', '...', 503)` powstawały naturalnie,
 * bo `ok()` ma status jako ostatni parametr. Bez tego rozróżnienia liczba
 * trafiała do `details` i klient dostawał `"details": 503` — bezużyteczne pole
 * udające dane diagnostyczne, przy statusie wziętym wyłącznie z katalogu.
 * Traktowanie liczby 100–599 jako statusu usuwa cały ten rodzaj pomyłki.
 */
export const fail = (
  c: Context,
  code: ErrorCode,
  message?: string,
  detailsOrStatus?: unknown,
) => {
  const requestId = getRequestId(c)
  c.header('x-request-id', requestId)

  const isStatus =
    typeof detailsOrStatus === 'number' &&
    Number.isInteger(detailsOrStatus) &&
    detailsOrStatus >= 100 &&
    detailsOrStatus <= 599
  const details = isStatus ? undefined : detailsOrStatus
  const status = isStatus ? (detailsOrStatus as number) : statusForCode(code)

  const body: ErrorEnvelope = {
    ok: false,
    error: { code, message: message ?? messageForCode(code), ...(details === undefined ? {} : { details }) },
    requestId,
  }
  return c.json(body, status as never)
}

/**
 * Strażnik bindingu D1.
 *
 * Zastępuje wzorzec `if (!c.env.DB) return c.json({ items: [], fallback: true })`,
 * który był groźny: klient dostawał HTTP 200 i pustą listę, więc nie miał
 * jak odróżnić „w bazie nic nie ma” od „bazy w ogóle nie ma”. Puste sekcje
 * portalu wyglądały wtedy jak poprawnie działający, ale pusty serwis.
 *
 * Teraz brak bazy to uczciwe 503 z kodem `database_unavailable`.
 *
 *   const db = requireDb(c)
 *   if (db instanceof Response) return db
 *   // dalej `db` jest już bezpiecznie typowane
 */
export const requireDb = (c: Context) => {
  const db = c.env?.DB
  if (!db) return fail(c, 'database_unavailable')
  return db
}

/** Lista kodów błędów — wystawiana pod `GET /api/v1/errors` jako dokumentacja. */
export const errorCatalogList = () =>
  (Object.keys(ERROR_CATALOG) as ErrorCode[]).map((code) => ({
    code,
    status: ERROR_CATALOG[code].status,
    message: ERROR_CATALOG[code].message,
  }))
