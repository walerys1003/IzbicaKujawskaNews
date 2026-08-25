// ============================================================================
// IZBICA24.PL v4 — STRONA GŁÓWNA
// Odwzorowanie 1:1 układu z index.html. Każda sekcja czyta dane z content-db,
// zachowując dokładnie tę samą strukturę DOM i klasy CSS co szata źródłowa.
// ============================================================================

import type { FC } from 'hono/jsx'
import { SOLECTWA, findCategory } from '../taxonomy'
import { GMINA } from '../gmina-fakty'
import {
  byCategory,
  bySubcategory,
  byType,
  incidents,
  findArticleV4,
  allGalleries,
  findGallery,
  latest,
  slot,
} from '../content-db'
import { snapshot } from '../content-source'
import {
  KUJAWIANKA_LEAGUE,
  KUJAWIANKA_LEAGUE_META,
  KUJAWIANKA_RECENT_MATCHES,
  KUJAWIANKA_UPCOMING_MATCHES,
} from '../kujawianka-data'
import { articleUrl, type Article } from '../content-types'
import { SectionHeader } from '../components/Layout'
import { PogodaKarta, type DanePogody, type DanePowietrza } from '../components/PogodaWidget'

/**
 * Rejestr slugow zuzytych przez slot() w biezacym zadaniu (etap D4).
 *
 * Getter, a nie stala modulu: `used` zyje w migawce zadania, wiec zbior
 * zeruje sie przy kazdym odsloniu. Stala na poziomie modulu narastalaby
 * przez cale zycie izolatu Workera i po kilkudziesieciu wejsciach kazdy slot
 * zwracalby undefined — czyli 500 na stronie glownej.
 */
const slotsUsed = () => snapshot().used

const IMG = '/static/img/v4'

// ─────────────────────────────────────────────────────────── HELPERY
const metaOf = (a: Article, opts: { author?: boolean; reading?: boolean; views?: boolean; comments?: boolean } = {}) => (
  <div class="meta">
    {opts.author ? <strong>{a.author.name}</strong> : null}
    {opts.author ? <span class="meta-dot"></span> : null}
    <time datetime={a.publishedAtISO}>{a.publishedAt}</time>
    {opts.reading ? <span class="meta-dot"></span> : null}
    {opts.reading ? <span>{a.readingMinutes} min</span> : null}
    {opts.views && a.views ? <span class="meta-dot"></span> : null}
    {opts.views && a.views ? <span>{a.views.toLocaleString('pl-PL')} odsłon</span> : null}
    {opts.comments && a.commentCount ? <span class="meta-dot"></span> : null}
    {opts.comments && a.commentCount ? <span>{a.commentCount} komentarzy</span> : null}
  </div>
)

/**
 * Beleczki podkategorii — ten sam wzorzec co w sekcji Wiadomości,
 * powielony na życzenie redakcji (2026-07-28) do WSZYSTKICH sekcji
 * strony głównej.
 *
 * Linki, nie <button>: każda beleczka MUSI prowadzić do strony
 * podkategorii (taxonomy sub().path), bo nie każda sekcja ma na
 * stronie głównej karty z każdej podkategorii. JS (izbica-v4.js)
 * przechwytuje klik i filtruje na miejscu TYLKO wtedy, gdy w sekcji
 * są pasujące karty [data-cat] — inaczej kliknięcie filtrowałoby
 * sekcję do zera i czytelnik widziałby pustkę.
 */
const SubcatBar: FC<{ catSlug: string; activeSlug?: string }> = ({ catSlug, activeSlug = 'all' }) => {
  const cat = findCategory(catSlug)!
  return (
    <div class="news-filters" role="tablist" aria-label={`Podkategorie: ${cat.title}`}>
      <a
        class={`news-filter${activeSlug === 'all' ? ' active' : ''}`}
        data-filter="all"
        href={cat.path}
        aria-current={activeSlug === 'all' ? 'page' : undefined}
      >
        Wszystkie
      </a>
      {cat.subcategories.map((s) => (
        <a
          class={`news-filter${activeSlug === s.slug ? ' active' : ''}`}
          data-filter={s.slug}
          href={s.path}
          aria-current={activeSlug === s.slug ? 'page' : undefined}
        >
          {s.title}
        </a>
      ))}
    </div>
  )
}

const shortDate = (a: Article) => {
  const d = new Date(a.publishedAtISO)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}, ${hh}:${mi}`
}

// ════════════════════════════════════════════════════════════ HERO
/**
 * Etap I10 — karta pogodowa w kolumnie bocznej hero.
 *
 * Dlaczego pogoda trafia TUTAJ, a nie na koniec strony: prognoza jest
 * treścią użytkową o krótkim terminie przydatności — czytelnik sprawdza
 * ją przy wejściu, nie po przeczytaniu wszystkich działów. Kolumna
 * boczna hero jest widoczna bez przewijania na komputerze i zaraz po
 * pierwszym artykule na telefonie.
 *
 * Dlaczego POD listą „Najważniejsze dziś", a nie nad nią: portal jest
 * informacyjny, więc pierwszeństwo na stronie głównej mają wiadomości.
 * Widget pogodowy nad nagłówkiem odsuwałby je poniżej krawędzi ekranu.
 *
 * `dane === null` obsługuje sama `PogodaKarta` — pokazuje wtedy krótkie
 * wyjaśnienie zamiast temperatury wpisanej „na zapas". Tutaj nie
 * dublujemy tej logiki.
 */
const Hero: FC<{ pogoda?: DanePogody | null; powietrze?: DanePowietrza | null }> = ({
  pogoda,
  powietrze,
}) => {
  const main = slot('remont-ulicy-koscielnej-zakonczony', { category: 'wiadomosci', used: slotsUsed() })!
  const side = [
    slot('sesja-rady-miejskiej-budzet-remontowy', { category: 'samorzad', used: slotsUsed() })!,
    slot('kujawianka-sparta-brzesc-3-1', { category: 'sport', used: slotsUsed() })!,
    slot('wietrzychowice-nowe-odkrycia-archeologiczne', { category: 'historia', used: slotsUsed() })!,
    slot('dni-izbicy-2026-program', { category: 'kultura', used: slotsUsed() })!,
  ]

  /**
   * Etap 2026-08-25 — trzy materiały POD zdjęciem głównym.
   *
   * Dlaczego tutaj, a nie w kolumnie bocznej: kolumna boczna z listą
   * „Najważniejsze dziś" i kartą pogodową jest wyższa niż zdjęcie główne
   * w proporcji 16/10, więc pod zdjęciem zostawał pusty biały prostokąt na
   * całą szerokość zdjęcia (zrzut redakcji). Trzy karty w JEDNYM RZĘDZIE
   * zamykają tę lukę i domykają wysokość lewej kolumny do prawej.
   *
   * Dlaczego poziomo, a nie w pionie: pionowa lista wróciłaby do kolumny
   * bocznej i tylko przeniosłaby pustkę na drugą stronę. Rząd trzech kart
   * wykorzystuje pełną szerokość zdjęcia (≈1150 px na desktopie).
   *
   * Skąd materiały: `latest()` z pominięciem tego, co już jest w hero
   * (`slotsUsed()` gwarantuje brak duplikatów), i tylko materiały ze
   * zdjęciem — karta bez zdjęcia wyglądałaby jak błąd renderowania.
   * `filter` przed `slice`, nie odwrotnie: inaczej materiał bez zdjęcia
   * zjadałby jedno z trzech miejsc i widzielibyśmy dwie karty.
   */
  const used = slotsUsed()
  const podHero = latest(60)
    .filter((a) => a.heroImage && !used.has(a.slug))
    .slice(0, 3)
  for (const a of podHero) used.add(a.slug)

  return (
    <div class="page">
      <div class="hero-grid reveal">
        {/* Lewa kolumna: zdjęcie główne + rząd trzech materiałów pod nim.
            Wrapper (nie samo <article class="hero-main">) jest konieczny,
            bo .hero-main jest kontenerem pozycjonującym dla nakładki
            z tytułem (position:absolute) — karty musiałyby leżeć NA zdjęciu. */}
        <div class="hero-left">
          <article class="hero-main">
            <a href={articleUrl(main)}>
              <img src={main.heroImage} alt={main.heroAlt || main.title} loading="eager" />
              <div class="hero-main-overlay">
                <span class="tag">Wiadomości · Inwestycje</span>
                <h1>{main.title}</h1>
                <p class="lead">{main.lede}</p>
                {metaOf(main, { author: true, reading: true, views: true, comments: true })}
              </div>
            </a>
          </article>

          {/*
            Trzy materiały w jednym rzędzie, na szerokość zdjęcia głównego.
            Renderowane tylko gdy realnie mamy czym je wypełnić — pusty rząd
            byłby gorszy niż brak sekcji (dokładnie ten błąd widać dziś
            w „Na sygnale · LIVE").
          */}
          {podHero.length > 0 ? (
            <div class="hero-below">
              {podHero.map((a) => {
                const cat = findCategory(a.category)
                return (
                  <a class="hb-card" href={articleUrl(a)}>
                    <div class="hb-img">
                      <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                    </div>
                    <div class="hb-body">
                      <span class={`tag ${cat?.tagClass ?? ''}`}>{cat?.title ?? 'Wiadomości'}</span>
                      <h3>{a.shortTitle || a.title}</h3>
                      <p>
                        {a.lede.slice(0, 120)}
                        {a.lede.length > 120 ? '…' : ''}
                      </p>
                      <div class="meta">
                        <time datetime={a.publishedAtISO}>{shortDate(a)}</time>
                        {a.readingMinutes ? <span class="meta-dot"></span> : null}
                        {a.readingMinutes ? <span>{a.readingMinutes} min</span> : null}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>

        <aside class="hero-side">
          <div class="hero-side-header">
            <svg class="sec-ico" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>
            Najważniejsze dziś
          </div>
          <div class="hero-side-list">
            {side.map((a) => {
              const cat = findCategory(a.category)!
              return (
                <a class="hero-side-item" href={articleUrl(a)}>
                  <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                  <div class="hsi-body">
                    <span class={`tag ${cat.tagClass}`}>{cat.title}</span>
                    <h3>{a.shortTitle || a.title}</h3>
                    <p>{a.lede.slice(0, 110)}{a.lede.length > 110 ? '…' : ''}</p>
                    <div class="meta">
                      <time datetime={a.publishedAtISO}>{shortDate(a)}</time>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>

          {/*
            Karta pogodowa renderowana tylko wtedy, gdy trasa dostarczyła
            dane. Gdy `pogoda` jest `undefined` (np. inny widok użyje
            komponentu Hero bez pobierania prognozy), nie pokazujemy nawet
            komunikatu o awarii — brak danych to nie to samo co awaria
            dostawcy. `null` oznacza „próbowaliśmy i się nie udało" i wtedy
            PogodaKarta wyjaśnia to czytelnikowi.
          */}
          {pogoda !== undefined ? (
            <div class="hero-side-pogoda">
              <PogodaKarta dane={pogoda} powietrze={powietrze} />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════ NA SYGNALE (duża sekcja)
const NaSygnaleSection: FC = () => {
  const all = incidents(7)
  const big = all.slice(0, 3)
  const small = all.slice(3, 7)

  return (
    <section class="sygnale-section reveal" id="na-sygnale">
      <div class="sygnale-inner">
        <div class="sygnale-head">
          <h2>
            <span class="live-dot"></span> Na sygnale · LIVE · ostatnie 24 godziny
          </h2>
          <a href="/na-sygnale">Wszystkie zdarzenia →</a>
        </div>
        {/* Pasek podkategorii — wzorzec jak w sekcji Wiadomości.
            Kliknięcie prowadzi na stronę podkategorii (np. /na-sygnale/wypadki),
            bo w tej sekcji karty nie są filtrowane w miejscu. */}
        <SubcatBar catSlug="na-sygnale" />

        <div class="sygnale-grid-big">
          {big.map((a) => (
            <article class="sygnale-big">
              <a href={articleUrl(a)}>
                <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                <div class="sygnale-big-body">
                  <div class="sygnale-time">
                    {a.incident?.time} · {a.incident?.dayLabel}
                  </div>
                  <div class="sygnale-type">
                    {a.incident?.icon} {a.incident?.kind}
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.lede}</p>
                  <div class="source">Źródło: {a.incident?.source}</div>
                </div>
              </a>
            </article>
          ))}
        </div>

        <div class="sygnale-grid-small">
          {small.map((a) => (
            <article class="sygnale-md">
              <a href={articleUrl(a)}>
                <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                <div class="sygnale-md-body">
                  <div class="sygnale-time">
                    {a.incident?.time} · {a.incident?.dayLabel}
                  </div>
                  <div class="sygnale-type">
                    {a.incident?.icon} {a.incident?.kind}
                  </div>
                  <h4>{a.shortTitle || a.title}</h4>
                  <p>{a.lede}</p>
                  <div class="source">{a.incident?.source}</div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═════════════════════════════════════════ WIADOMOŚCI (filtry + grid)
const WiadomosciSection: FC = () => {
  const cat = findCategory('wiadomosci')!
  const items = [
    slot('pozar-stodoly-chociszewo', { category: 'na-sygnale', used: slotsUsed() })!,
    slot('arimr-doplaty-2026-nabor', { category: 'zycie', used: slotsUsed() })!,
    slot('sp1-wygrala-konkurs-matematyczny', { category: 'edukacja', used: slotsUsed() })!,
    slot('spzoz-dodatkowe-godziny-kardiologia', { category: 'zdrowie', used: slotsUsed() })!,
    slot('nasadzenia-200-drzew-augustynowo-modzerowo', { category: 'srodowisko', used: slotsUsed() })!,
    slot('harmonogram-odbioru-odpadow-czerwiec-2026', { category: 'zycie', used: slotsUsed() })!,
  ]
  const feat = items[0]
  const rest = items.slice(1)

  const filters = [
    { key: 'all', label: 'Wszystkie' },
    ...cat.subcategories.map((s) => ({ key: s.slug, label: s.title.split(' i ')[0] })),
  ]

  const subLabel = (a: Article) => {
    const c = findCategory(a.category)!
    const s = c.subcategories.find((x) => x.slug === a.subcategory)
    return s ? s.title : c.title
  }

  return (
    <section class="section reveal" id="wiadomosci">
      <SectionHeader
        title="Wiadomości"
        small="· Gmina Izbica Kujawska"
        colorVar="var(--c-news)"
        moreHref="/wiadomosci"
        moreLabel="Wszystkie wiadomości"
      />

      <div class="news-filters" role="tablist">
        {filters.map((f, i) => (
          <button class={`news-filter${i === 0 ? ' active' : ''}`} data-filter={f.key}>
            {f.label}
          </button>
        ))}
      </div>

      <div class="news-grid">
        <article class="news-feat" data-cat={feat.subcategory}>
          <a href={articleUrl(feat)}>
            <div class="img-wrap">
              <img src={feat.heroImage} alt={feat.heroAlt || feat.title} loading="lazy" />
            </div>
            <div class="news-feat-body">
              <span class="tag sygnale">Na sygnale · Pożar</span>
              <h2>{feat.title}</h2>
              <p>{feat.lede}</p>
              {metaOf(feat, { author: true, reading: true, views: true })}
            </div>
          </a>
        </article>

        {rest.map((a) => {
          const c = findCategory(a.category)!
          return (
            <article class="news-card" data-cat={a.subcategory}>
              <a href={articleUrl(a)}>
                <div class="img-wrap">
                  <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                </div>
                <div class="news-card-body">
                  <span class={`tag ${c.tagClass}`}>{subLabel(a)}</span>
                  <h3>{a.title}</h3>
                  <p>{a.lede}</p>
                  {metaOf(a, { views: true })}
                </div>
              </a>
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ═══════════════════════════ SPLIT: KUJAWIANKA + SAMORZĄD
/**
 * Naprawa sekcji Kujawianka (2026-08-25).
 *
 * Zgłoszenie redakcji: pod wynikiem „KUJAWIANKA 3:1 SPARTA BRZEŚĆ" wisiał
 * zupełnie niezwiązany materiał (m.in. nekrolog i zdjęcie pielgrzymki),
 * a pole tabeli/strzelców było puste.
 *
 * Trzy niezależne błędy, każdy naprawiony osobno:
 *
 * 1. BŁĘDNY SLUG KATEGORII. `slot(..., { category: 'sport' })` — kategorii
 *    `sport` NIE MA w taksonomii (jest `kujawianka`). Filtr nie pasował do
 *    niczego, więc slot schodził do „najświeższy dowolny artykuł" i wrzucał
 *    w kafel piłkarski pierwszy lepszy materiał z portalu.
 *
 * 2. WYNIK ZASZYTY W JSX. Rezultat 3:1, „25. kolejka", „Następny mecz:
 *    28 maja" i tabela były wpisane na sztywno w szablon, więc ŻADNA zmiana
 *    artykułu ich nie ruszała — stąd wynik meczu nad nekrologiem. Teraz
 *    wszystko pochodzi z `kujawianka-data.ts` (to samo źródło, z którego
 *    korzysta już strona /kujawianka), a nakładka z wynikiem pokazuje się
 *    TYLKO wtedy, gdy artykuł faktycznie jest z kategorii `kujawianka`.
 *
 * 3. BIAŁY TEKST NA BIAŁYM TLE. `article.kujawianka` ma w bazowym CSS
 *    `background:var(--dark); color:#fff`, ale plik rozszerzeń nadpisał
 *    tło na `#fff`, nie zmieniając koloru tekstu (pomiar: tło rgb(255,255,255),
 *    tekst rgb(255,255,255)). Dlatego tabela i strzelcy byli niewidoczni —
 *    zostawały tylko elementy złote. Kolory przeniesione na jasny motyw
 *    w izbica-v4-ext.css.
 *
 * 4. MARTWE PANELE. `.k-tab` usunięto kiedyś z szablonu, ale cztery panele
 *    `data-kpanel` (mecze/tabela/kadra/junior) zostały — jako HTML, którego
 *    nie da się otworzyć (pomiar: display:none, 0 przełączników). To ~150
 *    linii nieosiągalnego znacznika w każdej odsłonie strony głównej.
 *    Usunięte; pełna tabela i terminarz są na /kujawianka, gdzie prowadzą
 *    linki „Tabela" i „Terminarz".
 */
const KujawiankaSamorzad: FC = () => {
  /* `category: 'kujawianka'` — poprawny slug z taksonomii (było: 'sport',
     kategoria nieistniejąca). Dzięki temu w kaflu ląduje materiał sportowy,
     a nie pierwszy lepszy artykuł z portalu. */
  const kMain = slot('kujawianka-sparta-brzesc-3-1', { category: 'kujawianka', used: slotsUsed() })!
  /* Czy materiał REALNIE jest o Kujawiance? Jeśli redakcja nie ma jeszcze
     żadnego materiału w tej kategorii, slot podstawi coś z innego działu —
     wtedy nie wolno kłamać nakładką z wynikiem meczu. */
  const kSport = kMain.category === 'kujawianka'
  /* Ostatni rozegrany mecz i najbliższe spotkanie — z tego samego źródła,
     z którego korzysta strona /kujawianka. Bez duplikowania danych. */
  const kLast = KUJAWIANKA_RECENT_MATCHES[0]
  const kNext = KUJAWIANKA_UPCOMING_MATCHES[0]
  /* Nazwy drużyn i wynik parsowane z opisu meczu, żeby nakładka nigdy nie
     rozjechała się z terminarzem (wcześniej wynik był wpisany ręcznie). */
  const kTeams = kLast.description.split('·')[0].split('—').map((s) => s.trim())
  const kGoals = kLast.result.split(':')
  const kOutcomeLabel =
    kLast.outcome === 'win' ? 'Zwycięstwo' : kLast.outcome === 'draw' ? 'Remis' : 'Porażka'
  const kRound = kLast.description.match(/(\d+)\.\s*kolejka/)?.[1]
  const samMain = slot('sesja-rady-miejskiej-budzet-remontowy', { category: 'samorzad', used: slotsUsed() })!
  const samList = [
    slot('zarzadzenie-47-2026-nabor-kierownika-zgkiw', { category: 'samorzad', used: slotsUsed() })!,
    slot('fundusze-ue-termomodernizacja-sp2', { category: 'samorzad', used: slotsUsed() })!,
    slot('remont-drogi-powiatowej-izbica-brdow', { category: 'samorzad', used: slotsUsed() })!,
    slot('zebranie-solectwa-chociszewo-nowy-soltys', { category: 'solectwa', used: slotsUsed() })!,
  ]

  const dayOf = (a: Article) => String(new Date(a.publishedAtISO).getDate()).padStart(2, '0')
  const monOf = (a: Article) =>
    ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'][
      new Date(a.publishedAtISO).getMonth()
    ]

  return (
    <section class="section reveal">
      <div class="split-grid">
        {/* ───────── KUJAWIANKA — 5 klikalnych zakładek ───────── */}
        <article class="kujawianka">
          <SectionHeader
            title="Kujawianka · Klasa Okręgowa"
            small="· Mecze, tabela, terminarz"
            colorVar="var(--c-kujawianka)"
            moreHref="/kujawianka"
            moreLabel="Wszystkie wiadomości"
          />

          {/* Pasek podkategorii — wzorzec identyczny z Wiadomościami.
              Klik prowadzi na stronę podkategorii (np. /kujawianka/mecze). */}
          <SubcatBar catSlug="kujawianka" />

          {/* Panel: Aktualności (domyślnie widoczny — po usunięciu k-tabs). */}
          {/* Ostatni mecz — nakładka z wynikiem TYLKO dla materiału
              z kategorii `kujawianka`. Gdy slot podstawił materiał z innego
              działu (brak treści sportowych w bazie), pokazujemy zwykłą
              nakładkę bez wyniku — zamiast wpisywać wynik meczu nad
              nekrologiem, jak działo się wcześniej. */}
          <div class="k-panel active" data-kpanel="aktualnosci">
            <div class="k-img">
              <a href={articleUrl(kMain)}>
                <img src={kMain.heroImage} alt={kMain.heroAlt || kMain.title} loading="lazy" />
                <div class="k-img-overlay">
                  <span class="tag kujawianka">
                    Kujawianka{kSport && kRound ? ` · ${kRound}. kolejka` : ''}
                  </span>
                  {kSport ? (
                    <div class="k-score-line">
                      <span class="k-team">{kTeams[0]?.toUpperCase()}</span>
                      <span class="k-score-num">{kGoals[0]}</span>
                      <span class="k-score-vs">:</span>
                      <span class="k-score-num">{kGoals[1]}</span>
                      <span class="k-team">{kTeams[1]?.toUpperCase()}</span>
                    </div>
                  ) : null}
                  <h3>{kMain.title}</h3>
                  <p>{kMain.lede}</p>
                  {kSport ? (
                    <div class={`k-result-tag ${kLast.outcome ?? ''}`}>● {kOutcomeLabel}</div>
                  ) : null}
                </div>
              </a>
            </div>

            {/* Najbliższy mecz — z terminarza, nie z ręcznie wpisanej daty. */}
            <div class="k-info-bar">
              <span>
                Następny mecz: {kNext.date} {kNext.month}
              </span>
              <span class="next">{kNext.description.split('·')[0].trim()}</span>
            </div>

            <div class="k-body">
              {/* Skrót tabeli — pierwsze 6 pozycji ze wspólnego źródła
                  (KUJAWIANKA_LEAGUE), identycznego z tabelą na /kujawianka.
                  Wcześniej te wiersze były wpisane w szablon, więc po zmianie
                  wyników rozjeżdżały się ze stroną kategorii. */}
              <div class="k-table-mini">
                <h4>Tabela · {KUJAWIANKA_LEAGUE_META.league}</h4>
                <table>
                  <tbody>
                    {KUJAWIANKA_LEAGUE.slice(0, 6).map((r) => (
                      <tr class={r.highlight ? 'hl' : undefined}>
                        <td>{r.pos}</td>
                        <td>{r.team}</td>
                        <td>{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <a class="k-body-more" href="/kujawianka">
                  Pełna tabela →
                </a>
              </div>

              {/* Ostatnie wyniki zamiast „strzelców sezonu": lista strzelców
                  była zaszyta w szablonie i nie miała żadnego źródła danych
                  (nie ma jej w kujawianka-data.ts), więc każda zmiana kadry
                  czyniła ją nieprawdziwą. Wyniki mamy realnie w terminarzu. */}
              <div class="k-scorers">
                <h4>Ostatnie wyniki</h4>
                {KUJAWIANKA_RECENT_MATCHES.slice(0, 4).map((m) => (
                  <div class="scorer">
                    <span>{m.description.split('·')[0].trim()}</span>
                    <span class={`num ${m.outcome ?? ''}`}>{m.result}</span>
                  </div>
                ))}
                <a class="k-body-more" href="/kujawianka">
                  Terminarz i wyniki →
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* ───────── SAMORZĄD ───────── */}
        <article class="samorzad-card">
          <SectionHeader
            title="Samorząd"
            small="· Rada, urząd, budżet, sołectwa"
            colorVar="var(--c-samorzad)"
            moreHref="/samorzad"
            moreLabel="Wszystkie wiadomości"
          />

          {/* Pasek podkategorii — wzorzec identyczny z Wiadomościami.
              Klik prowadzi na stronę podkategorii (np. /samorzad/rada-miejska). */}
          <SubcatBar catSlug="samorzad" />

          <div class="samorzad-img">
            <a href={articleUrl(samMain)}>
              <img src={samMain.heroImage} alt="Sesja Rady" loading="lazy" />
              <div class="samorzad-img-overlay">
                <span class="tag samorzad">Samorząd · Rada Miejska</span>
                <h2>Budżet remontowy 4,8 mln zł. Rekordowe inwestycje w gminie.</h2>
              </div>
            </a>
          </div>
          <div class="samorzad-body">
            <p class="lead">
              Podczas sesji 22 maja Rada przyjęła zmiany w budżecie. Inwestycje drogowe i kanalizacyjne
              wzrosną o 18% rok do roku. Burmistrz Dorabiała: „To największy budżet remontowy w
              historii gminy. Czeka nas pracowite półrocze”.
            </p>
            <div class="samorzad-list">
              {samList.map((a) => (
                <a class="item" href={articleUrl(a)}>
                  <div class="date">
                    <div class="d">{dayOf(a)}</div>
                    <div class="m">{monOf(a)}</div>
                  </div>
                  <div>
                    <h4>{a.title}</h4>
                    <p>{a.lede.slice(0, 78)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

// ═════════════════════════════════════════════════════════ STATS BAR
const StatsBar: FC = () => (
  <div class="stats-section reveal">
    <div class="stats-inner">
      <div class="stats-title">
        <h2>
          GMINA IZBICA KUJAWSKA <span class="red">W LICZBACH</span>
        </h2>
        <p>Powiat włocławski · województwo kujawsko-pomorskie · maj 2026</p>
      </div>
      <div class="stats-bar">
        <div class="stat"><div class="num">{GMINA.ludnosc.tekst}</div><div class="lbl">Mieszkańców</div><div class="sub">w {SOLECTWA.length} sołectwach</div></div>
        <div class="stat"><div class="num">{SOLECTWA.length}</div><div class="lbl">Sołectw</div><div class="sub">na {GMINA.powierzchnia.tekst}</div></div>
        <div class="stat"><div class="num">1750</div><div class="lbl">Lokacja miasta</div><div class="sub">prawa miejskie od króla</div></div>
        <div class="stat"><div class="num">12 847</div><div class="lbl">Artykułów</div><div class="sub">w bazie portalu</div></div>
      </div>
    </div>
  </div>
)

// ══════════════════════════════════════ FEATURE FULL — WIETRZYCHOWICE
const FeatureWietrzychowice: FC = () => {
  const a = slot('wietrzychowice-nowe-odkrycia-archeologiczne', { category: 'historia', used: slotsUsed() })!
  return (
    <section class="section reveal">
      <SectionHeader
        title="Historia"
        small="· Dzieje Izbicy, Wietrzychowice, dziedzictwo"
        colorVar="var(--c-historia)"
        moreHref="/historia"
        moreLabel="Wszystkie artykuły"
      />

      <SubcatBar catSlug="historia" />

      <article class="feature-full">
        <a href={articleUrl(a)}>
          <img src={a.heroImage} alt="Wietrzychowice" loading="lazy" />
          <div class="feature-full-overlay">
            <div class="feature-full-content">
              <span class="tag historia">Historia · Polskie piramidy</span>
              <h2>Wietrzychowice: pod warstwą piasku spała tajemnica sprzed 5 500 lat.</h2>
              <p>{a.lede}</p>
              <span class="read-more">Pełna relacja</span>
            </div>
          </div>
        </a>
      </article>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════ KULTURA
const KulturaSection: FC = () => {
  const dni = slot('dni-izbicy-2026-program', { category: 'kultura', used: slotsUsed() })!
  const cards = [
    slot('wojciech-tochman-spotkanie-autorskie', { category: 'kultura', used: slotsUsed() })!,
    slot('pielgrzymka-blenna-7-czerwca', { category: 'kultura', used: slotsUsed() })!,
    slot('kgw-pasieczanki-warsztaty-chleba', { category: 'kultura', used: slotsUsed() })!,
  ]
  const subOf = (a: Article) => {
    const c = findCategory(a.category)!
    return c.subcategories.find((s) => s.slug === a.subcategory)?.title || c.title
  }

  return (
    <section class="section reveal">
      <SectionHeader
        title="Kultura · MGCK"
        small="· Parafie · KGW · Biblioteka"
        colorVar="var(--c-kultura)"
        moreHref="/kultura"
        moreLabel="Wszystkie wydarzenia"
      />
      <SubcatBar catSlug="kultura" />

      <article class="feature-full reveal" style="aspect-ratio:21/8;margin-bottom:20px">
        <a href={articleUrl(dni)}>
          <img src={dni.heroImage} alt="Dni Izbicy" loading="lazy" />
          <div class="feature-full-overlay">
            <div class="feature-full-content">
              <span class="tag kultura">MGCK · Dni Izbicy 2026</span>
              <h2>14–16 czerwca: trzy dni świętowania. Koncerty, dożynki, festyn rodzinny.</h2>
              <p>{dni.lede}</p>
              <span class="read-more">Pełny program</span>
            </div>
          </div>
        </a>
      </article>

      <div class="cards-3">
        {cards.map((a) => (
          <article class="cult-card">
            <a href={articleUrl(a)}>
              <div class="img-wrap">
                <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
              </div>
              <div class="cult-card-body">
                <span class="tag kultura">{subOf(a)}</span>
                <h3>{a.title}</h3>
                <p>{a.lede}</p>
                {metaOf(a, { views: true })}
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════ LUDZIE
const LudzieSection: FC = () => {
  const people = [
    { a: slot('marek-dorabiala-5-pytan', { category: 'ludzie', used: slotsUsed() })!, name: 'Marek Dorabiała', role: 'Burmistrz gminy Izbica Kujawska', badge: 'Wywiad · 5 pytań', quote: '„Termomodernizacja szkół to nie luksus — to inwestycja w przyszłość naszych dzieci i w portfele rodziców. Każda zaoszczędzona złotówka wróci do mieszkańców.”' },
    { a: slot('jadwiga-kowalska-38-lat-w-bibliotece', { category: 'ludzie', used: slotsUsed() })!, name: 'Jadwiga Kowalska', role: 'Bibliotekarka · 38 lat stażu', badge: 'Sylwetka · Wspomnienia', quote: '„Przez 38 lat pracowałam w jednej bibliotece, ale Izbica zmieniała się każdego dnia. Każda książka znajduje swojego czytelnika.”' },
    { a: slot('adam-adamiak-kujawianka-to-moj-dom', { category: 'ludzie', used: slotsUsed() })!, name: 'Adam Adamiak', role: 'Napastnik Kujawianki · 14 goli', badge: 'Sukcesy · Sport', quote: '„Kujawianka to mój dom. Mam oferty z wyższych lig, ale Izbica wygrywa za każdym razem. Tu są moi ludzie.”' },
  ]

  return (
    <section class="section reveal" id="ludzie">
      <SectionHeader
        title="Ludzie Izbicy"
        small="· Wywiady, sylwetki, sukcesy"
        colorVar="var(--c-ludzie)"
        moreHref="/ludzie"
        moreLabel="Wszystkie sylwetki"
      />
      <SubcatBar catSlug="ludzie" />
      <div class="cards-3">
        {people.map((p) => (
          <article class="portrait-card">
            <a href={articleUrl(p.a)}>
              <div class="p-img">
                <img src={p.a.heroImage} alt={p.name} loading="lazy" />
                <span class="tag dark">{p.badge}</span>
                <div class="p-name">
                  <h3>{p.name}</h3>
                  <div class="role">{p.role}</div>
                </div>
              </div>
              <div class="p-body">
                <p class="quote">{p.quote}</p>
                {metaOf(p.a, { author: true, views: true })}
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════ PRZEGLĄD MEDIÓW
const PrzegladMediow: FC = () => {
  const all = byCategory('przeglad-mediow')
  const big = all.slice(0, 3)
  const small = all.slice(3, 7)

  return (
    <section class="section reveal">
      <SectionHeader
        title="Przegląd Mediów"
        small="· O Izbicy piszą inni"
        colorVar="var(--c-przeglad)"
        moreHref="/przeglad-mediow"
        moreLabel="Wszystkie publikacje"
      />
      <SubcatBar catSlug="przeglad-mediow" />

      <div class="media-grid-big">
        {big.map((a) => (
          <article class="media-card">
            <a href={articleUrl(a)}>
              <div class="img-wrap">
                <span
                  class="media-source-badge"
                  style={a.externalSource?.badgeColor ? `background:${a.externalSource.badgeColor}` : undefined}
                >
                  {a.externalSource?.name}
                </span>
                <img src={a.heroImage} alt={a.title} loading="lazy" />
              </div>
              <div class="media-card-body">
                <h3>{a.title}</h3>
                <p>{a.lede}</p>
                {metaOf(a, { views: true, comments: true })}
              </div>
            </a>
          </article>
        ))}
      </div>

      <div class="media-grid-small">
        {small.map((a) => (
          <article class="media-card">
            <a href={articleUrl(a)}>
              <div class="img-wrap">
                <span
                  class="media-source-badge"
                  style={a.externalSource?.badgeColor ? `background:${a.externalSource.badgeColor}` : undefined}
                >
                  {a.externalSource?.name}
                </span>
                <img src={a.heroImage} alt={a.title} loading="lazy" />
              </div>
              <div class="media-card-body">
                <h4 class="media-small">{a.title}</h4>
                <p>
                  {a.publishedAt} · {a.views.toLocaleString('pl-PL')} odsłon
                  {a.commentCount ? ` · ${a.commentCount} kom.` : ''}
                </p>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════ ŻYCIE CODZIENNE
const ZycieCodzienne: FC = () => {
  const items = byCategory('zycie-codzienne').slice(0, 8)
  const cat = findCategory('zycie-codzienne')!
  const subOf = (a: Article) =>
    cat.subcategories.find((s) => s.slug === a.subcategory)?.title.split(' i ')[0] || 'Poradnik'

  return (
    <section class="section reveal">
      <SectionHeader
        title="Życie codzienne"
        small="· Praktyczna wiedza o gminie"
        colorVar="var(--c-zycie)"
        moreHref="/zycie-codzienne"
        moreLabel="Wszystkie poradniki"
      />
      <SubcatBar catSlug="zycie-codzienne" />
      <div class="zycie-grid">
        {items.map((a) => (
          <a class="zycie-card" href={articleUrl(a)}>
            <div class="img-wrap">
              <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
            </div>
            <div class="zycie-card-body">
              <span class="tag">{subOf(a)}</span>
              <h3>{a.title}</h3>
              <p>{a.lede}</p>
              <span class="more">Pełny przewodnik</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════ SOŁECTWA

/**
 * Przykładowe nazwy w akapicie wstępnym — brane z listy sołectw,
 * nie wypisane ręcznie.
 *
 * Poprzednio stało tu zdanie wymieniające „Sadłno, Bierzyn, Pasieka,
 * Wietrzychowice, Modzerowo, Sarnowo, Mchówek". Z siedmiu nazw trzy nie
 * są sołectwami tej gminy: Bierzyn leży w gminie Boniewo, Sarnowo
 * w gminie Lubraniec (szkoła w Sarnowie ma pocztowy adres „87-865 Izbica
 * Kujawska", co zapewne było źródłem pomyłki, ale w wykazie oświatowym
 * gminy Izbica Kujawska jej nie ma), a Sadłna OpenStreetMap nie zna
 * w tym rejonie w ogóle.
 *
 * Zdanie było na stronie głównej, więc trzy obce wsie witały każdego
 * czytelnika jako „nasze sołectwa". Wyliczenie z SOLECTWA usuwa całą
 * klasę tego błędu: dopisanie lub usunięcie sołectwa w taksonomii
 * zmienia ten akapit automatycznie i nie da się już wpisać nazwy,
 * której nie ma na liście.
 *
 * Bierzemy pierwsze sześć pozycji alfabetycznie, nie losowe — SSR musi
 * dawać przy każdym żądaniu ten sam HTML (cache brzegowy, diff w testach).
 */
const NAZWY_PRZYKLADOWE = SOLECTWA.slice(0, 6)
  .map((s) => s.name)
  .join(', ')

const SolectwaSection: FC = () => (
  <section class="section reveal">
    <div class="solectwa">
      <div class="sol-map-col">
        <h2>
          {SOLECTWA.length} sołectw. <span class="red">Jedna gmina.</span>
        </h2>
        <p>
          Gmina Izbica Kujawska to nie tylko miasto. To <strong>{SOLECTWA.length} sołectw</strong> rozsianych wokół
          rynku — {NAZWY_PRZYKLADOWE} i wiele
          innych. Każde z własną historią, sołtysem, świetlicą i Kołem Gospodyń Wiejskich. Kliknij
          sołectwo, by zobaczyć wszystkie wpisy z jego okolic.
        </p>
        <div class="sol-stats-row">
          {/*
            Liczba sołectw wyliczana z listy, nie wpisana. Wcześniej obok
            wyliczanego „{SOLECTWA.length} sołectw" w nagłówku stała tu
            liczba „34" wpisana na stałe — dwie różne liczby sołectw
            widoczne jednocześnie na jednym ekranie.
          */}
          <div class="sstat"><div class="num">{SOLECTWA.length}</div><div class="lbl">Sołectw</div></div>
          {/*
            Ludność ze wspólnego źródła faktów: 7 688 (GUS, Statystyczne
            Vademecum Samorządowca). Poprzednie „5,4 tys." nie odpowiadało
            żadnemu znanemu pomiarowi — zaniżało liczbę mieszkańców gminy
            o ponad dwa tysiące osób.
          */}
          <div class="sstat"><div class="num">{GMINA.ludnosc.tekst}</div><div class="lbl">Mieszkańców</div></div>
          <div class="sstat"><div class="num">{GMINA.powierzchnia.tekst}</div><div class="lbl">Powierzchnia</div></div>
        </div>
      </div>
      <div class="sol-list-col">
        <h3>Wszystkie sołectwa</h3>
        <div class="sol-list">
          {SOLECTWA.map((s) => (
            <a href={`/solectwa/${s.slug}`}>
              {s.name} <span class="cnt">{s.articleCount}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
)

// ═════════════════════════════════════════════════════════ MULTIMEDIA
const MultimediaSection: FC = () => {
  const video = slot('wideo-dni-izbicy-2026-zapowiedz', { category: 'multimedia', used: slotsUsed() })!
  const pod = slot('podcast-23-burmistrz-termomodernizacja', { category: 'multimedia', used: slotsUsed() })!
  const podEps = byType('audio').filter((a) => a.slug !== pod.slug).slice(0, 3)
  // s10: preferowany slug z szaty, a gdy redakcja opublikuje wlasne galerie
  // bez tego sluga — najswiezsza galeria z D1. Asercja `!` na sztywnym slugu
  // dawalaby undefined i bialy 500 dla calej strony glownej (ten sam blad,
  // ktory slot() naprawil dla artykulow).
  const gal = findGallery('dni-izbicy-2025') ?? allGalleries()[0]

  return (
    <section class="section reveal">
      <SectionHeader
        title="Multimedia"
        small="· Wideo, podcast, galerie"
        colorVar="var(--ink)"
        moreHref="/multimedia"
        moreLabel="Wszystkie nagrania"
      />

      <SubcatBar catSlug="multimedia" />

      <div class="mm-grid">
        <a class="mm-video-big" href={articleUrl(video)} data-mmtype="reportaze">
          <img src={video.heroImage} alt="Wideo Dni Izbicy" loading="lazy" />
          <div class="mm-play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
          <div class="mm-video-content">
            <span class="tag dark">Wideo · Reportaż · {video.video?.durationLabel}</span>
            <h3>{video.title}</h3>
            <p>{video.lede}</p>
            <div class="meta">
              {video.publishedAt} · {video.views.toLocaleString('pl-PL')} odsłon
            </div>
          </div>
        </a>

        <div class="mm-podcast" data-mmtype="podcast">
          <div class="mm-podcast-head">
            <span class="tag dark">Podcast · odc. {pod.audio?.episode}</span>
          </div>
          <h3>
            <a href={articleUrl(pod)}>{pod.title}</a>
          </h3>
          <p class="lead">{pod.lede}</p>
          <div class="meta">
            {pod.publishedAt} · {pod.audio?.durationLabel} min ·{' '}
            {(pod.audio?.plays || 0).toLocaleString('pl-PL')} odsłuchów
          </div>
          <div class="pc-player">
            <button class="pc-play" aria-label="Odtwórz">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            </button>
            <div class="pc-progress">
              <div class="pc-bar">
                <div class="pc-bar-fill"></div>
              </div>
              <div class="pc-times">
                <span>11:24</span>
                <span>{pod.audio?.durationLabel}</span>
              </div>
            </div>
          </div>
          <div class="pc-eps">
            {podEps.map((e) => (
              <a class="pc-ep" href={articleUrl(e)}>
                <div class="pc-ep-num">#{e.audio?.episode}</div>
                <div class="pc-ep-title">{e.title}</div>
                <div class="pc-ep-dur">{e.audio?.durationLabel}</div>
              </a>
            ))}
          </div>
        </div>

        {gal ? (
          <div class="mm-gallery" data-mmtype="galerie">
            <div class="mm-gallery-head">
              <h3>
                <a href={`/multimedia/galerie/${gal.section ?? 'kultura'}/${gal.slug}`}>Galeria · {gal.title}</a>
              </h3>
              <p class="lead">{gal.description}</p>
            </div>
            <div class="mm-thumb-grid">
              {gal.photos.slice(0, 4).map((p, i) => (
                <a class="mm-thumb" href={`/multimedia/galerie/${gal.section ?? 'kultura'}/${gal.slug}`}>
                  {i === 3 && gal.photos.length > 4 ? (
                    <div class="mm-thumb-count">+{gal.photos.length - 4}</div>
                  ) : null}
                  <img src={p.src} alt={p.alt} loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════ OGŁOSZENIA
const OgloszeniaSection: FC = () => (
  <section class="ogl reveal" id="ogloszenia">
    <div class="ogl-inner">
      <div class="ogl-head">
        <h2>Ogłoszenia · Społeczność Izbica</h2>
        <a class="ogl-add" href="/ogloszenia/dodaj">
          + Dodaj ogłoszenie
        </a>
      </div>
      <div class="ogl-grid">
        <a class="ogl-tile nekro" href="/ogloszenia/nekrologi">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 6h3v6h2V6h3l-4-4zm-5 9v9h10v-9h-2v7H9v-7H7z" /></svg></div>
          <div class="ogl-name">Nekrologi</div>
          <div class="ogl-sub">Z żałobną czcią</div>
          <div class="ogl-count">4</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/praca">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div>
          <div class="ogl-name">Praca</div>
          <div class="ogl-desc">Oferty lokalne</div>
          <div class="ogl-count">23</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/nieruchomosci">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg></div>
          <div class="ogl-name">Nieruchomości</div>
          <div class="ogl-desc">Domy, działki, najem</div>
          <div class="ogl-count">14</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/drobne">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" /></svg></div>
          <div class="ogl-name">Kupię/Sprzedam</div>
          <div class="ogl-desc">Drobne ogłoszenia</div>
          <div class="ogl-count">47</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/uslugi">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0" /></svg></div>
          <div class="ogl-name">Usługi</div>
          <div class="ogl-desc">Hydraulik, elektryk, transport</div>
          <div class="ogl-count">31</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/firmy">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg></div>
          <div class="ogl-name">Katalog firm</div>
          <div class="ogl-desc">Lokalni przedsiębiorcy</div>
          <div class="ogl-count">87</div>
        </a>
      </div>
      <div class="ogl-grid">
        <a class="ogl-tile special" href="/kontakt">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></div>
          <div class="ogl-name">Redakcja</div>
          <div class="ogl-desc">Masz temat? Daj znać redakcji</div>
          <div class="ogl-count">tel. 502 124 567</div>
        </a>
        <a class="ogl-tile special" href="/newsletter">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div>
          <div class="ogl-name">Newsletter</div>
          <div class="ogl-desc">Cotygodniowe podsumowanie</div>
          <div class="ogl-count">2 847 zapisów</div>
        </a>
        <a class="ogl-tile special" href="/kultura/kalendarz">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
          <div class="ogl-name">Tydzień w Izbicy</div>
          <div class="ogl-desc">Wszystkie wydarzenia tygodnia</div>
          <div class="ogl-count">23 wydarzenia</div>
        </a>
        <a class="ogl-tile special" href="/telefony">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg></div>
          <div class="ogl-name">Ważne telefony</div>
          <div class="ogl-desc">Urząd, OSP, SPZOZ, Policja</div>
          <div class="ogl-count">15 numerów</div>
        </a>
        <a class="ogl-tile" href="/ogloszenia/rocznice">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></div>
          <div class="ogl-name">Rocznice</div>
          <div class="ogl-desc">Życzenia, podziękowania</div>
          <div class="ogl-count">5</div>
        </a>
        <a class="ogl-tile" href="/mapa">
          <div class="ogl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
          <div class="ogl-name">Mapa gminy</div>
          <div class="ogl-desc">Instytucje, sołectwa</div>
          <div class="ogl-count">interaktywna</div>
        </a>
      </div>
    </div>
  </section>
)

// ════════════════════════════════════════════════════════════ EXPORT
export const HomeV4: FC<{
  pogoda?: DanePogody | null
  powietrze?: DanePowietrza | null
}> = ({ pogoda, powietrze }) => (
  <>
    <Hero pogoda={pogoda} powietrze={powietrze} />
    <NaSygnaleSection />
    <div class="page">
      <WiadomosciSection />
      <KujawiankaSamorzad />
    </div>
    <StatsBar />
    <div class="page">
      <FeatureWietrzychowice />
      <KulturaSection />
      <LudzieSection />
      <PrzegladMediow />
      <ZycieCodzienne />
      <SolectwaSection />
      <MultimediaSection />
    </div>
    <OgloszeniaSection />
  </>
)
