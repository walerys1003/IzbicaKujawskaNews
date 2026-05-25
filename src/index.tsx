import { Hono } from 'hono'
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
import { PlanPage } from './components/plan'
import { WiedzaPage } from './components/wiedza'
import { ragStats } from './rag'

const app = new Hono()

app.use(renderer)

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
app.get('/', (c) => {
  return c.render(
    <>
      <DemoStrip active="home" />
      <SuperHeader />
      <MainNav />
      <BreakingBar />

      {/* ┌──── FULL-BLEED #1: SkrotDnia (6 KPI strip — pełna szer.) ────┐ */}
      <SkrotDnia />

      {/* ┌──── STREFA A: HERO + WIADOMOŚCI + UTRUDNIENIA (grid) ────────┐ */}
      <main id="page-main" class="main-wrap">
        <div class="main-grid">
          <div id="content-col">
            {/* PASS 1+2 — Orientacja + twarde informacje */}
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

      {/* ┌──── FULL-BLEED #2: Na sygnale (czarny pas alertów) ──────────┐ */}
      <NaSygnaleFull />

      {/* ┌──── STREFA B: USŁUGI PRAKTYCZNE (zebra, 2-kolumny) ──────────┐ */}
      <section class="main-wrap section-zebra">
        <div class="cont">
          <div class="cards-grid-2">
            <DyzuryGodziny />
            <CenyPaliw />
          </div>
        </div>
      </section>

      {/* ┌──── STREFA C: KULTURA + LUDZIE + SPOŁECZNOŚĆ (grid) ─────────┐ */}
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

      {/* ┌──── STREFA D: OGŁOSZENIA + MULTIMEDIA (full-width content) ──┐ */}
      <section class="main-wrap">
        <div class="cont">
          <Ogloszenia />
          <Multimedia />
        </div>
      </section>

      {/* ┌──── FULL-BLEED #3: Newsletter (czarny + orange CTA) ─────────┐ */}
      <NewsletterInline />

      <Footer />
    </>,
    { title: 'izbica24.pl — Portal Gminy Izbica Kujawska' }
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

// ============ API: STATS ============
app.get('/api/stats', (c) => c.json(ragStats))

// ============ ZDROWIE ============
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

export default app
