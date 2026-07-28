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
import { pogodaZPamieci, powietrzeZPamieci } from '../lib/integrations/pogoda-cache'
// F5 — dane strukturalne i adres kanoniczny. Renderer dokłada Organization
// na każdej podstronie; tutaj podajemy tylko obiekty zależne od treści.
import {
  buildCanonicalUrl,
  buildNewsArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildWebSiteJsonLd,
} from '../seo'
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
/**
 * Etap I10 — strona główna z kartą pogodową w kolumnie bocznej.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DLACZEGO TRASA JEST ASYNCHRONICZNA, A NIE UZUPEŁNIANA W PRZEGLĄDARCE
 * ─────────────────────────────────────────────────────────────────────
 * Rozważaliśmy dociąganie prognozy skryptem po wczytaniu strony — trasa
 * pozostałaby wtedy synchroniczna. Odrzucone z trzech powodów:
 *
 * 1. Przeskok układu (CLS). Karta pogodowa ma ok. 200 px wysokości i stoi
 *    NAD dolną częścią kolumny bocznej. Wstawiona po wczytaniu zepchnęłaby
 *    treść w dół w momencie, gdy czytelnik już zaczął czytać. CLS to
 *    mierzony wskaźnik Core Web Vitals (etap F4) i jednocześnie realna
 *    uciążliwość: na telefonie tekst ucieka spod palca.
 *
 * 2. Prognoza bez JavaScriptu w ogóle by się nie pokazała. Portal gminny
 *    czyta się też na starszych telefonach i przez czytniki ekranu,
 *    a strona główna nie powinna wymagać skryptu do pokazania treści.
 *
 * 3. Koszt jest zerowy. Dane leżą już w KV, więc renderowanie serwerowe
 *    to jedno odczytanie KV (~5 ms) w tym samym Workerze — a nie
 *    dodatkowe żądanie HTTP z przeglądarki. Wariant kliencki byłby
 *    WOLNIEJSZY, nie szybszy.
 *
 * To ten sam wzorzec, co na podstronie `/pogoda` (info-routes.tsx) —
 * świadomie, żeby prognoza pochodziła z jednego źródła i nie rozjeżdżała
 * się między stroną główną a podstroną.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DLACZEGO BRAK POGODY NIE MOŻE ZEPSUĆ STRONY GŁÓWNEJ
 * ─────────────────────────────────────────────────────────────────────
 * `pogodaZPamieci` i `powietrzeZPamieci` nigdy nie rzucają wyjątkiem —
 * przy pustym KV lub milczącym dostawcy zwracają `{ dane: null }`.
 * Strona główna zostaje wtedy w całości, tylko bez temperatury.
 * Świadomie NIE ustawiamy tu statusu 503 (inaczej niż na `/pogoda`):
 * na podstronie pogodowej brak prognozy oznacza, że strona nie spełniła
 * swojego zadania, ale strona główna portalu informacyjnego jest sprawna
 * także bez pogody — zwrócenie 503 zniknęłoby ją z wyników wyszukiwania
 * z powodu awarii u zewnętrznego dostawcy.
 */
app.get('/', async (c) => {
  const env = c.env as { WEATHER_KV?: unknown; AIR_KV?: unknown } | undefined
  const [pogoda, powietrze] = await Promise.all([
    pogodaZPamieci(env?.WEATHER_KV),
    powietrzeZPamieci(env?.AIR_KV ?? env?.WEATHER_KV),
  ])

  return c.render(
    <Shell>
      <HomeV4 pogoda={pogoda.dane} powietrze={powietrze.dane} />
    </Shell>,
    {
      title: 'Izbica24.pl — Niezależny portal informacyjny gminy Izbica Kujawska',
      description:
        'Aktualne wiadomości z Izbicy Kujawskiej. Samorząd, Kujawianka, kultura, historia, sołectwa.',
      // F5 — WebSite z SearchAction tylko na stronie głównej. Google czyta
      // ten obiekt wyłącznie z adresu głównego witryny, więc powtarzanie go
      // na podstronach dodawałoby wagi bez efektu.
      jsonLd: buildWebSiteJsonLd(),
    }
  )
})

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
  const sciezka = articleUrl(a)

  /**
   * F5 — dane strukturalne artykułu.
   *
   * Okruszki budujemy z tej samej taksonomii, z której powstaje widoczny
   * komponent `Breadcrumbs`, a nie z rozbioru ścieżki URL. Rozbiór ścieżki
   * dawałby w okruszkach slug („inwestycje") zamiast nazwy działu
   * („Inwestycje"), a w danych strukturalnych widzianych przez czytelnika
   * w wyniku wyszukiwania to różnica widoczna gołym okiem.
   *
   * Ostatni element (tytuł artykułu) nie ma `sciezka`, więc nie dostanie
   * `item` — bieżąca strona nie powinna linkować do siebie.
   */
  // findSubcategory zwraca PARĘ { category, subcategory } — nie samą
  // podkategorię. Pierwsze podejście czytało `sub.title` i dawało puste
  // `name` w okruszkach; wychwycił to walidator scripts/sprawdz-jsonld.mjs,
  // bo blok był składniowo poprawnym JSON-em i grep uznałby go za obecny.
  const para = a.subcategory ? findSubcategory(a.category, a.subcategory) : undefined
  const sub = para?.subcategory
  const okruszki = [
    { nazwa: 'Strona główna', sciezka: '/' },
    { nazwa: cat.title, sciezka: cat.path },
    ...(sub ? [{ nazwa: sub.title, sciezka: sub.path }] : []),
    { nazwa: a.title },
  ]

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
      canonical: buildCanonicalUrl(sciezka),
      jsonLd: [
        buildNewsArticleJsonLd(
          {
            slug: a.slug,
            title: a.title,
            lede: a.lede,
            heroImage: a.heroImage,
            publishedAtISO: a.publishedAtISO,
            updatedAt: a.updatedAt,
            author: { name: a.author.name, slug: a.author.slug },
            category: cat.title,
            tags: a.tags,
            readingMinutes: a.readingMinutes,
          },
          sciezka,
        ),
        buildBreadcrumbJsonLd(okruszki),
      ],
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
