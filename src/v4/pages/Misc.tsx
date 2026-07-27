// ============================================================================
// IZBICA24.PL v4 — WIDOKI POMOCNICZE
// Sołectwa, wyszukiwanie, 404 — spójne z szatą graficzną.
// ============================================================================

import type { FC } from 'hono/jsx'
import { SOLECTWA, CATEGORIES, findCategory } from '../taxonomy'
import { GMINA } from '../gmina-fakty'
import { bySolectwo, mostRead } from '../content-db'
import type { Article } from '../content-types'
import { Breadcrumbs, SectionHeader } from '../components/Layout'
import { ListCard, Pager } from './Category'

// ═════════════════════════════════════════════════════════ SOŁECTWA
export const SolectwaPageV4: FC = () => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Sołectwa' }]} />

    <header class="cat-hero reveal" style="--c:var(--c-samorzad)">
      <span class="tag samorzad">Samorząd</span>
      <h1 style="margin-top:12px">{SOLECTWA.length} sołectw. Jedna gmina.</h1>
      <p class="cat-lead">
        Gmina Izbica Kujawska to nie tylko miasto. To {SOLECTWA.length} sołectw rozsianych wokół rynku, każde z własną
        historią, sołtysem, świetlicą i Kołem Gospodyń Wiejskich. Wybierz sołectwo, aby zobaczyć
        wszystkie materiały z jego okolic.
      </p>
      <div class="cat-stats">
        <span>
          <strong>{SOLECTWA.length}</strong> sołectw
        </span>
        <span>
          <strong>{GMINA.ludnosc.tekst}</strong> mieszkańców
        </span>
        <span>
          <strong>{GMINA.powierzchnia.tekst}</strong> powierzchni
        </span>
      </div>
    </header>

    <section class="section reveal">
      <SectionHeader title="Wszystkie sołectwa" colorVar="var(--c-samorzad)" />
      <div class="sol-page-grid">
        {SOLECTWA.map((s) => {
          const count = bySolectwo(s.slug).length
          return (
            <a class="sol-card" href={`/solectwa/${s.slug}`}>
              <h3>{s.name}</h3>
              <div class="sc-count">
                {count > 0 ? `${count} materiałów w portalu` : `${s.articleCount} wpisów w archiwum`}
              </div>
            </a>
          )
        })}
      </div>
    </section>

    <section class="section reveal">
      <SectionHeader
        title="Najczęściej czytane"
        small="· materiały z sołectw i całej gminy"
        colorVar="var(--c-samorzad)"
      />
      <div class="list-grid">
        {mostRead(6).map((a) => {
          const c = findCategory(a.category)!
          return <ListCard article={a} cat={c} />
        })}
      </div>
    </section>
  </div>
)

// ══════════════════════════════════════════════════════ WYSZUKIWANIE
export const SearchPageV4: FC<{
  query: string
  articles: Article[]
  total: number
  page: number
}> = ({ query, articles, total, page }) => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Wyszukiwanie' }]} />

    <header class="cat-hero reveal" style="--c:var(--red)">
      <h1>{query ? `Wyniki dla: „${query}”` : 'Wyszukiwarka portalu'}</h1>
      <p class="cat-lead">
        {query
          ? `Znaleziono ${total} ${total === 1 ? 'materiał' : total < 5 ? 'materiały' : 'materiałów'} w bazie portalu.`
          : 'Wpisz frazę, aby przeszukać wszystkie materiały portalu — wiadomości, sylwetki, historię, multimedia i ogłoszenia.'}
      </p>
      <form action="/szukaj" method="get" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
        <input
          type="search"
          name="q"
          value={query}
          placeholder="Szukaj — sołectwo, Kujawianka, OSP, Wietrzychowice..."
          style="flex:1;min-width:260px;padding:13px 16px;border:1px solid var(--rule);font:500 14.5px var(--body)"
        />
        <button type="submit" class="btn-primary">
          Szukaj
        </button>
      </form>
    </header>

    {query ? (
      <section class="section reveal">
        {articles.length === 0 ? (
          <div class="empty-state">
            <h3>Brak wyników</h3>
            <p>
              Nie znaleziono materiałów dla frazy „{query}”. Spróbuj innego słowa kluczowego lub
              przejrzyj kategorie portalu.
            </p>
            <a href="/">Strona główna</a>
          </div>
        ) : (
          <>
            <div class="list-grid">
              {articles.map((a) => {
                const c = findCategory(a.category)!
                return <ListCard article={a} cat={c} />
              })}
            </div>
            <Pager page={page} total={total} base={`/szukaj?q=${encodeURIComponent(query)}`} />
          </>
        )}
      </section>
    ) : (
      <section class="section reveal">
        <SectionHeader title="Przeglądaj kategorie" colorVar="var(--red)" />
        <div class="subcat-tiles">
          {CATEGORIES.map((c) => (
            <a class="subcat-tile" href={c.path} style={`--c:${c.colorVar}`}>
              <div class="st-body" style="padding:18px">
                <h3>{c.title}</h3>
                <p>{c.lead}</p>
                <span class="st-count">{c.subcategories.length} podkategorii →</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    )}
  </div>
)

// ═══════════════════════════════════════════════════════════════ 404
export const NotFoundV4: FC<{ path?: string }> = ({ path }) => (
  <div class="page">
    <section class="section reveal">
      <div class="empty-state" style="padding:80px 28px">
        <div style="font:900 96px/1 var(--display);color:var(--red);margin-bottom:12px">404</div>
        <h3>Nie znaleziono strony</h3>
        <p>
          Materiał, którego szukasz, nie istnieje lub został przeniesiony.
          {path ? ` Ścieżka: ${path}` : ''}
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">
          <a href="/">Strona główna</a>
          <a href="/szukaj" style="background:var(--ink)">
            Wyszukiwarka
          </a>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <SectionHeader title="Może to Cię zainteresuje" colorVar="var(--red)" />
      <div class="list-grid">
        {mostRead(3).map((a) => {
          const c = findCategory(a.category)!
          return <ListCard article={a} cat={c} />
        })}
      </div>
    </section>
  </div>
)
