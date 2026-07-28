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
import type { AppEnv, D1DatabaseLike } from '../../types/env'
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
 *
 * ── Dlaczego sygnatura jest wypisana jawnie ──────────────────────────────
 *
 * Wcześniej parametr miał typ `Context` bez parametru generycznego, więc
 * `c.env` było typu `any`. Skutek: `c.env?.DB` też było `any`, wynik funkcji
 * był wnioskowany jako `any`, a każde `db.prepare(...).first<T>()` w trasach
 * TypeScript raportował jako TS2347 „Untyped function calls may not accept
 * type arguments” — 43 błędy w `src/routes/v1`. Parametr typu `<T>` przy
 * `.first()` / `.all()` był w kodzie obecny, ale nie miał żadnego wpływu:
 * wynik i tak był `any`, więc literówka w nazwie kolumny lub zmiana schematu
 * bazy nie mogła zostać wykryta.
 *
 * `Context<AppEnv>` wiąże `c.env` z interfejsem `Bindings`, a jawny typ
 * zwracany `D1DatabaseLike | Response` sprawia, że pominięcie sprawdzenia
 * `instanceof Response` jest błędem kompilacji, nie cichą awarią runtime.
 */
export const requireDb = (c: Context<AppEnv>): D1DatabaseLike | Response => {
  const db = c.env?.DB
  if (!db) return fail(c, 'database_unavailable') as unknown as Response
  return db
}

/** Lista kodów błędów — wystawiana pod `GET /api/v1/errors` jako dokumentacja. */
export const errorCatalogList = () =>
  (Object.keys(ERROR_CATALOG) as ErrorCode[]).map((code) => ({
    code,
    status: ERROR_CATALOG[code].status,
    message: ERROR_CATALOG[code].message,
  }))

/**
 * Bezpieczne czytanie ciała żądania jako obiektu JSON.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANY WZORZEC — 21 zgłoszeń tsc z JEDNEJ przyczyny
 * ══════════════════════════════════════════════════════════════════════════
 * W trasach powtarzał się zapis:
 *
 *     const body = await c.req.json<Record<string, unknown>>().catch(() => ({}))
 *
 * Typem wyniku jest wtedy UNIA `Record<string, unknown> | {}`. Drugi składnik
 * unii nie ma ŻADNYCH właściwości, więc każde późniejsze `body.sessionId`,
 * `body.eventName`, `body.query` było błędem TS2339 „Property does not exist”.
 * W `analytics` (12) i `search` (9) dawało to 21 z 191 błędów typów.
 *
 * ── Dlaczego to NIE była tylko kosmetyka ─────────────────────────────────
 * Skutek praktyczny był poważniejszy niż liczba w raporcie: ponieważ dostęp
 * do pól był błędem typu, TypeScript nie sprawdzał NICZEGO poniżej — ani
 * nazw pól, ani ich typów. Literówka `body.sesionId` byłaby dokładnie tym
 * samym błędem TS2339 co poprawne `body.sessionId`, więc kompilator nie
 * odróżniał kodu poprawnego od zepsutego. Zgłoszenie, które nie odróżnia
 * jednego od drugiego, nie chroni już niczego.
 *
 * ── Zachowanie jest zachowane celowo ─────────────────────────────────────
 * Funkcja nie zmienia semantyki: ciało nie-JSON nadal daje pusty obiekt,
 * a nie wyjątek. To świadome — trasy analityczne przyjmują dane z beaconów
 * przeglądarki (`navigator.sendBeacon`), gdzie odrzucenie żądania nic nie
 * naprawia, bo nadawca nie odbiera odpowiedzi. Trasy, które MUSZĄ odrzucić
 * niepoprawny JSON (np. moderacja komentarzy), robią to nadal jawnie przez
 * `try/catch` i `fail(c, 'validation_error', …)` — tego pomocnika tam nie
 * używamy i nie należy go tam wprowadzać.
 *
 * Dodatkowo odsiewamy wartości, które są poprawnym JSON-em, ale nie
 * obiektem (`null`, `[]`, `42`, `"tekst"`). Bez tego `body.sessionId` na
 * tablicy dawałoby `undefined`, a na `null` — wyjątek w czasie wykonania.
 */
export const readJsonObject = async (c: Context<AppEnv>): Promise<Record<string, unknown>> => {
  try {
    const parsed: unknown = await c.req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}
