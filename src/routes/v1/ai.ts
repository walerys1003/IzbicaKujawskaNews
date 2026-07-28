/**
 * FAZA 3 / AI1 + AI2 + AI8 + AI10 + AI12 — trasy modeli jezykowych.
 *
 * Trzy rzeczy, ktore ten plik gwarantuje:
 *
 * 1. BRAK DOSTAWCY = HTTP 503, nigdy udawana odpowiedz. Poprzedni
 *    `src/ai/client.ts` przy braku klucza zwracal `provider: 'fallback'`
 *    z trescia wygenerowana ze schematu JSON. Dla portalu informacyjnego to
 *    fabrykowanie materialu prasowego — redaktor nie mial jak rozpoznac,
 *    ze czyta wypelniacz, a nie tekst modelu.
 *
 * 2. KLUCZ NIE OPUSZCZA SERWERA. Panel wysyla polecenie do `/api/v1/ai/*`,
 *    a zapytanie do dostawcy wychodzi z Workera. Do przegladarki wraca
 *    wylacznie tekst i podpowiedz klucza w formie `sk-…f3a9`.
 *
 * 3. KAZDE WYWOLANIE JEST ZAPISANE (AI10). Bez rejestru kosztow limit
 *    dzienny nie ma na czym sie oprzec, a redakcja dowiedzialaby sie
 *    o wydatkach z faktury dostawcy.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, fail, requireDb } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth } from '../../middleware/require-permission'
import { jsonBodyLimit } from '../../middleware/body-limit'
import { aiRateLimit } from '../../middleware/rate-limit'
import { audit } from '../../lib/audit'
import { parseJson } from '../../lib/validation/core'
import { z } from 'zod'
import {
  complete,
  streamCompletion,
  testConnection,
  configFromEnv,
  keyHint,
  AiProviderError,
  PROVIDER_PRESETS,
  PROVIDER_KINDS,
  DEFAULT_TIMEOUT_MS,
  type ProviderConfig,
} from '../../ai/providers'

const route = new Hono<AppEnv>()

// ─────────────────────────────────────────────────────────────────────────────
// Schematy
// ─────────────────────────────────────────────────────────────────────────────

const overrideSchema = z
  .object({
    kind: z.enum(PROVIDER_KINDS).optional(),
    baseUrl: z.string().trim().url('Adres dostawcy musi byc poprawnym URL.').max(300).optional(),
    apiKey: z.string().trim().min(8, 'Klucz jest za krotki.').max(400).optional(),
    model: z.string().trim().min(1).max(120).optional(),
  })
  .optional()

const completeSchema = z.object({
  prompt: z.string().trim().min(1, 'Polecenie nie moze byc puste.').max(20_000),
  system: z.string().trim().max(10_000).optional(),
  temperature: z.coerce.number().min(0).max(2).default(0.4),
  maxTokens: z.coerce.number().int().min(16).max(8000).default(1500),
  dostawca: overrideSchema,
})

const testSchema = z.object({ dostawca: overrideSchema })

// ─────────────────────────────────────────────────────────────────────────────
// Rejestr wywolan (AI10)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zapis uzycia. Tabela `ai_generations` jest tworzona migracja 0050;
 * gdyby jej jeszcze nie bylo, blad zapisu nie moze zablokowac odpowiedzi
 * dla redaktora — dlatego `catch` z logiem, nie rzucenie wyjatkiem.
 */
const recordUsage = async (
  c: never,
  data: {
    userId: number | null
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    action: string
    ms: number
    ok: boolean
    error?: string
  },
): Promise<void> => {
  const ctx = c as unknown as { env: { DB?: { prepare(q: string): { bind(...v: unknown[]): { run(): Promise<unknown> } } } } }
  const db = ctx.env?.DB
  if (!db) return
  try {
    await db
      .prepare(
        `INSERT INTO ai_generations
           (user_id, provider, model, action, input_tokens, output_tokens,
            duration_ms, outcome, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.userId,
        data.provider,
        data.model,
        data.action,
        data.inputTokens,
        data.outputTokens,
        data.ms,
        data.ok ? 'ok' : 'error',
        data.error ?? null,
      )
      .run()
  } catch (error) {
    console.error('[ai] nie zapisano zuzycia:', error)
  }
}

/**
 * Kontrola limitu dziennego (AI10). Zwraca komunikat, gdy limit wyczerpany.
 *
 * Limit liczymy w TOKENACH, nie w liczbie wywolan: jedno zapytanie o dlugi
 * artykul kosztuje tyle, co kilkadziesiat krotkich poprawek stylistycznych,
 * wiec licznik wywolan nie mowilby nic o wydatku.
 */
const DAILY_TOKEN_LIMIT = 400_000

const checkBudget = async (
  c: never,
): Promise<{ allowed: boolean; used: number; limit: number; percent: number }> => {
  const ctx = c as unknown as {
    env: { DB?: { prepare(q: string): { bind(...v: unknown[]): { first<T>(): Promise<T | null> } } } }
  }
  const db = ctx.env?.DB
  if (!db) return { allowed: true, used: 0, limit: DAILY_TOKEN_LIMIT, percent: 0 }

  try {
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(input_tokens + output_tokens), 0) AS n
           FROM ai_generations
          WHERE created_at >= date('now', 'start of day')`,
      )
      .bind()
      .first<{ n: number }>()
    const used = row?.n ?? 0
    return {
      allowed: used < DAILY_TOKEN_LIMIT,
      used,
      limit: DAILY_TOKEN_LIMIT,
      percent: Math.round((used / DAILY_TOKEN_LIMIT) * 100),
    }
  } catch {
    // Brak tabeli nie moze blokowac pracy redakcji.
    return { allowed: true, used: 0, limit: DAILY_TOKEN_LIMIT, percent: 0 }
  }
}

const toConfig = (o: z.infer<typeof overrideSchema>): Partial<ProviderConfig> | undefined =>
  o ? { kind: o.kind, baseUrl: o.baseUrl, apiKey: o.apiKey, model: o.model } : undefined

const httpFor = (error: AiProviderError) => {
  if (error.code === 'brak_konfiguracji') return 'service_unavailable' as const
  if (error.code === 'blad_uwierzytelnienia') return 'forbidden' as const
  if (error.code === 'limit_dostawcy') return 'rate_limited' as const
  return 'internal_error' as const
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Stan konfiguracji (AI2)
// ─────────────────────────────────────────────────────────────────────────────

route.get('/status', requireAuth, requirePermission('ai:use'), async (c) => {
  const config = configFromEnv(c.env)
  const budget = await checkBudget(c as never)

  return ok(c, {
    skonfigurowany: config !== null,
    // Klucz NIGDY nie jest zwracany. Podpowiedz wystarcza, by administrator
    // rozpoznal, ktory klucz jest wpisany, i nie pozwala go uzyc.
    dostawca: config
      ? {
          rodzaj: config.kind,
          nazwa: config.label,
          adres: config.baseUrl || '(binding Cloudflare)',
          model: config.model,
          podpowiedzKlucza: keyHint(config.apiKey),
        }
      : null,
    komunikat: config
      ? null
      : 'Zaden dostawca nie jest skonfigurowany. Trasy AI zwracaja 503 i NIE generuja zastepczej tresci.',
    gotoweProfile: Object.entries(PROVIDER_PRESETS).map(([id, p]) => ({
      id,
      nazwa: p.label,
      rodzaj: p.kind,
      adres: p.baseUrl,
      przykladowyModel: p.exampleModel,
    })),
    limitDzienny: budget,
    limitCzasuMs: DEFAULT_TIMEOUT_MS,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Test polaczenia (AI2 — przycisk „Testuj”)
// ─────────────────────────────────────────────────────────────────────────────

route.post('/test', requireAuth, requirePermission('ai:configure'), jsonBodyLimit, async (c) => {
  const input = await parseJson(c, testSchema)
  if (input instanceof Response) return input

  const result = await testConnection(c.env, toConfig(input.dostawca))

  await audit(c, {
    action: 'ai.test',
    entity: 'ai_providers',
    outcome: result.ok ? 'ok' : 'error',
    note: result.ok ? `${result.dostawca}/${result.model} w ${result.czasMs} ms` : `${result.kod}: ${result.komunikat}`,
  })

  // Nieudany test to poprawnie obsluzona sytuacja, nie blad serwera —
  // administrator ma zobaczyc przyczyne w interfejsie, a nie strone bledu.
  return ok(c, result)
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Wywolanie zwykle
// ─────────────────────────────────────────────────────────────────────────────

route.post('/complete', requireAuth, requirePermission('ai:use'), aiRateLimit, jsonBodyLimit, async (c) => {
  const input = await parseJson(c, completeSchema)
  if (input instanceof Response) return input

  const budget = await checkBudget(c as never)
  if (!budget.allowed) {
    return fail(c, 'rate_limited', `Dzienny limit ${budget.limit} tokenow zostal wyczerpany (${budget.used}).`, budget)
  }

  const started = Date.now()
  const auth = getAuth(c as never)
  const uid = auth?.sub ? Number(auth.sub) || null : null

  try {
    const result = await complete(
      c.env,
      {
        system: input.system,
        messages: [{ role: 'user', content: input.prompt }],
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      },
      toConfig(input.dostawca),
    )

    await recordUsage(c as never, {
      userId: uid,
      provider: result.provider,
      model: result.model,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      action: 'complete',
      ms: Date.now() - started,
      ok: true,
    })

    return ok(c, {
      tekst: result.text,
      model: result.model,
      dostawca: result.provider,
      tokeny: result.usage,
      czasMs: Date.now() - started,
    })
  } catch (error) {
    const e = error instanceof AiProviderError ? error : new AiProviderError('blad_dostawcy', String(error))
    await recordUsage(c as never, {
      userId: uid,
      provider: 'nieznany',
      model: input.dostawca?.model ?? 'nieznany',
      inputTokens: 0,
      outputTokens: 0,
      action: 'complete',
      ms: Date.now() - started,
      ok: false,
      error: `${e.code}: ${e.message}`,
    })
    return fail(c, httpFor(e), e.message, { kod: e.code, mozliwePonowienie: e.retryable })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Strumien (AI8 — „widzi tekst powstajacy na zywo”)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Odpowiedz w formacie SSE. Klient przerywa generowanie po prostu zamykajac
 * polaczenie — `c.req.raw.signal` przekazujemy do dostawcy, wiec przycisk
 * „Przerwij” faktycznie zatrzymuje zapytanie i nie placimy za reszte tokenow.
 */
route.post('/stream', requireAuth, requirePermission('ai:use'), aiRateLimit, jsonBodyLimit, async (c) => {
  const input = await parseJson(c, completeSchema)
  if (input instanceof Response) return input

  const budget = await checkBudget(c as never)
  if (!budget.allowed) {
    return fail(c, 'rate_limited', `Dzienny limit ${budget.limit} tokenow zostal wyczerpany.`, budget)
  }

  const auth = getAuth(c as never)
  const uid = auth?.sub ? Number(auth.sub) || null : null
  const started = Date.now()
  const encoder = new TextEncoder()

  let iterator: AsyncGenerator<{ delta?: string; usage?: unknown; done?: boolean }, void, unknown>
  try {
    iterator = streamCompletion(
      c.env,
      {
        system: input.system,
        messages: [{ role: 'user', content: input.prompt }],
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        signal: c.req.raw.signal,
      },
      toConfig(input.dostawca),
    ) as never
  } catch (error) {
    // Blad konfiguracji zglaszamy jako zwykla odpowiedz HTTP, PRZED
    // otwarciem strumienia. Po otwarciu strumienia status jest juz 200
    // i klient nie mialby jak rozpoznac awarii.
    const e = error instanceof AiProviderError ? error : new AiProviderError('blad_dostawcy', String(error))
    return fail(c, httpFor(e), e.message, { kod: e.code })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      let usage = { inputTokens: 0, outputTokens: 0 }
      let charCount = 0

      try {
        for await (const chunk of iterator) {
          if (chunk.delta) {
            charCount += chunk.delta.length
            send('fragment', { tekst: chunk.delta })
          }
          if (chunk.usage) usage = chunk.usage as typeof usage
          if (chunk.done) break
        }

        send('koniec', { tokeny: usage, znakow: charCount, czasMs: Date.now() - started })

        await recordUsage(c as never, {
          userId: uid,
          provider: 'strumien',
          model: input.dostawca?.model ?? configFromEnv(c.env)?.model ?? 'nieznany',
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          action: 'stream',
          ms: Date.now() - started,
          ok: true,
        })
      } catch (error) {
        const e = error instanceof AiProviderError ? error : new AiProviderError('blad_dostawcy', String(error))
        /**
         * AI12 — praca redaktora musi przezyc awarie. Wysylamy zdarzenie
         * `blad` razem z liczba znakow, ktore juz doszly, zeby panel mogl
         * zachowac to, co model zdazyl napisac, zamiast czyscic edytor.
         */
        send('blad', { kod: e.code, komunikat: e.message, znakowPrzedBledem: charCount, mozliwePonowienie: e.retryable })

        await recordUsage(c as never, {
          userId: uid,
          provider: 'strumien',
          model: input.dostawca?.model ?? 'nieznany',
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          action: 'stream',
          ms: Date.now() - started,
          ok: false,
          error: `${e.code}: ${e.message}`,
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // Bez tego posrednik buforowalby strumien i efekt pisania na zywo
      // zamienilby sie w jedna porcje tekstu na koncu.
      'x-accel-buffering': 'no',
    },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Zuzycie i koszty (AI10)
// ─────────────────────────────────────────────────────────────────────────────

route.get('/usage', requireAuth, requirePermission('ai:use'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  try {
    const [daily, byUser, byAction] = await Promise.all([
      dbGuard.prepare(
        `SELECT date(created_at) AS dzien,
                SUM(input_tokens) AS wejscie,
                SUM(output_tokens) AS wyjscie,
                COUNT(*) AS wywolan,
                SUM(CASE WHEN outcome <> 'ok' THEN 1 ELSE 0 END) AS bledow
           FROM ai_generations
          WHERE created_at >= date('now', '-30 days')
          GROUP BY date(created_at) ORDER BY dzien DESC`,
      ).all(),
      dbGuard.prepare(
        `SELECT g.user_id, u.name, u.email,
                SUM(g.input_tokens + g.output_tokens) AS tokeny, COUNT(*) AS wywolan
           FROM ai_generations g LEFT JOIN users u ON u.id = g.user_id
          WHERE g.created_at >= date('now', 'start of month')
          GROUP BY g.user_id ORDER BY tokeny DESC LIMIT 20`,
      ).all(),
      dbGuard.prepare(
        `SELECT action, COUNT(*) AS wywolan, SUM(input_tokens + output_tokens) AS tokeny
           FROM ai_generations
          WHERE created_at >= date('now', 'start of month')
          GROUP BY action ORDER BY tokeny DESC`,
      ).all(),
    ])

    const budget = await checkBudget(c as never)
    return ok(c, {
      limitDzienny: budget,
      /** Prog ostrzegawczy z audytu — 80 % limitu. */
      ostrzezenie: budget.percent >= 80 ? `Wykorzystano ${budget.percent}% dziennego limitu.` : null,
      poDniach: daily.results ?? [],
      poUzytkownikach: byUser.results ?? [],
      poOperacjach: byAction.results ?? [],
    })
  } catch (error) {
    return fail(c, 'internal_error', 'Nie udalo sie odczytac rejestru zuzycia.', {
      podpowiedz: 'Czy migracja 0050 (ai_generations) zostala zastosowana?',
      szczegol: String(error).slice(0, 200),
    })
  }
})

export default route
