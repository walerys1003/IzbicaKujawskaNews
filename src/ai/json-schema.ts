import type { JsonSchema } from './prompts/types'

export interface SchemaValidationResult {
  valid: boolean
  errors: string[]
}

export const validateAgainstSchema = (value: unknown, schema: JsonSchema, path = '$'): SchemaValidationResult => {
  const errors: string[] = []
  const walk = (input: unknown, current: JsonSchema, currentPath: string) => {
    if (current.type === 'object') {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        errors.push(`${currentPath} should be an object`)
        return
      }
      const record = input as Record<string, unknown>
      for (const key of current.required || []) {
        if (!(key in record)) errors.push(`${currentPath}.${key} is required`)
      }
      for (const [key, child] of Object.entries(current.properties || {})) {
        if (key in record) walk(record[key], child, `${currentPath}.${key}`)
      }
      if (current.additionalProperties === false) {
        for (const key of Object.keys(record)) {
          if (!current.properties?.[key]) errors.push(`${currentPath}.${key} is not allowed`)
        }
      }
      return
    }

    if (current.type === 'array') {
      if (!Array.isArray(input)) {
        errors.push(`${currentPath} should be an array`)
        return
      }
      if (typeof current.minItems === 'number' && input.length < current.minItems) errors.push(`${currentPath} should contain at least ${current.minItems} items`)
      if (typeof current.maxItems === 'number' && input.length > current.maxItems) errors.push(`${currentPath} should contain at most ${current.maxItems} items`)
      if (current.items) input.forEach((item, index) => walk(item, current.items as JsonSchema, `${currentPath}[${index}]`))
      return
    }

    if (current.type === 'string') {
      if (typeof input !== 'string') {
        errors.push(`${currentPath} should be a string`)
        return
      }
      if (current.enum && !current.enum.includes(input)) errors.push(`${currentPath} should be one of: ${current.enum.join(', ')}`)
      return
    }

    if (current.type === 'boolean') {
      if (typeof input !== 'boolean') errors.push(`${currentPath} should be a boolean`)
      return
    }

    if (current.type === 'number' || current.type === 'integer') {
      if (typeof input !== 'number' || Number.isNaN(input)) {
        errors.push(`${currentPath} should be a number`)
        return
      }
      if (current.type === 'integer' && !Number.isInteger(input)) errors.push(`${currentPath} should be an integer`)
      if (typeof current.minimum === 'number' && input < current.minimum) errors.push(`${currentPath} should be >= ${current.minimum}`)
      if (typeof current.maximum === 'number' && input > current.maximum) errors.push(`${currentPath} should be <= ${current.maximum}`)
    }
  }

  walk(value, schema, path)
  return { valid: errors.length === 0, errors }
}

export const extractJsonFromText = (text: string): unknown => {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const objectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (objectMatch) return JSON.parse(objectMatch[0])
    const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
    if (arrayMatch) return JSON.parse(arrayMatch[0])
    throw new Error('Model response did not contain valid JSON')
  }
}

export const renderPromptTemplate = (template: string, variables: Record<string, unknown>) =>
  template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => String(variables[key] ?? ''))

export const createSchemaExample = (schema: JsonSchema): unknown => {
  if (schema.type === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(schema.properties || {})) result[key] = createSchemaExample(child)
    return result
  }
  if (schema.type === 'array') return schema.items ? [createSchemaExample(schema.items)] : []
  if (schema.type === 'string') return schema.enum?.[0] ?? ''
  if (schema.type === 'boolean') return false
  return 0
}
