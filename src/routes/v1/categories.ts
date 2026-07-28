/**
 * FAZA 2 / A4 — kategorie z tabeli `categories`.
 *
 * Poprzednia wersja czytala `CATEGORIES_MAP` — obiekt w pliku zrodlowym —
 * i liczyla artykuly funkcja `articlesByCategory()` operujaca na statycznej
 * tablicy. Dwa skutki: dodanie kategorii wymagalo wdrozenia nowego kodu,
 * a licznik przy kazdej kategorii pokazywal liczbe tekstow demonstracyjnych,
 * nie rzeczywistych.
 *
 * Drzewo kategorii jest w bazie jednym poziomem z `parent_id`. Zwracamy je
 * jako strukture zagniezdzona, poniewaz nawigacja portalu (11 kategorii
 * glownych, 67 podkategorii) potrzebuje calego drzewa w jednym zapytaniu —
 * pobieranie dzieci osobno dla kazdej kategorii to 12 zapytan na kazde
 * wyswietlenie menu.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, fail, requireDb } from '../../lib/http/envelope'

const route = new Hono<AppEnv>()

interface CategoryRow {
  id: number
  slug: string
  name: string
  parent_id: number | null
  parent_slug: string | null
  color_hex: string | null
  icon: string | null
  order_index: number
  description: string | null
  /** Liczba OPUBLIKOWANYCH artykulow — tylko takie widzi czytelnik. */
  article_count: number
}

/**
 * Licznik liczymy podzapytaniem skorelowanym, a nie LEFT JOIN + GROUP BY.
 * Przy JOIN kategoria bez artykulow wypadalaby z wyniku przy jednoczesnym
 * filtrze `status='published'` w warunku JOIN-a, a przeniesienie filtru do
 * WHERE gubiloby puste kategorie calkowicie — nawigacja portalu straciloby
 * wtedy dzialy, w ktorych jeszcze nic nie opublikowano.
 */
const SELECT_TREE = `
  SELECT c.id, c.slug, c.name, c.parent_id, p.slug AS parent_slug,
         c.color_hex, c.icon, c.order_index, c.description,
         (SELECT COUNT(*) FROM articles a
           WHERE a.category_id = c.id
             AND a.status = 'published'
             AND a.deleted_at IS NULL) AS article_count
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id`

const shape = (r: CategoryRow) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  parent: r.parent_slug,
  color: r.color_hex,
  icon: r.icon,
  order: r.order_index,
  description: r.description,
  count: r.article_count,
})

route.get('/', async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const rows = await dbGuard.prepare(`${SELECT_TREE} ORDER BY c.order_index ASC, c.name ASC`).all<CategoryRow>()
  const all = rows.results ?? []

  const roots = all.filter((r) => r.parent_id === null)
  const tree = roots.map((rootRow) => ({
    ...shape(rootRow),
    /** Licznik dzialu = wlasne artykuly + artykuly podkategorii. */
    countTotal:
      rootRow.article_count + all.filter((x) => x.parent_id === rootRow.id).reduce((s, x) => s + x.article_count, 0),
    children: all.filter((x) => x.parent_id === rootRow.id).map(shape),
  }))

  return ok(c, tree, { total: tree.length, wszystkichPoziomow: all.length })
})

route.get('/:slug', async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const slug = c.req.param('slug')
  const row = await dbGuard.prepare(`${SELECT_TREE} WHERE c.slug = ? LIMIT 1`).bind(slug).first<CategoryRow>()
  if (!row) return fail(c, 'not_found', `Nie ma dzialu o adresie „${slug}”.`)

  const [children, articles] = await Promise.all([
    dbGuard.prepare(`${SELECT_TREE} WHERE c.parent_id = ? ORDER BY c.order_index ASC`).bind(row.id).all<CategoryRow>(),
    dbGuard.prepare(
      `SELECT a.id, a.slug, a.title, a.lead, a.hero_image_r2_key, a.hero_alt,
              a.published_at, a.reading_minutes, a.view_count, a.subcategory_slug,
              u.name AS author_name
         FROM articles a
         LEFT JOIN users u ON u.id = a.author_id
        WHERE a.category_id = ? AND a.status = 'published' AND a.deleted_at IS NULL
        ORDER BY a.published_at DESC
        LIMIT 24`,
    )
      .bind(row.id)
      .all<Record<string, unknown>>(),
  ])

  return ok(c, {
    ...shape(row),
    children: (children.results ?? []).map(shape),
    articles: (articles.results ?? []).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      lede: a.lead,
      heroImage: a.hero_image_r2_key,
      heroAlt: a.hero_alt,
      author: a.author_name,
      publishedAt: a.published_at,
      readingMinutes: a.reading_minutes,
      viewCount: a.view_count,
      url: a.subcategory_slug ? `/${row.slug}/${a.subcategory_slug}/${a.slug}` : `/${row.slug}/${a.slug}`,
    })),
  })
})

export default route
