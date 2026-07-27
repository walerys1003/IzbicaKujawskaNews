/**
 * Weryfikacja Cloudflare Turnstile po stronie serwera — etap I9.
 *
 * Do tej pory schematy walidacji przyjmowaly pole `turnstileToken`, ale nikt
 * go nie sprawdzal. Token bez weryfikacji w siteverify jest bez wartosci:
 * napastnik wysyla dowolny ciag znakow i przechodzi. Formularz wygladal na
 * chroniony i nie byl.
 */

export interface TurnstileOutcome {
  ok: boolean
  /** 'disabled' oznacza brak sekretu — patrz uwaga o trybie fail-closed */
  reason: 'ok' | 'disabled' | 'missing_token' | 'rejected' | 'network_error' | 'hostname_mismatch'
  errorCodes: string[]
  hostname?: string
  challengeTs?: string
  action?: string
}

const ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Klucz testowy Cloudflare, ktory przepuszcza wszystko. W produkcji zabroniony. */
const TESTING_SECRETS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
])

export interface VerifyOptions {
  secret?: string
  token?: string | null
  remoteIp?: string | null
  expectedAction?: string
  expectedHostnames?: string[]
  /**
   * Gdy brak sekretu:
   *  - w rozwoju lokalnym blokada kazdego formularza uniemozliwia prace,
   *  - w produkcji przepuszczanie wszystkiego to otwarta furtka dla botow.
   * Stad decyzja jest jawnym parametrem wywolania, a nie domyslnym zachowaniem.
   */
  allowWhenUnconfigured: boolean
  fetchImpl?: typeof fetch
}

interface SiteverifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

export const verifyTurnstile = async (options: VerifyOptions): Promise<TurnstileOutcome> => {
  const secret = options.secret?.trim()

  if (!secret) {
    return {
      ok: options.allowWhenUnconfigured,
      reason: 'disabled',
      errorCodes: ['turnstile_secret_missing'],
    }
  }

  const token = options.token?.trim()
  if (!token) {
    return { ok: false, reason: 'missing_token', errorCodes: ['missing-input-response'] }
  }

  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (options.remoteIp) body.append('remoteip', options.remoteIp)
  // idempotency_key pozwala powtorzyc weryfikacje tego samego tokenu przy
  // ponowieniu zadania — bez niego drugie sprawdzenie zwraca timeout-or-duplicate.
  body.append('idempotency_key', crypto.randomUUID())

  const doFetch = options.fetchImpl ?? fetch

  let payload: SiteverifyResponse
  try {
    const response = await doFetch(ENDPOINT, { method: 'POST', body })
    if (!response.ok) {
      return { ok: false, reason: 'network_error', errorCodes: [`http_${response.status}`] }
    }
    payload = (await response.json()) as SiteverifyResponse
  } catch (error) {
    // Awaria siteverify nie moze otwierac formularza — inaczej wystarczy
    // zablokowac ten jeden adres, zeby wylaczyc ochrone calego portalu.
    return {
      ok: false,
      reason: 'network_error',
      errorCodes: [error instanceof Error ? error.message : 'unknown'],
    }
  }

  const errorCodes = payload['error-codes'] ?? []

  if (!payload.success) {
    return { ok: false, reason: 'rejected', errorCodes, hostname: payload.hostname }
  }

  if (options.expectedHostnames?.length && payload.hostname) {
    // Token wystawiony dla innej domeny oznacza, ze widget zostal osadzony
    // na obcej stronie i uzyty do zasilania naszego formularza.
    const allowed = options.expectedHostnames.some(
      (host) => payload.hostname === host || payload.hostname?.endsWith(`.${host}`),
    )
    if (!allowed) {
      return { ok: false, reason: 'hostname_mismatch', errorCodes: ['hostname-not-allowed'], hostname: payload.hostname }
    }
  }

  if (options.expectedAction && payload.action && payload.action !== options.expectedAction) {
    return { ok: false, reason: 'rejected', errorCodes: ['action-mismatch'], action: payload.action }
  }

  return {
    ok: true,
    reason: 'ok',
    errorCodes: [],
    hostname: payload.hostname,
    challengeTs: payload.challenge_ts,
    action: payload.action,
  }
}

export const isTestingSecret = (secret?: string | null) => !!secret && TESTING_SECRETS.has(secret.trim())

/**
 * Wyciaga token z zadania niezaleznie od tego, jak formularz go nazwal.
 * Widget Turnstile wstawia `cf-turnstile-response`; nasze schematy Zod uzywaja
 * `turnstileToken`. Oba warianty musza dzialac, bo oba wystepuja w kodzie.
 */
export const extractTurnstileToken = (source: Record<string, unknown> | null | undefined, header?: string | null) => {
  if (header) return header
  if (!source) return null
  const candidates = ['cf-turnstile-response', 'turnstileToken', 'turnstile_token', 'captchaToken']
  for (const key of candidates) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}
