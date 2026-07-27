/**
 * FAZA 2 / B5 — Rdzeń warstwy walidacji
 *
 * Stan przed tą zmianą: w katalogu `src/lib/validators/` istniały trzy pliki
 * (article, comment, newsletter) obsługujące łącznie trzy endpointy z około
 * pięćdziesięciu. Pozostałe trasy przyjmowały `await c.req.json<any>()`
 * i albo nie sprawdzały niczego, albo sprawdzały wyrywkowo — `if (!body.title)`.
 * Konsekwencje były realne, nie teoretyczne:
 *
 *   • `POST /api/v1/incoming` sprawdzał obecność dwóch pól i przepuszczał
 *     dowolny kształt `payload`, więc integrator n8n mógł wysłać cokolwiek;
 *   • pola liczbowe przychodziły jako łańcuchy znaków („12”) i trafiały
 *     do SQL bez konwersji, co w SQLite daje ciche porównania tekstowe;
 *   • komunikaty błędów miały trzy różne kształty, w zależności od pliku.
 *
 * Ten moduł wprowadza jedno źródło prawdy: schemat. Schemat jednocześnie
 * (1) waliduje, (2) normalizuje (trim, coerce, wartości domyślne),
 * (3) wytwarza typ TypeScript, więc handler nie deklaruje typu osobno
 * i nie może się z nim rozjechać.
 *
 * Kontrakt błędu jest jeden — koperta z A3 i kod `validation_error`:
 *
 *   {
 *     "ok": false,
 *     "error": {
 *       "code": "validation_error",
 *       "message": "Przesłane dane są nieprawidłowe lub niekompletne.",
 *       "details": { "pola": [ { "pole": "title", "problem": "..." } ] }
 *     },
 *     "requestId": "..."
 *   }
 *
 * `details.pola` jest tablicą, nie mapą, bo ta sama ścieżka może mieć wiele
 * problemów, a klient (formularz w panelu) podświetla pola po kolei.
 */

import type { Context, MiddlewareHandler } from 'hono'
import { z, ZodError, type ZodTypeAny } from 'zod'
import { fail } from '../http/envelope'

export { z }

// ─────────────────────────────────────────────────────────────────────────────
// Tłumaczenie komunikatów Zod na polski
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Domyślne komunikaty Zod są angielskie („Expected string, received number”).
 * Portal gminny czyta redaktor, nie programista, więc komunikat musi być
 * po polsku i mówić, co zrobić — nie jak nazywa się typ w bibliotece.
 */
const translateIssue = (issue: z.ZodIssue): string => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') return 'Pole jest wymagane.'
      if (issue.received === 'null') return 'Pole nie może być puste.'
      return `Oczekiwano wartości typu ${polishType(issue.expected)}, otrzymano ${polishType(issue.received)}.`
    case 'too_small':
      if (issue.type === 'string') {
        return issue.minimum === 1
          ? 'Pole nie może być puste.'
          : `Wymagane co najmniej ${issue.minimum} znaków.`
      }
      if (issue.type === 'array') return `Wymagane co najmniej ${issue.minimum} pozycji.`
      if (issue.type === 'number') return `Wartość musi być nie mniejsza niż ${issue.minimum}.`
      return `Wartość jest za mała (minimum ${issue.minimum}).`
    case 'too_big':
      if (issue.type === 'string') return `Dopuszczalne najwyżej ${issue.maximum} znaków.`
      if (issue.type === 'array') return `Dopuszczalne najwyżej ${issue.maximum} pozycji.`
      if (issue.type === 'number') return `Wartość musi być nie większa niż ${issue.maximum}.`
      return `Wartość jest za duża (maksimum ${issue.maximum}).`
    case 'invalid_enum_value':
      return `Dopuszczalne wartości: ${issue.options.map(String).join(', ')}.`
    case 'invalid_string':
      if (issue.validation === 'email') return 'To nie jest poprawny adres e-mail.'
      if (issue.validation === 'url') return 'To nie jest poprawny adres URL.'
      if (issue.validation === 'uuid') return 'To nie jest poprawny identyfikator UUID.'
      if (issue.validation === 'datetime') return 'Oczekiwano daty w formacie ISO 8601.'
      return 'Wartość ma nieprawidłowy format.'
    case 'invalid_union':
      return 'Wartość nie odpowiada żadnemu z dopuszczalnych wariantów.'
    case 'unrecognized_keys':
      return `Nieznane pola: ${issue.keys.join(', ')}.`
    case 'custom':
      return issue.message || 'Wartość nie przeszła weryfikacji.'
    default:
      return issue.message || 'Wartość jest nieprawidłowa.'
  }
}

const polishType = (t: string): string => {
  const map: Record<string, string> = {
    string: 'tekst',
    number: 'liczba',
    boolean: 'wartość logiczna',
    array: 'lista',
    object: 'obiekt',
    undefined: 'brak wartości',
    null: 'wartość pusta',
    nan: 'nie-liczba',
  }
  return map[t] ?? t
}

export interface FieldProblem {
  /** Ścieżka do pola w notacji kropkowej, np. `blocks.3.html`. */
  pole: string
  problem: string
}

/** Zamiana błędu Zod na listę problemów gotową do wstawienia w kopertę. */
export const formatZodError = (error: ZodError): FieldProblem[] =>
  error.issues.map((issue) => ({
    pole: issue.path.length ? issue.path.map(String).join('.') : '(korzeń)',
    problem: translateIssue(issue),
  }))

// ─────────────────────────────────────────────────────────────────────────────
// Walidacja wywoływana wprost w handlerze
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; problems: FieldProblem[] }

/**
 * Walidacja bez rzucania wyjątku. Używana tam, gdzie handler chce sam
 * zdecydować o odpowiedzi (np. dołożyć własne pole do `details`).
 */
export const check = <S extends ZodTypeAny>(schema: S, input: unknown): ValidationOutcome<z.infer<S>> => {
  const result = schema.safeParse(input)
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, problems: formatZodError(result.error) }
}

/**
 * Walidacja z natychmiastową odpowiedzią błędu.
 *
 *   const parsed = await parseJson(c, ArticleCreateSchema)
 *   if (parsed instanceof Response) return parsed
 *   parsed.title // typowane
 *
 * Zwracamy `Response`, a nie rzucamy — dzięki temu ścieżka błędu jest
 * widoczna w sygnaturze i TypeScript wymusi jej obsługę.
 */
export const parseJson = async <S extends ZodTypeAny>(
  c: Context,
  schema: S,
): Promise<z.infer<S> | Response> => {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    return fail(c, 'validation_error', 'Treść żądania nie jest poprawnym dokumentem JSON.')
  }
  const outcome = check(schema, raw)
  if (!outcome.ok) {
    return fail(c, 'validation_error', undefined, { pola: outcome.problems })
  }
  return outcome.data
}

/** Walidacja parametrów zapytania (`?limit=20&status=draft`). */
export const parseQuery = <S extends ZodTypeAny>(c: Context, schema: S): z.infer<S> | Response => {
  const outcome = check(schema, c.req.query())
  if (!outcome.ok) {
    return fail(c, 'validation_error', 'Nieprawidłowe parametry zapytania.', { pola: outcome.problems })
  }
  return outcome.data
}

/** Walidacja parametrów ścieżki (`/articles/:id`). */
export const parseParams = <S extends ZodTypeAny>(c: Context, schema: S): z.infer<S> | Response => {
  const outcome = check(schema, c.req.param())
  if (!outcome.ok) {
    return fail(c, 'validation_error', 'Nieprawidłowy adres zasobu.', { pola: outcome.problems })
  }
  return outcome.data
}

/**
 * Walidacja formularza `application/x-www-form-urlencoded` lub
 * `multipart/form-data`. Pola wielokrotne (`tags=a&tags=b`) są zwijane
 * do tablicy, bo `FormData.get` zwróciłby tylko pierwszą wartość i cicho
 * zgubił pozostałe — to był realny błąd w formularzu tagów w panelu.
 */
export const parseForm = async <S extends ZodTypeAny>(
  c: Context,
  schema: S,
): Promise<z.infer<S> | Response> => {
  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return fail(c, 'validation_error', 'Nie udało się odczytać danych formularza.')
  }
  const raw: Record<string, unknown> = {}
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key)
    raw[key] = values.length > 1 ? values : values[0]
  }
  const outcome = check(schema, raw)
  if (!outcome.ok) {
    return fail(c, 'validation_error', undefined, { pola: outcome.problems })
  }
  return outcome.data
}

// ─────────────────────────────────────────────────────────────────────────────
// Warstwa pośrednicząca (middleware) — dla tras deklaratywnych
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationTarget = 'json' | 'query' | 'param' | 'form'

/**
 * Middleware odkładające zwalidowane dane pod kluczem `valid:<target>`.
 *
 *   app.post('/x', validator('json', Schema), (c) => {
 *     const body = validated<typeof Schema>(c, 'json')
 *   })
 *
 * Wariant middleware jest wygodniejszy przy wielu warstwach (query + json
 * na jednej trasie); wariant `parseJson` — przy jednej.
 */
export const validator = (target: ValidationTarget, schema: ZodTypeAny): MiddlewareHandler => {
  return async (c, next) => {
    let raw: unknown
    if (target === 'json') {
      try {
        raw = await c.req.json()
      } catch {
        return fail(c, 'validation_error', 'Treść żądania nie jest poprawnym dokumentem JSON.')
      }
    } else if (target === 'query') {
      raw = c.req.query()
    } else if (target === 'param') {
      raw = c.req.param()
    } else {
      try {
        const form = await c.req.formData()
        const acc: Record<string, unknown> = {}
        for (const key of new Set(form.keys())) {
          const values = form.getAll(key)
          acc[key] = values.length > 1 ? values : values[0]
        }
        raw = acc
      } catch {
        return fail(c, 'validation_error', 'Nie udało się odczytać danych formularza.')
      }
    }

    const outcome = check(schema, raw)
    if (!outcome.ok) {
      const message =
        target === 'query'
          ? 'Nieprawidłowe parametry zapytania.'
          : target === 'param'
            ? 'Nieprawidłowy adres zasobu.'
            : undefined
      return fail(c, 'validation_error', message, { pola: outcome.problems })
    }
    c.set(`valid:${target}` as never, outcome.data as never)
    await next()
  }
}

/** Odczyt danych odłożonych przez `validator`. */
export const validated = <S extends ZodTypeAny>(c: Context, target: ValidationTarget): z.infer<S> =>
  c.get(`valid:${target}` as never) as z.infer<S>
