import { callTextModelOrNull } from '../../ai/client'
import type { Bindings } from '../../types/env'

/**
 * Opis alternatywny zdjecia (WCAG).
 *
 * Wartosc zastepcza jest tu dopuszczalna, bo NIE jest wymyslona: powstaje
 * z nazwy pliku, ktora nadal redaktor. „remont-ulicy-koscielnej.jpg" daje
 * „remont ulicy koscielnej" — to informacja pochodzaca od czlowieka, tylko
 * inaczej sformatowana. Rozni sie to od generowania tresci ze schematu JSON,
 * gdzie zadne slowo nie mialo zrodla.
 *
 * Sprawdzanie kluczy przez `env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY`
 * zostalo usuniete: pomijalo dostawce pod wlasnym adresem i Workers AI,
 * a wiec przy poprawnie skonfigurowanym modelu funkcja i tak zwracalaby
 * nazwe pliku. Teraz decyzje podejmuje `configFromEnv()` — jedno miejsce
 * dla calego projektu.
 */

const fallbackFromFilename = (filename: string) => filename
  .replace(/\.[a-z0-9]+$/i, '')
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export const generateAltText = async (env: Bindings, filename: string, context = ''): Promise<string> => {
  const fallback = fallbackFromFilename(filename) || 'Zdjęcie do artykułu lokalnego'
  const prompt = `Wygeneruj krótki, konkretny alt text po polsku dla zdjęcia. Nazwa pliku: ${filename}. Kontekst: ${context || 'portal lokalny, Izbica Kujawska'}. Maksymalnie 16 słów.`

  let text: string | null = null
  try {
    text = await callTextModelOrNull(
      env as never,
      prompt,
      'Jesteś redaktorem dostępności WCAG dla lokalnego portalu informacyjnego.',
      80,
    )
  } catch {
    // Blad dostawcy nie moze zatrzymac wgrywania zdjecia — opis da sie
    // uzupelnic pozniej, a zablokowany upload oznacza brak ilustracji
    // w gotowym artykule.
    text = null
  }

  return (text ?? '').replace(/^"|"$/g, '').trim() || fallback
}
