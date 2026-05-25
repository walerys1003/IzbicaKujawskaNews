import { callTextModel } from '../../ai/client'
import type { Bindings } from '../../types/env'

export const transcribeAudio = async (env: Bindings, filename: string, context = '') => {
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) return `Transkrypcja robocza: ${filename}. ${context}`.trim()
  const prompt = `Przygotuj roboczą transkrypcję audio po polsku na podstawie metadanych pliku ${filename}. Kontekst: ${context || 'lokalny materiał audio'}. Jeśli nie masz audio, zwróć zwięzły placeholder redakcyjny.`
  return callTextModel(env as never, prompt, 'Jesteś systemem przygotowującym placeholder transkrypcji do CMS.', 180)
}
