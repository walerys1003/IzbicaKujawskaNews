// ============================================================================
// IZBICA24.PL v4 — ROUTER PUBLICZNY
// Kolejność tras jest istotna: statyczne → 3 poziomy taksonomii → catch-all.
// ============================================================================

import { Hono } from 'hono'
import { rendererV4 } from './renderer'
import { Shell } from './components/Layout'
import { HomeV4 } from './pages/Home'
import {
  CategoryPageV4,
  SubcategoryPageV4,
  ThirdLevelPageV4,
  ArticleListPage,
} from './pages/Category'
import { ArticlePageV4, GalleryPageV4 } from './pages/Article'
import { SolectwaPageV4, SearchPageV4, NotFoundV4 } from './pages/Misc'
import {
  CATEGORIES,
  SOLECTWA,
  findCategory,
  findSubcategory,
  findThirdLevel,
} from './taxonomy'
import {
  byCategory,
  bySubcategory,
  byThirdLevel,
  bySolectwo,
  byTag,
  findArticleV4,
  findGallery,
  mostRead,
  relatedArticles,
  searchV4,
  GALLERIES,
  latest,
} from './content-db'
import type { Gallery } from './content-types'
import { articleUrl } from './content-types'

const PER_PAGE = 12
const app = new Hono()

app.use('*', rendererV4)

const galleryMap: Record<string, Gallery> = Object.fromEntries(GALLERIES.map((g) => [g.id, g]))

const pageParam = (v: string | undefined) => {
  const n = parseInt(v || '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}
const slice = <T,>(arr: T[], page: number) => arr.slice((page - 1) * PER_PAGE, page * PER_PAGE)

// ════════════════════════════════════════════════════ STRONA GŁÓWNA
app.get('/', (c) =>
  c.render(
    <Shell>
      <HomeV4 />
    </Shell>,
    {
      title: 'Izbica24.pl — Niezależny portal informacyjny gminy Izbica Kujawska',
      description:
        'Aktualne wiadomości z Izbicy Kujawskiej. Samorząd, Kujawianka, kultura, historia, sołectwa.',
    }
  )
)

// ════════════════════════════════════════════════════════ WYSZUKIWANIE
app.get('/szukaj', (c) => {
  const q = c.req.query('q') || ''
  const page = pageParam(c.req.query('page'))
  const results = searchV4(q)
  return c.render(
    <Shell>
      <SearchPageV4
        query={q}
        articles={slice(results, page)}
        total={results.length}
        page={page}
      />
    </Shell>,
    {
      title: q ? `Szukaj: ${q} — Izbica24.pl` : 'Wyszukiwarka — Izbica24.pl',
      description: `Wyniki wyszukiwania dla: ${q}`,
    }
  )
})

// ══════════════════════════════════════════════════════════ SOŁECTWA
app.get('/solectwa', (c) =>
  c.render(
    <Shell>
      <SolectwaPageV4 />
    </Shell>,
    {
      title: '34 sołectwa gminy Izbica Kujawska — Izbica24.pl',
      description:
        'Sadłno, Bierzyn, Pasieka, Wietrzychowice, Modzerowo i pozostałe sołectwa gminy Izbica Kujawska.',
    }
  )
)

app.get('/solectwa/:slug', (c) => {
  const slug = c.req.param('slug')
  const sol = SOLECTWA.find((s) => s.slug === slug)
  if (!sol) {
    c.status(404)
    return c.render(
      <Shell>
        <NotFoundV4 path={c.req.path} />
      </Shell>,
      { title: '404 — Izbica24.pl' }
    )
  }
  const page = pageParam(c.req.query('page'))
  const items = bySolectwo(slug)
  return c.render(
    <Shell>
      <ArticleListPage
        title={`Sołectwo ${sol.name}`}
        badge="Sołectwo"
        lead={`Wszystkie materiały portalu dotyczące sołectwa ${sol.name} w gminie Izbica Kujawska.`}
        articles={slice(items, page)}
        total={items.length}
        page={page}
        base={`/solectwa/${slug}`}
        colorVar="var(--c-samorzad)"
        emptyText={`Nie mamy jeszcze materiałów z sołectwa ${sol.name}. Masz temat? Napisz do redakcji.`}
      />
    </Shell>,
    {
      title: `Sołectwo ${sol.name} — Izbica24.pl`,
      description: `Wiadomości z sołectwa ${sol.name}, gmina Izbica Kujawska.`,
    }
  )
})

// ══════════════════════════════════════════════════════════════ TAGI
app.get('/tag/:tag', (c) => {
  const tag = decodeURIComponent(c.req.param('tag'))
  const page = pageParam(c.req.query('page'))
  const items = byTag(tag)
  return c.render(
    <Shell>
      <ArticleListPage
        title={`#${tag}`}
        badge="Tag"
        lead={`Materiały oznaczone tagiem „${tag}”.`}
        articles={slice(items, page)}
        total={items.length}
        page={page}
        base={`/tag/${encodeURIComponent(tag)}`}
      />
    </Shell>,
    { title: `Tag: ${tag} — Izbica24.pl` }
  )
})

// ═══════════════════════════════════════════════════ GALERIE (pełny widok)
app.get('/multimedia/galerie/:section/:slug', (c) => {
  const slug = c.req.param('slug')
  const g = findGallery(slug)
  if (g) {
    return c.render(
      <Shell activeCategory="multimedia">
        <GalleryPageV4 gallery={g} related={latest(3)} />
      </Shell>,
      {
        title: `${g.title} — galeria — Izbica24.pl`,
        description: g.description,
        ogImage: g.cover,
      }
    )
  }
  // brak galerii → potraktuj jako artykuł 3. poziomu
  const art = findArticleV4(slug)
  if (art) return renderArticle(c, art)
  c.status(404)
  return c.render(
    <Shell>
      <NotFoundV4 path={c.req.path} />
    </Shell>,
    { title: '404 — Izbica24.pl' }
  )
})

// ════════════════════════════════════ HELPER: RENDER ARTYKUŁU
function renderArticle(c: any, a: NonNullable<ReturnType<typeof findArticleV4>>) {
  const cat = findCategory(a.category)!
  return c.render(
    <Shell activeCategory={a.category}>
      <ArticlePageV4
        article={a}
        related={relatedArticles(a, 3)}
        mostRead={mostRead(5)}
        sameCategory={byCategory(a.category)
          .filter((x) => x.slug !== a.slug)
          .slice(0, 4)}
        galleries={galleryMap}
      />
    </Shell>,
    {
      title: `${a.title} — ${cat.title} — Izbica24.pl`,
      description: a.lede.slice(0, 300),
      ogImage: a.heroImage,
      canonical: `https://izbica24.pl${articleUrl(a)}`,
    }
  )
}

// ══════════════════════════════════ TAKSONOMIA — 3 POZIOMY + ARTYKUŁY
// Rejestrujemy trasy jawnie dla każdej kategorii, aby uniknąć kolizji
// z trasami statycznymi (/szukaj, /solectwa, /admin, /api…).
for (const cat of CATEGORIES) {
  // /kategoria
  app.get(cat.path, (c) => {
    const page = pageParam(c.req.query('page'))
    const all = byCategory(cat.slug)
    const counts: Record<string, number> = {}
    const covers: Record<string, string | undefined> = {}
    for (const s of cat.subcategories) {
      const items = bySubcategory(cat.slug, s.slug)
      counts[s.slug] = items.length
      covers[s.slug] = items[0]?.heroImage || all[0]?.heroImage
    }
    return c.render(
      <Shell activeCategory={cat.slug}>
        <CategoryPageV4
          cat={cat}
          articles={slice(all, page)}
          total={all.length}
          page={page}
          counts={counts}
          covers={covers}
        />
      </Shell>,
      {
        title: `${cat.title} — Izbica24.pl`,
        description: cat.lead,
        ogImage: all[0]?.heroImage,
      }
    )
  })

  for (const sub of cat.subcategories) {
    // /kategoria/podkategoria
    app.get(sub.path, (c) => {
      const page = pageParam(c.req.query('page'))
      const all = bySubcategory(cat.slug, sub.slug)
      const childCounts: Record<string, number> = {}
      const childCovers: Record<string, string | undefined> = {}
      for (const ch of sub.children ?? []) {
        const items = byThirdLevel(cat.slug, sub.slug, ch.slug)
        childCounts[ch.slug] = items.length
        childCovers[ch.slug] = items[0]?.heroImage || all[0]?.heroImage
      }
      return c.render(
        <Shell activeCategory={cat.slug}>
          <SubcategoryPageV4
            cat={cat}
            sub={sub}
            articles={slice(all, page)}
            total={all.length}
            page={page}
            childCounts={childCounts}
            childCovers={childCovers}
          />
        </Shell>,
        {
          title: `${sub.title} — ${cat.title} — Izbica24.pl`,
          description: sub.description,
          ogImage: all[0]?.heroImage,
        }
      )
    })

    // 3. poziom
    for (const ch of sub.children ?? []) {
      app.get(ch.path, (c) => {
        const page = pageParam(c.req.query('page'))
        const all = byThirdLevel(cat.slug, sub.slug, ch.slug)
        return c.render(
          <Shell activeCategory={cat.slug}>
            <ThirdLevelPageV4
              cat={cat}
              sub={sub}
              child={ch}
              articles={slice(all, page)}
              total={all.length}
              page={page}
            />
          </Shell>,
          {
            title: `${ch.title} — ${sub.title} — Izbica24.pl`,
            description: ch.description,
          }
        )
      })
    }

    // /kategoria/podkategoria/:slug — artykuł
    app.get(`${sub.path}/:slug`, (c) => {
      const slug = c.req.param('slug')
      const a = findArticleV4(slug)
      if (a) return renderArticle(c, a)
      // może to 3. poziom obsłużony wyżej — jeśli nie, 404
      c.status(404)
      return c.render(
        <Shell activeCategory={cat.slug}>
          <NotFoundV4 path={c.req.path} />
        </Shell>,
        { title: '404 — Izbica24.pl' }
      )
    })
  }

  // /kategoria/:slug — artykuł bez podkategorii
  app.get(`${cat.path}/:slug`, (c) => {
    const slug = c.req.param('slug')
    const a = findArticleV4(slug)
    if (a) return renderArticle(c, a)
    c.status(404)
    return c.render(
      <Shell activeCategory={cat.slug}>
        <NotFoundV4 path={c.req.path} />
      </Shell>,
      { title: '404 — Izbica24.pl' }
    )
  })
}

export default app
