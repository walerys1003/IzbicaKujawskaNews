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

  // ── Etap A5 — warstwa mediów ──────────────────────────────────────────
  // Te sytuacje trafiają wprost do redaktora w panelu, więc komunikat musi
  // mówić, co zrobić, a nie tylko że coś się nie udało.
  file_required: {
    status: 400,
    message: 'Nie wybrano pliku. Pole „file” jest wymagane.',
  },
  empty_file: {
    status: 400,
    message: 'Przesłany plik jest pusty (0 bajtów).',
  },
  invalid_multipart: {
    status: 400,
    message: 'Nie udało się odczytać formularza. Spróbuj wysłać plik ponownie.',
  },
  forbidden_file_type: {
    status: 415,
    message:
      'Ten plik to program wykonywalny lub archiwum, nie materiał redakcyjny. Zmiana rozszerzenia nie zmienia zawartości pliku.',
  },
  unrecognized_file_type: {
    status: 415,
    message:
      'Nie rozpoznano formatu pliku po jego zawartości. Dopuszczone są zdjęcia (JPG, PNG, WebP, AVIF, GIF), wideo (MP4, WebM), audio (MP3, WAV, OGG) i PDF.',
  },
  unsafe_svg: {
    status: 415,
    message:
      'Ten plik SVG zawiera kod wykonywalny (skrypt lub zdarzenie), który uruchomiłby się w przeglądarce czytelnika. Zapisz grafikę jako PNG albo usuń skrypt.',
  },
  file_too_large: {
    status: 413,
    message: 'Plik przekracza dopuszczalny rozmiar dla swojego rodzaju.',
  },
  storage_unavailable: {
    status: 503,
    message: 'Magazyn plików R2 nie jest dostępny. Plik nie został zapisany — spróbuj ponownie.',
  },
  storage_error: {
    status: 502,
    message: 'Magazyn plików odrzucił operację. Plik mógł nie zostać zapisany w całości.',
  },
  no_parts: {
    status: 400,
    message: 'Sesja przesyłania nie zawiera żadnej części pliku.',
  },
  empty_part: {
    status: 400,
    message: 'Przesłana część pliku jest pusta.',
  },
  incomplete_upload: {
    status: 409,
    message: 'Brakuje części pliku — numeracja nie jest ciągła. Prześlij brakujące części przed zamknięciem sesji.',
  },
  part_missing_in_storage: {
    status: 409,
    message: 'Część pliku zapisana w sesji nie istnieje już w magazynie. Rozpocznij przesyłanie od nowa.',
  },
  gone: {
    status: 410,
    message: 'Ten zasób został usunięty i nie jest już dostępny.',
  },
  accessibility_warning: {
    status: 409,
    message:
      'Część zdjęć nie ma opisu alternatywnego (alt). Bez niego galeria jest niedostępna dla osób korzystających z czytnika ekranu. Uzupełnij opisy albo wymuś publikację parametrem ?force=1.',
  },

  // ── Etap I9 — ochrona formularzy (Turnstile) ──────────────────────────
  turnstile_failed: {
    status: 403,
    message: 'Weryfikacja „nie jestem robotem” nie została zaliczona. Odśwież stronę i spróbuj ponownie.',
  },
  misconfigured: {
    status: 503,
    message: 'Usługa jest źle skonfigurowana na serwerze. Zgłoś to redakcji — formularz jest chwilowo wyłączony.',
  },
} as const

export type ErrorCode = keyof typeof ERROR_CATALOG

/** Domyślny wpis stosowany, gdy kod nie istnieje w katalogu. */
const FALLBACK_ENTRY = ERROR_CATALOG.internal_error

/**
 * Odczyt wpisu katalogu odporny na nieznany kod.
 *
 * Bez tego zabezpieczenia literówka w nazwie kodu (`fail(c, 'not_fnd')`)
 * albo kod dodany w trasie, ale zapomniany w katalogu, powodowały
 * `TypeError: Cannot read properties of undefined (reading 'status')`
 * WEWNĄTRZ obsługi błędu — czyli żądanie kończyło się HTTP 500
 * „nieoczekiwany błąd serwera” zamiast właściwym 415 czy 413. Klient
 * widział awarię serwera tam, gdzie w rzeczywistości sam przesłał
 * nieprawidłowe dane, a prawdziwa przyczyna nie pojawiała się nigdzie.
 */
const entryForCode = (code: string): { status: number; message: string } => {
  const entry = (ERROR_CATALOG as Record<string, { status: number; message: string } | undefined>)[code]
  if (entry) return entry
  console.error(
    `[errors] Kod błędu "${code}" nie istnieje w ERROR_CATALOG — użyto ${FALLBACK_ENTRY.status}. ` +
      'Dodaj go do src/lib/http/errors.ts.',
  )
  return FALLBACK_ENTRY
}

/** Status HTTP przypisany do kodu błędu. */
export const statusForCode = (code: ErrorCode): number => entryForCode(code).status

/** Domyślny komunikat po polsku dla kodu błędu. */
export const messageForCode = (code: ErrorCode): string => entryForCode(code).message

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
