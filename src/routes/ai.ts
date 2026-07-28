/**
 * BIBLIOTEKA PODPOWIEDZI — 15 gotowych szablonów promptów.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWA KRYTYCZNEJ LUKI Z AUDYTU 27.07.2026
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Audyt potwierdził wywołaniem BEZ TOKENU:
 *
 *     POST /api/ai/prompt/headline-generator  →  200, płatny model wywołany
 *
 * Plik nie miał ani jednego `use(`, `requireAuth` czy `rateLimit`. Każdy
 * z 15 szablonów był publicznym, darmowym dla obcych, płatnym dla nas
 * wejściem do modelu językowego.
 *
 * Dołożone: `requireAuth` + `requirePermission('ai:use')` + `aiRateLimit`
 * + `jsonBodyLimit` + dzienny limit tokenów + zapis do `ai_generations`.
 *
 * Uwaga o kształcie odpowiedzi: ten router celowo NIE został przełożony na
 * kopertę `ok()/fail()`. Konsumuje go istniejący kod panelu, który czyta
 * `{ ok, data, provider }` — zmiana kształtu przy okazji łatania luki
 * bezpieczeństwa zepsułaby panel i utrudniła ocenę, co właściwie naprawiono.
 * Ujednolicenie koperty należy do zadania A3 i ma własny commit.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { callStructuredModel } from '../ai/client'
import { AiProviderError, configFromEnv } from '../ai/providers'
import { renderPromptTemplate } from '../ai/json-schema'
import { ALL_PROMPTS, getPromptById } from '../ai/prompts'
import type { SupportedModel } from '../ai/prompts/types'
import type { AppEnv } from '../types/env'
import { requireAuth } from '../middleware/require-auth'
import { requirePermission, getAuth } from '../middleware/require-permission'
import { jsonBodyLimit } from '../middleware/body-limit'
import { aiRateLimit } from '../middleware/rate-limit'
import { recordAiUsage, checkAiBudget } from '../lib/ai/usage'

const aiRouter = new Hono<AppEnv>()

// Zalogowanie wymagane na całym routerze — nawet lista szablonów ujawnia
// zakres narzędzi redakcyjnych i strukturę promptów.
aiRouter.use('*', requireAuth, requirePermission('ai:use'))

const promptRequestValidator = validator('json', (value, c) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return c.json({ error: 'invalid_json_body' }, 400)
  }
  const payload = value as { variables?: Record<string, unknown>; overrideModel?: SupportedModel }
  if (payload.variables && (typeof payload.variables !== 'object' || Array.isArray(payload.variables))) {
    return c.json({ error: 'variables_must_be_object' }, 400)
  }
  return {
    variables: payload.variables || {},
    overrideModel: payload.overrideModel,
  }
})

const promptParamValidator = validator('param', (value, c) => {
  const id = String(value.id || '').trim()
  if (!id) return c.json({ error: 'prompt_id_required' }, 400)
  return { id }
})

aiRouter.get('/prompts', (c) =>
  c.json({
    total: ALL_PROMPTS.length,
    items: ALL_PROMPTS.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      model: prompt.model,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    })),
  })
)

/** Stan dziennego limitu tokenów — panel pokazuje pasek zużycia. */
aiRouter.get('/budget', async (c) => c.json({ ok: true, ...(await checkAiBudget(c as never)) }))

aiRouter.post(
  '/prompt/:id',
  aiRateLimit,
  jsonBodyLimit,
  promptParamValidator,
  promptRequestValidator,
  async (c) => {
  const { id } = c.req.valid('param')
  const { variables, overrideModel } = c.req.valid('json')
  const prompt = getPromptById(id)

  if (!prompt) return c.json({ error: 'prompt_not_found', id }, 404)

  const budget = await checkAiBudget(c as never)
  if (!budget.allowed) {
    return c.json(
      {
        error: 'dzienny_limit_wyczerpany',
        detail: `Dzienny limit ${budget.limit} tokenow zostal wyczerpany (${budget.used}).`,
        ...budget,
      },
      429,
    )
  }

  const auth = getAuth(c)
  const uid = auth?.sub ? Number(auth.sub) || null : null
  const started = Date.now()
  const model = overrideModel || prompt.model

  // FAZA 3 / AI1 — poprzednie sprawdzenie wiazalo nazwe modelu z konkretnym
  // kluczem: prompt oznaczony 'gpt-4o-mini' zwracal 503 „missing_openai_api_key"
  // nawet wtedy, gdy administrator poprawnie skonfigurowal dostawce zgodnego
  // z Anthropic. Nazwa modelu zapisana w definicji promptu blokowala dzialajaca
  // konfiguracje. Teraz o dostepnosci decyduje `configFromEnv()` — jedno
  // zrodlo prawdy dla calego projektu.
  if (!configFromEnv(c.env as never)) {
    return c.json({
      error: 'brak_konfiguracji_dostawcy',
      detail:
        'Nie skonfigurowano dostawcy modelu. Ustaw ANTHROPIC_API_KEY (z opcjonalnym ' +
        'ANTHROPIC_BASE_URL) albo OPENAI_API_KEY (z opcjonalnym OPENAI_BASE_URL), ' +
        'albo wlacz wiazanie Workers AI.',
      promptId: id,
    }, 503)
  }

  const userPrompt = renderPromptTemplate(prompt.userPromptTemplate, variables)

  try {
    const result = await callStructuredModel({
      bindings: c.env as never,
      model,
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      jsonSchema: prompt.jsonSchema,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    })

    // Zapis następuje NIEZALEŻNIE od wyniku walidacji schematu: dostawca
    // policzył tokeny także wtedy, gdy zwrócił JSON niezgodny ze schematem.
    // Pominięcie tego zapisu zaniżałoby zużycie dokładnie w przypadkach,
    // w których model zachowuje się najgorzej.
    await recordAiUsage(c as never, {
      userId: uid,
      provider: result.provider,
      model: result.model,
      action: `prompt:${id}`,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      ms: Date.now() - started,
      ok: result.validated,
      error: result.validated ? undefined : `schema_validation_failed: ${result.validationErrors.join('; ')}`,
    })

    if (!result.validated) {
      return c.json({
        error: 'schema_validation_failed',
        promptId: id,
        provider: result.provider,
        rawText: result.rawText,
        validationErrors: result.validationErrors,
      }, 502)
    }

    return c.json({
      ok: true,
      prompt: {
        id: prompt.id,
        name: prompt.name,
        model,
      },
      provider: result.provider,
      data: result.data,
      tokeny: result.usage,
      czasMs: Date.now() - started,
    })
  } catch (error) {
    await recordAiUsage(c as never, {
      userId: uid,
      provider: 'nieznany',
      model,
      action: `prompt:${id}`,
      inputTokens: 0,
      outputTokens: 0,
      ms: Date.now() - started,
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })

    // Blad dostawcy to nie blad promptu — 503 mowi „usluga niedostepna,
    // spróbuj ponownie", 502 sugerowaloby zla definicje promptu i wyslaloby
    // redaktora na poszukiwanie bledu tam, gdzie go nie ma.
    if (error instanceof AiProviderError) {
      const status = error.retryable ? 503 : 502
      return c.json({ error: error.code, detail: error.message, promptId: id }, status)
    }
    return c.json({
      error: 'prompt_execution_failed',
      detail: error instanceof Error ? error.message : 'Unknown AI error',
      promptId: id,
    }, 502)
  }
})

export default aiRouter
export { aiRouter }
