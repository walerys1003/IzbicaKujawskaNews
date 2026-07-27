// ============================================================================
// IZBICA24.PL v4 — ROUTER PUBLICZNY
// Kolejność tras jest istotna: statyczne → 3 poziomy taksonomii → catch-all.
// ============================================================================

import { Hono } from 'hono'
import { rendererV4 } from './renderer'
import { loadSnapshot, runWithSnapshot } from './content-source'
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
// Etap I10 — mapa gminy. Osobny plik, bo strona ma własną warstwę kliencką
// (MapLibre) i notę o źródłach danych, której pozostałe widoki nie mają.
import { MapaPageV4, type PunktMapy } from './pages/Mapa'
// Etap D5 — wyniki z indeksu FTS5 mają własny komponent, bo dysponują
// fragmentem z zaznaczonym trafieniem, czego karta ListCard nie obsługuje.
import { SearchResultsV4 } from './pages/SearchResults'
import { szukaj, podpowiedzi } from '../lib/search/search-service'
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

/**
 * Migawka tresci na zadanie (etap D4).
 *
 * Musi byc PRZED rendererem: akcesory content-db (byCategory, latest…) sa
 * synchroniczne i czytaja migawke w chwili renderowania JSX, wiec dane musza
 * juz byc w kontekscie, gdy renderer zaczyna prace.
 *
 * `runWithSnapshot` obejmuje `await next()`, a nie tylko wywolanie handlera —
 * inaczej AsyncLocalStorage stracilby kontekst na pierwszym punkcie
 * podzialu asynchronicznego i strona glowna renderowalaby sie pusta.
 */
app.use('*', async (c, next) => {
  const snap = await loadSnapshot(c)
  return runWithSnapshot(snap, () => next())
})

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
/**
 * Etap D5 — wyszukiwanie oparte o indeks FTS5 w D1, z zapasem w pamięci.
 *
 * Dlaczego nie samo FTS5: strona wyszukiwania jest jedną z najczęściej
 * odwiedzanych, a jej awaria jest dla czytelnika nieodróżnialna od awarii
 * całego portalu. Gdy indeks nie odpowie (brak bindingu, błąd zapytania),
 * spadamy do starego filtra `searchV4()` — wyniki są wtedy gorsze, ale
 * strona działa. Rozstrzygające jest pole `zrodlo` w odpowiedzi usługi.
 *
 * Dlaczego nie sam filtr w pamięci: nie znajduje odmienionych form
 * („izbica" nie trafia w „w Izbicy"), nie składa polskich liter
 * („sadlno" nie trafia w „Sadłno") i nie widzi artykułów dodanych przez
 * redakcję do bazy — a to trzy najczęstsze rzeczy, jakie wpisze
 * mieszkaniec gminy.
 */
app.get('/szukaj', async (c) => {
  const q = c.req.query('q') || ''
  const page = pageParam(c.req.query('page'))
  const kategoria = c.req.query('kategoria') || undefined
  const solectwo = c.req.query('solectwo') || undefined

  const odp = await szukaj(c.env?.DB, q, { strona: page, kategoria, solectwo })

  // Indeks zwrócił wyniki — mapujemy je na karty szaty v4.
  if (odp.zrodlo === 'fts') {
    return c.render(
      <Shell>
        <SearchResultsV4
          query={q}
          wyniki={odp.wyniki}
          total={odp.total}
          page={odp.strona}
          stron={odp.stron}
          terminy={odp.terminy}
        />
      </Shell>,
      {
        title: q ? `Szukaj: ${q} — Izbica24.pl` : 'Wyszukiwarka — Izbica24.pl',
        description: q
          ? `Wyniki wyszukiwania dla frazy „${q}” na portalu Izbica24.pl`
          : 'Wyszukiwarka portalu Izbica24.pl — wiadomości z gminy Izbica Kujawska.',
      }
    )
  }

  // Wariant zapasowy: pusta fraza albo niedostępny indeks.
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

/**
 * Podpowiedzi do pola wyszukiwania. Zwraca JSON, nie HTML — pole w nagłówku
 * odpytuje ten adres przy pisaniu.
 */
app.get('/szukaj/podpowiedzi', async (c) => {
  const q = c.req.query('q') || ''
  if (q.trim().length < 2) return c.json({ items: [] })
  const items = await podpowiedzi(c.env?.DB, q, 8)
  // Krótki cache: te same prefiksy powtarzają się masowo między czytelnikami,
  // a 30 s nieaktualności podpowiedzi nikomu nie szkodzi.
  c.header('cache-control', 'public, max-age=30')
  return c.json({ items })
})

// ══════════════════════════════════════════════════════════ SOŁECTWA
app.get('/solectwa', (c) =>
  c.render(
    <Shell>
      <SolectwaPageV4 />
    </Shell>,
    {
      title: `${SOLECTWA.length} sołectw gminy Izbica Kujawska — Izbica24.pl`,
      // Opis wyliczany z listy, nie wpisany: poprzednio wymieniał
      // „Sadłno, Bierzyn…" — nazwy, które nie są sołectwami tej gminy
      // (Bierzyn należy do gminy Boniewo). Opis meta trafia do Google,
      // więc błąd był widoczny w wynikach wyszukiwania.
      description: `${SOLECTWA.slice(0, 5)
        .map((s) => s.name)
        .join(', ')} i pozostałe sołectwa gminy Izbica Kujawska.`,
    }
  )
)

// ══════════════════════════════════════════════════════════ MAPA GMINY (I10)
//
// Trasa musi stać PRZED catch-allem kategorii (/:cat/:slug), inaczej router
// taksonomii przejąłby „/mapa" i zwrócił 404 kategorii.
//
// Dane czytamy tu bezpośrednio z D1, a NIE przez fetch do /api/v1/mapa/solectwa.
// Wywoływanie własnego API po HTTP z wnętrza Workera przy każdym renderze
// dokładałoby pełny obieg żądania (podróż przez warstwę sieciową Cloudflare)
// do czasu odpowiedzi strony, mimo że dane leżą w tej samej bazie. Trasa API
// zostaje — z niej korzysta warstwa kliencka mapy oraz zewnętrzni klienci.
//
// Zapytanie jest świadomie tym samym co w routes/v1/mapa.ts. Nie wyodrębniam
// go do wspólnej funkcji, bo oba miejsca zwracają inny kształt (koperta JSON
// vs props komponentu), a wspólna warstwa musiałaby i tak rozgałęziać się na
// końcu — zyskiem byłaby jedna linijka SELECT, kosztem dodatkowej pośredniej
// abstrakcji nad zapytaniem, które zmienia się razem ze schematem tabeli.
app.get('/mapa', async (c) => {
  let punkty: PunktMapy[] = []
  let blad: string | null = null

  const db = c.env?.DB
  if (!db) {
    blad = 'Baza danych jest niedostępna.'
  } else {
    try {
      const wynik = await db
        .prepare(
          `SELECT slug, name, soltys, news_count, latitude, longitude
             FROM solectwa
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY name COLLATE NOCASE`
        )
        .all<{
          slug: string
          name: string
          soltys: string | null
          news_count: number | null
          latitude: number
          longitude: number
        }>()

      punkty = (wynik.results ?? []).map((r) => ({
        slug: r.slug,
        nazwa: r.name,
        lat: r.latitude,
        lon: r.longitude,
        soltys: r.soltys,
        liczbaMaterialow: r.news_count ?? 0,
        adres: `/solectwa/${r.slug}`,
        // Miasto jest siedzibą gminy — jedyny punkt o innej randze.
        jestSiedziba: r.slug === 'izbica-kujawska',
      }))

      if (punkty.length === 0) {
        blad = 'W bazie nie ma jeszcze współrzędnych sołectw (wymagana migracja 0055).'
      }
    } catch (e) {
      // Uczciwy komunikat zamiast strony sugerującej gminę bez sołectw.
      blad = e instanceof Error ? e.message : 'Nieznany błąd odczytu bazy.'
    }
  }

  // Liczba sołectw = punkty bez siedziby gminy. Wyliczana, nie wpisana —
  // dopisanie sołectwa w bazie zmienia wszystkie liczby na stronie.
  const liczbaSolectw = punkty.filter((p) => !p.jestSiedziba).length

  return c.render(
    <Shell>
      <MapaPageV4 punkty={punkty} liczbaSolectw={liczbaSolectw} blad={blad} />
    </Shell>,
    {
      title: 'Mapa gminy Izbica Kujawska — sołectwa — Izbica24.pl',
      description:
        `Interaktywna mapa ${liczbaSolectw || SOLECTWA.length} sołectw gminy Izbica Kujawska. ` +
        `Kliknij miejscowość, aby zobaczyć materiały z jej okolic.`,
      canonical: 'https://izbica24.pl/mapa',
    }
  )
})

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
