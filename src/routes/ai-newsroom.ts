/**
 * AI-NEWSROOM — 25 akcji redakcyjnych.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWA KRYTYCZNEJ LUKI Z AUDYTU 27.07.2026
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Poprzednia wersja tego pliku miała 23 linie i ZERO kontroli dostępu.
 * Potwierdzone wywołaniem bez tokenu:
 *
 *     POST /api/newsroom/autoTitle  →  200, prawdziwa odpowiedź modelu, 4,3 s
 *
 * Trzy niezależne konsekwencje po wdrożeniu na produkcję:
 *
 *   1. Dowolna osoba w internecie mogła wywoływać płatny model w pętli.
 *      Koszt obciążał konto redakcji.
 *   2. Brak limitu zapytań — pojedynczy skrypt mógł wysłać tysiące żądań.
 *   3. Brak zapisu do `ai_generations` — panel „Zużycie AI" pokazywał zero,
 *      więc problem byłby niewidoczny do momentu otrzymania faktury.
 *
 * Punkt 3 był najgorszy: luka nie tylko istniała, ale była też niemierzalna.
 *
 * Teraz obowiązuje ten sam łańcuch, co na `/api/v1/ai/*`:
 *
 *     requireAuth → requirePermission('ai:use') → aiRateLimit
 *                 → jsonBodyLimit → dzienny limit tokenów → zapis zużycia
 *
 * Trasa `GET /` (lista nazw akcji) pozostaje dostępna po zalogowaniu, ale nie
 * wymaga uprawnienia `ai:use` — sama lista nazw nie kosztuje ani jednego
 * tokenu, a jest potrzebna panelowi do zbudowania menu.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { newsroomActions, type NewsroomActionName } from '../ai/newsroom'
import { ok, fail } from '../lib/http/envelope'
import { requireAuth } from '../middleware/require-auth'
import { requirePermission, getAuth } from '../middleware/require-permission'
import { jsonBodyLimit } from '../middleware/body-limit'
import { aiRateLimit } from '../middleware/rate-limit'
import { recordAiUsage, checkAiBudget, estimateTokens } from '../lib/ai/usage'
import { AiProviderError } from '../ai/providers'

const app = new Hono<AppEnv>()

/** Nazwy akcji jako zbiór — sprawdzenie bez rzutowania niesprawdzonego wejścia. */
const ACTION_NAMES = new Set(Object.keys(newsroomActions))

const httpForProviderError = (error: AiProviderError) => {
  if (error.code === 'brak_konfiguracji') return 'service_unavailable' as const
  if (error.code === 'blad_uwierzytelnienia') return 'forbidden' as const
  if (error.code === 'limit_dostawcy') return 'rate_limited' as const
  return 'internal_error' as const
}

/**
 * Lista dostępnych akcji. Wymaga zalogowania, bo ujawnia zakres możliwości
 * panelu redakcyjnego, ale nie wymaga `ai:use` — moderator bez prawa do
 * modeli również widzi menu, tylko wywołanie zwróci mu 403.
 */
app.get('/', requireAuth, (c) =>
  ok(c, {
    akcje: Object.keys(newsroomActions).sort(),
    liczba: ACTION_NAMES.size,
  }),
)

/** Stan dziennego limitu — panel pokazuje pasek zużycia przed wywołaniem. */
app.get('/budget', requireAuth, requirePermission('ai:use'), async (c) =>
  ok(c, await checkAiBudget(c)),
)

app.post(
  '/:action',
  requireAuth,
  requirePermission('ai:use'),
  aiRateLimit,
  jsonBodyLimit,
  async (c) => {
    const action = c.req.param('action')

    if (!ACTION_NAMES.has(action)) {
      return fail(c, 'not_found', `Nieznana akcja redakcyjna: ${action}.`, {
        dostepneAkcje: Object.keys(newsroomActions).sort(),
      })
    }

    const budget = await checkAiBudget(c)
    if (!budget.allowed) {
      return fail(
        c,
        'rate_limited',
        `Dzienny limit ${budget.limit} tokenow zostal wyczerpany (${budget.used}).`,
        budget,
      )
    }

    const payload = await c.req.json().catch(() => ({}))
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return fail(c, 'validation_error', 'Tresc zadania musi byc obiektem JSON.')
    }

    const auth = getAuth(c)
    const uid = auth?.sub ? Number(auth.sub) || null : null
    const started = Date.now()
    const handler = newsroomActions[action as NewsroomActionName]

    // Model dostawcy nie jest znany przed wywołaniem (rozstrzyga go
    // `configFromEnv`), więc do rejestru trafia nazwa z konfiguracji lub
    // 'domyslny' — nigdy zmyślona wartość.
    const modelHint = c.env?.AI_DEFAULT_MODEL || 'domyslny'
    const providerHint = c.env?.AI_DEFAULT_PROVIDER || 'domyslny'

    try {
      const result = await handler(c.env as never, payload as never)
      const ms = Date.now() - started

      // Akcje newsroomu zwracają czysty tekst — dostawca nie przekazuje tu
      // liczników tokenów, więc szacujemy. Zapis szacunku jest uczciwszy od
      // zera: limit dzienny musi widzieć te wywołania.
      const outputTokens = estimateTokens(String(result ?? ''))
      const inputTokens = estimateTokens(JSON.stringify(payload))

      await recordAiUsage(c, {
        userId: uid,
        provider: providerHint,
        model: modelHint,
        action: `newsroom:${action}`,
        inputTokens,
        outputTokens,
        ms,
        ok: true,
      })

      return ok(c, {
        akcja: action,
        wynik: result,
        czasMs: ms,
        tokenySzacowane: { wejscie: inputTokens, wyjscie: outputTokens },
      })
    } catch (error) {
      const ms = Date.now() - started
      const providerError =
        error instanceof AiProviderError
          ? error
          : new AiProviderError('blad_dostawcy', String(error))

      await recordAiUsage(c, {
        userId: uid,
        provider: providerHint,
        model: modelHint,
        action: `newsroom:${action}`,
        inputTokens: estimateTokens(JSON.stringify(payload)),
        outputTokens: 0,
        ms,
        ok: false,
        error: `${providerError.code}: ${providerError.message}`,
      })

      return fail(c, httpForProviderError(providerError), providerError.message, {
        kod: providerError.code,
        mozliwePonowienie: providerError.retryable,
      })
    }
  },
)

export default app
export { app }
