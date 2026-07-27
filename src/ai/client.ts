/**
 * FAZA 3 / AI1 — warstwa zgodnosci: stare wywolania na nowym adapterze.
 *
 * CO USUNIETO I DLACZEGO
 * ──────────────────────
 * Poprzednia wersja tego pliku, przy braku klucza, konczyla sie tak:
 *
 *     const data = createSchemaExample(jsonSchema)
 *     return { provider: 'fallback', data, ... }
 *
 * `createSchemaExample()` buduje obiekt z SAMEGO SCHEMATU JSON — wypelnia pola
 * wartosciami przykladowymi. Dla schematu artykulu oznaczalo to gotowy tytul,
 * lead i akapity, w ktorych zadne slowo nie pochodzilo ani od modelu, ani od
 * czlowieka, ani z zadnego zrodla. Odpowiedz miala `ok: true` i poprawna
 * strukture, wiec panel redakcyjny pokazywal ja jak kazda inna.
 *
 * Dla portalu informacyjnego to nie „tryb zapasowy" — to fabrykowanie
 * materialu prasowego. Redaktor, ktory dostal taki wynik, nie mial sygnalu,
 * ze czyta wypelniacz. Wystarczylo, ze klucz wygasl albo nie zostal wgrany na
 * srodowisko produkcyjne, i portal zaczynal produkowac tresci o niczym —
 * z nazwami solectw i liczbami, ktore nie odnosza sie do rzeczywistosci.
 *
 * Teraz brak dostawcy podnosi `AiProviderError('brak_konfiguracji')`, a trasy
 * odpowiadaja HTTP 503. Lepiej, zeby funkcja nie zadzialala w sposob widoczny,
 * niz zadzialala w sposob niewidocznie zmyslony.
 *
 * Usunieto takze wpisane na stale adresy `api.openai.com` i `api.anthropic.com`
 * — teraz adres bazowy pochodzi z konfiguracji (`ANTHROPIC_BASE_URL`,
 * `OPENAI_BASE_URL`), wiec dziala dowolna usluga zgodna z tymi API.
 */

import type { AppBindings } from '../types/cloudflare'
import type { Bindings } from '../types/env'
import type { JsonSchema, SupportedModel } from './prompts/types'
import { extractJsonFromText, validateAgainstSchema } from './json-schema'
import { AiProviderError, complete, configFromEnv, type ProviderConfig } from './providers'

interface StructuredRequest {
  bindings: AppBindings
  /**
   * Zachowane dla zgodnosci ze `src/routes/ai.ts`. Nowy kod powinien
   * przekazywac `providerOverride`: nazwa modelu nie powinna decydowac
   * o wyborze dostawcy (patrz naglowek `providers.ts`, punkt 2).
   */
  model?: SupportedModel | string
  systemPrompt: string
  userPrompt: string
  jsonSchema: JsonSchema
  temperature?: number
  maxTokens?: number
  /** Jawne wskazanie dostawcy — pomija odgadywanie po nazwie modelu. */
  providerOverride?: Partial<ProviderConfig>
}

interface StructuredResponse {
  /** Nazwa uzytego dostawcy. Wartosci 'fallback' juz nie ma. */
  provider: string
  model: string
  data: unknown
  rawText: string
  validated: boolean
  validationErrors: string[]
  usage: { inputTokens: number; outputTokens: number }
}

const schemaPrompt = (schema: JsonSchema) =>
  `Zwroc WYLACZNIE poprawny JSON zgodny z tym schematem: ${JSON.stringify(schema)}`

/**
 * Mostek typow. `AppBindings` z Sandboxa 5 to wezszy zestaw pol niz `Bindings`,
 * ale `configFromEnv()` czyta z niego tylko klucze i adresy — a te wystepuja
 * w obu. Rzutowanie jest tu swiadome i ograniczone do jednego miejsca.
 */
const asBindings = (bindings: AppBindings): Bindings => bindings as unknown as Bindings

/**
 * Przelozenie starych nazw modeli na wskazanie dostawcy.
 *
 * `SupportedModel` mialo dwie wartosci ('gpt-4o-mini', 'claude-3-5-sonnet'),
 * ktore jednoczesnie oznaczaly model i dostawce. Utrzymujemy to tylko po to,
 * by istniejace wywolania nie zmienily zachowania; jesli konfiguracja wskazuje
 * innego dostawce, ma ona pierwszenstwo — inaczej klucz wpisany przez
 * administratora bylby ignorowany na rzecz nazwy zapisanej w kodzie.
 */
const overrideFromLegacyModel = (
  bindings: AppBindings,
  model: string | undefined,
): Partial<ProviderConfig> | undefined => {
  if (!model) return undefined
  const configured = configFromEnv(asBindings(bindings))
  if (configured) return undefined

  if (model.startsWith('claude') && bindings.ANTHROPIC_API_KEY) {
    return { kind: 'anthropic', model }
  }
  if (bindings.OPENAI_API_KEY) return { kind: 'openai-compatible', model }
  return undefined
}

export const callStructuredModel = async (request: StructuredRequest): Promise<StructuredResponse> => {
  const {
    bindings,
    model,
    systemPrompt,
    userPrompt,
    jsonSchema,
    temperature = 0.2,
    maxTokens = 900,
    providerOverride,
  } = request

  const override = providerOverride ?? overrideFromLegacyModel(bindings, model)

  // Brak dostawcy -> wyjatek. Ta jedna linia zastepuje cala galaz 'fallback'.
  const result = await complete(
    asBindings(bindings),
    {
      system: `${systemPrompt}\n\n${schemaPrompt(jsonSchema)}`,
      messages: [{ role: 'user', content: userPrompt }],
      temperature,
      maxTokens,
      json: true,
    },
    override,
  )

  const data = extractJsonFromText(result.text)
  const validation = validateAgainstSchema(data, jsonSchema)

  return {
    provider: result.provider,
    model: result.model,
    data,
    rawText: result.text,
    validated: validation.valid,
    validationErrors: validation.errors,
    usage: result.usage,
  }
}

/**
 * Wywolanie tekstowe.
 *
 * Poprzednia wersja przy braku klucza zwracala pusty napis. Wolanci pisali
 * wtedy `aiText || wartoscZastepcza`, wiec brak dostawcy byl nieodrozninalny
 * od modelu, ktory nie mial nic do powiedzenia — i nikt sie nie dowiadywal,
 * ze konfiguracja jest niepelna. Teraz jest wyjatek, ktory da sie zobaczyc
 * w odpowiedzi HTTP i w rejestrze bledow.
 */
export const callTextModel = async (
  bindings: AppBindings,
  prompt: string,
  systemPrompt: string,
  maxTokens = 700,
): Promise<string> => {
  const result = await complete(asBindings(bindings), {
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    maxTokens,
  })
  return result.text
}

/**
 * Wariant dla miejsc, w ktorych brak dostawcy ma dawac wynik zastepczy
 * WYLICZONY Z DANYCH (np. streszczenie zlozone z tytulow rzeczywistych
 * dokumentow), a nie zmyslony przez schemat.
 *
 * Zwraca `null` przy braku konfiguracji — wolant sam decyduje, co pokazac,
 * i musi to zrobic jawnie. Rozne od starego `''`, ktore ginelo w `||`.
 */
export const callTextModelOrNull = async (
  bindings: AppBindings,
  prompt: string,
  systemPrompt: string,
  maxTokens = 700,
): Promise<string | null> => {
  try {
    return await callTextModel(bindings, prompt, systemPrompt, maxTokens)
  } catch (error) {
    if (error instanceof AiProviderError && error.code === 'brak_konfiguracji') return null
    throw error
  }
}

export { AiProviderError }
