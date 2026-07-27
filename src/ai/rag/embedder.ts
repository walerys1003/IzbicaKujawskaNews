import type { AppBindings } from '../../types/cloudflare'

/**
 * FAZA 3 / AI1 + AI7 — wektory zanurzen dla wyszukiwania znaczeniowego.
 *
 * CO ZMIENIONO
 * ────────────
 * 1. Adres `https://api.openai.com/v1/embeddings` byl wpisany na stale, wiec
 *    dostawca zgodny z OpenAI pod innym adresem (Groq, vLLM, Ollama, wlasny
 *    serwer) nie mial jak zostac uzyty. Teraz adres bazowy pochodzi
 *    z `OPENAI_BASE_URL`, tak jak w `providers.ts`.
 *
 * 2. `localEmbedding()` — wektor liczony z kodow znakow tekstu:
 *
 *        const slot = (code * 31 + index * 17) % EMBEDDING_DIMENSION
 *        vector[slot] += ((code % 97) + 1) / 100
 *
 *    To NIE jest zanurzenie znaczeniowe. Odleglosc miedzy takimi wektorami
 *    zalezy od tego, jakie litery wystepuja w tekscie, a nie od tego, o czym
 *    tekst mowi. „remont ulicy Koscielnej" i „remont ulicy Koscielnej odwolany"
 *    wypadna blisko siebie, bo maja te same znaki — ale „awaria wodociagu"
 *    i „brak wody w kranach" beda daleko, mimo ze dotycza jednej sprawy.
 *
 *    Wyszukiwanie znaczeniowe zbudowane na tym daje wyniki wygladajace jak
 *    trafienia, ale dobrane po pisowni. W RAG (AI7) oznacza to kontekst
 *    nie na temat, podany modelowi jako zrodlo — czyli material do artykulu
 *    opartego na niezwiazanych dokumentach. Zachowujemy te funkcje WYLACZNIE
 *    jako awaryjne grupowanie po podobienstwie napisow i oznaczamy wynik
 *    `provider: 'brak-modelu'` oraz `semantic: false`, zeby wolant mial
 *    czym odrozniac jedno od drugiego.
 *
 *    Trasy RAG, ktore podaja kontekst modelowi, musza sprawdzac `semantic`
 *    i odmawiac, gdy jest `false` — patrz `src/routes/rag.ts`.
 */

export interface EmbeddingBatchResult {
  vectors: number[][]
  dimension: number
  provider: 'openai' | 'brak-modelu'
  /**
   * `true` tylko wtedy, gdy wektory pochodza z modelu zanurzen.
   * `false` oznacza zapasowe podobienstwo napisow — nie wolno na nim opierac
   * kontekstu przekazywanego modelowi jezykowemu.
   */
  semantic: boolean
}

const EMBEDDING_DIMENSION = 1536
const DEFAULT_OPENAI_BASE = 'https://api.openai.com'

const trimUrl = (url: string) => url.replace(/\/+$/, '').replace(/\/v1$/, '')

const normalize = (vector: number[]) => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map(value => value / norm)
}

/** Zapasowe podobienstwo NAPISOW — nie znaczen. Patrz naglowek pliku, punkt 2. */
const lexicalVector = (text: string): number[] => {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0)
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index)
    const slot = (code * 31 + index * 17) % EMBEDDING_DIMENSION
    vector[slot] += ((code % 97) + 1) / 100
  }
  return normalize(vector)
}

export const createEmbeddings = async (
  bindings: AppBindings,
  texts: string[],
  batchSize = 16,
): Promise<EmbeddingBatchResult> => {
  if (!texts.length) {
    return { vectors: [], dimension: EMBEDDING_DIMENSION, provider: 'brak-modelu', semantic: false }
  }

  const env = bindings as unknown as {
    OPENAI_API_KEY?: string
    OPENAI_BASE_URL?: string
    AI_EMBEDDING_MODEL?: string
  }

  if (!env.OPENAI_API_KEY) {
    return {
      vectors: texts.map(lexicalVector),
      dimension: EMBEDDING_DIMENSION,
      provider: 'brak-modelu',
      semantic: false,
    }
  }

  const base = trimUrl(env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE)
  const model = env.AI_EMBEDDING_MODEL || 'text-embedding-3-small'

  const vectors: number[][] = []
  for (let offset = 0; offset < texts.length; offset += batchSize) {
    const batch = texts.slice(offset, offset + batchSize)
    const response = await fetch(`${base}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, input: batch }),
    })
    const payload = (await response.json()) as {
      data?: Array<{ embedding: number[] }>
      error?: { message?: string }
    }
    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message || 'Nie udalo sie policzyc zanurzen.')
    }
    payload.data.forEach(item => vectors.push(item.embedding))
  }

  return {
    vectors,
    dimension: vectors[0]?.length ?? EMBEDDING_DIMENSION,
    provider: 'openai',
    semantic: true,
  }
}
