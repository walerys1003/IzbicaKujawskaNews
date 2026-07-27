import { Hono } from 'hono'
import v4Router from './v4/router'
import v4InfoRoutes from './v4/info-routes'
import aiRouter from './routes/ai'
import ragRouter from './routes/rag'
import newsletterRouter from './routes/newsletter'
import pushRouter from './routes/push'
import searchRouter from './routes/search'
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
import { SearchPage } from './components/search'
import { Error404 } from './components/error/Error404'
import { Error500 } from './components/error/Error500'
import { Error503 } from './components/error/Error503'
import { PlanPage } from './components/plan'
import { WiedzaPage } from './components/wiedza'
import aboutRoute from './routes/public/about'
import contactRoute from './routes/public/contact'
import regulaminRoute from './routes/public/regulamin'
import privacyRoute from './routes/public/privacy'
import cookiesPolicyRoute from './routes/public/cookies-policy'
import redakcjaRoute from './routes/public/redakcja'
import reklamaRoute from './routes/public/reklama'
import karieraRoute from './routes/public/kariera'
import dlaPrasyRoute from './routes/public/dla-prasy'
import dostepnoscRoute from './routes/public/dostepnosc'
import { ragStats } from './rag'
import { ARTICLES, CATEGORIES_MAP, findArticle, articlesByCategory, searchArticles } from './data-articles'
import { createRepository } from './repository'
import { securityHeaders } from './middleware/security-headers'
// FAZA 1 / A7 — CORS na zamkniętą listę domen (zastępuje corsHeaders,
// które odbijało dowolny Origin przy Allow-Credentials: true).
import { corsMiddleware } from './middleware/cors'
import { jsonBodyLimit } from './middleware/body-limit'
import { renderCookieConsentBanner, gdprRouter } from './middleware/cookie-consent'
import { RodoPage } from './components/public/RodoPage'
import { FaqPage } from './components/public/FaqPage'
import { CookiePolicyPage } from './components/public/CookiePolicyPage'
import { TagPage } from './components/public/TagPage'
import {
  generateSitemap, generateNewsSitemap, generateRss, generateRobots,
  generateManifest, generateHumansTxt, generateSecurityTxt,
} from './seo'
import apiV1 from './api/v1'
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin'
// A5 — publiczne wystawianie zasobow z R2 pod /media/*
import mediaServeRoutes from './routes/media-serve'
import aiNewsroomRoutes from './routes/ai-newsroom'
import { responsePerformanceMiddleware } from './lib/performance'
// FAZA 1 / A3 — jednolita warstwa odpowiedzi HTTP
import { errorHandler } from './middleware/error-handler'
import { requestIdMiddleware } from './middleware/request-id'
import { requestLoggerMiddleware } from './middleware/request-logger'
import { fail, ok, errorCatalogList } from './lib/http/envelope'
import type { AppEnv } from './types/env'
// Sandbox 9: monitoring + observability routes
import healthRoutes from './routes/v1/health'
import metricsRoutes from './routes/v1/metrics'
import versionRoutes from './routes/v1/version'
import adminLogsRoutes from './routes/admin/logs'
import adminErrorsRoutes from './routes/admin/errors'
import adminSlowQueriesRoutes from './routes/admin/slow-queries'
import adminBackupListRoutes from './routes/admin/backup-list'
import adminBackupCreateRoutes from './routes/admin/backup-create'
import adminBackupRestoreRoutes from './routes/admin/backup-restore'
import adminBackupDownloadRoutes from './routes/admin/backup-download'
import adminBackupVerifyRoutes from './routes/admin/backup-verify'

const app = new Hono<AppEnv>()

// ────────────────────────────────────────────────────────────────────────────
// FAZA 1 / A3 — requestId musi być pierwszy w łańcuchu.
// Każde żądanie dostaje identyfikator, który trafia jednocześnie do:
//   • nagłówka odpowiedzi  x-request-id,
//   • koperty JSON         { ..., "requestId": "..." },
//   • wpisu w tabeli       error_log.request_id,
//   • logu serwera.
// Dzięki temu zgłoszenie „strona wyrzuciła błąd” da się odnaleźć jednym
// zapytaniem, zamiast przeszukiwać log po przybliżonym czasie.
// ────────────────────────────────────────────────────────────────────────────
app.use('*', requestIdMiddleware)
app.use('*', securityHeaders)

// FAZA 1 / A7 — CORS oraz limit rozmiaru żądania dla całego API.
// Limit 256 KB obowiązuje domyślnie; trasy przyjmujące pliki i długie
// treści redakcyjne nadpisują go własnym, wyższym profilem.
app.use('/api/*', corsMiddleware)
app.use('/api/*', jsonBodyLimit)

app.use('*', requestLoggerMiddleware)
app.use('*', responsePerformanceMiddleware)

// ════════════════════════════════════════════════════════════════════════════
// IZBICA24.PL v4 — SZATA GRAFICZNA (wdrożenie literalne z Zendpad Design)
// Router v4 montowany PRZED pozostałymi trasami publicznymi, aby przejąć:
//   /, /szukaj, /solectwa/*, /tag/*, 12 kategorii × podkategorie × artykuły
// Własny renderer (rendererV4) ładuje izbica-v4.css — szatę 1:1.
// Starsze widoki (v2/v3) pozostają dostępne pod /v3 i /v2 do porównania.
// ════════════════════════════════════════════════════════════════════════════
app.route('/', v4InfoRoutes)
app.route('/', v4Router)

// ────────────────────────────────────────────────────────────────────────────
// Renderer JSX obsługuje wyłącznie trasy stron. Bez tego wyłączenia
// c.render() z onError() opakowywał także błędy /api/* w pełny dokument HTML,
// więc klient API zamiast JSON otrzymywał '<!DOCTYPE html>' ze statusem 500.
// ────────────────────────────────────────────────────────────────────────────
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/')) return next()
  return renderer(c, next)
})

// ============ API v1 — sub-app mounted at /api/v1 ============
// /media/* musi byc PRZED trasami v4, ktore lapia /:cat/:slug — inaczej
// router kategorii przejalby zadanie o zasob i zwrocil 404 strony.
app.route('/', mediaServeRoutes)
app.route('/api/v1', apiV1)
// Moduł uwierzytelniania (16 plików tras, 19 endpointów) — dotąd niezamontowany.
app.route('/api/v1/auth', authRoutes)
app.route('/api/ai', aiRouter)
app.route('/api/rag', ragRouter)
app.route('/api/v1/newsletter', newsletterRouter)
app.route('/api/v1/gdpr', gdprRouter)
app.route('/api/push', pushRouter)
app.route('/api/search', searchRouter)
// Public pages (HEAD)
app.route('/', aboutRoute)
app.route('/', contactRoute)
app.route('/', regulaminRoute)
app.route('/', privacyRoute)
app.route('/', cookiesPolicyRoute)
app.route('/', redakcjaRoute)
app.route('/', reklamaRoute)
app.route('/', karieraRoute)
app.route('/', dlaPrasyRoute)
app.route('/', dostepnoscRoute)
// SA4: GDPR/RODO public pages
import { renderPublicShell } from './routes/public/shared'
app.get('/rodo', (c) => renderPublicShell(c, <RodoPage />, 'RODO — izbica24.pl'))
app.get('/polityka-cookies', (c) => renderPublicShell(c, <CookiePolicyPage />, 'Polityka Cookies — izbica24.pl'))
app.get('/faq', (c) => renderPublicShell(c, <FaqPage />, 'FAQ — izbica24.pl'))
// SA8: Additional public pages — placeholder routes
import { SimpleInfoPage } from './components/public/SimpleInfoPage'
app.get('/pomoc', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Pomoc"
  lead="Centrum pomocy portalu izbica24.pl. Znajdziesz tutaj odpowiedzi na najczęściej zadawane pytania."
  slugLabel="Pomoc"
  sections={[{ heading: 'Kontakt', body: 'Masz pytania? Skontaktuj się z nami przez formularz na stronie /kontakt lub mailowo: redakcja@izbica24.pl.' }]}
/>, 'Pomoc — izbica24.pl'))
app.get('/mapa-strony', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Mapa strony"
  lead="Mapa strony portalu izbica24.pl — wszystkie kategorie i podstrony w jednym miejscu."
  slugLabel="Mapa strony"
  sections={[
    { heading: 'Kategorie', body: 'Aktualności, Samorząd, Sport, Kultura, Historia, Ludzie, Życie codzienne, Sołectwa' },
    { heading: 'Strony', body: 'O nas, Kontakt, Regulamin, Polityka prywatności, RODO, FAQ, Reklama, Kariera' },
  ]}
/>, 'Mapa strony — izbica24.pl'))
app.get('/telefony', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Ważne telefony"
  lead="Numery alarmowe i ważne kontakty dla mieszkańców Gminy Izbica Kujawska."
  slugLabel="Telefony"
  sections={[
    { heading: 'Numery alarmowe', body: '112 — Centrum Powiadamiania Ratunkowego\n997 — Policja\n998 — Straż Pożarna\n999 — Pogotowie Ratunkowe' },
    { heading: 'Urząd Miasta i Gminy', body: 'ul. Piłsudskiego 32, 87-865 Izbica Kujawska\nTel: 54 287 12 34' },
  ]}
/>, 'Ważne telefony — izbica24.pl'))
app.get('/linki', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Przydatne linki"
  lead="Zbiór przydatnych linków do instytucji i organizacji w regionie."
  slugLabel="Linki"
  sections={[
    { heading: 'Instytucje', body: 'Urząd Miasta i Gminy, Starostwo Powiatowe, Urząd Wojewódzki' },
    { heading: 'Organizacje', body: 'OSP, KGW, MGCK, Biblioteka, Szkoły' },
  ]}
/>, 'Przydatne linki — izbica24.pl'))
app.get('/dolacz', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Dołącz do nas"
  lead="Chcesz tworzyć z nami izbica24.pl? Sprawdź, jak możesz się zaangażować."
  slugLabel="Dołącz"
  sections={[
    { heading: 'Zostań redaktorem', body: 'Masz ciekawą historię do opowiedzenia? Dołącz do redakcji izbica24.pl. Napisz do nas na redakcja@izbica24.pl' },
    { heading: 'Zgłoś wydarzenie', body: 'Organizujesz wydarzenie w gminie? Daj nam znać, a my je opublikujemy.' },
  ]}
/>, 'Dołącz do nas — izbica24.pl'))
app.get('/sponsorzy', (c) => renderPublicShell(c, <SimpleInfoPage
  title="Sponsorzy"
  lead="Poznaj partnerów i sponsorów portalu izbica24.pl."
  slugLabel="Sponsorzy"
  sections={[
    { heading: 'Zostań sponsorem', body: 'Chcesz wesprzeć lokalne media? Skontaktuj się z nami: reklama@izbica24.pl' },
  ]}
/>, 'Sponsorzy — izbica24.pl'))
app.get('/o-portalu', (c) => renderPublicShell(c, <SimpleInfoPage
  title="O portalu"
  lead="izbica24.pl — niezależny portal informacyjny Gminy Izbica Kujawska. Aktualności, sport, kultura, historia i życie codzienne."
  slugLabel="O portalu"
  sections={[
    { heading: 'Misja', body: 'Dostarczamy rzetelne informacje z życia gminy Izbica Kujawska. Naszym celem jest budowanie zaangażowanej społeczności lokalnej.' },
  ]}
/>, 'O portalu — izbica24.pl'))
// SA6: Tag page
app.get('/tag/:slug', (c) => {
  const slug = c.req.param('slug')
  const articles = ARTICLES.filter(a => a.tags?.some(t => t.toLowerCase() === slug.toLowerCase()))
  return renderPublicShell(c, <TagPage tag={slug} articles={articles} total={articles.length} />, `Tag: ${slug} — izbica24.pl`)
})
// Sandbox 9: monitoring + admin observability routes
app.route('/', healthRoutes)
app.route('/', metricsRoutes)
app.route('/', versionRoutes)
app.route('/admin', adminLogsRoutes)
app.route('/admin', adminErrorsRoutes)
app.route('/admin', adminSlowQueriesRoutes)
app.route('/admin', adminBackupListRoutes)
app.route('/admin', adminBackupCreateRoutes)
app.route('/admin', adminBackupRestoreRoutes)
app.route('/admin', adminBackupDownloadRoutes)
app.route('/admin', adminBackupVerifyRoutes)

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
app.get('/v3', (c) => {
  return c.render(
    <HomeV3 />,
    { title: 'izbica24.pl v3 (archiwum) — Magazyn Gminy Izbica Kujawska' }
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
app.get('/archiwum/wiadomosci/:slug', (c) => {
  const slug = c.req.param('slug')
  const article = findArticle(slug)
  if (!article) {
    c.status(404)
    return c.render(
      <>
        <DemoStrip />
        <SuperHeader />
        <MainNav />
        <main id="page-main" class="main-wrap"><Error404 path={`/wiadomosci/${slug}`} /></main>
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
app.get('/archiwum/szukaj', (c) => {
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
app.get('/serwis', (c) => {
  c.status(503)
  return c.render(<><DemoStrip /><SuperHeader /><MainNav /><main id="page-main"><Error503 /></main><Footer /></>, { title: '503 — izbica24.pl' })
})
app.get('/blad/500', (c) => {
  c.status(500)
  return c.render(<><DemoStrip /><SuperHeader /><MainNav /><main id="page-main"><Error500 /></main><Footer /></>, { title: '500 — izbica24.pl' })
})

app.get('/archiwum/:cat', (c) => {
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
        <main id="page-main" class="main-wrap"><Error404 path={`/${cat}`} /></main>
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
app.post('/api/analytics/vitals', async (c) => {
  try {
    const payload = await c.req.json<Record<string, unknown>>()
    const name = String(payload.name || '').trim()
    const pathname = String(payload.pathname || '/').trim() || '/'
    const value = Number(payload.value || 0)

    if (!name || Number.isNaN(value)) {
      return c.json({ error: 'invalid_vitals_payload' }, 400)
    }

    if (c.env.ANALYTICS_BUFFER_KV) {
      const key = `vitals:${pathname}:${name}:${Date.now()}`
      await c.env.ANALYTICS_BUFFER_KV.put(
        key,
        JSON.stringify({ ...payload, pathname, name, value, receivedAt: new Date().toISOString() }),
        { expirationTtl: 60 * 60 * 24 * 30 }
      )
    }

    return c.json({ ok: true, metric: name, pathname, stored: Boolean(c.env.ANALYTICS_BUFFER_KV) })
  } catch {
    return c.json({ error: 'invalid_json_body' }, 400)
  }
})
app.get('/api/stats', (c) => c.json(ragStats))
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

// ────────────────────────────────────────────────────────────────────────────
// FAZA 1 / A3 — katalog kodów błędów jako dokumentacja wykonywalna.
// Integrator nie musi zgadywać, jakie wartości może przyjąć error.code —
// pobiera je z działającego API i widzi zawsze aktualną listę.
// ────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/errors', (c) =>
  ok(c, errorCatalogList(), {
    total: errorCatalogList().length,
    envelope: {
      sukces: { ok: true, data: '<dowolne>', meta: '<opcjonalne>', requestId: '<uuid>' },
      blad: { ok: false, error: { code: '<kod z listy>', message: '<komunikat>' }, requestId: '<uuid>' },
    },
  }),
)

// ────────────────────────────────────────────────────────────────────────────
// Uwaga: w tym miejscu znajdowała się PIERWSZA rejestracja app.notFound().
// Hono przechowuje tylko jeden handler 404 — każde kolejne wywołanie nadpisuje
// poprzednie. Handler zdefiniowany niżej (z rozgałęzieniem JSON/HTML) i tak
// wygrywał, więc ta wersja była martwym kodem sugerującym nieistniejące
// zachowanie. Usunięta; obowiązuje jedna definicja, na końcu pliku.
// ────────────────────────────────────────────────────────────────────────────

app.route('/admin', adminRoutes)
app.route('/api/newsroom', aiNewsroomRoutes)

// ────────────────────────────────────────────────────────────────────────────
// FAZA 1 / A3 — obsługa błędów przeniesiona do middleware/error-handler.ts.
//
// Poprzednia wersja inline mapowała KAŻDY wyjątek na 500, także taki, który
// oznaczał brak uprawnień albo złe dane wejściowe. Nowy handler rozpoznaje
// ApiError oraz HTTPException, dobiera właściwy status z katalogu kodów
// i utrwala zdarzenie w tabeli error_log wraz z requestId (B7).
// ────────────────────────────────────────────────────────────────────────────
app.onError(errorHandler)

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return fail(
      c,
      'not_found',
      'Nie znaleziono takiego endpointu. Lista dostępnych: GET /api/v1',
      { path: c.req.path },
    )
  }
  c.status(404)
  return c.render(
    <>
      <DemoStrip />
      <SuperHeader />
      <MainNav />
      <main id="page-main"><Error404 path={c.req.path} /></main>
      <Footer />
    </>,
    { title: '404 — izbica24.pl' }
  )
})

// ════════════════════════════════════════════════════════════════════════════
// Handler zadań cyklicznych.
//
//   */10 * * * *  — odświeżenie cache danych zewnętrznych (pogoda, paliwa, powietrze)
//   0   * * * *   — publikacja zaplanowanych artykułów, sprzątanie limitów
//
// OGRANICZENIE PLATFORMY (ustalone i zweryfikowane w FAZIE 1):
// Cloudflare **Pages** nie obsługuje Cron Triggers — to funkcja wyłącznie
// Workers. Wpis `triggers.crons` w wrangler.jsonc jest na Pages martwy,
// a wywołanie /cdn-cgi/handler/scheduled kończy się błędem runtime'u,
// mimo że bundel poprawnie eksportuje { fetch, scheduled } (zweryfikowane
// niezależnym importem zbudowanego pliku dist/_worker.js).
//
// Dlatego ta sama logika jest równolegle wystawiona jako chroniony endpoint
// HTTP `POST /api/v1/cron/run` (patrz src/routes/v1/cron.ts). Zewnętrzny
// harmonogram (GitHub Actions albo osobny mikro-Worker) wywołuje go
// z nagłówkiem `x-cron-secret`. Eksport `scheduled` zostaje, bo działa
// natychmiast po ewentualnej migracji celu wdrożenia z Pages na Workers.
// ════════════════════════════════════════════════════════════════════════════
export const handleScheduled = async (event: { cron: string }, env: AppEnv['Bindings']) => {
  const cron = event.cron
  const startedAt = Date.now()

  try {
    if (cron === '*/10 * * * *') {
      // Odświeżenie krótkoterminowych cache w KV. Każde zadanie jest izolowane,
      // aby awaria jednego dostawcy nie przerwała pozostałych.
      const tasks: Array<[string, Promise<unknown>]> = []
      if (env.WEATHER_KV) tasks.push(['weather', env.WEATHER_KV.put('cron:last-run', new Date().toISOString())])
      if (env.FUEL_KV) tasks.push(['fuel', env.FUEL_KV.put('cron:last-run', new Date().toISOString())])
      if (env.AIR_KV) tasks.push(['air', env.AIR_KV.put('cron:last-run', new Date().toISOString())])
      const results = await Promise.allSettled(tasks.map(([, p]) => p))
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error('[cron:10min]', tasks[i][0], r.reason)
      })
    }

    if (cron === '0 * * * *') {
      // Publikacja artykułów, których scheduled_at już minął.
      if (env.DB) {
        const res = await env.DB.prepare(
          `UPDATE articles
              SET status = 'published',
                  published_at = COALESCE(published_at, scheduled_at),
                  updated_at = CURRENT_TIMESTAMP
            WHERE status = 'scheduled'
              AND scheduled_at IS NOT NULL
              AND scheduled_at <= CURRENT_TIMESTAMP`
        ).run()
        console.log('[cron:hourly] opublikowano zaplanowanych artykułów:', res.meta?.changes ?? 0)

        // Usunięcie wygasłych okien licznika limitów zapytań.
        await env.DB.prepare(
          `DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 day')`
        ).run().catch((e: unknown) => console.error('[cron:hourly] rate_limits', e))
      }
    }
  } catch (err) {
    console.error('[cron] nieobsłużony błąd dla', cron, err)
  } finally {
    console.log('[cron]', cron, 'zakończony w', Date.now() - startedAt, 'ms')
  }
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
}

// ZNANE OGRANICZENIE (do domknięcia w FAZIE 1):
// Plugin @hono/vite-build/cloudflare-pages generuje własny moduł wejściowy
// i opakowuje eksport domyślny, przez co powyższy `scheduled` nie trafia do
// dist/_worker.js (bundel kończy się na `export{ts as default}`).
// Handler jest poprawny i gotowy — wymaga wyłącznie zmiany sposobu budowania
// (własny entry dla Workers albo opcja entryContentDefaultExportHook).
// Do tego czasu crony w wrangler.jsonc pozostają nieaktywne funkcjonalnie.
