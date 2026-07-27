/**
 * Etap I9 — sredniowarstwa Turnstile.
 *
 * Schematy Zod przyjmowaly `turnstileToken` i `cf-turnstile-response`, ale nikt
 * tych pol nie sprawdzal. Formularz z widgetem CAPTCHA, ktorego serwer nie
 * weryfikuje, jest tylko utrudnieniem dla czlowieka — bot pomija widget i
 * wysyla POST bezposrednio, z dowolna wartoscia pola.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types/env'
import { fail } from '../lib/http/envelope'
import { verifyTurnstile, extractTurnstileToken, isTestingSecret } from '../lib/security/turnstile'

export interface TurnstileGuardOptions {
  /** Nazwa akcji zadeklarowana w widgecie — chroni przed przenoszeniem tokenow miedzy formularzami. */
  action?: string
  /**
   * Czy przepuszczac, gdy sekret nie jest ustawiony.
   * Domyslnie: tak w rozwoju (inaczej nie da sie testowac formularzy),
   * nie w produkcji (inaczej ochrona jest fikcyjna).
   */
  allowWhenUnconfigured?: boolean
}

const isProduction = (env: Record<string, unknown>) => {
  const stage = String(env.ENVIRONMENT ?? env.NODE_ENV ?? '').toLowerCase()
  return stage === 'production' || stage === 'prod'
}

/**
 * Zwraca sredniowarstwe. Zaklada, ze cialo zadania jest JSON-em albo
 * formularzem, i NIE konsumuje strumienia w sposob uniemozliwiajacy
 * pozniejszy odczyt: Hono buforuje cialo, wiec `c.req.json()` w handlerze
 * nadal zadziala. Bez tego zalozenia kazda trasa za ta sredniowarstwa
 * dostawalaby puste cialo — blad trudny do zdiagnozowania.
 */
export const turnstileGuard = (options: TurnstileGuardOptions = {}) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const secret = (c.env as Record<string, unknown>).TURNSTILE_SECRET_KEY as string | undefined
    const production = isProduction(c.env as unknown as Record<string, unknown>)

    const allowWhenUnconfigured = options.allowWhenUnconfigured ?? !production

    // Klucz testowy Cloudflare przepuszcza kazdy token. W produkcji to znaczy
    // brak ochrony przy pozorze konfiguracji — najgorszy z mozliwych stanow.
    if (production && isTestingSecret(secret)) {
      console.error('[turnstile] W produkcji ustawiono klucz testowy Cloudflare — ochrona nie działa.')
      return fail(c, 'misconfigured', 'Ochrona antyspamowa jest nieprawidłowo skonfigurowana.', 503)
    }

    let source: Record<string, unknown> | null = null
    const contentType = c.req.header('content-type') ?? ''
    try {
      if (contentType.includes('application/json')) {
        source = (await c.req.json()) as Record<string, unknown>
      } else if (contentType.includes('form')) {
        source = (await c.req.parseBody({ all: false })) as Record<string, unknown>
      }
    } catch {
      source = null
    }

    const token = extractTurnstileToken(source, c.req.header('cf-turnstile-response'))

    const outcome = await verifyTurnstile({
      secret,
      token,
      remoteIp: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      expectedAction: options.action,
      expectedHostnames: ['izbica24.pl', 'localhost', '127.0.0.1'],
      allowWhenUnconfigured,
    })

    c.set('turnstile' as never, outcome as never)

    if (!outcome.ok) {
      const komunikaty: Record<string, string> = {
        disabled: 'Ochrona antyspamowa nie jest skonfigurowana na serwerze.',
        missing_token: 'Potwierdź, że nie jesteś robotem, i wyślij formularz ponownie.',
        rejected: 'Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie.',
        network_error: 'Nie udało się połączyć z usługą weryfikacji. Spróbuj ponownie za chwilę.',
        hostname_mismatch: 'Token weryfikacji pochodzi z innej witryny.',
      }
      const status = outcome.reason === 'network_error' || outcome.reason === 'disabled' ? 503 : 403
      return fail(c, 'turnstile_failed', komunikaty[outcome.reason] ?? 'Weryfikacja antyspamowa nie powiodła się.', status)
    }

    await next()
  })

/** Wariant miekki: nie blokuje, tylko zapisuje wynik do kontekstu. */
export const turnstileObserve = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const secret = (c.env as Record<string, unknown>).TURNSTILE_SECRET_KEY as string | undefined
    let source: Record<string, unknown> | null = null
    try {
      if ((c.req.header('content-type') ?? '').includes('application/json')) {
        source = (await c.req.json()) as Record<string, unknown>
      }
    } catch {
      source = null
    }
    const outcome = await verifyTurnstile({
      secret,
      token: extractTurnstileToken(source, c.req.header('cf-turnstile-response')),
      remoteIp: c.req.header('cf-connecting-ip') ?? null,
      allowWhenUnconfigured: true,
    })
    c.set('turnstile' as never, outcome as never)
    await next()
  })
