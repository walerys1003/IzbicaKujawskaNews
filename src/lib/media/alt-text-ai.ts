import { callTextModel } from '../../ai/client'
import type { Bindings } from '../../types/env'

const fallbackFromFilename = (filename: string) => filename
  .replace(/\.[a-z0-9]+$/i, '')
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export const generateAltText = async (env: Bindings, filename: string, context = ''): Promise<string> => {
  const fallback = fallbackFromFilename(filename) || 'Zdjęcie do artykułu lokalnego'
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) return fallback
  const prompt = `Wygeneruj krótki, konkretny alt text po polsku dla zdjęcia. Nazwa pliku: ${filename}. Kontekst: ${context || 'portal lokalny, Izbica Kujawska'}. Maksymalnie 16 słów.`
  const text = await callTextModel(env as never, prompt, 'Jesteś redaktorem dostępności WCAG dla lokalnego portalu informacyjnego.', 80)
  return text.replace(/^"|"$/g, '').trim() || fallback
}
