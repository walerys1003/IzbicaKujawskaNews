/**
 * FAZA 1 / A3 — Katalog kodów błędów API izbica24.pl
 *
 * Jedno źródło prawdy dla wszystkich odpowiedzi błędnych. Każdy kod ma
 * przypisany stały status HTTP i domyślny komunikat po polsku, dzięki czemu
 * ta sama sytuacja zawsze wygląda tak samo — niezależnie od tego, który
 * z ~150 plików tras ją zgłasza.
 *
 * Zasada nadrzędna: klient NIGDY nie dostaje szczegółów technicznych
 * (stack trace, treść zapytania SQL, nazwy tabel). Te trafiają do logu
 * serwera i tabeli `error_log`, a klient otrzymuje wyłącznie `requestId`,
 * po którym redakcja odnajdzie zdarzenie.
 */

export const ERROR_CATALOG = {
  // ── 4xx — wina klienta ────────────────────────────────────────────────
  validation_error: {
    status: 400,
    message: 'Przesłane dane są nieprawidłowe lub niekompletne.',
  },
  unauthorized: {
    status: 401,
    message: 'Wymagane zalogowanie.',
  },
  invalid_credentials: {
    status: 401,
    message: 'Nieprawidłowy adres e-mail lub hasło.',
  },
  forbidden: {
    status: 403,
    message: 'Brak uprawnień do wykonania tej operacji.',
  },
  not_found: {
    status: 404,
    message: 'Nie znaleziono zasobu pod wskazanym adresem.',
  },
  method_not_allowed: {
    status: 405,
    message: 'Ta metoda HTTP nie jest obsługiwana dla tego zasobu.',
  },
  conflict: {
    status: 409,
    message: 'Zasób o podanych danych już istnieje.',
  },
  payload_too_large: {
    status: 413,
    message: 'Przesłane żądanie przekracza dopuszczalny rozmiar.',
  },
  unsupported_media_type: {
    status: 415,
    message: 'Nieobsługiwany format przesłanych danych.',
  },
  two_factor_required: {
    status: 428,
    message: 'Konto chronione jest weryfikacją dwuetapową — podaj kod.',
  },
  rate_limited: {
    status: 429,
    message: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.',
  },

  // ── 5xx — wina serwera lub środowiska ─────────────────────────────────
  internal_error: {
    status: 500,
    message: 'Wystąpił nieoczekiwany błąd po stronie serwera.',
  },
  not_implemented: {
    status: 501,
    message: 'Ta funkcja nie została jeszcze uruchomiona.',
  },
  service_unavailable: {
    status: 503,
    message: 'Usługa jest chwilowo niedostępna.',
  },
  database_unavailable: {
    status: 503,
    message: 'Baza danych jest chwilowo niedostępna. Spróbuj ponownie za chwilę.',
  },
  upstream_error: {
    status: 502,
    message: 'Usługa zewnętrzna nie odpowiedziała poprawnie.',
  },
} as const

export type ErrorCode = keyof typeof ERROR_CATALOG

/** Status HTTP przypisany do kodu błędu. */
export const statusForCode = (code: ErrorCode): number => ERROR_CATALOG[code].status

/** Domyślny komunikat po polsku dla kodu błędu. */
export const messageForCode = (code: ErrorCode): string => ERROR_CATALOG[code].message

/**
 * Wyjątek niosący kod z katalogu. Rzucony w dowolnym miejscu aplikacji
 * zostanie przechwycony przez `errorHandler` i zamieniony na poprawną
 * kopertę JSON bez wycieku szczegółów.
 */
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? messageForCode(code))
    this.name = 'ApiError'
    this.code = code
    this.status = statusForCode(code)
    this.details = details
  }
}

/** Skrót dla najczęstszego przypadku: brak bindingu D1. */
export const databaseUnavailable = () => new ApiError('database_unavailable')
