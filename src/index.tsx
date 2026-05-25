import { Hono } from 'hono'
import aiRouter from './routes/ai'
import ragRouter from './routes/rag'
import { renderer } from './renderer'
import { SuperHeader, MainNav, DemoStrip, Footer } from './components/layout'
import {
  BreakingBar, Hero, Wiadomosci, NaSygnaleFull, Kujawianka,
  SamorzadMedia, KulturaHistoria, Historia, Ludzie, ZycieCodzienne,
  DzisWIzbicy, Solectwa, Ogloszenia, Multimedia, Sidebar,
} from './components/home'
import {
  SkrotDnia, AwarieIUtrudnienia, DrogiKomunikacja, DyzuryGodziny,
  CenyPaliw, PomagamyRazem, KronikaRodzinna, KalendarzTygodnia,
  TopTygodnia, MowiaMieszkancy, NewsletterInline,
} from './components/home-v2'
// ============ v3 REDESIGN — "Magazyn Kujawski Premium" ============
import { HomeV3 } from './components/home-v3'
import { ArticlePage } from './components/article'
import { CategoryPage } from './components/category'
import { SearchPage, NotFoundPage } from './components/search'
import { PlanPage } from './components/plan'
import { WiedzaPage } from './components/wiedza'
import { ragStats } from './rag'
import { ARTICLES, CATEGORIES_MAP, findArticle, articlesByCategory, searchArticles } from './data-articles'
import {
  generateSitemap, generateNewsSitemap, generateRss, generateRobots,
  generateManifest, generateHumansTxt, generateSecurityTxt,
} from './seo'
import apiV1 from './api/v1'
import adminRoutes from './routes/admin'
import aiNewsroomRoutes from './routes/ai-newsroom'

const app = new Hono<AppEnv>()

app.use(renderer)

// ============ API v1 — sub-app mounted at /api/v1 ============
app.route('/api/v1', apiV1)
app.route('/api/ai', aiRouter)
app.route('/api/rag', ragRouter)

// ============ STRONA GŁÓWNA — PEŁNA MAKIETA PORTALU (25 modułów) ============
//
// Rozplanowanie strategiczne (przemyślane jak dla portalu informacyjnego gminy):
//
//  PASS 1 — ORIENTACJA W DNIU:
//   • BreakingBar (alerty)
//   • Hero (otwarcie)
//   • SkrotDnia (6 KPI: pogoda, prąd, drogi, dyżur, sesja, zbiórki)
//
//  PASS 2 — TWARDE INFORMACJE:
//   • Wiadomosci (najnowsze artykuły)
//   • AwarieIUtrudnienia + DrogiKomunikacja (band: side-by-side w cards-grid-2)
//   • NaSygnaleFull (interwencje służb — full-bleed czarny pas)
//
//  PASS 3 — SPOŁECZNOŚĆ I SAMORZĄD:
//   • Kujawianka (sport lokalny)
//   • SamorzadMedia (Rada/Urząd)
//   • DyzuryGodziny (apteka, lekarz, urząd, MGOPS)
//   • NewsletterInline (full-bleed dark band, mid-page CTA)
//
//  PASS 4 — KULTURA I CZAS:
//   • KulturaHistoria + Historia
//   • KalendarzTygodnia (7-dniowy event-grid)
//
//  PASS 5 — LUDZIE:
//   • Ludzie (sylwetki)
//   • MowiaMieszkancy (głosy mieszkańców)
//   • ZycieCodzienne
//
//  PASS 6 — CODZIENNOŚĆ:
//   • DzisWIzbicy + Solectwa
//   • CenyPaliw (ranking lokalny)
//   • PomagamyRazem (zbiórki OSP/MGOPS)
//   • KronikaRodzinna (narodziny/śluby/jubileusze)
//
//  PASS 7 — DODATKI:
//   • Ogloszenia + Multimedia
//   • TopTygodnia (ranking najczęściej czytanych)
//
// ┌─────────────────────────────────────────────────────────────────┐
// │  v3 REDESIGN — "Magazyn Kujawski Premium"                       │
// │  Inspirowane: Interia.pl + The Guardian + NYT Magazine          │
// │  Paleta: Navy #0a2540 + Burgundy #8b1d2a + Gold #c8a951 + Cream │
// │  Typografia: Playfair Display + Lora + Inter                    │
// │  Layout: asymetryczny hero grid, magazine cards, sticky sidebar │
// └─────────────────────────────────────────────────────────────────┘
app.get('/', (c) => {
  return c.render(
    <HomeV3 />,
    { title: 'izbica24.pl — Magazyn Gminy Izbica Kujawska' }
  )
})

// ============ LEGACY: stara wersja v2 (do porównania) ============
app.get('/v2', (c) => {
  return c.render(
    <>
      <DemoStrip active="home" />
      <SuperHeader />
      <MainNav />
      <BreakingBar />
      <SkrotDnia />
      <main id="page-main" class="main-wrap">
        <div class="main-grid">
          <div id="content-col">
            <Hero />
            <Wiadomosci />
            <div class="cards-grid-2 modv2-band">
              <AwarieIUtrudnienia />
              <DrogiKomunikacja />
            </div>
            <Kujawianka />
            <SamorzadMedia />
          </div>
          <Sidebar />
        </div>
      </main>
      <NaSygnaleFull />
      <section class="main-wrap section-zebra">
        <div class="cont">
          <div class="cards-grid-2">
            <DyzuryGodziny />
            <CenyPaliw />
          </div>
        </div>
      </section>
      <section class="main-wrap">
        <div class="main-grid">
          <div id="content-col">
            <KalendarzTygodnia />
            <KulturaHistoria />
            <Historia />
            <Ludzie />
            <MowiaMieszkancy />
            <ZycieCodzienne />
            <DzisWIzbicy />
            <Solectwa />
          </div>
          <aside class="sidebar-col">
            <TopTygodnia />
            <PomagamyRazem />
            <KronikaRodzinna />
          </aside>
        </div>
      </section>
      <section class="main-wrap">
        <div class="cont">
          <Ogloszenia />
          <Multimedia />
        </div>
      </section>
      <NewsletterInline />
      <Footer />
    </>,
    { title: 'izbica24.pl v2 (archiwum) — Portal Gminy Izbica Kujawska' }
  )
})

// ============ STRONA: PLAN WDROŻENIA ============
app.get('/plan', (c) => {
  return c.render(
    <>
      <DemoStrip active="plan" />
      <SuperHeader />
      <MainNav />
      <main id="page-main">
        <PlanPage />
      </main>
      <Footer />
    </>,
    { title: 'Plan wdrożenia — izbica24.pl' }
  )
})

// ============ STRONA: BAZA WIEDZY (RAG) ============
app.get('/wiedza', (c) => {
  return c.render(
    <>
      <DemoStrip active="wiedza" />
      <SuperHeader />
      <MainNav />
      <main id="page-main">
        <WiedzaPage stats={ragStats} />
      </main>
      <Footer />
    </>,
    { title: 'Baza wiedzy projektu — izbica24.pl' }
  )
})

// ============ STRONA: ARTYKUŁ ============
app.get('/wiadomosci/:slug', (c) => {
  const slug = c.req.param('slug')
  const article = findArticle(slug)
  if (!article) {
    c.status(404)
    return c.render(
      <>
        <DemoStrip />
        <SuperHeader />
        <MainNav />
        <main id="page-main" class="main-wrap"><NotFoundPage path={`/wiadomosci/${slug}`} /></main>
        <Footer />
      </>,
      { title: '404 — izbica24.pl' }
    )
  }
  return c.render(
    <>
      <DemoStrip />
      <SuperHeader />
      <MainNav />
      <main id="page-main" class="main-wrap">
        <ArticlePage article={article} />
      </main>
      <Footer />
    </>,
    { title: `${article.title} — izbica24.pl` }
  )
})

// ============ STRONA: SZUKAJ (MUSI BYĆ PRZED /:cat) ============
app.get('/szukaj', (c) => {
  const q = c.req.query('q') || ''
  const results = q ? searchArticles(q).map(a => ({
    url: `/wiadomosci/${a.slug}`,
    category: a.category,
    title: a.title,
    snippet: highlightSnippet(a.lede, q),
    publishedAt: a.publishedAt,
  })) : []
  return c.render(
    <>
      <DemoStrip />
      <SuperHeader />
      <MainNav />
      <main id="page-main" class="main-wrap">
        <SearchPage query={q} results={results} total={results.length} />
      </main>
      <Footer />
    </>,
    { title: q ? `Szukaj: ${q} — izbica24.pl` : 'Wyszukiwarka — izbica24.pl' }
  )
})

function highlightSnippet(text: string, q: string): string {
  if (!q) return text
  const safe = text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return safe.replace(re, '<mark>$1</mark>')
}

// ============ SEO: sitemap, RSS, robots, manifest (PRZED /:cat) ============
app.get('/sitemap.xml', (c) => {
  c.header('Content-Type', 'application/xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(generateSitemap())
})
app.get('/news-sitemap.xml', (c) => {
  c.header('Content-Type', 'application/xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=600')
  return c.body(generateNewsSitemap())
})
app.get('/rss.xml', (c) => {
  c.header('Content-Type', 'application/rss+xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=900')
  return c.body(generateRss())
})
app.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  return c.body(generateRobots())
})
app.get('/manifest.json', (c) => c.json(generateManifest()))
app.get('/humans.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  return c.body(generateHumansTxt())
})
app.get('/.well-known/security.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8')
  return c.body(generateSecurityTxt())
})

// ============ STRONA: KATEGORIA (catch-all — MUSI BYĆ OSTATNIA) ============
app.get('/:cat', (c) => {
  const cat = c.req.param('cat')
  // Skip routes that don't look like categories
  if (['api', 'static', 'downloads', 'szukaj', 'plan', 'wiedza', 'v2', 'rss.xml', 'sitemap.xml', 'news-sitemap.xml', 'robots.txt', 'manifest.json', 'humans.txt', '_debug-layout.js'].includes(cat)) {
    return c.notFound()
  }
  const meta = CATEGORIES_MAP[cat]
  if (!meta) {
    c.status(404)
    return c.render(
      <>
        <DemoStrip />
        <SuperHeader />
        <MainNav />
        <main id="page-main" class="main-wrap"><NotFoundPage path={`/${cat}`} /></main>
        <Footer />
      </>,
      { title: '404 — izbica24.pl' }
    )
  }
  const articles = articlesByCategory(cat)
  const page = parseInt(c.req.query('page') || '1')
  const perPage = 12
  const paged = articles.slice((page - 1) * perPage, page * perPage)

  return c.render(
    <>
      <DemoStrip />
      <SuperHeader />
      <MainNav />
      <main id="page-main" class="main-wrap">
        <CategoryPage cat={{
          slug: cat,
          title: meta.title,
          description: meta.description,
          color: meta.color,
          subcategories: meta.subcategories,
          articles: paged,
          total: articles.length,
          page,
          perPage,
        }} />
      </main>
      <Footer />
    </>,
    { title: `${meta.title} — izbica24.pl` }
  )
})

// ============ LEGACY: API STATS + HEALTH ============
app.get('/api/stats', (c) => c.json(ragStats))
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

// ============ 404 ============
app.notFound((c) => {
  return c.render(
    <>
      <DemoStrip />
      <SuperHeader />
      <MainNav />
      <main id="page-main" class="main-wrap"><NotFoundPage path={c.req.path} /></main>
      <Footer />
    </>,
    { title: '404 — izbica24.pl' }
  )
})

app.route('/admin', adminRoutes)

app.route('/api/newsroom', aiNewsroomRoutes)

export default app
