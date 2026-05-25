export type SupportedModel = 'gpt-4o-mini' | 'claude-3-5-sonnet'

export type JsonSchema = {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean'
  description?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: string[]
  minItems?: number
  maxItems?: number
  minimum?: number
  maximum?: number
  additionalProperties?: boolean
}

export interface PromptDefinition {
  id: string
  name: string
  systemPrompt: string
  userPromptTemplate: string
  jsonSchema: JsonSchema
  model: SupportedModel
  temperature: number
  maxTokens: number
}

export const definePrompt = (prompt: PromptDefinition) => prompt
