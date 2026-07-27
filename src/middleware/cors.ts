/**
 * FAZA 1 / A7 — CORS na zamkniętą listę domen.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWIANA LUKA
 * ══════════════════════════════════════════════════════════════════════════
 * Poprzednia implementacja (src/middleware/security-headers.ts) robiła:
 *
 *     Access-Control-Allow-Origin: <dowolna wartość nagłówka Origin>
 *     Access-Control-Allow-Credentials: true
 *
 * To zestawienie całkowicie znosi ochronę CORS. Odbicie `Origin` sprawia,
 * że każda domena na świecie przechodzi kontrolę, a `Allow-Credentials: true`
 * pozwala przeglądarce dołączyć ciasteczko sesji i UDOSTĘPNIĆ treść
 * odpowiedzi skryptowi obcej witryny.
 *
 * Skutek praktyczny: wystarczyło, że zalogowany redaktor izbica24.pl
 * odwiedził dowolną stronę atakującego, aby ta odczytała jego profil,
 * listę sesji, treść panelu redakcyjnego i wykonała w jego imieniu
 * dowolne żądanie zapisu. Specyfikacja CORS wprost zabrania łączenia
 * `Allow-Credentials: true` z wartością `*` — odbicie Origin jest
 * funkcjonalnie tym samym, tylko omija tę blokadę przeglądarki.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ROZWIĄZANIE
 * ══════════════════════════════════════════════════════════════════════════
 * Zamknięta lista dozwolonych źródeł. Origin poza listą nie otrzymuje
 * nagłówka `Access-Control-Allow-Origin` w ogóle — przeglądarka sama
 * zablokuje odczyt odpowiedzi. Żądanie nie jest odrzucane błędem, bo
 * CORS jest mechanizmem przeglądarki, nie autoryzacją serwera: blokowanie
 * po stronie serwera zepsułoby integracje server-to-server, które CORS-u
 * nie używają.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'

/** Źródła produkcyjne portalu. */
const STATIC_ALLOWED_ORIGINS = [
  'https://izbica24.pl',
  'https://www.izbica24.pl',
]

/** Wzorce źródeł generowanych przez platformy wdrożeniowe i lokalny development. */
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.izbica24\.pl$/,          // subdomeny (redakcja., api.)
  /^https:\/\/[a-z0-9-]+\.izbica24\.pages\.dev$/,  // podglądy Cloudflare Pages
  /^https:\/\/izbica24\.pages\.dev$/,
]

/** Wzorce dopuszczane WYŁĄCZNIE w środowisku deweloperskim. */
const DEV_ORIGIN_PATTERNS: RegExp[] = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/[a-z0-9-]+\.sandbox\.novita\.ai$/,   // podgląd w piaskownicy
  /^https:\/\/[a-z0-9-]+\.e2b\.dev$/,
]

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, X-Request-Id, X-CSRF-Token'
const EXPOSED_HEADERS = 'X-Request-Id, X-Response-Time, RateLimit-Remaining, RateLimit-Reset, Retry-After'

/**
 * Rozstrzyga, czy dane źródło jest dozwolone.
 * Dodatkowe domeny można podać w zmiennej środowiskowej CORS_ALLOWED_ORIGINS
 * (lista rozdzielona przecinkami) — bez przebudowy aplikacji.
 */
export const isOriginAllowed = (origin: string, env?: { ENVIRONMENT?: string; CORS_ALLOWED_ORIGINS?: string }) => {
  if (!origin) return false

  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true
  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))) return true

  const extra = (env?.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  if (extra.includes(origin)) return true

  const isDevelopment = env?.ENVIRONMENT !== 'production'
  if (isDevelopment && DEV_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))) return true

  return false
}

export const corsMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const allowed = isOriginAllowed(origin, c.env as never)

  // Zapytanie wstępne (preflight) obsługujemy bez wchodzenia w trasę.
  if (c.req.method === 'OPTIONS') {
    const headers = new Headers()
    if (allowed) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
      headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
      headers.set('Access-Control-Max-Age', '86400')
    }
    // Vary jest konieczne zawsze: bez niego cache podałby odpowiedź
    // wygenerowaną dla dozwolonego Origin także źródłu niedozwolonemu.
    headers.set('Vary', 'Origin')
    return new Response(null, { status: 204, headers })
  }

  await next()

  c.res.headers.append('Vary', 'Origin')
  if (!allowed) {
    // Świadomie NIE ustawiamy Allow-Origin. Brak nagłówka = przeglądarka
    // nie udostępni treści skryptowi obcej witryny.
    if (origin) {
      console.warn('[cors] Odrzucone źródło:', origin, c.req.method, c.req.path)
    }
    return
  }

  c.res.headers.set('Access-Control-Allow-Origin', origin)
  c.res.headers.set('Access-Control-Allow-Credentials', 'true')
  c.res.headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS)
})
