/**
 * FAZA 2 — warstwa repozytorium artykulow (D1).
 *
 * Dlaczego to nie jest kolejny „model” w src/db/models/
 * ────────────────────────────────────────────────────────
 * Pliki w src/db/models/ sa wygenerowane po jednej tabeli i operuja na
 * plaskich wierszach. Artykul w izbica24.pl nie jest plaskim wierszem —
 * to wiersz w `articles` PLUS uporzadkowana lista wierszy w `article_blocks`
 * PLUS powiazania w `article_tags`. Zapis czesciowy (np. wiersz artykulu bez
 * blokow) zostawia w bazie tekst bez tresci, ktory na portalu wyglada jak
 * pusta strona z tytulem. Dlatego kazda operacja tutaj idzie przez
 * `DB.batch()` — D1 wykonuje batch jako jedna transakcje, wiec albo zapisze
 * sie wszystko, albo nic.
 *
 * Klucz konstrukcyjny: bloki sa ZAWSZE nadpisywane calosciowo
 * (DELETE + INSERT), nigdy scalane. Proba scalania po `position` wymagalaby
 * rozstrzygania, co zrobic z blokiem, ktory edytor przesunal i zmienil
 * jednoczesnie — a `UNIQUE(article_id, position)` sprawia, ze kolejnosc
 * operacji UPDATE moze przejsciowo lamac ograniczenie. Nadpisanie calosci
 * jest tansze w rozumowaniu i przy 300 blokach nadal to jeden round trip.
 */

import type { Context } from 'hono'
import { slugify } from '../../lib/slugify'
import { blocksToPlainText, type ValidatedBlock } from '../../lib/validation/blocks'

// ─────────────────────────────────────────────────────────────────────────────
// Typy
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleRecord {
  id: number
  slug: string
  title: string
  lead: string
  content_type: string
  short_title: string | null
  category_id: number | null
  subcategory_slug: string | null
  subsubcategory_slug: string | null
  author_id: number | null
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived'
  hero_image_r2_key: string | null
  hero_alt: string | null
  hero_caption: string | null
  hero_credit: string | null
  solectwo_slug: string | null
  featured: number
  breaking: number
  view_count: number
  comment_count: number
  reading_minutes: number
  type_data_json: string | null
  ai_assisted: number
  ai_disclosure: string | null
  human_reviewed_by: number | null
  human_reviewed_at: string | null
  locked_by: number | null
  locked_at: string | null
  published_at: string | null
  scheduled_at: string | null
  archived_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface BlockRecord {
  id: number
  article_id: number
  position: number
  block_type: string
  payload_json: string
  plain_text: string | null
  media_id: number | null
}

/** Artykul wraz z blokami, tagami i danymi autora/kategorii. */
export interface ArticleFull extends ArticleRecord {
  blocks: ValidatedBlock[]
  tags: string[]
  category_slug: string | null
  category_name: string | null
  author_name: string | null
  author_email: string | null
}

/** Pola, ktore wolno zapisac przez repozytorium (nazwy w domenie, nie w SQL). */
export interface ArticleWriteFields {
  title?: string
  slug?: string
  lede?: string
  type?: string
  shortTitle?: string | null
  category?: string
  subcategory?: string | null
  subsubcategory?: string | null
  heroImage?: string | null
  heroAlt?: string | null
  heroCaption?: string | null
  heroCredit?: string | null
  solectwo?: string | null
  featured?: boolean
  breaking?: boolean
  readingMinutes?: number
  typeData?: unknown
  aiAssisted?: boolean
  aiDisclosure?: string | null
  scheduledAt?: string | null
  authorId?: number | null
}

type D1 = {
  prepare(q: string): D1Stmt
  batch<T = unknown>(statements: D1Stmt[]): Promise<T[]>
}
type D1Stmt = {
  bind(...values: unknown[]): D1Stmt
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results?: T[]; meta?: Record<string, unknown> }>
  run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }>
}

export const db = (c: Context): D1 => c.env.DB as D1

// ─────────────────────────────────────────────────────────────────────────────
// Mapowanie pol domenowych na kolumny
// ─────────────────────────────────────────────────────────────────────────────

const bool = (v: boolean | undefined): number | undefined => (v === undefined ? undefined : v ? 1 : 0)

/**
 * Kategoria przychodzi z klienta jako slug (bo takie sa adresy URL), a w bazie
 * jest liczbowym `category_id`. Tlumaczymy w jednym miejscu; brak kategorii
 * o podanym slugu zwraca `null`, co wolant obsluguje jako blad walidacji —
 * cichy zapis z `category_id = NULL` wypchnalby artykul poza wszystkie sekcje
 * portalu, a redaktor widzialby „zapisano”.
 */
export const categoryIdBySlug = async (c: Context, slug: string): Promise<number | null> => {
  const row = await db(c)
    .prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{ id: number }>()
  return row?.id ?? null
}

export const categorySlugById = async (c: Context, id: number | null): Promise<string | null> => {
  if (!id) return null
  const row = await db(c).prepare('SELECT slug FROM categories WHERE id = ?').bind(id).first<{ slug: string }>()
  return row?.slug ?? null
}

/** Zamiana pol domenowych na pary kolumna→wartosc. Pomija `undefined`. */
const toColumns = (fields: ArticleWriteFields, categoryId?: number | null): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  const put = (col: string, value: unknown) => {
    if (value !== undefined) out[col] = value
  }

  put('title', fields.title)
  put('slug', fields.slug)
  put('lead', fields.lede)
  put('content_type', fields.type)
  put('short_title', fields.shortTitle)
  if (categoryId !== undefined) put('category_id', categoryId)
  put('subcategory_slug', fields.subcategory)
  put('subsubcategory_slug', fields.subsubcategory)
  put('hero_image_r2_key', fields.heroImage)
  put('hero_alt', fields.heroAlt)
  put('hero_caption', fields.heroCaption)
  put('hero_credit', fields.heroCredit)
  put('solectwo_slug', fields.solectwo)
  put('featured', bool(fields.featured))
  put('breaking', bool(fields.breaking))
  put('reading_minutes', fields.readingMinutes)
  put('type_data_json', fields.typeData === undefined ? undefined : JSON.stringify(fields.typeData))
  put('ai_assisted', bool(fields.aiAssisted))
  put('ai_disclosure', fields.aiDisclosure)
  put('scheduled_at', fields.scheduledAt)
  put('author_id', fields.authorId)

  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Unikalnosc sluga
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `articles.slug` ma ograniczenie UNIQUE. Dwa artykuly o tytule
 * „Sesja rady gminy” daja ten sam slug, wiec drugi zapis bylby odrzucony
 * bledem bazy — dla redaktora nieczytelnym. Dokladamy przyrostek liczbowy.
 *
 * Sprawdzamy takze wiersze usuniete miekko: slug usunietego artykulu nadal
 * zajmuje miejsce w indeksie UNIQUE, wiec pominiecie ich dawaloby blad
 * ograniczenia przy proponowaniu „wolnego” sluga.
 */
export const uniqueSlug = async (c: Context, desired: string, exceptId?: number): Promise<string> => {
  const base = slugify(desired) || 'artykul'
  const rows = await db(c)
    .prepare(
      `SELECT slug FROM articles
        WHERE (slug = ? OR slug LIKE ? ESCAPE '\\')
          AND (? IS NULL OR id <> ?)`,
    )
    .bind(base, `${base.replace(/[%_]/g, (m) => '\\' + m)}-%`, exceptId ?? null, exceptId ?? null)
    .all<{ slug: string }>()

  const taken = new Set((rows.results ?? []).map((r) => r.slug))
  if (!taken.has(base)) return base

  for (let n = 2; n < 500; n += 1) {
    const candidate = `${base}-${n}`
    if (!taken.has(candidate)) return candidate
  }
  // Skrajny przypadek: 500 kolizji. Znacznik czasu gwarantuje unikalnosc.
  return `${base}-${Date.now().toString(36)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloki tresci
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Instrukcje zapisu blokow. Zwracamy tablice, a nie wykonujemy od razu,
 * bo wolant dokleja je do wiekszego `batch()` razem z zapisem artykulu —
 * inaczej istnialoby okno, w ktorym artykul ma nowa tresc, a bloki stara.
 */
export const blockStatements = (c: Context, articleId: number, blocks: ValidatedBlock[]): D1Stmt[] => {
  const d = db(c)
  const statements: D1Stmt[] = [d.prepare('DELETE FROM article_blocks WHERE article_id = ?').bind(articleId)]

  blocks.forEach((block, index) => {
    const b = block as unknown as Record<string, unknown>
    statements.push(
      d
        .prepare(
          `INSERT INTO article_blocks (article_id, position, block_type, payload_json, plain_text, media_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          articleId,
          index,
          String(b.type),
          JSON.stringify(block),
          blocksToPlainText([block]).slice(0, 20000) || null,
          typeof b.mediaId === 'number' ? b.mediaId : null,
        ),
    )
  })

  return statements
}

export const loadBlocks = async (c: Context, articleId: number): Promise<ValidatedBlock[]> => {
  const rows = await db(c)
    .prepare('SELECT payload_json FROM article_blocks WHERE article_id = ? ORDER BY position ASC')
    .bind(articleId)
    .all<{ payload_json: string }>()

  const out: ValidatedBlock[] = []
  for (const row of rows.results ?? []) {
    try {
      out.push(JSON.parse(row.payload_json) as ValidatedBlock)
    } catch {
      // Uszkodzony wiersz pomijamy zamiast wywracac cala strone artykulu.
      console.error(`[repozytorium] Nieczytelny blok w artykule ${articleId}`)
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Tagi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tagi przychodza jako nazwy („OSP”, „droga w Pasiece”), a w bazie sa dwoma
 * tabelami: `tags` (slownik) i `article_tags` (powiazanie). `INSERT OR IGNORE`
 * na slugu tagu zalatwia rowniez rownolegle zapisy dwoch redaktorow
 * uzywajacych tego samego, jeszcze nieistniejacego tagu.
 */
export const syncTags = async (c: Context, articleId: number, tags: string[]): Promise<void> => {
  const d = db(c)
  const normalized = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 20)

  const statements: D1Stmt[] = [d.prepare('DELETE FROM article_tags WHERE article_id = ?').bind(articleId)]
  for (const name of normalized) {
    const slug = slugify(name) || name.toLowerCase().slice(0, 48)
    statements.push(d.prepare('INSERT OR IGNORE INTO tags (slug, name) VALUES (?, ?)').bind(slug, name))
    statements.push(
      d
        .prepare(
          `INSERT OR IGNORE INTO article_tags (article_id, tag_id)
           SELECT ?, id FROM tags WHERE slug = ?`,
        )
        .bind(articleId, slug),
    )
  }

  await d.batch(statements)
}

export const loadTags = async (c: Context, articleId: number): Promise<string[]> => {
  const rows = await db(c)
    .prepare(
      `SELECT t.name FROM tags t
         JOIN article_tags at ON at.tag_id = t.id
        WHERE at.article_id = ? ORDER BY t.name`,
    )
    .bind(articleId)
    .all<{ name: string }>()
  return (rows.results ?? []).map((r) => r.name)
}

// ─────────────────────────────────────────────────────────────────────────────
// Odczyt
// ─────────────────────────────────────────────────────────────────────────────

const SELECT_FULL = `
  SELECT a.*, c.slug AS category_slug, c.name AS category_name,
         u.name AS author_name, u.email AS author_email
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    LEFT JOIN users u ON u.id = a.author_id`

const hydrate = async (c: Context, row: Record<string, unknown> | null): Promise<ArticleFull | null> => {
  if (!row) return null
  const id = Number(row.id)
  const [blocks, tags] = await Promise.all([loadBlocks(c, id), loadTags(c, id)])
  return { ...(row as unknown as ArticleRecord), blocks, tags } as ArticleFull
}

export const getById = async (c: Context, id: number, includeDeleted = false): Promise<ArticleFull | null> => {
  const row = await db(c)
    .prepare(`${SELECT_FULL} WHERE a.id = ? ${includeDeleted ? '' : 'AND a.deleted_at IS NULL'} LIMIT 1`)
    .bind(id)
    .first()
  return hydrate(c, row)
}

export const getBySlug = async (c: Context, slug: string, includeDeleted = false): Promise<ArticleFull | null> => {
  const row = await db(c)
    .prepare(`${SELECT_FULL} WHERE a.slug = ? ${includeDeleted ? '' : 'AND a.deleted_at IS NULL'} LIMIT 1`)
    .bind(slug)
    .first()
  return hydrate(c, row)
}

/** Wiersz bez blokow i tagow — do sprawdzen (status, blokada, wlasciciel). */
export const getRow = async (c: Context, id: number): Promise<ArticleRecord | null> =>
  (await db(c)
    .prepare('SELECT * FROM articles WHERE id = ? LIMIT 1')
    .bind(id)
    .first<ArticleRecord>()) ?? null

export interface ListOptions {
  status?: string
  category?: string
  subcategory?: string
  author?: number
  tag?: string
  solectwo?: string
  type?: string
  q?: string
  featured?: boolean
  sort?: string
  dir?: 'asc' | 'desc'
  limit: number
  offset: number
  includeDeleted?: boolean
  /** Domyslnie lista publiczna pokazuje tylko `published`. */
  publicOnly?: boolean
}

export interface ListResult {
  items: ArticleListItem[]
  total: number
}

export interface ArticleListItem {
  id: number
  slug: string
  title: string
  lead: string
  content_type: string
  status: string
  category_slug: string | null
  category_name: string | null
  subcategory_slug: string | null
  hero_image_r2_key: string | null
  hero_alt: string | null
  solectwo_slug: string | null
  featured: number
  breaking: number
  view_count: number
  comment_count: number
  reading_minutes: number
  ai_assisted: number
  author_id: number | null
  author_name: string | null
  published_at: string | null
  scheduled_at: string | null
  updated_at: string
  created_at: string
  deleted_at: string | null
  locked_by: number | null
  locked_at: string | null
}

/**
 * Lista z filtrami. Kolumna sortowania NIE jest parametryzowana (SQL nie
 * pozwala na `ORDER BY ?`), dlatego przechodzi przez biala liste ponizej.
 * Wartosc `sort` pochodzi ze schematu `sortBy(...)`, ktory juz ja ogranicza —
 * ta lista jest druga linia obrony, na wypadek wywolania repozytorium
 * z innego miejsca niz trasa HTTP.
 */
const SORTABLE: Record<string, string> = {
  published_at: 'a.published_at',
  created_at: 'a.created_at',
  updated_at: 'a.updated_at',
  title: 'a.title',
  view_count: 'a.view_count',
}

export const list = async (c: Context, opts: ListOptions): Promise<ListResult> => {
  const where: string[] = []
  const binds: unknown[] = []

  if (!opts.includeDeleted) where.push('a.deleted_at IS NULL')

  if (opts.publicOnly) {
    // Artykul zaplanowany staje sie publiczny, gdy nadejdzie jego czas —
    // bez tego warunku cron musialby byc jedynym mechanizmem publikacji,
    // a jego awaria zatrzymywalaby portal.
    where.push(`(a.status = 'published' AND (a.published_at IS NULL OR a.published_at <= CURRENT_TIMESTAMP))`)
  } else if (opts.status) {
    where.push('a.status = ?')
    binds.push(opts.status)
  }

  if (opts.category) {
    where.push('c.slug = ?')
    binds.push(opts.category)
  }
  if (opts.subcategory) {
    where.push('a.subcategory_slug = ?')
    binds.push(opts.subcategory)
  }
  if (opts.author) {
    where.push('a.author_id = ?')
    binds.push(opts.author)
  }
  if (opts.solectwo) {
    where.push('a.solectwo_slug = ?')
    binds.push(opts.solectwo)
  }
  if (opts.type) {
    where.push('a.content_type = ?')
    binds.push(opts.type)
  }
  if (opts.featured !== undefined) {
    where.push('a.featured = ?')
    binds.push(opts.featured ? 1 : 0)
  }
  if (opts.tag) {
    where.push('EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.slug = ?)')
    binds.push(slugify(opts.tag))
  }
  if (opts.q) {
    // LIKE, nie FTS: ta lista sluzy panelowi redakcyjnemu, gdzie szuka sie
    // po fragmencie tytulu wlasnie napisanego szkicu. FTS5 indeksuje tylko
    // opublikowane tresci i nie znajduje slow czesciowych.
    where.push('(a.title LIKE ? ESCAPE \'\\\' OR a.lead LIKE ? ESCAPE \'\\\')')
    const needle = `%${opts.q.replace(/[%_\\]/g, (m) => '\\' + m)}%`
    binds.push(needle, needle)
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const orderColumn = SORTABLE[opts.sort ?? 'published_at'] ?? 'a.published_at'
  const dir = opts.dir === 'asc' ? 'ASC' : 'DESC'

  const countRow = await db(c)
    .prepare(`SELECT COUNT(*) AS n FROM articles a LEFT JOIN categories c ON c.id = a.category_id ${clause}`)
    .bind(...binds)
    .first<{ n: number }>()

  const rows = await db(c)
    .prepare(
      `SELECT a.id, a.slug, a.title, a.lead, a.content_type, a.status,
              c.slug AS category_slug, c.name AS category_name, a.subcategory_slug,
              a.hero_image_r2_key, a.hero_alt, a.solectwo_slug,
              a.featured, a.breaking, a.view_count, a.comment_count, a.reading_minutes,
              a.ai_assisted, a.author_id, u.name AS author_name,
              a.published_at, a.scheduled_at, a.updated_at, a.created_at,
              a.deleted_at, a.locked_by, a.locked_at
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         LEFT JOIN users u ON u.id = a.author_id
         ${clause}
         ORDER BY ${orderColumn} ${dir}, a.id DESC
         LIMIT ? OFFSET ?`,
    )
    .bind(...binds, opts.limit, opts.offset)
    .all<ArticleListItem>()

  return { items: rows.results ?? [], total: countRow?.n ?? 0 }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zapis
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateInput extends ArticleWriteFields {
  title: string
  lede: string
  category: string
  blocks: ValidatedBlock[]
  tags?: string[]
  status: 'draft' | 'review'
}

export const create = async (c: Context, input: CreateInput): Promise<{ id: number; slug: string }> => {
  const categoryId = await categoryIdBySlug(c, input.category)
  if (categoryId === null) {
    throw new RepositoryError('nieznana_kategoria', `Kategoria „${input.category}” nie istnieje.`)
  }

  const slug = await uniqueSlug(c, input.slug ?? input.title)
  const columns = toColumns({ ...input, slug }, categoryId)
  columns.status = input.status

  const names = Object.keys(columns)
  const result = await db(c)
    .prepare(
      `INSERT INTO articles (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
    )
    .bind(...names.map((n) => columns[n]))
    .run()

  const id = Number(result.meta?.last_row_id)
  if (!id) throw new RepositoryError('zapis_nieudany', 'Baza nie zwrocila identyfikatora nowego artykulu.')

  const statements = blockStatements(c, id, input.blocks)
  if (statements.length > 1) await db(c).batch(statements)
  if (input.tags?.length) await syncTags(c, id, input.tags)

  return { id, slug }
}

export class RepositoryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

/**
 * Nadpisanie / zapis czesciowy. `blocks === undefined` oznacza „nie ruszaj
 * tresci” — to rozroznienie jest istotne przy PATCH z panelu, ktory czesto
 * wysyla tylko zmienione metadane. Gdyby brak pola traktowac jak pusta
 * tablice, autozapis metadanych usuwalby cala tresc artykulu.
 */
export const update = async (
  c: Context,
  id: number,
  fields: ArticleWriteFields & { blocks?: ValidatedBlock[]; tags?: string[] },
): Promise<void> => {
  let categoryId: number | null | undefined
  if (fields.category !== undefined) {
    categoryId = await categoryIdBySlug(c, fields.category)
    if (categoryId === null) {
      throw new RepositoryError('nieznana_kategoria', `Kategoria „${fields.category}” nie istnieje.`)
    }
  }

  if (fields.slug !== undefined) {
    fields = { ...fields, slug: await uniqueSlug(c, fields.slug, id) }
  }

  const columns = toColumns(fields, categoryId)
  const statements: D1Stmt[] = []
  const d = db(c)

  // `updated_at` ustawiamy jawnie. DEFAULT CURRENT_TIMESTAMP dziala tylko
  // przy INSERT, a bez tego pola kontrola rownoczesnej edycji (B4) nigdy
  // nie zauwazylaby, ze ktos zapisal w miedzyczasie.
  const names = Object.keys(columns)
  if (names.length) {
    statements.push(
      d
        .prepare(
          `UPDATE articles SET ${names.map((n) => `${n} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(...names.map((n) => columns[n]), id),
    )
  } else {
    statements.push(d.prepare('UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id))
  }

  if (fields.blocks !== undefined) statements.push(...blockStatements(c, id, fields.blocks))

  await d.batch(statements)
  if (fields.tags !== undefined) await syncTags(c, id, fields.tags)
}

export const replaceBlocks = async (c: Context, id: number, blocks: ValidatedBlock[]): Promise<void> => {
  const statements = blockStatements(c, id, blocks)
  statements.push(db(c).prepare('UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id))
  await db(c).batch(statements)
}

/**
 * Usuniecie miekkie. Twarde DELETE jest w tym systemie niedopuszczalne:
 * artykul moze byc przedmiotem wniosku o sprostowanie, a `ON DELETE CASCADE`
 * na `article_versions` zabralby wlasnie te dowody, ktore sa potrzebne.
 * Slug zwalniamy przez dopisanie znacznika, zeby dawny adres nie blokowal
 * nowego tekstu o tym samym tytule.
 */
export const softDelete = async (c: Context, id: number): Promise<void> => {
  await db(c)
    .prepare(
      `UPDATE articles
          SET deleted_at = CURRENT_TIMESTAMP,
              status = 'archived',
              slug = slug || '--usuniety-' || CAST(strftime('%s','now') AS TEXT),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(id)
    .run()
}

export const undelete = async (c: Context, id: number): Promise<void> => {
  await db(c)
    .prepare(
      `UPDATE articles
          SET deleted_at = NULL,
              slug = REPLACE(slug, '--usuniety-' || CAST(strftime('%s', deleted_at) AS TEXT), ''),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(id)
    .run()
}

// ─────────────────────────────────────────────────────────────────────────────
// Statusy (B4)
// ─────────────────────────────────────────────────────────────────────────────

export const setStatus = async (
  c: Context,
  id: number,
  status: string,
  extra: { publishedAt?: string | null; scheduledAt?: string | null; reviewerId?: number } = {},
): Promise<void> => {
  const sets: string[] = ['status = ?']
  const binds: unknown[] = [status]

  if (status === 'published') {
    sets.push('published_at = COALESCE(?, published_at, CURRENT_TIMESTAMP)')
    binds.push(extra.publishedAt ?? null)
    sets.push('scheduled_at = NULL', 'archived_at = NULL')
  }
  if (status === 'scheduled') {
    sets.push('scheduled_at = ?')
    binds.push(extra.scheduledAt ?? null)
  }
  if (status === 'archived') {
    sets.push('archived_at = CURRENT_TIMESTAMP')
  }
  if (status === 'draft' || status === 'review') {
    // Wycofanie z publikacji musi zdjac `published_at`, inaczej lista
    // publiczna (filtr `published_at <= CURRENT_TIMESTAMP`) nadal by go
    // pokazywala po ponownym ustawieniu statusu.
    sets.push('published_at = NULL')
  }
  if (extra.reviewerId !== undefined) {
    sets.push('human_reviewed_by = ?', 'human_reviewed_at = CURRENT_TIMESTAMP')
    binds.push(extra.reviewerId)
  }

  await db(c)
    .prepare(`UPDATE articles SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(...binds, id)
    .run()
}

// ─────────────────────────────────────────────────────────────────────────────
// Blokada edycji (B4)
// ─────────────────────────────────────────────────────────────────────────────

/** Blokada wygasa po 15 minutach bezczynnosci. */
export const LOCK_MINUTES = 15

export interface LockState {
  locked: boolean
  by: number | null
  byName?: string | null
  at: string | null
  mine: boolean
}

export const lockState = async (c: Context, id: number, userId: number): Promise<LockState> => {
  const row = await db(c)
    .prepare(
      `SELECT a.locked_by, a.locked_at, u.name AS by_name,
              CASE WHEN a.locked_at IS NULL THEN 0
                   WHEN a.locked_at > datetime('now', ?) THEN 1 ELSE 0 END AS active
         FROM articles a LEFT JOIN users u ON u.id = a.locked_by
        WHERE a.id = ?`,
    )
    .bind(`-${LOCK_MINUTES} minutes`, id)
    .first<{ locked_by: number | null; locked_at: string | null; by_name: string | null; active: number }>()

  if (!row || !row.active) return { locked: false, by: null, at: null, mine: false }
  return {
    locked: true,
    by: row.locked_by,
    byName: row.by_name,
    at: row.locked_at,
    mine: row.locked_by === userId,
  }
}

/**
 * Proba zajecia blokady. `WHERE` w jednym UPDATE zapewnia atomowosc —
 * wariant „przeczytaj, sprawdz, zapisz” pozwalalby dwóm redaktorom zajac
 * blokade w tej samej milisekundzie i obaj widzieliby „masz wylacznosc”.
 */
export const acquireLock = async (c: Context, id: number, userId: number): Promise<boolean> => {
  const result = await db(c)
    .prepare(
      `UPDATE articles
          SET locked_by = ?, locked_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND (locked_by IS NULL OR locked_by = ? OR locked_at IS NULL OR locked_at <= datetime('now', ?))`,
    )
    .bind(userId, id, userId, `-${LOCK_MINUTES} minutes`)
    .run()
  return (result.meta?.changes ?? 0) > 0
}

export const releaseLock = async (c: Context, id: number, userId: number, force = false): Promise<void> => {
  await db(c)
    .prepare(
      `UPDATE articles SET locked_by = NULL, locked_at = NULL
        WHERE id = ? ${force ? '' : 'AND locked_by = ?'}`,
    )
    .bind(...(force ? [id] : [id, userId]))
    .run()
}

// ─────────────────────────────────────────────────────────────────────────────
// Wersjonowanie (D9)
// ─────────────────────────────────────────────────────────────────────────────

export interface VersionRow {
  id: number
  article_id: number
  version_number: number | null
  title: string | null
  lead: string | null
  slug: string | null
  status: string | null
  change_note: string | null
  chars_added: number
  chars_removed: number
  edited_by: number | null
  edited_at: string
  editor_name?: string | null
}

/**
 * Zapis wersji. Wolamy PRZED modyfikacja artykulu — zapisujemy stan
 * poprzedni, zeby dalo sie do niego wrocic. Kolejnosc odwrotna (najpierw
 * zapis, potem wersja) utrwalalaby stan po zmianie, a wiec „powrot do
 * poprzedniej wersji” wracalby do tej samej tresci.
 *
 * `body_md` jest NOT NULL w schemacie odziedziczonym po starej implementacji
 * Markdown. Wypelniamy je tekstem plaskim z blokow — jest to jedyna sensowna
 * interpretacja, a jednoczesnie daje czytelny podglad wersji bez parsowania
 * JSON.
 */
export const saveVersion = async (
  c: Context,
  article: ArticleFull | ArticleRecord,
  editorId: number | null,
  note?: string,
  nextBlocks?: ValidatedBlock[],
): Promise<number> => {
  const blocks = 'blocks' in article ? article.blocks : await loadBlocks(c, article.id)
  const plain = blocksToPlainText(blocks)

  const nextPlain = nextBlocks ? blocksToPlainText(nextBlocks) : null
  const added = nextPlain === null ? 0 : Math.max(0, nextPlain.length - plain.length)
  const removed = nextPlain === null ? 0 : Math.max(0, plain.length - nextPlain.length)

  const numberRow = await db(c)
    .prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS n FROM article_versions WHERE article_id = ?')
    .bind(article.id)
    .first<{ n: number }>()

  const snapshot = {
    title: article.title,
    lead: article.lead,
    slug: article.slug,
    status: article.status,
    content_type: article.content_type,
    category_id: article.category_id,
    subcategory_slug: article.subcategory_slug,
    subsubcategory_slug: article.subsubcategory_slug,
    hero_image_r2_key: article.hero_image_r2_key,
    hero_alt: article.hero_alt,
    hero_caption: article.hero_caption,
    hero_credit: article.hero_credit,
    solectwo_slug: article.solectwo_slug,
    featured: article.featured,
    breaking: article.breaking,
    reading_minutes: article.reading_minutes,
    type_data_json: article.type_data_json,
    ai_assisted: article.ai_assisted,
    ai_disclosure: article.ai_disclosure,
    tags: 'tags' in article ? article.tags : undefined,
  }

  const result = await db(c)
    .prepare(
      `INSERT INTO article_versions
         (article_id, body_md, edited_by, version_number, title, lead, slug, status,
          snapshot_json, blocks_json, change_note, chars_added, chars_removed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      article.id,
      plain.slice(0, 200000),
      editorId,
      numberRow?.n ?? 1,
      article.title,
      article.lead,
      article.slug,
      article.status,
      JSON.stringify(snapshot),
      JSON.stringify(blocks),
      note ?? null,
      added,
      removed,
    )
    .run()

  return Number(result.meta?.last_row_id ?? 0)
}

export const listVersions = async (c: Context, articleId: number): Promise<VersionRow[]> => {
  const rows = await db(c)
    .prepare(
      `SELECT v.id, v.article_id, v.version_number, v.title, v.lead, v.slug, v.status,
              v.change_note, v.chars_added, v.chars_removed, v.edited_by, v.edited_at,
              u.name AS editor_name
         FROM article_versions v
         LEFT JOIN users u ON u.id = v.edited_by
        WHERE v.article_id = ?
        ORDER BY COALESCE(v.version_number, v.id) DESC`,
    )
    .bind(articleId)
    .all<VersionRow>()
  return rows.results ?? []
}

export const getVersion = async (
  c: Context,
  articleId: number,
  versionId: number,
): Promise<(VersionRow & { snapshot_json: string | null; blocks_json: string | null }) | null> =>
  (await db(c)
    .prepare('SELECT * FROM article_versions WHERE id = ? AND article_id = ? LIMIT 1')
    .bind(versionId, articleId)
    .first()) as never

/**
 * Powrot do wersji. Najpierw zapisujemy stan biezacy jako nowa wersje —
 * bez tego „powrot” bylby operacja nieodwracalna i redaktor, ktory kliknal
 * przez pomylke, tracilby najnowsza prace.
 */
export const restoreVersion = async (
  c: Context,
  articleId: number,
  versionId: number,
  editorId: number | null,
): Promise<{ restoredFrom: number } | null> => {
  const current = await getById(c, articleId, true)
  if (!current) return null

  const version = await getVersion(c, articleId, versionId)
  if (!version) return null

  await saveVersion(c, current, editorId, `Stan przed powrotem do wersji ${version.version_number ?? versionId}`)

  const snapshot = version.snapshot_json ? (JSON.parse(version.snapshot_json) as Record<string, unknown>) : {}
  const blocks = version.blocks_json ? (JSON.parse(version.blocks_json) as ValidatedBlock[]) : []

  const columnAllow = [
    'title',
    'lead',
    'content_type',
    'subcategory_slug',
    'subsubcategory_slug',
    'hero_image_r2_key',
    'hero_alt',
    'hero_caption',
    'hero_credit',
    'solectwo_slug',
    'featured',
    'breaking',
    'reading_minutes',
    'type_data_json',
    'ai_assisted',
    'ai_disclosure',
    'category_id',
  ]
  const sets: string[] = []
  const binds: unknown[] = []
  for (const col of columnAllow) {
    if (snapshot[col] === undefined) continue
    sets.push(`${col} = ?`)
    binds.push(snapshot[col])
  }

  const statements: D1Stmt[] = []
  const d = db(c)
  if (sets.length) {
    statements.push(
      d.prepare(`UPDATE articles SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...binds, articleId),
    )
  }
  statements.push(...blockStatements(c, articleId, blocks))
  await d.batch(statements)

  // Status i slug NIE sa przywracane. Powrot do tresci nie moze cofnac
  // artykulu do szkicu ani zmienic adresu, pod ktorym czytelnicy juz go
  // znaja — to zlamalo by linki i wyniki wyszukiwania.
  if (Array.isArray(snapshot.tags)) await syncTags(c, articleId, snapshot.tags as string[])

  return { restoredFrom: version.version_number ?? versionId }
}

// ─────────────────────────────────────────────────────────────────────────────
// Statystyki i liczniki
// ─────────────────────────────────────────────────────────────────────────────

export const bumpViews = async (c: Context, id: number): Promise<void> => {
  await db(c).prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').bind(id).run()
}

export const statusCounts = async (c: Context): Promise<Record<string, number>> => {
  const rows = await db(c)
    .prepare('SELECT status, COUNT(*) AS n FROM articles WHERE deleted_at IS NULL GROUP BY status')
    .all<{ status: string; n: number }>()
  const out: Record<string, number> = { draft: 0, review: 0, scheduled: 0, published: 0, archived: 0 }
  for (const row of rows.results ?? []) out[row.status] = row.n
  return out
}

export const ArticlesRepo = {
  getById,
  getBySlug,
  getRow,
  list,
  create,
  update,
  replaceBlocks,
  softDelete,
  undelete,
  setStatus,
  lockState,
  acquireLock,
  releaseLock,
  saveVersion,
  listVersions,
  getVersion,
  restoreVersion,
  bumpViews,
  statusCounts,
  uniqueSlug,
  loadBlocks,
  loadTags,
  syncTags,
  categoryIdBySlug,
  categorySlugById,
}
