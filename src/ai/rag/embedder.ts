import type { AppBindings } from '../../types/cloudflare'

export interface EmbeddingBatchResult {
  vectors: number[][]
  dimension: number
  provider: 'openai' | 'local-fallback'
}

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_DIMENSION = 1536

const normalize = (vector: number[]) => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map(value => value / norm)
}

const localEmbedding = (text: string): number[] => {
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0)
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index)
    const slot = (code * 31 + index * 17) % EMBEDDING_DIMENSION
    vector[slot] += ((code % 97) + 1) / 100
  }
  return normalize(vector)
}

export const createEmbeddings = async (bindings: AppBindings, texts: string[], batchSize = 16): Promise<EmbeddingBatchResult> => {
  if (!texts.length) return { vectors: [], dimension: EMBEDDING_DIMENSION, provider: 'local-fallback' }

  if (!bindings.OPENAI_API_KEY) {
    return {
      vectors: texts.map(localEmbedding),
      dimension: EMBEDDING_DIMENSION,
      provider: 'local-fallback',
    }
  }

  const vectors: number[][] = []
  for (let offset = 0; offset < texts.length; offset += batchSize) {
    const batch = texts.slice(offset, offset + batchSize)
    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bindings.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
      }),
    })
    const payload = await response.json() as { data?: Array<{ embedding: number[] }>; error?: { message?: string } }
    if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Embedding request failed')
    payload.data.forEach(item => vectors.push(item.embedding))
  }

  return { vectors, dimension: EMBEDDING_DIMENSION, provider: 'openai' }
}
