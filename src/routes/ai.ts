import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { callStructuredModel } from '../ai/client'
import { renderPromptTemplate } from '../ai/json-schema'
import { ALL_PROMPTS, getPromptById } from '../ai/prompts'
import type { SupportedModel } from '../ai/prompts/types'
import type { AppBindings } from '../types/cloudflare'

type AppEnv = { Bindings: AppBindings }

const aiRouter = new Hono<AppEnv>()

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

aiRouter.post('/prompt/:id', promptParamValidator, promptRequestValidator, async (c) => {
  const { id } = c.req.valid('param')
  const { variables, overrideModel } = c.req.valid('json')
  const prompt = getPromptById(id)

  if (!prompt) return c.json({ error: 'prompt_not_found', id }, 404)

  const model = overrideModel || prompt.model
  if (model === 'gpt-4o-mini' && !c.env.OPENAI_API_KEY) {
    return c.json({ error: 'missing_openai_api_key', promptId: id }, 503)
  }
  if (model === 'claude-3-5-sonnet' && !c.env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'missing_anthropic_api_key', promptId: id }, 503)
  }

  const userPrompt = renderPromptTemplate(prompt.userPromptTemplate, variables)

  try {
    const result = await callStructuredModel({
      bindings: c.env,
      model,
      systemPrompt: prompt.systemPrompt,
      userPrompt,
      jsonSchema: prompt.jsonSchema,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
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
    })
  } catch (error) {
    return c.json({
      error: 'prompt_execution_failed',
      detail: error instanceof Error ? error.message : 'Unknown AI error',
      promptId: id,
    }, 502)
  }
})

export default aiRouter
