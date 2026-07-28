/**
 * RAG — 19 tras nad archiwum portalu.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * NAPRAWA KRYTYCZNEJ LUKI Z AUDYTU 27.07.2026
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Cały router był otwarty. Konsekwencje wykraczały poza koszt tokenów:
 *
 *   • `POST /ingest/article` i `/ingest/bulk` — obcy mógł WSTRZYKNĄĆ dowolny
 *     dokument do indeksu, na którym opierają się odpowiedzi `/ask`
 *     i `/fact-check`. To zatrucie źródła, nie tylko rachunek.
 *   • `DELETE /document/:slug` — obcy mógł USUWAĆ dokumenty z indeksu.
 *   • `POST /reindex` — jedno żądanie przeliczające zanurzenia CAŁEGO archiwum;
 *     w pętli to najdroższy pojedynczy punkt w całym API.
 *
 * PODZIAŁ UPRAWNIEŃ — dlaczego dwa poziomy, a nie jeden
 * ──────────────────────────────────────────────────
 * Odczyt (`/search`, `/ask`, `/similar`, `/stats`) wymaga `ai:use` — ma go
 * autor, redaktor i administrator.
 * Zmiana indeksu (`/ingest/*`, `/document/:slug`, `/reindex`) wymaga
 * `ai:configure` — tylko administrator. Autor nie powinien móc przebudować
 * bazy wiedzy, na której opiera się weryfikacja faktów innych redaktorów.
 */

import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { ARTICLES } from '../data-articles'
import { callTextModelOrNull } from '../ai/client'
import { createEmbeddings } from '../ai/rag/embedder'
import { RagVectorStore, chunkText, cosineSimilarity, mergeContext } from '../ai/rag/vector-store'
import type { AppBindings } from '../types/cloudflare'
import { requireAuth } from '../middleware/require-auth'
import { requirePermission, getAuth } from '../middleware/require-permission'
import { jsonBodyLimit, articleBodyLimit } from '../middleware/body-limit'
import { aiRateLimit, rateLimit } from '../middleware/rate-limit'
import { recordAiUsage, checkAiBudget, estimateTokens } from '../lib/ai/usage'

type AppEnv = { Bindings: AppBindings }

type JsonRecord = Record<string, unknown>

type IngestPayload = {
  slug: string
  title: string
  content: string
  category: string
}

const ragRouter = new Hono<AppEnv>()

/**
 * Wspólny próg dla całego routera: zalogowanie + prawo do modeli + limit
 * częstości. Nakładamy go raz na `*`, a nie osobno na 19 tras — nowa trasa
 * dodana w przyszłości jest wtedy zabezpieczona domyślnie. Poprzedni stan
 * (żadnej ochrony) powstał dokładnie dlatego, że każda trasa miała
 * pamiętać o sobie sama.
 */
ragRouter.use('*', requireAuth, requirePermission('ai:use'), aiRateLimit)

/**
 * Przebudowa indeksu jest o dwa rzędy wielkości droższa od pojedynczego
 * zapytania (zanurzenia dla całego archiwum), więc ma własny, ostry limit:
 * 2 na godzinę. `aiRateLimit` (10/min) byłby tu bez znaczenia.
 */
const reindexRateLimit = rateLimit({ name: 'rag-reindex', limit: 2, windowMs: 3_600_000, perUser: true })

const asObject = (value: unknown): JsonRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null

const jsonValidator = validator('json', (value, c) => {
  const record = asObject(value)
  if (!record) return c.json({ error: 'invalid_json_body' }, 400)
  return record
})

const paramSlugValidator = validator('param', (value, c) => {
  const slug = String(value.slug || '').trim()
  if (!slug) return c.json({ error: 'slug_required' }, 400)
  return { slug }
})

const userIdParamValidator = validator('param', (value, c) => {
  const userId = String(value.userId || '').trim()
  if (!userId) return c.json({ error: 'user_id_required' }, 400)
  return { userId }
})

const ensureString = (record: JsonRecord, key: string, required = true) => {
  const value = record[key]
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!required) return ''
  throw new Error(`Field ${key} must be a non-empty string`)
}

const ensureNumber = (record: JsonRecord, key: string, fallback: number) => {
  const value = record[key]
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return fallback
}

const ensureStringArray = (record: JsonRecord, key: string) => {
  const value = record[key]
  if (!Array.isArray(value)) throw new Error(`Field ${key} must be an array`)
  return value.map(item => String(item)).filter(Boolean)
}

const topKValue = (value: number) => Math.min(Math.max(Math.floor(value || 5), 1), 25)

const articleToContent = (article: { lede?: string; body?: string[]; title: string }) =>
  [article.title, article.lede || '', ...(article.body || [])].join('\n\n')

const averageVector = (vectors: number[][]) => {
  if (!vectors.length) return [] as number[]
  const dimension = vectors[0].length
  const merged = new Array<number>(dimension).fill(0)
  for (const vector of vectors) {
    for (let index = 0; index < dimension; index++) merged[index] += vector[index]
  }
  return merged.map(value => value / vectors.length)
}

const uniqueBySlug = (matches: Array<{ slug: string; title: string; category: string; content: string; score: number }>) => {
  const seen = new Map<string, { slug: string; title: string; category: string; content: string; score: number }>()
  for (const match of matches) {
    const current = seen.get(match.slug)
    if (!current || match.score > current.score) seen.set(match.slug, match)
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}

const buildCitationList = (matches: Array<{ slug: string; title: string; score: number }>) =>
  matches.map(match => ({ slug: match.slug, title: match.title, score: Number(match.score.toFixed(4)) }))

const heuristicAnswer = (question: string, matches: Array<{ slug: string; title: string; content: string }>) => ({
  answer: matches.length
    ? `Na podstawie archiwum najbardziej związane z pytaniem „${question}” są materiały: ${matches.map(match => match.title).join('; ')}.`
    : `Brak wystarczającego kontekstu w archiwum dla pytania „${question}”.`,
})

const getStore = (c: { env: AppBindings }) => new RagVectorStore(c.env)

/**
 * Opakowanie wywołania modelu tekstowego zapisujące zużycie (AI10)
 * i sprawdzające dzienny limit.
 *
 * `callTextModelOrNull` zwraca sam tekst, bez liczników tokenów, więc
 * szacujemy je z długości — patrz uzasadnienie w `estimateTokens`.
 * Zwraca `null` również przy wyczerpanym limicie; wołant ma wtedy gotowy
 * wynik zastępczy wyliczony z danych, więc redaktor dostaje odpowiedź
 * opartą na archiwum zamiast błędu.
 */
const modelTekstowyZRejestrem = async (
  c: { env: AppBindings; get: (key: never) => unknown },
  akcja: string,
  prompt: string,
  systemPrompt: string,
  maxTokens = 700,
): Promise<string | null> => {
  const ctx = c as never
  const budget = await checkAiBudget(ctx)
  if (!budget.allowed) {
    console.warn(`[rag] ${akcja}: dzienny limit tokenow wyczerpany (${budget.used}/${budget.limit}) — uzyto wyniku zastepczego.`)
    return null
  }

  const auth = getAuth(ctx)
  const uid = auth?.sub ? Number(auth.sub) || null : null
  const env = c.env as unknown as { AI_DEFAULT_MODEL?: string; AI_DEFAULT_PROVIDER?: string }
  const started = Date.now()

  try {
    const text = await callTextModelOrNull(c.env, prompt, systemPrompt, maxTokens)
    // `null` = brak skonfigurowanego dostawcy: model nie został wywołany,
    // więc nie ma czego zapisywać. Zapis z zerami sugerowałby wywołanie.
    if (text === null) return null

    await recordAiUsage(ctx, {
      userId: uid,
      provider: env.AI_DEFAULT_PROVIDER || 'domyslny',
      model: env.AI_DEFAULT_MODEL || 'domyslny',
      action: `rag:${akcja}`,
      inputTokens: estimateTokens(`${systemPrompt}\n${prompt}`),
      outputTokens: estimateTokens(text),
      ms: Date.now() - started,
      ok: true,
    })
    return text
  } catch (error) {
    await recordAiUsage(ctx, {
      userId: uid,
      provider: env.AI_DEFAULT_PROVIDER || 'domyslny',
      model: env.AI_DEFAULT_MODEL || 'domyslny',
      action: `rag:${akcja}`,
      inputTokens: estimateTokens(`${systemPrompt}\n${prompt}`),
      outputTokens: 0,
      ms: Date.now() - started,
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })
    throw error
  }
}

/**
 * FAZA 3 / AI7 — straz jakosci wektorow.
 *
 * `createEmbeddings()` przy braku modelu zanurzen zwraca wektory policzone
 * z kodow znakow (`semantic: false`). Dobieraja one dokumenty po pisowni,
 * nie po znaczeniu — „awaria wodociagu" nie trafi do „brak wody w kranach",
 * a „remont ulicy" trafi do dowolnego tekstu o podobnym zestawie liter.
 *
 * Zwrocenie takich trafien jako listy do przejrzenia jest jeszcze uczciwe.
 * Ale podanie ich modelowi jako KONTEKSTU to co innego: model dostaje wtedy
 * dokumenty nie na temat, opisane jako zrodla, i buduje z nich odpowiedz.
 * Wynik wyglada na oparty na archiwum gminy, a jest oparty na przypadkowym
 * doborze. Dlatego trasy, ktore karmia model, musza tu odmowic.
 */
const wymagajZnaczeniowych = (
  embedding: { semantic: boolean; provider: string },
): { blad: string; szczegol: string } | null => {
  if (embedding.semantic) return null
  return {
    blad: 'brak_modelu_zanurzen',
    szczegol:
      'Wyszukiwanie znaczeniowe wymaga modelu zanurzen (OPENAI_API_KEY + OPENAI_BASE_URL). ' +
      'Bez niego dobor dokumentow opiera sie na podobienstwie napisow, wiec kontekst przekazany ' +
      'modelowi jezykowemu bylby niezwiazany z pytaniem. Odpowiedz nie zostala wygenerowana.',
  }
}

const ingestSingle = async (bindings: AppBindings, payload: IngestPayload) => {
  const store = new RagVectorStore(bindings)
  const chunks = chunkText(payload.content)
  const embeddingResult = await createEmbeddings(bindings, chunks)
  await store.upsertDocumentEmbeddings(payload, chunks, embeddingResult.vectors)
  return { slug: payload.slug, title: payload.title, category: payload.category, chunks: chunks.length, provider: embeddingResult.provider }
}

ragRouter.post('/ingest/article', requirePermission('ai:configure'), articleBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const payload: IngestPayload = {
      slug: ensureString(body, 'slug'),
      title: ensureString(body, 'title'),
      content: ensureString(body, 'content'),
      category: ensureString(body, 'category'),
    }
    const result = await ingestSingle(c.env, payload)
    return c.json({ ok: true, document: result })
  } catch (error) {
    return c.json({ error: 'ingest_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/ingest/bulk', requirePermission('ai:configure'), articleBodyLimit, validator('json', (value, c) => {
  if (!Array.isArray(value)) return c.json({ error: 'body_must_be_array' }, 400)
  // Górny limit partii: bez niego jedno żądanie z tysiącem dokumentów
  // przekracza limit czasu CPU Workera i kończy się indeksem w połowie
  // zapisanym — najgorszy możliwy stan bazy wiedzy.
  if (value.length > 50) {
    return c.json({ error: 'batch_too_large', detail: 'Maksymalnie 50 dokumentow w jednym zadaniu.', received: value.length }, 400)
  }
  return value as JsonRecord[]
}), async (c) => {
  try {
    const items = c.req.valid('json').map(item => ({
      slug: ensureString(item, 'slug'),
      title: ensureString(item, 'title'),
      content: ensureString(item, 'content'),
      category: ensureString(item, 'category'),
    }))
    const results = []
    for (const item of items) results.push(await ingestSingle(c.env, item))
    return c.json({ ok: true, total: results.length, items: results })
  } catch (error) {
    return c.json({ error: 'bulk_ingest_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.delete('/document/:slug', requirePermission('ai:configure'), paramSlugValidator, async (c) => {
  const { slug } = c.req.valid('param')
  const result = await getStore(c).deleteDocument(slug)
  return c.json(result)
})

ragRouter.post('/search', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const query = ensureString(body, 'query')
    const filterCategory = typeof body.filterCategory === 'string' ? body.filterCategory : undefined
    const topK = topKValue(ensureNumber(body, 'topK', 5))
    const embedding = await createEmbeddings(c.env, [query])
    const matches = await getStore(c).search(embedding.vectors[0], topK, filterCategory)
    // Ta trasa zwraca liste do przejrzenia przez czlowieka, wiec nie odmawiamy —
    // ale `znaczeniowe: false` musi byc widoczne, inaczej redaktor uzna dobor
    // po pisowni za dobor po temacie.
    return c.json({ ok: true, query, topK, items: matches, znaczeniowe: embedding.semantic })
  } catch (error) {
    return c.json({ error: 'search_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/ask', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const question = ensureString(body, 'question')
    const topK = topKValue(ensureNumber(body, 'topK', 5))
    const embedding = await createEmbeddings(c.env, [question])
    const brak = wymagajZnaczeniowych(embedding)
    if (brak) return c.json({ error: brak.blad, detail: brak.szczegol }, 503)
    const matches = await getStore(c).search(embedding.vectors[0], topK)
    const citations = buildCitationList(matches)
    const context = mergeContext(matches)
    const aiText = await modelTekstowyZRejestrem(c, 'ask', `Pytanie: ${question}\n\nKontekst:\n${context}\n\nOdpowiedz po polsku w 3-5 zdaniach i odwołaj się wyłącznie do kontekstu.`, 'Jesteś asystentem RAG portalu lokalnego.')
    const answer = aiText || heuristicAnswer(question, matches).answer
    return c.json({ ok: true, question, answer, citations })
  } catch (error) {
    return c.json({ error: 'ask_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.get('/similar/:slug', paramSlugValidator, async (c) => {
  const { slug } = c.req.valid('param')
  const chunks = await getStore(c).getChunksBySlug(slug)
  if (!chunks.length) return c.json({ error: 'document_not_found', slug }, 404)
  const queryVector = averageVector(chunks.map(chunk => chunk.vector))
  const matches = await getStore(c).search(queryVector, 12)
  const similar = uniqueBySlug(matches.filter(match => match.slug !== slug)).slice(0, 5)
  return c.json({ ok: true, slug, items: similar })
})

ragRouter.post('/summarize-cluster', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const slugs = ensureStringArray(c.req.valid('json'), 'slugs')
    const docs = await getStore(c).getDocuments(slugs)
    const context = docs.map(doc => `${doc.title}\n${doc.content}`).join('\n\n')
    const aiText = await modelTekstowyZRejestrem(c, 'summarize-cluster', `Streszcz wspólny klaster tematów na podstawie dokumentów:\n\n${context}`, 'Tworzysz jeden spójny summary w języku polskim.')
    return c.json({ ok: true, slugs, summary: aiText || `Klaster obejmuje ${docs.length} materiałów dotyczących: ${docs.map(doc => doc.title).join('; ')}.` })
  } catch (error) {
    return c.json({ error: 'summarize_cluster_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/timeline/:topic', validator('param', (value, c) => {
  const topic = String(value.topic || '').trim()
  if (!topic) return c.json({ error: 'topic_required' }, 400)
  return { topic }
}), async (c) => {
  const { topic } = c.req.valid('param')
  const embedding = await createEmbeddings(c.env, [topic])
  const matches = await getStore(c).search(embedding.vectors[0], 10)
  const items = uniqueBySlug(matches).map(match => ({ slug: match.slug, title: match.title, category: match.category, note: match.content }))
  return c.json({ ok: true, topic, items })
})

ragRouter.post('/compare', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const leftSlug = ensureString(body, 'leftSlug')
    const rightSlug = ensureString(body, 'rightSlug')
    const docs = await getStore(c).getDocuments([leftSlug, rightSlug])
    if (docs.length < 2) return c.json({ error: 'documents_not_found' }, 404)
    const [left, right] = docs
    const prompt = `Porównaj dwa artykuły.\nA: ${left.title}\n${left.content}\n\nB: ${right.title}\n${right.content}\n\nWypisz podobieństwa i różnice.`
    const aiText = await modelTekstowyZRejestrem(c, 'compare', prompt, 'Tworzysz krótkie porównanie w punktach po polsku.')
    return c.json({
      ok: true,
      left: { slug: left.slug, title: left.title },
      right: { slug: right.slug, title: right.title },
      comparison: aiText || `Artykuł „${left.title}” i „${right.title}” różnią się kategorią lub akcentem redakcyjnym, ale dotyczą tej samej gminy i lokalnego kontekstu.`,
    })
  } catch (error) {
    return c.json({ error: 'compare_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/translate-context', articleBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const text = ensureString(body, 'text')
    const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage : 'English'
    const embedding = await createEmbeddings(c.env, [text])
    const brak = wymagajZnaczeniowych(embedding)
    if (brak) return c.json({ error: brak.blad, detail: brak.szczegol }, 503)
    const matches = await getStore(c).search(embedding.vectors[0], 4)
    const context = mergeContext(matches)
    const aiText = await modelTekstowyZRejestrem(c, 'translate-context', `Przetłumacz tekst na ${targetLanguage}, zachowując lokalne nazwy.\n\nTekst:\n${text}\n\nKontekst RAG:\n${context}`, 'Tłumaczysz tekst z użyciem kontekstu lokalnego.')
    return c.json({ ok: true, targetLanguage, translation: aiText || text, citations: buildCitationList(matches) })
  } catch (error) {
    return c.json({ error: 'translate_context_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.get('/topics', async (c) => {
  const topics = await getStore(c).listTopics(10)
  return c.json({ ok: true, items: topics.map(topic => ({ category: topic.category, count: topic.count, sampleTitles: String(topic.titles || '').split(' • ').slice(0, 3) })) })
})

ragRouter.post('/qa-archive', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const question = ensureString(body, 'question')
    const topK = topKValue(ensureNumber(body, 'topK', 6))
    const embedding = await createEmbeddings(c.env, [question])
    const matches = await getStore(c).search(embedding.vectors[0], topK)
    return c.json({ ok: true, question, answer: heuristicAnswer(question, matches).answer, citations: buildCitationList(matches) })
  } catch (error) {
    return c.json({ error: 'qa_archive_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/recommend/:userId', userIdParamValidator, async (c) => {
  const { userId } = c.req.valid('param')
  const stats = await getStore(c).stats()
  const categoryOrder = stats.categories.map(item => item.category)
  const start = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(categoryOrder.length || 1, 1)
  const categories = categoryOrder.slice(start).concat(categoryOrder.slice(0, start)).slice(0, 3)
  const items = ARTICLES.filter(article => categories.includes(article.category)).slice(0, 6).map(article => ({ slug: article.slug, title: article.title, category: article.category }))
  return c.json({ ok: true, userId, strategy: 'category-rotation-fallback', items })
})

ragRouter.post('/auto-categorize', articleBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const title = ensureString(body, 'title')
    const content = ensureString(body, 'content')
    const queryVector = (await createEmbeddings(c.env, [`${title}\n${content}`])).vectors[0]
    const matches = await getStore(c).search(queryVector, 8)
    const counts = new Map<string, number>()
    for (const match of matches) counts.set(match.category, (counts.get(match.category) || 0) + 1)
    const [suggestedCategory = 'wiadomosci'] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || []
    return c.json({ ok: true, suggestedCategory, supportingArticles: buildCitationList(matches) })
  } catch (error) {
    return c.json({ error: 'auto_categorize_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/find-duplicates', jsonBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const slug = typeof body.slug === 'string' ? body.slug : ''
    if (slug) {
      const chunks = await getStore(c).getChunksBySlug(slug)
      if (!chunks.length) return c.json({ error: 'document_not_found', slug }, 404)
      const vector = averageVector(chunks.map(chunk => chunk.vector))
      const matches = uniqueBySlug((await getStore(c).search(vector, 12)).filter(match => match.slug !== slug)).slice(0, 5)
      return c.json({ ok: true, slug, items: matches })
    }
    const docs = await getStore(c).getDocuments(ARTICLES.map(article => article.slug))
    const pairs = [] as Array<{ leftSlug: string; rightSlug: string; score: number }>
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const leftTokens = String(docs[i].title).toLowerCase().split(/\W+/)
        const rightTokens = String(docs[j].title).toLowerCase().split(/\W+/)
        const shared = leftTokens.filter(token => token && rightTokens.includes(token)).length
        const score = shared / Math.max(new Set(leftTokens).size, 1)
        if (score >= 0.4) pairs.push({ leftSlug: String(docs[i].slug), rightSlug: String(docs[j].slug), score: Number(score.toFixed(3)) })
      }
    }
    return c.json({ ok: true, items: pairs.slice(0, 10) })
  } catch (error) {
    return c.json({ error: 'find_duplicates_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/expand-stub', articleBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const draft = ensureString(body, 'draft')
    const topK = topKValue(ensureNumber(body, 'topK', 4))
    const embedding = await createEmbeddings(c.env, [draft])
    const brak = wymagajZnaczeniowych(embedding)
    if (brak) return c.json({ error: brak.blad, detail: brak.szczegol }, 503)
    const matches = await getStore(c).search(embedding.vectors[0], topK)
    const context = mergeContext(matches)
    const aiText = await modelTekstowyZRejestrem(c, 'expand-stub', `Rozwiń krótki szkic artykułu o brakujące szczegóły, korzystając wyłącznie z kontekstu.\n\nSzkic:\n${draft}\n\nKontekst:\n${context}`, 'Piszesz uporządkowany, rzeczowy szkic artykułu po polsku.')
    return c.json({ ok: true, expanded: aiText || `${draft}\n\nUzupełnienie kontekstowe: ${matches.map(match => match.content).join(' ')}`, citations: buildCitationList(matches) })
  } catch (error) {
    return c.json({ error: 'expand_stub_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.post('/fact-check', articleBodyLimit, jsonValidator, async (c) => {
  try {
    const body = c.req.valid('json')
    const statement = ensureString(body, 'statement')
    const topK = topKValue(ensureNumber(body, 'topK', 5))
    const embedding = await createEmbeddings(c.env, [statement])
    const brak = wymagajZnaczeniowych(embedding)
    if (brak) return c.json({ error: brak.blad, detail: brak.szczegol }, 503)
    const matches = await getStore(c).search(embedding.vectors[0], topK)
    const answer = await modelTekstowyZRejestrem(c, 'fact-check', `Oceń twierdzenie na bazie kontekstu RAG.\n\nTwierdzenie: ${statement}\n\nKontekst:\n${mergeContext(matches)}`, 'Jesteś fact-checkerem lokalnego archiwum.')
    return c.json({ ok: true, statement, verdict: answer || 'Wymaga dodatkowej weryfikacji redakcyjnej.', citations: buildCitationList(matches) })
  } catch (error) {
    return c.json({ error: 'rag_fact_check_failed', detail: error instanceof Error ? error.message : 'unknown' }, 400)
  }
})

ragRouter.get('/stats', async (c) => c.json({ ok: true, ...(await getStore(c).stats()) }))

ragRouter.post('/reindex', requirePermission('ai:configure'), reindexRateLimit, async (c) => {
  try {
    const items = ARTICLES.map(article => ({
      slug: article.slug,
      title: article.title,
      content: articleToContent(article),
      category: article.category,
    }))
    const results = []
    for (const item of items) results.push(await ingestSingle(c.env, item))
    return c.json({ ok: true, reindexed: results.length, items: results })
  } catch (error) {
    return c.json({ error: 'reindex_failed', detail: error instanceof Error ? error.message : 'unknown' }, 500)
  }
})

ragRouter.get('/health', async (c) => {
  const dbCheck = await c.env.DB?.prepare('SELECT 1 as ok').first<{ ok: number }>().catch(() => null)
  const embeddingProvider = (await createEmbeddings(c.env, ['izbica health probe'])).provider
  return c.json({
    ok: Boolean(dbCheck?.ok),
    services: {
      d1: Boolean(dbCheck?.ok),
      openaiEmbeddings: Boolean(c.env.OPENAI_API_KEY),
      vectorize: Boolean(c.env.VECTORIZE_INDEX),
      embeddingProvider,
    },
    time: new Date().toISOString(),
  })
})

export default ragRouter
export { ragRouter }
