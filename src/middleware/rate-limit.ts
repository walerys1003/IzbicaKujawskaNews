/**
 * FAZA 1 / A7 — ograniczanie liczby żądań (rate limiting).
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DLACZEGO POPRZEDNIA WERSJA NIE DZIAŁAŁA
 * ══════════════════════════════════════════════════════════════════════════
 * src/routes/auth/middleware/rate-limit.ts trzymał licznik w
 * `new Map<string, number[]>()` — w pamięci pojedynczej instancji Workera.
 *
 * Na Cloudflare to nie chroni przed niczym:
 *   • kolejne żądania tego samego napastnika trafiają do RÓŻNYCH izolatów
 *     (inne kolokacje, inne instancje w tej samej kolokacji), a każdy
 *     izolat startuje z pustą mapą — licznik praktycznie nigdy nie dobija
 *     do limitu,
 *   • izolat jest usypiany po kilkudziesięciu sekundach bezczynności,
 *     co samo z siebie zeruje licznik,
 *   • mapa rosła bez ograniczenia (brak usuwania wygasłych kluczy) —
 *     wyciek pamięci przy większym ruchu.
 *
 * Efekt: atak słownikowy na /api/v1/auth/login przechodził bez przeszkód,
 * mimo że w kodzie „był rate limit”.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ROZWIĄZANIE
 * ══════════════════════════════════════════════════════════════════════════
 * Licznik w RATE_LIMIT_KV — magazynie współdzielonym między wszystkimi
 * instancjami. Zastosowano okno przesuwne (sliding window) na liście
 * znaczników czasu, dzięki czemu limit „5 na minutę” nie daje się obejść
 * przez wystrzelenie 5 żądań na końcu jednego okna i 5 na początku
 * następnego (wada okna stałego).
 *
 * ŚWIADOME OGRANICZENIE: KV jest ostatecznie spójne (eventually consistent),
 * więc przy równoległych żądaniach z wielu kolokacji limit może zostać
 * chwilowo przekroczony o kilka żądań. Dla ochrony przed atakiem
 * słownikowym i zalewaniem formularzy to w pełni wystarcza — istotne jest
 * zatrzymanie tysięcy prób, nie arytmetyczna precyzja przy piątej.
 * Twardy, ściśle spójny limit wymagałby Durable Objects (poza zakresem
 * tej fazy; udokumentowane jako możliwe rozszerzenie).
 *
 * Gdy RATE_LIMIT_KV nie jest podłączone, następuje degradacja do licznika
 * w pamięci — słabego, ale lepszego niż brak jakiegokolwiek. Fakt ten jest
 * logowany, aby nie stwarzać złudzenia ochrony.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { noteRateLimitDecision } from '../monitoring/rate-limit-monitor'
import { rateLimitedRequestsTotal } from '../monitoring/metrics'
import { fail } from '../lib/http/envelope'

export interface RateLimitOptions {
  /** Dopuszczalna liczba żądań w oknie. */
  limit: number
  /** Długość okna w milisekundach. */
  windowMs: number
  /** Nazwa licznika — rozdziela pule (np. 'login' vs 'comment'). */
  name: string
  /**
   * Czy identyfikować po zalogowanym użytkowniku, gdy jest dostępny.
   * Dla operacji wymagających logowania (upload, AI) sprawiedliwiej jest
   * liczyć per konto niż per adres IP — jedno biuro za wspólnym NAT-em
   * nie blokuje wtedy wszystkich swoich pracowników.
   */
  perUser?: boolean
}

/** Awaryjny licznik w pamięci — używany tylko gdy brak RATE_LIMIT_KV. */
const memoryBuckets = new Map<string, number[]>()
const MEMORY_KEYS_MAX = 5_000

const memoryHit = (key: string, windowMs: number, now: number): number[] => {
  // Prosty bezpiecznik przed nieograniczonym wzrostem mapy.
  if (memoryBuckets.size > MEMORY_KEYS_MAX) memoryBuckets.clear()
  const stamps = (memoryBuckets.get(key) || []).filter((stamp) => now - stamp < windowMs)
  memoryBuckets.set(key, stamps)
  return stamps
}

/** Identyfikator klienta: IP lub — gdy perUser i jest sesja — id użytkownika. */
const resolveClientId = (c: Parameters<Parameters<typeof createMiddleware>[0]>[0], perUser: boolean) => {
  if (perUser) {
    const auth = c.get('auth' as never) as { sub?: string } | undefined
    if (auth?.sub) return `u:${auth.sub}`
  }
  const ip =
    c.req.header('CF-Connecting-IP') ||
    (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  return `ip:${ip}`
}

export const rateLimit = (options: RateLimitOptions) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const { limit, windowMs, name, perUser = false } = options
    const clientId = resolveClientId(c as never, perUser)
    const key = `rl:${name}:${clientId}`
    const now = Date.now()
    const kv = c.env?.RATE_LIMIT_KV

    let stamps: number[]

    if (kv) {
      try {
        const raw = await kv.get(key)
        const parsed = raw ? (JSON.parse(raw) as number[]) : []
        stamps = Array.isArray(parsed) ? parsed.filter((stamp) => now - stamp < windowMs) : []
      } catch {
        // Uszkodzona wartość w KV nie może blokować serwisu.
        stamps = []
      }
    } else {
      console.warn(`[rate-limit] RATE_LIMIT_KV niepodłączone — licznik "${name}" działa tylko w pamięci instancji.`)
      stamps = memoryHit(key, windowMs, now)
    }

    const remaining = Math.max(0, limit - stamps.length)
    const oldest = stamps.length ? Math.min(...stamps) : now
    const resetAtMs = oldest + windowMs
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000))

    c.header('RateLimit-Limit', String(limit))
    c.header('RateLimit-Remaining', String(remaining))
    c.header('RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)))

    if (stamps.length >= limit) {
      noteRateLimitDecision(true)
      rateLimitedRequestsTotal.inc()
      c.header('Retry-After', String(retryAfterSeconds))
      console.warn(`[rate-limit] Limit "${name}" wyczerpany dla ${clientId} (${stamps.length}/${limit})`)
      return fail(
        c,
        'rate_limited',
        `Przekroczono limit ${limit} żądań na ${Math.round(windowMs / 1000)} s. Spróbuj ponownie za ${retryAfterSeconds} s.`,
        { limit, windowSeconds: Math.round(windowMs / 1000), retryAfterSeconds },
      )
    }

    noteRateLimitDecision(false)
    stamps.push(now)

    if (kv) {
      // TTL z zapasem — KV samo usunie wpis po wygaśnięciu okna, więc
      // nie potrzebujemy osobnego zadania sprzątającego.
      const ttl = Math.max(60, Math.ceil(windowMs / 1000) + 60)
      try {
        await kv.put(key, JSON.stringify(stamps), { expirationTtl: ttl })
      } catch (error) {
        console.error('[rate-limit] Nie udało się zapisać licznika w KV:', error)
      }
    } else {
      memoryBuckets.set(key, stamps)
    }

    await next()
  })

// ══════════════════════════════════════════════════════════════════════════
// Gotowe profile limitów wymagane w FAZIE 1 (roadmapa, etap A7).
// Trzymane w jednym miejscu, aby wartości nie rozjeżdżały się po plikach.
// ══════════════════════════════════════════════════════════════════════════

/** Logowanie: 5 prób na minutę. Szósta próba w tej samej minucie → 429. */
export const loginRateLimit = rateLimit({ name: 'login', limit: 5, windowMs: 60_000 })

/** Rejestracja i odzyskiwanie hasła: ostrzej, bo generują e-maile. */
export const registerRateLimit = rateLimit({ name: 'register', limit: 3, windowMs: 600_000 })
export const passwordResetRateLimit = rateLimit({ name: 'password-reset', limit: 3, windowMs: 900_000 })

/** Komentarze: 3 na 10 minut — ogranicza spam bez blokowania dyskusji. */
export const commentRateLimit = rateLimit({ name: 'comment', limit: 3, windowMs: 600_000 })

/** Wysyłka plików: 20 na godzinę, liczone per konto. */
export const uploadRateLimit = rateLimit({ name: 'upload', limit: 20, windowMs: 3_600_000, perUser: true })

/** Wywołania modeli AI: 10 na minutę — pilnuje też kosztów u dostawcy. */
export const aiRateLimit = rateLimit({ name: 'ai', limit: 10, windowMs: 60_000, perUser: true })

/** Zapis do newslettera: 3 na 10 minut z jednego adresu IP. */
export const newsletterRateLimit = rateLimit({ name: 'newsletter', limit: 3, windowMs: 600_000 })

/** Formularz kontaktowy i zgłoszenia od mieszkańców. */
export const contactRateLimit = rateLimit({ name: 'contact', limit: 5, windowMs: 900_000 })

/** Wyszukiwanie — ochrona przed zalewaniem zapytaniami FTS. */
export const searchRateLimit = rateLimit({ name: 'search', limit: 30, windowMs: 60_000 })
