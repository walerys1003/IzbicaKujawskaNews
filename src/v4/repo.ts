// ============================================================================
// IZBICA24.PL v4 — WARSTWA ZAPYTAŃ (REPOZYTORIUM TREŚCI)
// Jedno API dla strony głównej, kategorii, podkategorii i artykułów.
// Docelowo te same sygnatury obsłuży D1 — komponenty nie zmienią się.
// ============================================================================

import type { Article, ArticleCard, Gallery, MediaAsset } from './content-types'
import { articleUrl, toCard } from './content-types'
import { ARTICLES_CORE, AUTHORS, TICKER } from './content'
import { ARTICLES_MORE, GALLERIES, MEDIA_LIBRARY } from './content-2'
import { CATEGORY_BY_SLUG, findCategory, findSubcategory } from './taxonomy'

/** Pełna baza materiałów portalu */
export const ALL_ARTICLES: Article[] = [...ARTICLES_CORE, ...ARTICLES_MORE]

export { AUTHORS, TICKER, GALLERIES, MEDIA_LIBRARY }

const BY_SLUG = new Map<string, Article>()
for (const a of ALL_ARTICLES) BY_SLUG.set(a.slug, a)

const PUBLISHED = ALL_ARTICLES.filter((a) => a.status === 'published')

function ts(a: Article): number {
  const t = Date.parse(a.publishedAtISO)
  return Number.isNaN(t) ? 0 : t
}

const BY_DATE = [...PUBLISHED].sort((a, b) => ts(b) - ts(a))

// ─────────────────────────────────────────────────────────── POBIERANIE
export function getArticle(slug: string): Article | undefined {
  const a = BY_SLUG.get(slug)
  return a && a.status === 'published' ? a : undefined
}

export function getArticleById(id: string): Article | undefined {
  return ALL_ARTICLES.find((a) => a.id === id)
}

export function latest(limit = 10): Article[] {
  return BY_DATE.slice(0, limit)
}

export function byCategory(catSlug: string, limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.category === catSlug)
  return limit ? list.slice(0, limit) : list
}

export function bySubcategory(catSlug: string, subSlug: string, limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.category === catSlug && a.subcategory === subSlug)
  return limit ? list.slice(0, limit) : list
}

export function byThirdLevel(
  catSlug: string,
  subSlug: string,
  childSlug: string,
  limit?: number
): Article[] {
  const list = BY_DATE.filter(
    (a) => a.category === catSlug && a.subcategory === subSlug && a.subsubcategory === childSlug
  )
  return limit ? list.slice(0, limit) : list
}

export function byType(type: Article['type'], limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.type === type)
  return limit ? list.slice(0, limit) : list
}

export function bySolectwo(slug: string, limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.solectwo === slug)
  return limit ? list.slice(0, limit) : list
}

export function byAuthor(slug: string, limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.author.slug === slug)
  return limit ? list.slice(0, limit) : list
}

export function byTag(tag: string, limit?: number): Article[] {
  const t = tag.toLowerCase()
  const list = BY_DATE.filter((a) => a.tags.some((x) => x.toLowerCase() === t))
  return limit ? list.slice(0, limit) : list
}

export function featured(limit = 5): Article[] {
  return BY_DATE.filter((a) => a.featured).slice(0, limit)
}

export function mostRead(limit = 5): Article[] {
  return [...PUBLISHED].sort((a, b) => b.views - a.views).slice(0, limit)
}

export function incidents(limit?: number): Article[] {
  const list = BY_DATE.filter((a) => a.type === 'live')
  return limit ? list.slice(0, limit) : list
}

export function getGallery(idOrSlug: string): Gallery | undefined {
  return GALLERIES.find((g) => g.id === idOrSlug || g.slug === idOrSlug)
}

export function relatedTo(a: Article, limit = 4): Article[] {
  const scored = PUBLISHED.filter((x) => x.slug !== a.slug).map((x) => {
    let score = 0
    if (x.category === a.category) score += 3
    if (a.subcategory && x.subcategory === a.subcategory) score += 3
    if (a.solectwo && x.solectwo === a.solectwo) score += 2
    score += x.tags.filter((t) => a.tags.includes(t)).length * 2
    return { x, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((p, q) => q.score - p.score || ts(q.x) - ts(p.x))
    .slice(0, limit)
    .map((s) => s.x)
}

export function search(query: string, limit = 30): Article[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  const scored = PUBLISHED.map((a) => {
    const hay = `${a.title} ${a.lede} ${a.tags.join(' ')} ${a.solectwo ?? ''} ${a.category}`.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (a.title.toLowerCase().includes(t)) score += 5
      else if (hay.includes(t)) score += 2
    }
    return { a, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((p, q2) => q2.score - p.score || ts(q2.a) - ts(p.a))
    .slice(0, limit)
    .map((s) => s.a)
}

// ─────────────────────────────────────────────────────────── KONWERSJE
export function card(a: Article): ArticleCard {
  const cat = CATEGORY_BY_SLUG[a.category]
  const sub = a.subcategory ? findSubcategory(a.category, a.subcategory) : undefined
  return toCard(a, cat?.title ?? a.category, cat?.tagClass ?? '', sub?.subcategory.title)
}

export function cards(list: Article[]): ArticleCard[] {
  return list.map(card)
}

/** Etykieta tagu na karcie: „Kategoria · Podkategoria” */
export function tagLabel(a: Article): string {
  const cat = CATEGORY_BY_SLUG[a.category]
  const sub = a.subcategory ? findSubcategory(a.category, a.subcategory) : undefined
  if (!cat) return a.category
  return sub ? `${cat.title} · ${sub.subcategory.title}` : cat.title
}

export function tagClassOf(a: Article): string {
  return CATEGORY_BY_SLUG[a.category]?.tagClass ?? ''
}

export function urlOf(a: Article): string {
  return articleUrl(a)
}

// ────────────────────────────────────────── DANE DLA MEGA-MENU (belka górna)
export interface MegaSubEntry {
  slug: string
  title: string
  path: string
  description: string
  articles: Array<{
    slug: string
    url: string
    title: string
    lede: string
    image: string
    publishedAt: string
    tagLabel: string
  }>
}

/**
 * Dla każdej podkategorii kategorii zwraca listę do 4 artykułów ze zdjęciem —
 * karuzela w rozwijanym menu belki górnej.
 */
export function megaMenuFor(catSlug: string): MegaSubEntry[] {
  const cat = findCategory(catSlug)
  if (!cat) return []
  const fallbackPool = byCategory(catSlug)

  const withImage = fallbackPool.filter((a) => a.heroImage)
  const globalPool = BY_DATE.filter((a) => a.heroImage)

  return cat.subcategories.map((s, idx) => {
    const list = bySubcategory(catSlug, s.slug, 4).filter((a) => a.heroImage)
    // Dopełnienie do 4 kart — najpierw z tej samej kategorii, potem z całego portalu
    const seen = new Set(list.map((a) => a.slug))
    const fillFrom = (pool: Article[]) => {
      const rotated = pool.length ? [...pool.slice(idx % pool.length), ...pool.slice(0, idx % pool.length)] : []
      for (const a of rotated) {
        if (list.length >= 4) break
        if (seen.has(a.slug)) continue
        seen.add(a.slug)
        list.push(a)
      }
    }
    fillFrom(withImage)
    fillFrom(globalPool)

    return {
      slug: s.slug,
      title: s.title,
      path: s.path,
      description: s.description,
      articles: list.map((a) => ({
        slug: a.slug,
        url: articleUrl(a),
        title: a.shortTitle ?? a.title,
        lede: a.lede.length > 150 ? a.lede.slice(0, 147).trimEnd() + '…' : a.lede,
        image: a.heroImage!,
        publishedAt: a.publishedAt,
        tagLabel: tagLabel(a),
      })),
    }
  })
}

/** Cała mapa mega-menu dla wszystkich kategorii — serializowana do JSON dla JS */
export function megaMenuAll(): Record<string, MegaSubEntry[]> {
  const out: Record<string, MegaSubEntry[]> = {}
  for (const slug of Object.keys(CATEGORY_BY_SLUG)) out[slug] = megaMenuFor(slug)
  return out
}

// ─────────────────────────────────────────────────── STATYSTYKI DLA ADMINA
export function stats() {
  const byCat: Record<string, number> = {}
  const byTypeCount: Record<string, number> = {}
  for (const a of ALL_ARTICLES) {
    byCat[a.category] = (byCat[a.category] ?? 0) + 1
    byTypeCount[a.type] = (byTypeCount[a.type] ?? 0) + 1
  }
  return {
    total: ALL_ARTICLES.length,
    published: PUBLISHED.length,
    drafts: ALL_ARTICLES.filter((a) => a.status === 'draft').length,
    totalViews: ALL_ARTICLES.reduce((n, a) => n + a.views, 0),
    totalComments: ALL_ARTICLES.reduce((n, a) => n + a.commentCount, 0),
    galleries: GALLERIES.length,
    media: MEDIA_LIBRARY.length,
    byCategory: byCat,
    byType: byTypeCount,
  }
}
