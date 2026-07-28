// SA1: Repository layer — bridges D1 models with API (replaces data-articles.ts mock data)
import type { Bindings, D1DatabaseLike } from '../types/env'

export interface RepositoryContext {
  DB: D1DatabaseLike
}

export interface ArticleRow {
  id: number
  slug: string
  title: string
  lead: string
  body: string[]
  content_html: string | null
  hero_image_r2_key: string | null
  category: string
  category_slug: string
  author: string
  author_id: number | null
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
  view_count: number
  reading_minutes: number
  tags: string[]
  language: string
}

export interface CategoryRow {
  slug: string
  title: string
  description: string
  color: string
  subcategories: string[]
}

export interface CommentRow {
  id: number
  article_id: number
  article_slug: string
  article_title: string
  author: string
  content: string
  status: string
  created_at: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ====== Articles Repository ======
export function createArticlesRepo(db: D1DatabaseLike) {
  return {
    async findAll(opts: { limit?: number; offset?: number; category?: string; status?: string } = {}) {
      const limit = Math.min(opts.limit ?? 20, 100)
      const offset = opts.offset ?? 0
      let sql = `SELECT a.*, c.slug as category_slug, c.title as category_title, u.name as author_name, GROUP_CONCAT(t.name, ',') as tag_names FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.author_id = u.id LEFT JOIN article_tags at ON a.id = at.article_id LEFT JOIN tags t ON at.tag_id = t.id WHERE a.deleted_at IS NULL`
      const params: unknown[] = []
      if (opts.category) { sql += ` AND c.slug = ?`; params.push(opts.category) }
      if (opts.status) { sql += ` AND a.status = ?`; params.push(opts.status) }
      sql += ` GROUP BY a.id ORDER BY a.published_at DESC, a.created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)
      const { results = [] } = await db.prepare(sql).bind(...params).all<Record<string, unknown>>()
      return results.map(mapArticleRow)
    },

    async findBySlug(slug: string): Promise<ArticleRow | null> {
      const sql = `SELECT a.*, c.slug as category_slug, c.title as category_title, u.name as author_name, GROUP_CONCAT(t.name, ',') as tag_names FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.author_id = u.id LEFT JOIN article_tags at ON a.id = at.article_id LEFT JOIN tags t ON at.tag_id = t.id WHERE a.slug = ? AND a.deleted_at IS NULL GROUP BY a.id`
      const row = await db.prepare(sql).bind(slug).first<Record<string, unknown>>()
      return row ? mapArticleRow(row) : null
    },

    async search(query: string, limit = 20) {
      const sql = `SELECT a.*, c.slug as category_slug, c.title as category_title, u.name as author_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.author_id = u.id WHERE a.deleted_at IS NULL AND (a.title LIKE ? OR a.lead LIKE ?) ORDER BY a.published_at DESC LIMIT ?`
      const like = `%${query}%`
      const { results = [] } = await db.prepare(sql).bind(like, like, limit).all<Record<string, unknown>>()
      return results.map(mapArticleRow)
    },

    async count(): Promise<number> {
      const row = await db.prepare(`SELECT COUNT(*) as cnt FROM articles WHERE deleted_at IS NULL`).first<{cnt: number}>()
      return Number(row?.cnt ?? 0)
    },

    async findByCategory(categorySlug: string, limit = 20, offset = 0) {
      return this.findAll({ category: categorySlug, limit, offset })
    },

    async findPopular(limit = 10) {
      const sql = `SELECT a.*, c.slug as category_slug, c.title as category_title, u.name as author_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.author_id = u.id WHERE a.deleted_at IS NULL AND a.status = 'published' ORDER BY a.view_count DESC LIMIT ?`
      const { results = [] } = await db.prepare(sql).bind(limit).all<Record<string, unknown>>()
      return results.map(mapArticleRow)
    },

    async findLatest(limit = 10) {
      const sql = `SELECT a.*, c.slug as category_slug, c.title as category_title, u.name as author_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id LEFT JOIN users u ON a.author_id = u.id WHERE a.deleted_at IS NULL AND a.status = 'published' ORDER BY a.published_at DESC LIMIT ?`
      const { results = [] } = await db.prepare(sql).bind(limit).all<Record<string, unknown>>()
      return results.map(mapArticleRow)
    },
  }
}

function mapArticleRow(row: Record<string, unknown>): ArticleRow {
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ''),
    title: String(row.title ?? ''),
    lead: String(row.lead ?? ''),
    body: parseBody(row),
    content_html: typeof row.content_html === 'string' ? row.content_html : null,
    hero_image_r2_key: typeof row.hero_image_r2_key === 'string' ? row.hero_image_r2_key : null,
    category: String(row.category_title ?? row.category ?? ''),
    category_slug: String(row.category_slug ?? ''),
    author: String(row.author_name ?? row.author ?? 'Redakcja'),
    author_id: typeof row.author_id === 'number' ? row.author_id : null,
    status: String(row.status ?? 'draft'),
    published_at: typeof row.published_at === 'string' ? row.published_at : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    view_count: Number(row.view_count ?? 0),
    reading_minutes: Number(row.reading_minutes ?? 3),
    tags: typeof row.tag_names === 'string' ? row.tag_names.split(',').filter(Boolean) : [],
    language: String(row.language ?? 'pl'),
  }
}

function parseBody(row: Record<string, unknown>): string[] {
  if (typeof row.content_html === 'string' && row.content_html) return [row.content_html]
  if (typeof row.content_md === 'string' && row.content_md) return [row.content_md]
  if (typeof row.lead === 'string' && row.lead) return [row.lead]
  return []
}

// ====== Categories Repository ======
export function createCategoriesRepo(db: D1DatabaseLike) {
  return {
    async findAll(): Promise<CategoryRow[]> {
      const { results = [] } = await db.prepare(`SELECT * FROM categories ORDER BY title`).all<Record<string, unknown>>()
      return results.map(r => ({
        slug: String(r.slug ?? ''),
        title: String(r.title ?? ''),
        description: String(r.description ?? ''),
        color: String(r.color ?? '#1a1a2e'),
        subcategories: [],
      }))
    },
    async findBySlug(slug: string): Promise<CategoryRow | null> {
      const row = await db.prepare(`SELECT * FROM categories WHERE slug = ?`).bind(slug).first<Record<string, unknown>>()
      return row ? { slug: String(row.slug), title: String(row.title), description: String(row.description ?? ''), color: String(row.color ?? '#1a1a2e'), subcategories: [] } : null
    },
  }
}

// ====== Comments Repository ======
export function createCommentsRepo(db: D1DatabaseLike) {
  return {
    async findByArticle(articleId: number, status = 'approved') {
      const sql = `SELECT c.*, a.slug as article_slug, a.title as article_title FROM comments c JOIN articles a ON c.article_id = a.id WHERE c.article_id = ? AND c.status = ? ORDER BY c.created_at DESC`
      const { results = [] } = await db.prepare(sql).bind(articleId, status).all<Record<string, unknown>>()
      return results.map(mapCommentRow)
    },
    async create(input: { article_id: number; author: string; content: string }) {
      const id = crypto.randomUUID()
      await db.prepare(`INSERT INTO comments (article_id, author, content, status, created_at) VALUES (?, ?, ?, 'pending', datetime('now'))`).bind(input.article_id, input.author, input.content).run()
      return { id, ...input, status: 'pending' }
    },
    async findAllPending() {
      const sql = `SELECT c.*, a.slug as article_slug, a.title as article_title FROM comments c JOIN articles a ON c.article_id = a.id WHERE c.status = 'pending' ORDER BY c.created_at DESC`
      const { results = [] } = await db.prepare(sql).all<Record<string, unknown>>()
      return results.map(mapCommentRow)
    },
  }
}

function mapCommentRow(row: Record<string, unknown>): CommentRow {
  return {
    id: Number(row.id),
    article_id: Number(row.article_id),
    article_slug: String(row.article_slug ?? ''),
    article_title: String(row.article_title ?? ''),
    author: String(row.author ?? ''),
    content: String(row.content ?? ''),
    status: String(row.status ?? 'pending'),
    created_at: String(row.created_at ?? ''),
  }
}

// ====== Newsletter Repository ======
/**
 * Losowy token potwierdzenia — 64 znaki szesnastkowe (32 bajty entropii).
 *
 * `crypto.getRandomValues` zamiast `Math.random()`: `Math.random()` nie jest
 * generatorem kryptograficznym, jego wyniki daja sie przewidziec na podstawie
 * poprzednich, a token, ktory da sie przewidziec, pozwala potwierdzic cudzy
 * adres. Web Crypto jest dostepne w Cloudflare Workers bez dodatkowych flag.
 */
const losowyToken = (): string => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function createNewsletterRepo(db: D1DatabaseLike) {
  return {
    // Tabelą kanoniczną jest `newsletters` (0002_core_schema.sql).
    // Wcześniej zapytania kierowano do nieistniejącej `newsletter_subs`,
    // co powodowało błąd 500 przy każdej próbie zapisu do newslettera.
    // Dozwolone statusy wg CHECK w schemacie: 'pending' | 'confirmed' | 'unsubscribed'.
    /**
     * Zapisuje adres ze statusem 'pending' i ZWRACA token potwierdzenia.
     *
     * DWIE USTERKI, ktore to naprawia.
     *
     * (1) Kolumna `token` nigdy nie byla wypelniana. Pomiar po zapisie:
     *       SELECT email, token IS NULL FROM newsletters
     *       -> test@example.com | 1
     *     Schemat ma kolumne `token`, wiec podwojne potwierdzenie bylo
     *     zaprojektowane — tylko nieziszczone.
     *
     * (2) Skutek dla `confirm()`: potwierdzenie identyfikowalo subskrypcje
     *     WYLACZNIE adresem e-mail. Kazdy, kto zna adres mieszkanca, mogl go
     *     potwierdzic za niego jednym zapytaniem HTTP. To wywraca sens
     *     podwojnego potwierdzenia (RODO, art. 7 — zgoda musi byc wykazana):
     *     nie mielismy dowodu, ze wlasciciel skrzynki wyrazil zgode, bo
     *     potwierdzenie moglo przyjsc od kogokolwiek.
     *
     * Token jest losowy (Web Crypto, 32 bajty), wiec nie da sie go zgadnac ani
     * wyliczyć z adresu.
     */
    async subscribe(email: string): Promise<{ ok: boolean; message: string; token?: string }> {
      const existing = await db.prepare(
        `SELECT id, status FROM newsletters WHERE email = ? AND deleted_at IS NULL`
      ).bind(email).first<{ id: number; status: string }>()

      const token = losowyToken()

      if (existing) {
        // Powtórny zapis po wypisaniu przywraca subskrypcję do potwierdzenia.
        if (existing.status === 'unsubscribed') {
          await db.prepare(
            `UPDATE newsletters
                SET status = 'pending', token = ?, unsubscribed_at = NULL, confirmed_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`
          ).bind(token, existing.id).run()
          return { ok: true, message: 'confirmation_sent', token }
        }
        // Adres oczekujacy na potwierdzenie: wystawiamy NOWY token, bo
        // poprzedni list mogl nie dotrzec. Bez tego mieszkaniec, ktory zgubil
        // wiadomosc, nie mial zadnej drogi do potwierdzenia zgody.
        if (existing.status === 'pending') {
          await db.prepare(
            `UPDATE newsletters SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
          ).bind(token, existing.id).run()
          return { ok: true, message: 'confirmation_sent', token }
        }
        return { ok: false, message: 'already_subscribed' }
      }

      await db.prepare(
        `INSERT INTO newsletters (email, status, token, consent_version, created_at, updated_at)
         VALUES (?, 'pending', ?, '1.0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(email, token).run()
      return { ok: true, message: 'confirmation_sent', token }
    },

    /**
     * Potwierdza zgode na podstawie TOKENU, nie adresu e-mail.
     *
     * Token jest zuzywany (`token = NULL`), wiec przechwycony odnosnik nie
     * daje sie uzyc po raz drugi. Zwracamy `ok: false` dla tokenu nieznanego
     * lub juz zuzytego — bez informacji, ktora z tych sytuacji zachodzi, zeby
     * nie potwierdzac istnienia adresu w bazie.
     */
    async confirm(token: string): Promise<{ ok: boolean }> {
      const row = await db.prepare(
        `SELECT id FROM newsletters
          WHERE token = ? AND status = 'pending' AND deleted_at IS NULL`
      ).bind(token).first<{ id: number }>()
      if (!row) return { ok: false }

      await db.prepare(
        `UPDATE newsletters
            SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP,
                token = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
      ).bind(row.id).run()
      return { ok: true }
    },
    async unsubscribe(email: string): Promise<{ ok: boolean }> {
      await db.prepare(
        `UPDATE newsletters
            SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
          WHERE email = ? AND deleted_at IS NULL`
      ).bind(email).run()
      return { ok: true }
    },
    async getSubscribers(): Promise<{ email: string; status: string; subscribed_at: string }[]> {
      const { results = [] } = await db.prepare(
        `SELECT email, status, created_at AS subscribed_at
           FROM newsletters
          WHERE status = 'confirmed' AND deleted_at IS NULL
          ORDER BY created_at DESC`
      ).all<Record<string, unknown>>()
      return results.map(r => ({ email: String(r.email), status: String(r.status), subscribed_at: String(r.subscribed_at) }))
    },
  }
}

// ====== Events Repository ======
export function createEventsRepo(db: D1DatabaseLike) {
  return {
    async findAll(limit = 20) {
      const { results = [] } = await db.prepare(`SELECT * FROM events WHERE date >= date('now') ORDER BY date LIMIT ?`).bind(limit).all<Record<string, unknown>>()
      return results
    },
  }
}

// ====== Settings Repository ======
export function createSettingsRepo(db: D1DatabaseLike) {
  return {
    async get(key: string): Promise<string | null> {
      const row = await db.prepare(`SELECT value FROM settings WHERE key = ?`).bind(key).first<{value: string}>()
      return row?.value ?? null
    },
    async set(key: string, value: string) {
      await db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`).bind(key, value).run()
    },
    async getAll(): Promise<Record<string, string>> {
      const { results = [] } = await db.prepare(`SELECT key, value FROM settings`).all<{key: string; value: string}>()
      return Object.fromEntries(results.map(r => [r.key, r.value]))
    },
  }
}

// ====== Unified Repository Factory ======
export function createRepository(db: D1DatabaseLike) {
  return {
    articles: createArticlesRepo(db),
    categories: createCategoriesRepo(db),
    comments: createCommentsRepo(db),
    newsletter: createNewsletterRepo(db),
    events: createEventsRepo(db),
    settings: createSettingsRepo(db),
  }
}

export type Repository = ReturnType<typeof createRepository>
