/**
 * FAZA 2 / A4 + D4 — publiczny odczyt artykulow z D1.
 *
 * Zastepuje `api.get('/articles')` i `api.get('/articles/:slug')`, ktore
 * czytaly tablice `ARTICLES` z `src/data-articles.ts`. Konsekwencja tamtego
 * rozwiazania byla nastepujaca: cokolwiek redakcja zapisala w bazie, portal
 * i tak pokazywal te same 30 tekstow wkompilowanych w plik zrodlowy.
 * Publikacja nie mogla dzialac, bo nie istniala droga od bazy do strony.
 *
 * Rozdzielenie tras publicznych i redakcyjnych:
 *   • tutaj (`/api/v1/articles`)       — tylko `published`, adresowanie po SLUGU
 *   • tam  (`/api/v1/admin/articles`)  — wszystkie statusy, adresowanie po ID
 *
 * Rozdzielenie nie jest kosmetyczne. Gdyby jedna trasa obslugiwala oba
 * przypadki, `GET /articles/:x` musialoby zgadywac, czy `:x` to slug czy
 * identyfikator — a przy artykule o slugu „123” zgadywanie byloby zawodne.
 * Osobne przestrzenie daja tez pewnosc, ze trasa publiczna NIE MA fizycznej
 * mozliwosci pokazania szkicu: filtr statusu jest w niej wymuszony
 * (`publicOnly: true`), nie przekazywany z zapytania.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, fail, requireDb } from '../../lib/http/envelope'
import { parseQuery } from '../../lib/validation/core'
import { pageWindow } from '../../lib/validation/primitives'
import { articleListQuerySchema } from '../../lib/validation/schemas/articles'
import { ArticlesRepo, type ArticleListItem } from '../../db/repositories/articles'

const route = new Hono<AppEnv>()

/**
 * Adres artykulu na portalu.
 *
 * POPRAWKA: wersja poprzednia skladala adres wprost z kolumn bazy:
 *
 *     return `/${a.category_slug}/${a.slug}`
 *
 * Kategorie bazy (21) nie pokrywaja sie z kategoriami szaty v4 (11), a router
 * rejestruje trasy tylko dla tych drugich. Pomiar wszystkich 30 adresow
 * zwroconych przez `GET /api/v1/articles?limit=30`: 9 x 200, 21 x 404.
 * `inwestycje` z bazy dawalo `/inwestycje/<slug>` (404), gdy artykul jest pod
 * `/wiadomosci/inwestycje/<slug>` (200).
 *
 * Teraz uzywamy tego samego mapowania, ktore stosuja strony i mapa witryny,
 * wiec API i portal nie moga sie juz rozjechac.
 */
export { adresArtykuluZBazy as publicUrl } from '../../v4/mapowanie-kategorii'
import { adresArtykuluZBazy } from '../../v4/mapowanie-kategorii'

const card = (a: ArticleListItem) => ({
  id: a.id,
  slug: a.slug,
  title: a.title,
  lede: a.lead,
  type: a.content_type,
  category: a.category_slug,
  categoryName: a.category_name,
  subcategory: a.subcategory_slug,
  heroImage: a.hero_image_r2_key,
  heroAlt: a.hero_alt,
  solectwo: a.solectwo_slug,
  featured: a.featured === 1,
  breaking: a.breaking === 1,
  author: a.author_name,
  publishedAt: a.published_at,
  readingMinutes: a.reading_minutes,
  viewCount: a.view_count,
  commentCount: a.comment_count,
  aiAssisted: a.ai_assisted === 1,
  url: adresArtykuluZBazy(a),
})

// ─────────────────────────────────────────────────────────────────────────────
// Lista
// ─────────────────────────────────────────────────────────────────────────────

route.get('/', async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const q = parseQuery(c, articleListQuerySchema)
  if (q instanceof Response) return q

  const win = pageWindow(q)
  const result = await ArticlesRepo.list(c, {
    category: q.category,
    subcategory: q.subcategory,
    author: q.author,
    tag: q.tag,
    solectwo: q.solectwo,
    type: q.type,
    q: q.q,
    featured: q.featured,
    sort: q.sort,
    dir: q.dir,
    limit: win.limit,
    offset: win.offset,
    // Wymuszone. `q.status` i `q.includeDeleted` sa tu swiadomie ignorowane —
    // gdyby dzialaly, `?status=draft` wystawiloby szkice calego internetu.
    publicOnly: true,
  })

  return ok(c, result.items.map(card), {
    total: result.total,
    limit: win.limit,
    offset: win.offset,
    page: win.page,
    pages: Math.max(1, Math.ceil(result.total / win.limit)),
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Szczegoly
// ─────────────────────────────────────────────────────────────────────────────

route.get('/:slug', async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const slug = c.req.param('slug')
  const article = await ArticlesRepo.getBySlug(c, slug)

  if (!article) return fail(c, 'not_found', 'Nie znaleziono artykulu pod tym adresem.')

  /**
   * Artykul nieopublikowany zwracamy jako 404, nie 403. Odpowiedz „nie masz
   * dostepu” potwierdzalaby, ze taki tekst istnieje — a to informacja
   * redakcyjna: konkurencja dowiadywalaby sie o przygotowywanym materiale
   * po samym zgadnieciu sluga.
   */
  const visible =
    article.status === 'published' &&
    (!article.published_at || Date.parse(article.published_at.replace(' ', 'T') + 'Z') <= Date.now())
  if (!visible) return fail(c, 'not_found', 'Nie znaleziono artykulu pod tym adresem.')

  // Licznik odslon — bez await na koncu byloby to ucinane przez runtime
  // Workerow po zwrocie odpowiedzi.
  await ArticlesRepo.bumpViews(c, article.id)

  const [related] = await Promise.all([
    ArticlesRepo.list(c, {
      category: article.category_slug ?? undefined,
      limit: 4,
      offset: 0,
      publicOnly: true,
      sort: 'published_at',
      dir: 'desc',
    }),
  ])

  return ok(c, {
    id: article.id,
    slug: article.slug,
    title: article.title,
    shortTitle: article.short_title,
    lede: article.lead,
    type: article.content_type,
    category: article.category_slug,
    categoryName: article.category_name,
    subcategory: article.subcategory_slug,
    subsubcategory: article.subsubcategory_slug,
    heroImage: article.hero_image_r2_key,
    heroAlt: article.hero_alt,
    heroCaption: article.hero_caption,
    heroCredit: article.hero_credit,
    solectwo: article.solectwo_slug,
    featured: article.featured === 1,
    breaking: article.breaking === 1,
    tags: article.tags,
    blocks: article.blocks,
    readingMinutes: article.reading_minutes,
    viewCount: article.view_count + 1,
    commentCount: article.comment_count,
    /** AI11 — oznaczenie widoczne dla czytelnika, nie tylko w panelu. */
    aiAssisted: article.ai_assisted === 1,
    aiDisclosure: article.ai_disclosure,
    author: article.author_id ? { name: article.author_name } : null,
    publishedAt: article.published_at,
    updatedAt: article.updated_at,
    url: adresArtykuluZBazy(article),
    powiazane: related.items.filter((r) => r.id !== article.id).slice(0, 3).map(card),
  })
})

export default route
