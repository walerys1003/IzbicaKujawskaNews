/**
 * FAZA 3 / AI1 — uniwersalny adapter dostawcow modeli.
 *
 * Co bylo nie tak z poprzednim `src/ai/client.ts`
 * ────────────────────────────────────────────────
 * 1. Adresy `https://api.openai.com` i `https://api.anthropic.com` byly
 *    wpisane na stale. Klucz do dostawcy zgodnego z API Anthropic, ale pod
 *    innym adresem (np. `https://code.apipod.ai`, Groq, OpenRouter, Ollama,
 *    vLLM) nie mial jak zostac uzyty — nie bylo miejsca, w ktore da sie
 *    wlozyc adres bazowy.
 *
 * 2. `SupportedModel` mialo DWIE wartosci: 'gpt-4o-mini' i 'claude-3-5-sonnet'.
 *    Nazwa modelu byla jednoczesnie wyborem dostawcy, wiec uzycie innego
 *    modelu tego samego dostawcy wymagalo zmiany kodu.
 *
 * 3. NAJPOWAZNIEJSZE: przy braku klucza funkcja zwracala
 *    `provider: 'fallback'` i dane z `createSchemaExample(jsonSchema)` —
 *    czyli WYMYSLONE tresci wygenerowane ze schematu JSON. Dla portalu
 *    informacyjnego to nie „tryb zapasowy”, to fabrykowanie materialu
 *    prasowego. Redaktor dostawal wypelniony artykul i nie mial sygnalu,
 *    ze zadne slowo w nim nie pochodzi od modelu ani od czlowieka.
 *    Audyt zapisal to jako wymog: brak dostawcy musi dawac HTTP 503
 *    z jasnym komunikatem, nigdy udawanej odpowiedzi.
 *
 * Konstrukcja: JEDEN interfejs `ProviderAdapter`, trzy implementacje
 * (`anthropic`, `openai-compatible`, `workers-ai`). Wybor dostawcy jest
 * niezalezny od nazwy modelu, a adres bazowy zawsze pochodzi z konfiguracji.
 */

import type { Bindings } from '../types/env'

// ─────────────────────────────────────────────────────────────────────────────
// Typy wspolne
// ─────────────────────────────────────────────────────────────────────────────

export const PROVIDER_KINDS = ['anthropic', 'openai-compatible', 'workers-ai'] as const
export type ProviderKind = (typeof PROVIDER_KINDS)[number]

/**
 * Znane ustawienia gotowe. Nie ograniczaja wyboru — sluza tylko do
 * podpowiedzi w panelu (AI2), zeby administrator nie musial pamietac
 * adresow. Kazdy z nich mowi API zgodnym z OpenAI albo z Anthropic.
 */
export const PROVIDER_PRESETS: Record<
  string,
  { label: string; kind: ProviderKind; baseUrl: string; exampleModel: string }
> = {
  openai: {
    label: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com',
    exampleModel: 'gpt-4o-mini',
  },
  anthropic: {
    label: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    exampleModel: 'claude-sonnet-4-20250514',
  },
  groq: {
    label: 'Groq',
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai',
    exampleModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    label: 'OpenRouter',
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api',
    exampleModel: 'anthropic/claude-3.5-sonnet',
  },
  together: {
    label: 'Together AI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.together.xyz',
    exampleModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  mistral: {
    label: 'Mistral',
    kind: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai',
    exampleModel: 'mistral-large-latest',
  },
  ollama: {
    label: 'Ollama (wlasny serwer)',
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:11434',
    exampleModel: 'llama3.1',
  },
  vllm: {
    label: 'vLLM (wlasny serwer)',
    kind: 'openai-compatible',
    baseUrl: 'http://localhost:8000',
    exampleModel: 'meta-llama/Llama-3.1-8B-Instruct',
  },
  'workers-ai': {
    label: 'Cloudflare Workers AI',
    kind: 'workers-ai',
    baseUrl: '',
    exampleModel: '@cf/meta/llama-3.1-8b-instruct',
  },
}

export interface ProviderConfig {
  kind: ProviderKind
  /** Adres bazowy BEZ sciezki koncowej, np. `https://code.apipod.ai`. */
  baseUrl: string
  apiKey: string
  model: string
  /** Nazwa profilu do wyswietlenia w panelu i w dzienniku kosztow. */
  label?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  system?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  /** Wymuszenie odpowiedzi w JSON — obslugiwane roznie u roznych dostawcow. */
  json?: boolean
  signal?: AbortSignal
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface CompletionResult {
  text: string
  usage: TokenUsage
  model: string
  provider: ProviderKind
}

/** Blad dostawcy z kodem nadajacym sie na odpowiedz HTTP. */
export class AiProviderError extends Error {
  constructor(
    public readonly code:
      | 'brak_konfiguracji'
      | 'blad_uwierzytelnienia'
      | 'limit_dostawcy'
      | 'przerwano'
      | 'przekroczono_czas'
      | 'blad_dostawcy'
      | 'pusta_odpowiedz',
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message)
    this.name = 'AiProviderError'
  }
}

export interface ProviderAdapter {
  kind: ProviderKind
  complete(config: ProviderConfig, request: CompletionRequest, env: Bindings): Promise<CompletionResult>
  /** Strumien fragmentow tekstu (AI8). */
  stream(
    config: ProviderConfig,
    request: CompletionRequest,
    env: Bindings,
  ): AsyncGenerator<{ delta?: string; usage?: TokenUsage; done?: boolean }, void, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Pomocnicze
// ─────────────────────────────────────────────────────────────────────────────

const trimUrl = (url: string) => url.replace(/\/+$/, '')

/**
 * Limit czasu. Bez niego zawieszony dostawca trzymalby zadanie do wyczerpania
 * limitu Workera, a redaktor patrzylby na kreciolka bez informacji, co sie
 * dzieje. 60 s to wartosc z audytu (AI12).
 */
export const DEFAULT_TIMEOUT_MS = 60_000

const withTimeout = (external: AbortSignal | undefined, ms: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('przekroczono_czas')), ms)
  if (external) {
    if (external.aborted) controller.abort(new Error('przerwano'))
    else external.addEventListener('abort', () => controller.abort(new Error('przerwano')), { once: true })
  }
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}

/**
 * Tlumaczenie bledu HTTP dostawcy na kod domenowy. Rozroznienie
 * „da sie ponowic” od „nie da sie” jest kluczowe dla AI12: ponawianie
 * bledu 401 w petli tylko zuzywa czas i zaciemnia prawdziwa przyczyne.
 */
const classify = (status: number, body: string): AiProviderError => {
  if (status === 401 || status === 403) {
    return new AiProviderError('blad_uwierzytelnienia', 'Dostawca odrzucil klucz API.', status, false)
  }
  if (status === 429) {
    return new AiProviderError('limit_dostawcy', 'Dostawca chwilowo ogranicza tempo zapytan.', status, true)
  }
  if (status >= 500) {
    return new AiProviderError('blad_dostawcy', `Dostawca zwrocil blad ${status}.`, status, true)
  }
  return new AiProviderError('blad_dostawcy', `Dostawca odrzucil zapytanie (${status}): ${body.slice(0, 300)}`, status, false)
}

const readError = async (response: Response): Promise<never> => {
  const body = await response.text().catch(() => '')
  throw classify(response.status, body)
}

/** Iterator linii z odpowiedzi SSE — wspolny dla obu formatow strumienia. */
async function* sseLines(response: Response): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader()
  if (!reader) throw new AiProviderError('pusta_odpowiedz', 'Dostawca nie zwrocil strumienia.')
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    // Ostatni fragment moze byc niepelna linia — zostawiamy go w buforze.
    buffer = parts.pop() ?? ''
    for (const line of parts) yield line.trim()
  }
  if (buffer.trim()) yield buffer.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: Anthropic (i wszystko zgodne z jego API)
// ─────────────────────────────────────────────────────────────────────────────

interface AnthropicUsage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

/**
 * Scalanie rozliczenia z kolejnych zdarzen strumienia.
 *
 * Rozliczenie przychodzi w kawalkach i nie w ustalonym miejscu: `message_start`
 * moze podac tokeny wejsciowe albo zera, a `message_delta` na koncu podaje
 * pelne wartosci. Sprawdzony dostawca (code.apipod.ai) robi wlasnie to drugie.
 *
 * Zasada: kazda liczba wieksza od zera nadpisuje poprzednia, zero nie kasuje
 * odczytanej wartosci. Proste `usage.inputTokens = x ?? 0` byloby bledne w obie
 * strony — nadpisywaloby dobra wartosc zerem albo zatrzymywaloby zero z
 * pierwszego zdarzenia.
 *
 * Tokeny pamieci podrecznej (`cache_*`) doliczamy do wejscia, bo dostawca
 * nalicza za nie oplate osobno od `input_tokens`; pominiecie ich zanizaloby
 * rachunek przy dlugich, powtarzalnych podpowiedziach systemowych.
 */
const mergeUsage = (target: TokenUsage, incoming: AnthropicUsage | undefined): void => {
  if (!incoming) return
  const input =
    (incoming.input_tokens ?? 0) +
    (incoming.cache_creation_input_tokens ?? 0) +
    (incoming.cache_read_input_tokens ?? 0)
  if (input > 0) target.inputTokens = input
  if ((incoming.output_tokens ?? 0) > 0) target.outputTokens = incoming.output_tokens as number
}

const anthropicAdapter: ProviderAdapter = {
  kind: 'anthropic',

  async complete(config, request) {
    const { signal, clear } = withTimeout(request.signal, DEFAULT_TIMEOUT_MS)
    try {
      const response = await fetch(`${trimUrl(config.baseUrl)}/v1/messages`, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: request.maxTokens ?? 2000,
          temperature: request.temperature ?? 0.4,
          ...(request.system ? { system: request.system } : {}),
          messages: request.messages,
        }),
      })
      if (!response.ok) await readError(response)

      const payload = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>
        usage?: { input_tokens?: number; output_tokens?: number }
      }
      const text = (payload.content ?? [])
        .filter((p) => p.type === 'text' || p.text !== undefined)
        .map((p) => p.text ?? '')
        .join('')

      if (!text.trim()) throw new AiProviderError('pusta_odpowiedz', 'Model zwrocil pusta odpowiedz.')

      return {
        text,
        usage: {
          inputTokens: payload.usage?.input_tokens ?? 0,
          outputTokens: payload.usage?.output_tokens ?? 0,
        },
        model: config.model,
        provider: 'anthropic',
      }
    } catch (error) {
      throw normalizeThrown(error)
    } finally {
      clear()
    }
  },

  async *stream(config, request) {
    const { signal, clear } = withTimeout(request.signal, DEFAULT_TIMEOUT_MS)
    try {
      const response = await fetch(`${trimUrl(config.baseUrl)}/v1/messages`, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: request.maxTokens ?? 2000,
          temperature: request.temperature ?? 0.4,
          stream: true,
          ...(request.system ? { system: request.system } : {}),
          messages: request.messages,
        }),
      })
      if (!response.ok) await readError(response)

      const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 }

      for await (const line of sseLines(response)) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw || raw === '[DONE]') continue

        let event: Record<string, unknown>
        try {
          event = JSON.parse(raw) as Record<string, unknown>
        } catch {
          continue
        }

        const type = event.type as string | undefined
        if (type === 'content_block_delta') {
          const delta = event.delta as { text?: string } | undefined
          if (delta?.text) yield { delta: delta.text }
        } else if (type === 'message_start') {
          // Zdarzenie otwierajace CZESTO podaje input_tokens, ale nie zawsze:
          // sprawdzony dostawca (code.apipod.ai) wysyla tu zera i dopiero
          // `message_delta` zawiera prawdziwa liczbe. Dlatego to jest wartosc
          // wstepna, nadpisywalna ponizej — nigdy ostateczna.
          const msg = event.message as { usage?: AnthropicUsage } | undefined
          mergeUsage(usage, msg?.usage)
        } else if (type === 'message_delta') {
          // Zdarzenie zamykajace ma pierwszenstwo: to ono nosi rozliczenie
          // calego wywolania. Gdybysmy czytali wejscie tylko z `message_start`,
          // licznik kosztow (AI10) pokazywalby dla strumienia same tokeny
          // wyjsciowe. Przy generowaniu artykulu z kontekstem RAG (AI7)
          // wejscie jest zwykle WIEKSZE niz wyjscie, wiec limit dzienny
          // zliczalby ulamek faktycznego zuzycia i nie chronilby budzetu.
          mergeUsage(usage, event.usage as AnthropicUsage | undefined)
        } else if (type === 'error') {
          const err = event.error as { message?: string } | undefined
          throw new AiProviderError('blad_dostawcy', err?.message ?? 'Dostawca przerwal strumien.')
        }
      }

      yield { usage, done: true }
    } catch (error) {
      throw normalizeThrown(error)
    } finally {
      clear()
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: zgodny z OpenAI (OpenAI, Groq, OpenRouter, Together, Mistral, Ollama, vLLM)
// ─────────────────────────────────────────────────────────────────────────────

const openAiAdapter: ProviderAdapter = {
  kind: 'openai-compatible',

  async complete(config, request) {
    const { signal, clear } = withTimeout(request.signal, DEFAULT_TIMEOUT_MS)
    try {
      const response = await fetch(`${trimUrl(config.baseUrl)}/v1/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: request.temperature ?? 0.4,
          max_tokens: request.maxTokens ?? 2000,
          ...(request.json ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            ...(request.system ? [{ role: 'system', content: request.system }] : []),
            ...request.messages,
          ],
        }),
      })
      if (!response.ok) await readError(response)

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const text = payload.choices?.[0]?.message?.content ?? ''
      if (!text.trim()) throw new AiProviderError('pusta_odpowiedz', 'Model zwrocil pusta odpowiedz.')

      return {
        text,
        usage: {
          inputTokens: payload.usage?.prompt_tokens ?? 0,
          outputTokens: payload.usage?.completion_tokens ?? 0,
        },
        model: config.model,
        provider: 'openai-compatible',
      }
    } catch (error) {
      throw normalizeThrown(error)
    } finally {
      clear()
    }
  },

  async *stream(config, request) {
    const { signal, clear } = withTimeout(request.signal, DEFAULT_TIMEOUT_MS)
    try {
      const response = await fetch(`${trimUrl(config.baseUrl)}/v1/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: request.temperature ?? 0.4,
          max_tokens: request.maxTokens ?? 2000,
          stream: true,
          // Prosimy o rozliczenie tokenow w strumieniu. Nie wszyscy dostawcy
          // to obsluguja — dlatego licznik ma zapas w postaci szacowania
          // po stronie wolanta (AI10).
          stream_options: { include_usage: true },
          messages: [
            ...(request.system ? [{ role: 'system', content: request.system }] : []),
            ...request.messages,
          ],
        }),
      })
      if (!response.ok) await readError(response)

      const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 }

      for await (const line of sseLines(response)) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw) continue
        if (raw === '[DONE]') break

        let event: {
          choices?: Array<{ delta?: { content?: string } }>
          usage?: { prompt_tokens?: number; completion_tokens?: number }
        }
        try {
          event = JSON.parse(raw)
        } catch {
          continue
        }

        const delta = event.choices?.[0]?.delta?.content
        if (delta) yield { delta }
        if (event.usage) {
          // Tak samo jak w adapterze Anthropic: zero nie kasuje wartosci
          // odczytanej wczesniej. Czesc dostawcow zgodnych z OpenAI wysyla
          // `usage` z zerami w kazdym kawalku i wypelnia je tylko na koncu.
          if ((event.usage.prompt_tokens ?? 0) > 0) usage.inputTokens = event.usage.prompt_tokens as number
          if ((event.usage.completion_tokens ?? 0) > 0) {
            usage.outputTokens = event.usage.completion_tokens as number
          }
        }
      }

      yield { usage, done: true }
    } catch (error) {
      throw normalizeThrown(error)
    } finally {
      clear()
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: Workers AI (binding, nie HTTP)
// ─────────────────────────────────────────────────────────────────────────────

interface WorkersAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>
}

const workersAiAdapter: ProviderAdapter = {
  kind: 'workers-ai',

  async complete(config, request, env) {
    const ai = (env as unknown as { AI?: WorkersAiBinding }).AI
    if (!ai) {
      throw new AiProviderError(
        'brak_konfiguracji',
        'Workers AI nie jest podlaczone. Binding „AI” jest zakomentowany w wrangler.jsonc.',
      )
    }

    const result = (await ai.run(config.model, {
      messages: [
        ...(request.system ? [{ role: 'system', content: request.system }] : []),
        ...request.messages,
      ],
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.4,
    })) as { response?: string }

    const text = result?.response ?? ''
    if (!text.trim()) throw new AiProviderError('pusta_odpowiedz', 'Model zwrocil pusta odpowiedz.')

    return {
      text,
      // Workers AI nie raportuje tokenow w tym trybie. Zwracamy zera zamiast
      // szacunku, zeby licznik kosztow (AI10) nie podawal wymyslonych liczb
      // jako pomiaru — brak danych ma byc widoczny jako brak danych.
      usage: { inputTokens: 0, outputTokens: 0 },
      model: config.model,
      provider: 'workers-ai',
    }
  },

  async *stream(config, request, env) {
    // Strumieniowanie Workers AI wymaga innego trybu bindingu. Zamiast
    // udawac strumien, oddajemy calosc jednym fragmentem — panel dziala,
    // tylko bez efektu pisania na zywo.
    const result = await workersAiAdapter.complete(config, request, env)
    yield { delta: result.text }
    yield { usage: result.usage, done: true }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Wybor adaptera i konfiguracji
// ─────────────────────────────────────────────────────────────────────────────

const normalizeThrown = (error: unknown): AiProviderError => {
  if (error instanceof AiProviderError) return error
  if (error instanceof Error) {
    if (error.name === 'AbortError' || /przerwano/.test(error.message)) {
      return new AiProviderError('przerwano', 'Zapytanie zostalo przerwane.', undefined, false)
    }
    if (/przekroczono_czas|timeout/i.test(error.message)) {
      return new AiProviderError('przekroczono_czas', 'Dostawca nie odpowiedzial w ciagu 60 sekund.', undefined, true)
    }
    return new AiProviderError('blad_dostawcy', error.message, undefined, true)
  }
  return new AiProviderError('blad_dostawcy', 'Nieznany blad dostawcy.', undefined, true)
}

export const adapterFor = (kind: ProviderKind): ProviderAdapter => {
  if (kind === 'anthropic') return anthropicAdapter
  if (kind === 'workers-ai') return workersAiAdapter
  return openAiAdapter
}

/**
 * Konfiguracja ze zmiennych srodowiskowych.
 *
 * Zwraca `null`, gdy dostawcy nie da sie skonfigurowac. Wolant MUSI
 * potraktowac `null` jako HTTP 503 — i to jest cala roznica wobec starej
 * implementacji, ktora w tym miejscu produkowala zmyslona tresc.
 */
export const configFromEnv = (env: Bindings): ProviderConfig | null => {
  const e = env as unknown as Record<string, string | undefined>

  const preferred = e.AI_DEFAULT_PROVIDER
  const model = e.AI_DEFAULT_MODEL

  if (e.ANTHROPIC_API_KEY && (!preferred || preferred === 'anthropic')) {
    return {
      kind: 'anthropic',
      // Adres bazowy jest zmienna. To ta jedna linia decyduje o tym,
      // ze dostawca zgodny z Anthropic pod wlasnym adresem dziala.
      baseUrl: e.ANTHROPIC_BASE_URL || PROVIDER_PRESETS.anthropic.baseUrl,
      apiKey: e.ANTHROPIC_API_KEY,
      model: model || PROVIDER_PRESETS.anthropic.exampleModel,
      label: e.ANTHROPIC_BASE_URL ? `Anthropic-zgodny (${e.ANTHROPIC_BASE_URL})` : 'Anthropic',
    }
  }

  if (e.OPENAI_API_KEY) {
    return {
      kind: 'openai-compatible',
      baseUrl: e.OPENAI_BASE_URL || PROVIDER_PRESETS.openai.baseUrl,
      apiKey: e.OPENAI_API_KEY,
      model: model || PROVIDER_PRESETS.openai.exampleModel,
      label: e.OPENAI_BASE_URL ? `OpenAI-zgodny (${e.OPENAI_BASE_URL})` : 'OpenAI',
    }
  }

  if ((env as unknown as { AI?: unknown }).AI) {
    return {
      kind: 'workers-ai',
      baseUrl: '',
      apiKey: '',
      model: model || PROVIDER_PRESETS['workers-ai'].exampleModel,
      label: 'Cloudflare Workers AI',
    }
  }

  return null
}

/** Wywolanie z wybranym dostawca — jedno wejscie dla calej FAZY 3. */
export const complete = async (
  env: Bindings,
  request: CompletionRequest,
  override?: Partial<ProviderConfig>,
): Promise<CompletionResult> => {
  const base = configFromEnv(env)
  if (!base && !override?.apiKey) {
    throw new AiProviderError(
      'brak_konfiguracji',
      'Zaden dostawca modeli nie jest skonfigurowany. Wpisz klucz w panelu: Ustawienia → AI.',
    )
  }
  const config = { ...(base as ProviderConfig), ...override }
  return adapterFor(config.kind).complete(config, request, env)
}

export const streamCompletion = (
  env: Bindings,
  request: CompletionRequest,
  override?: Partial<ProviderConfig>,
) => {
  const base = configFromEnv(env)
  if (!base && !override?.apiKey) {
    throw new AiProviderError(
      'brak_konfiguracji',
      'Zaden dostawca modeli nie jest skonfigurowany. Wpisz klucz w panelu: Ustawienia → AI.',
    )
  }
  const config = { ...(base as ProviderConfig), ...override }
  return adapterFor(config.kind).stream(config, request, env)
}

/**
 * Test polaczenia dla panelu (AI2 — przycisk „Testuj”).
 * Zwraca wynik, a nie rzuca wyjatkiem: administrator ma zobaczyc komunikat,
 * co dokladnie jest nie tak, a nie stronę bledu.
 */
export const testConnection = async (
  env: Bindings,
  override?: Partial<ProviderConfig>,
): Promise<{
  ok: boolean
  dostawca?: string
  model?: string
  odpowiedz?: string
  tokeny?: TokenUsage
  czasMs?: number
  kod?: string
  komunikat?: string
}> => {
  const started = Date.now()
  try {
    const result = await complete(
      env,
      {
        system: 'Odpowiadasz wylacznie po polsku, maksymalnie zwiezle.',
        messages: [{ role: 'user', content: 'Odpowiedz dokladnie jednym slowem: dziala' }],
        maxTokens: 32,
        temperature: 0,
      },
      override,
    )
    return {
      ok: true,
      dostawca: result.provider,
      model: result.model,
      odpowiedz: result.text.trim().slice(0, 200),
      tokeny: result.usage,
      czasMs: Date.now() - started,
    }
  } catch (error) {
    const e = normalizeThrown(error)
    return { ok: false, kod: e.code, komunikat: e.message, czasMs: Date.now() - started }
  }
}

/** Podpowiedz klucza do panelu — nigdy nie zwracamy calego sekretu. */
export const keyHint = (key: string | undefined): string | null => {
  if (!key) return null
  if (key.length <= 10) return '…'
  return `${key.slice(0, 3)}…${key.slice(-4)}`
}
