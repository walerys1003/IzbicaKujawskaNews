import type { AppBindings } from '../types/cloudflare'
import type { JsonSchema, SupportedModel } from './prompts/types'
import { createSchemaExample, extractJsonFromText, validateAgainstSchema } from './json-schema'

interface StructuredRequest {
  bindings: AppBindings
  model: SupportedModel
  systemPrompt: string
  userPrompt: string
  jsonSchema: JsonSchema
  temperature?: number
  maxTokens?: number
}

interface StructuredResponse {
  provider: 'openai' | 'anthropic' | 'fallback'
  data: unknown
  rawText: string
  validated: boolean
  validationErrors: string[]
}

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'

const schemaPrompt = (schema: JsonSchema) => `Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}`

export const callStructuredModel = async (request: StructuredRequest): Promise<StructuredResponse> => {
  const { bindings, model, systemPrompt, userPrompt, jsonSchema, temperature = 0.2, maxTokens = 900 } = request
  const wantAnthropic = model === 'claude-3-5-sonnet'

  if (wantAnthropic && bindings.ANTHROPIC_API_KEY) {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': bindings.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature,
        system: `${systemPrompt}\n\n${schemaPrompt(jsonSchema)}`,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const payload = await response.json() as { content?: Array<{ text?: string }>; error?: { message?: string } }
    if (!response.ok) throw new Error(payload.error?.message || 'Anthropic request failed')
    const rawText = payload.content?.map(item => item.text || '').join('\n') || '{}'
    const data = extractJsonFromText(rawText)
    const validation = validateAgainstSchema(data, jsonSchema)
    return { provider: 'anthropic', data, rawText, validated: validation.valid, validationErrors: validation.errors }
  }

  if (!wantAnthropic && bindings.OPENAI_API_KEY) {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bindings.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${schemaPrompt(jsonSchema)}` },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
    if (!response.ok) throw new Error(payload.error?.message || 'OpenAI request failed')
    const rawText = payload.choices?.[0]?.message?.content || '{}'
    const data = extractJsonFromText(rawText)
    const validation = validateAgainstSchema(data, jsonSchema)
    return { provider: 'openai', data, rawText, validated: validation.valid, validationErrors: validation.errors }
  }

  const data = createSchemaExample(jsonSchema)
  const validation = validateAgainstSchema(data, jsonSchema)
  return {
    provider: 'fallback',
    data,
    rawText: JSON.stringify(data),
    validated: validation.valid,
    validationErrors: validation.errors,
  }
}

export const callTextModel = async (bindings: AppBindings, prompt: string, systemPrompt: string, maxTokens = 700): Promise<string> => {
  if (bindings.OPENAI_API_KEY) {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bindings.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    })
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    return payload.choices?.[0]?.message?.content || ''
  }
  return ''
}
