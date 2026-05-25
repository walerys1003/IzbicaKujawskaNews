import type { AppBindings } from '../../types/cloudflare'

export interface RagDocumentInput {
  slug: string
  title: string
  content: string
  category: string
  source?: string
}

export interface RagChunkMatch {
  id: string
  slug: string
  title: string
  category: string
  chunkIndex: number
  content: string
  score: number
}

export const chunkText = (text: string, maxChars = 650) => {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const sentences = clean.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > maxChars && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = `${current} ${sentence}`.trim()
    }
  }
  if (current) chunks.push(current.trim())
  return chunks.length ? chunks : [clean.slice(0, maxChars)]
}

export const cosineSimilarity = (left: number[], right: number[]) => {
  const limit = Math.min(left.length, right.length)
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < limit; index++) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }
  const denom = Math.sqrt(leftNorm) * Math.sqrt(rightNorm)
  return denom ? dot / denom : 0
}

const vectorToBlob = (vector: number[]) => new Float32Array(vector).buffer

const blobToVector = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.map(Number)
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as number[]
    } catch {
      return []
    }
  }
  if (value instanceof ArrayBuffer) return Array.from(new Float32Array(value))
  if (value instanceof Uint8Array) return Array.from(new Float32Array(value.buffer))
  if (typeof value === 'object' && value && 'buffer' in value) {
    const maybeBuffer = (value as { buffer?: ArrayBuffer }).buffer
    if (maybeBuffer) return Array.from(new Float32Array(maybeBuffer))
  }
  return []
}

export class RagVectorStore {
  constructor(private readonly bindings: AppBindings) {}

  async upsertDocumentEmbeddings(document: RagDocumentInput, chunks: string[], embeddings: number[][]) {
    const db = this.bindings.DB
    await db.prepare(
      `INSERT INTO rag_documents (slug, title, category, content, source, chunk_count, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(slug) DO UPDATE SET
         title=excluded.title,
         category=excluded.category,
         content=excluded.content,
         source=excluded.source,
         chunk_count=excluded.chunk_count,
         updated_at=CURRENT_TIMESTAMP`
    ).bind(document.slug, document.title, document.category, document.content, document.source || 'api', chunks.length).run()

    await db.prepare('DELETE FROM embeddings WHERE slug = ?').bind(document.slug).run()

    const statements = chunks.map((chunk, index) =>
      db.prepare(
        `INSERT INTO embeddings (id, slug, title, category, chunk_index, content_chunk, embedding, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(
        `${document.slug}::${index}`,
        document.slug,
        document.title,
        document.category,
        index,
        chunk,
        vectorToBlob(embeddings[index]),
        JSON.stringify({ slug: document.slug, title: document.title, category: document.category, chunkIndex: index, content: chunk }),
      )
    )

    if (statements.length) await db.batch(statements)

    if (this.bindings.VECTORIZE_INDEX) {
      await this.bindings.VECTORIZE_INDEX.upsert(
        embeddings.map((values, index) => ({
          id: `${document.slug}::${index}`,
          values,
          metadata: { slug: document.slug, title: document.title, category: document.category, chunkIndex: index, content: chunks[index] },
        }))
      )
    }

    return { ok: true, slug: document.slug, chunks: chunks.length }
  }

  async deleteDocument(slug: string) {
    const rows = await this.bindings.DB.prepare('SELECT id FROM embeddings WHERE slug = ?').bind(slug).all<{ id: string }>()
    await this.bindings.DB.prepare('DELETE FROM embeddings WHERE slug = ?').bind(slug).run()
    await this.bindings.DB.prepare('DELETE FROM rag_documents WHERE slug = ?').bind(slug).run()
    if (this.bindings.VECTORIZE_INDEX && rows.results.length) {
      await this.bindings.VECTORIZE_INDEX.deleteByIds(rows.results.map(row => row.id))
    }
    return { ok: true, slug, deletedChunks: rows.results.length }
  }

  async search(queryVector: number[], topK: number, filterCategory?: string): Promise<RagChunkMatch[]> {
    if (this.bindings.VECTORIZE_INDEX) {
      const result = await this.bindings.VECTORIZE_INDEX.query(queryVector, {
        topK,
        returnMetadata: 'all',
        filter: filterCategory ? { category: filterCategory } : undefined,
      })
      return result.matches.map(match => ({
        id: match.id,
        slug: String(match.metadata?.slug || ''),
        title: String(match.metadata?.title || ''),
        category: String(match.metadata?.category || ''),
        chunkIndex: Number(match.metadata?.chunkIndex || 0),
        content: String(match.metadata?.content || ''),
        score: match.score,
      }))
    }

    const query = filterCategory
      ? 'SELECT id, slug, title, category, chunk_index, content_chunk, embedding FROM embeddings WHERE category = ?'
      : 'SELECT id, slug, title, category, chunk_index, content_chunk, embedding FROM embeddings'
    const rows = filterCategory
      ? await this.bindings.DB.prepare(query).bind(filterCategory).all<Record<string, unknown>>()
      : await this.bindings.DB.prepare(query).all<Record<string, unknown>>()

    return rows.results
      .map(row => ({
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title),
        category: String(row.category),
        chunkIndex: Number(row.chunk_index),
        content: String(row.content_chunk),
        score: cosineSimilarity(queryVector, blobToVector(row.embedding)),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK)
  }

  async getDocument(slug: string) {
    return this.bindings.DB.prepare('SELECT slug, title, category, content, source, chunk_count, updated_at FROM rag_documents WHERE slug = ?').bind(slug).first<Record<string, unknown>>()
  }

  async getDocuments(slugs: string[]) {
    if (!slugs.length) return []
    const placeholders = slugs.map(() => '?').join(', ')
    const result = await this.bindings.DB.prepare(`SELECT slug, title, category, content, source, chunk_count, updated_at FROM rag_documents WHERE slug IN (${placeholders})`).bind(...slugs).all<Record<string, unknown>>()
    return result.results
  }

  async getChunksBySlug(slug: string) {
    const result = await this.bindings.DB.prepare('SELECT id, slug, title, category, chunk_index, content_chunk, embedding FROM embeddings WHERE slug = ? ORDER BY chunk_index ASC').bind(slug).all<Record<string, unknown>>()
    return result.results.map(row => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      category: String(row.category),
      chunkIndex: Number(row.chunk_index),
      content: String(row.content_chunk),
      vector: blobToVector(row.embedding),
    }))
  }

  async stats() {
    const documents = await this.bindings.DB.prepare('SELECT COUNT(*) as count FROM rag_documents').first<{ count: number }>()
    const chunks = await this.bindings.DB.prepare('SELECT COUNT(*) as count FROM embeddings').first<{ count: number }>()
    const categories = await this.bindings.DB.prepare('SELECT category, COUNT(*) as count FROM rag_documents GROUP BY category ORDER BY count DESC').all<{ category: string; count: number }>()
    return {
      documents: Number(documents?.count || 0),
      chunks: Number(chunks?.count || 0),
      categories: categories.results,
      vectorizeEnabled: Boolean(this.bindings.VECTORIZE_INDEX),
    }
  }

  async listTopics(limit = 10) {
    const result = await this.bindings.DB.prepare(
      `SELECT category, COUNT(*) as count, GROUP_CONCAT(title, ' • ') as titles
       FROM rag_documents
       GROUP BY category
       ORDER BY count DESC
       LIMIT ?`
    ).bind(limit).all<{ category: string; count: number; titles: string }>()
    return result.results
  }
}

export const mergeContext = (matches: Array<{ title: string; slug: string; category: string; content: string; score?: number }>) =>
  matches.map((match, index) => `[${index + 1}] ${match.title} (${match.category}, ${match.slug})\n${match.content}`).join('\n\n')
