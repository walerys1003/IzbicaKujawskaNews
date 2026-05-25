import { Hono } from 'hono'
import { renderer } from './renderer'
import { SuperHeader, MainNav, DemoStrip, Footer } from './components/layout'
import {
  BreakingBar, Hero, Wiadomosci, NaSygnaleFull, Kujawianka,
  SamorzadMedia, KulturaHistoria, Ludzie, ZycieCodzienne,
  DzisWIzbicy, Solectwa, Ogloszenia, Multimedia, Sidebar,
} from './components/home'
import { PlanPage } from './components/plan'
import { WiedzaPage } from './components/wiedza'
import { ragStats } from './rag'

const app = new Hono()

app.use(renderer)

// ============ STRONA GŁÓWNA — PEŁNA MAKIETA PORTALU ============
app.get('/', (c) => {
  return c.render(
    <>
      <DemoStrip active="home" />
      <SuperHeader />
      <MainNav />
      <BreakingBar />
      <main id="page-main">
        <div class="content-with-sidebar">
          <div id="content-col">
            <Hero />
            <Wiadomosci />
            <NaSygnaleFull />
            <Kujawianka />
            <SamorzadMedia />
            <KulturaHistoria />
            <Ludzie />
            <ZycieCodzienne />
            <DzisWIzbicy />
            <Solectwa />
            <Ogloszenia />
            <Multimedia />
          </div>
          <Sidebar />
        </div>
      </main>
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
