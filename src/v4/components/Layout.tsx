// ============================================================================
// IZBICA24.PL v4 — LAYOUT (Topbar, Header, MegaNav, Breaking, Footer)
// Szata graficzna przeniesiona literalnie z index.html; nawigacja rozszerzona
// o mega-panel: podkategorie + rotujące karty artykułów (zdjęcie + tytuł + zajawka)
// ============================================================================

import type { FC, Child } from 'hono/jsx'
import { CATEGORIES, SOLECTWA, CATEGORY_BY_SLUG, findSubcategory, type Category } from '../taxonomy'
import { GMINA } from '../gmina-fakty'
import { bySubcategory, byCategory, tickerItems, latest } from '../content-db'
import { articleUrl, type Article } from '../content-types'

// ─────────────────────────────────────────────────────────────────── IKONY
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 003.4 0" />
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────── TOPBAR

/**
 * Data w pasku — liczona po stronie serwera, ale ZAWSZE w strefie
 * Europe/Warsaw, nie w strefie procesu. Worker Cloudflare działa w UTC,
 * więc `new Date().toLocaleDateString('pl-PL')` bez wskazania strefy
 * pokazywałby wieczorem po 22:00 (23:00 w czasie letnim) datę dnia
 * poprzedniego — na portalu lokalnym, gdzie liczy się „co dziś",
 * jest to błąd widoczny dla każdego czytelnika.
 *
 * `Intl.DateTimeFormat` z jawną strefą jest w Workers dostępny
 * (pełne ICU), więc nie trzeba tu algorytmu Sakamoto jak w warstwie
 * prognozy, gdzie przeliczamy podane przez dostawcę daty ISO bez zegara.
 */
const dataPolska = (): string => {
  const tekst = new Intl.DateTimeFormat('pl-PL', {
    timeZone: 'Europe/Warsaw',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  // pl-PL daje „poniedziałek, 27 lipca 2026" — szata wymaga wielkiej litery
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

/**
 * Pogoda w pasku — uzupełniana po stronie klienta z /api/v1/pogoda/pasek.
 *
 * Dlaczego nie SSR: `Shell` jest używany w 20 miejscach jako komponent
 * synchroniczny. Pobranie pogody na serwerze wymagałoby `await` w każdej
 * z 20 tras i dołożyłoby do czasu odpowiedzi KAŻDEJ podstrony żądanie
 * do KV (a przy zimnym cache — do Open-Meteo). Pasek jest elementem
 * dekoracyjnym, więc płacić za niego opóźnieniem pierwszego bajtu na
 * artykule byłoby złym kompromisem.
 *
 * W SSR wychodzi pusty kontener. Nie ma tu wartości zastępczej („18°C"),
 * bo lepiej pokazać nic niż liczbę wziętą z powietrza — dotąd w tym
 * miejscu była właśnie taka liczba, wpisana na stałe.
 *
 * `aria-live="polite"` — czytnik ekranu ogłosi temperaturę po dociągnięciu,
 * ale nie przerwie czytania nagłówka strony (F3 WCAG).
 */
export const Topbar: FC = () => (
  <div id="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <span class="topbar-date">{dataPolska()}</span>
        <span
          class="topbar-weather"
          id="topbar-pogoda"
          aria-live="polite"
          data-endpoint="/api/v1/pogoda/pasek"
        ></span>
      </div>
      <div class="topbar-right">
        <a href="/redakcja">Redakcja</a>
        <a href="/newsletter">Newsletter</a>
        <a href="/reklama">Reklama</a>
        <a href="/kontakt">Kontakt</a>
        <a href="/na-sygnale" class="live-link">
          Na sygnale · LIVE
        </a>
      </div>
    </div>
  </div>
)

// ──────────────────────────────────────────────── MEGA-PANEL NAWIGACJI
/**
 * Panel podkategorii z rotującymi kartami artykułów.
 * Lewa kolumna: lista podkategorii (klikalna, przełącza zestaw kart).
 * Prawa kolumna: 4 karty (zdjęcie + tytuł + zajawka) dla aktywnej podkategorii,
 * automatycznie rotujące co 4 s (mn-rotator w v4-nav.js).
 */
const MegaPanel: FC<{ category: Category }> = ({ category }) => {
  // Pule dopełniające — tylko materiały ze zdjęciem, aby karta nigdy nie była pusta
  const catPool = byCategory(category.slug).filter((a) => a.heroImage)
  const globalPool = latest(120).filter((a) => a.heroImage)

  // Dla każdej podkategorii ZAWSZE 4 karty (zdjęcie + tytuł + zajawka),
  // dopełniane rotacyjnie z kategorii, a w ostateczności z całego portalu.
  const groups = category.subcategories.map((s, gi) => {
    const own = bySubcategory(category.slug, s.slug).filter((a) => a.heroImage)
    const items: Article[] = own.slice(0, 4)
    const seen = new Set(items.map((a) => a.slug))

    const fill = (pool: Article[]) => {
      if (!pool.length) return
      const off = gi % pool.length
      for (const a of [...pool.slice(off), ...pool.slice(0, off)]) {
        if (items.length >= 4) return
        if (seen.has(a.slug)) continue
        seen.add(a.slug)
        items.push(a)
      }
    }
    fill(catPool)
    fill(globalPool)

    return { sub: s, items, count: own.length || bySubcategory(category.slug, s.slug).length }
  })

  return (
    <div class="mega-panel" data-mega={category.slug}>
      <div class="mega-inner">
        {/* KOLUMNA 1 — podkategorie */}
        <nav class="mega-subs" aria-label={`Podkategorie: ${category.title}`}>
          <div class="mega-subs-head">{category.title}</div>
          {groups.map((g, i) => (
            <button
              type="button"
              class={`mega-sub${i === 0 ? ' active' : ''}`}
              data-mega-sub={g.sub.slug}
              data-mega-cat={category.slug}
            >
              <span class="mega-sub-name">{g.sub.title}</span>
              <span class="mega-sub-count">{g.count}</span>
            </button>
          ))}
          <a class="mega-subs-all" href={category.path}>
            Wszystko z „{category.title}” →
          </a>
        </nav>

        {/* KOLUMNA 2 — rotujące karty artykułów dla aktywnej podkategorii */}
        <div class="mega-stage">
          {groups.map((g, i) => (
            <div
              class={`mega-slate${i === 0 ? ' active' : ''}`}
              data-mega-slate={g.sub.slug}
              data-mega-cat={category.slug}
            >
              <div class="mega-slate-head">
                <a href={g.sub.path} class="mega-slate-title">
                  {g.sub.title}
                </a>
                <p class="mega-slate-desc">{g.sub.description}</p>
              </div>
              <div class="mega-cards" data-rotator>
                {g.items.map((a, idx) => (
                  <a
                    class={`mega-card${idx === 0 ? ' is-lead' : ''}`}
                    href={articleUrl(a)}
                    data-rot-index={String(idx)}
                  >
                    <div class="mega-card-img">
                      {a.heroImage ? (
                        <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" />
                      ) : (
                        <div class="mega-card-noimg" />
                      )}
                    </div>
                    <div class="mega-card-body">
                      <span class={`tag ${CATEGORY_BY_SLUG[a.category]?.tagClass ?? category.tagClass}`}>
                        {findSubcategory(a.category, a.subcategory)?.title ??
                          CATEGORY_BY_SLUG[a.category]?.title ??
                          g.sub.title}
                      </span>
                      <h4>{a.shortTitle || a.title}</h4>
                      <p>{a.lede}</p>
                      <div class="mega-card-meta">
                        <time>{a.publishedAt}</time>
                        {a.readingMinutes ? <span class="meta-dot"></span> : null}
                        {a.readingMinutes ? <span>{a.readingMinutes} min</span> : null}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <div class="mega-dots" data-rotator-dots>
                {g.items.map((_, idx) => (
                  <button type="button" class={`mega-dot${idx === 0 ? ' active' : ''}`} data-rot-dot={String(idx)} aria-label={`Materiał ${idx + 1}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────── HEADER + NAV
export const Header: FC<{ activeCategory?: string }> = ({ activeCategory }) => (
  <header id="main-header">
    <div class="header-top">
      <a href="/" class="logo">
        <div class="logo-row">
          <span class="logo-text">izbica</span>
          <span class="logo-red">24</span>
          <span class="logo-suffix">.pl</span>
        </div>
        <span class="logo-tagline">Portal Gminy Izbica Kujawska</span>
      </a>
      <form class="header-search" action="/szukaj" method="get" role="search">
        <IconSearch />
        <input
          type="search"
          name="q"
          placeholder="Szukaj — sołectwo, Kujawianka, OSP, Wietrzychowice..."
          aria-label="Szukaj w portalu"
        />
      </form>
      <div class="header-actions">
        <a href="/newsletter" class="header-btn" aria-label="Powiadomienia">
          <IconBell />
        </a>
        <a href="/admin" class="header-btn" aria-label="Panel redakcji">
          <IconUser />
        </a>
        <a href="/ogloszenia/dodaj" class="header-cta">
          Ogłoś
        </a>
        <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <nav class="nav-bar" aria-label="Nawigacja główna">
      <div class="nav-inner">
        <a href="/" class={`nav-item${!activeCategory ? ' active' : ''}`} style="--cat:var(--red)">
          Strona główna
        </a>
        {CATEGORIES.map((cat) => (
          <div
            class={`nav-item has-sub has-mega${activeCategory === cat.slug ? ' active' : ''}`}
            style={`--cat:${cat.colorVar}`}
            data-nav-cat={cat.slug}
          >
            <a href={cat.path} class="nav-item-link">
              {cat.navLabel}
            </a>
            <span class="chev">▾</span>
            <MegaPanel category={cat} />
          </div>
        ))}
      </div>
    </nav>
  </header>
)

// ─────────────────────────────────────────────────────────── BREAKING TICKER
export const BreakingBar: FC = () => {
  const items = tickerItems()
  const doubled = [...items, ...items]
  return (
    <div id="breaking">
      <a href="/na-sygnale" class="breaking-label">
        <span class="breaking-dot"></span> Na sygnale
      </a>
      <div class="ticker-wrap">
        <div class="ticker-track">
          {doubled.map((it) => (
            <a class="ticker-item" href={it.url}>
              <span class="t-time">{it.time}</span>
              <span class="t-sep">|</span> {it.text}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────── FOOTER
export const Footer: FC = () => (
  <footer id="footer">
    <div class="footer-hero">
      <div class="footer-hero-inner">
        <div class="footer-hero-logo">
          <div class="row">
            <span>izbica</span>
            <span class="r">24</span>
            <small>.pl</small>
          </div>
          <span class="tag">Portal Gminy Izbica Kujawska</span>
        </div>
        <div class="footer-mission">
          „Niezależny portal informacyjny gminy Izbica Kujawska. Codziennie świeże wiadomości, z
          pierwszej ręki, dla wszystkich mieszkańców {SOLECTWA.length} sołectw.”
        </div>
        <div class="footer-cta">
          <a href="/newsletter" class="btn-r">
            <IconMail /> Zapisz się do newslettera
          </a>
          <span class="footer-cta-sub">Tydzień w Izbicy · co piątek wieczorem</span>
        </div>
      </div>
    </div>

    <div class="footer-main">
      <div class="footer-col">
        <h4>O portalu</h4>
        <p>
          Niezależny portal informacyjny dla gminy Izbica Kujawska. Powstał z myślą o mieszkańcach 34
          sołectw i {GMINA.ludnosc.tekst} izbiczan. Wiadomości, samorząd, sport, kultura — z lokalnej perspektywy.
        </p>
        <div class="footer-socials">
          <a href="https://facebook.com" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a href="https://instagram.com" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a href="https://youtube.com" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 3.993L9 16z" />
            </svg>
          </a>
          <a href="/rss.xml" aria-label="RSS">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 012.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82c0-1.2 1-2.18 2.18-2.18zM4 4.44v3c6.93 0 12.56 5.63 12.56 12.56h3c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v3c3.81 0 6.9 3.09 6.9 6.9h3c0-5.47-4.43-9.9-9.9-9.9z" />
            </svg>
          </a>
        </div>
      </div>

      <div class="footer-col">
        <h4>Kategorie</h4>
        <div class="footer-cats">
          {CATEGORIES.map((c) => (
            <a href={c.path}>{c.navLabel}</a>
          ))}
          <a href="/solectwa">Sołectwa ({SOLECTWA.length})</a>
        </div>
      </div>

      <div class="footer-col">
        <h4>Redakcja</h4>
        <div class="footer-contact-info">
          <p>
            <strong>Tomasz Kotliński</strong>
            <br />
            Redaktor naczelny
          </p>
          <p>
            📧 redakcja@izbica24.pl
            <br />
            📞 +48 502 124 567
            <br />
            📍 ul. Marszałka Piłsudskiego 26
            <br />
            87-865 Izbica Kujawska
          </p>
        </div>
        <div class="footer-redakcja">
          <a href="/o-portalu">O portalu</a>
          <a href="/redakcja">Zespół redakcyjny</a>
          <a href="/reklama">Reklama i współpraca</a>
          <a href="/dolacz">Dołącz do nas</a>
          <a href="/telefony">Ważne telefony</a>
          <a href="/mapa">Mapa gminy</a>
        </div>
      </div>

      <div class="footer-col">
        <h4>Newsletter „Tydzień w Izbicy”</h4>
        <p>
          Co tydzień podsumowanie najważniejszych wydarzeń w gminie. Bezpłatnie. Bez spamu. Wyłącznie
          merytoryczne treści — w piątkowy wieczór, prosto do skrzynki.
        </p>
        <form class="footer-nl-form" action="/api/v1/newsletter/subscribe" method="post">
          <input type="email" name="email" placeholder="twoj@email.pl" required />
          <button type="submit">Zapisz się →</button>
        </form>
        <div class="footer-nl-stats">
          <div class="s">
            <div class="n">2 847</div>
            <div class="l">subskrybentów</div>
          </div>
          <div class="s">
            <div class="n">96%</div>
            <div class="l">open rate</div>
          </div>
          <div class="s">
            <div class="n">5 lat</div>
            <div class="l">działalności</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>© 2026 Izbica24.pl · Wszelkie prawa zastrzeżone</span>
        <div class="footer-legal">
          <a href="/regulamin">Regulamin</a>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
          <a href="/rodo">RODO</a>
          <a href="/polityka-cookies">Cookies</a>
        </div>
        <div class="footer-ai-note">
          Niektóre artykuły na portalu są przygotowywane z wykorzystaniem narzędzi AI i weryfikowane
          przez redakcję Izbica24.pl. Każdy taki materiał ma stosowne oznaczenie w stopce.
        </div>
      </div>
    </div>
  </footer>
)

// ────────────────────────────────────────────────────────────── SHELL STRONY
/**
 * F3 / WCAG 2.1 AA — dwie naprawy wykonane w JEDNYM miejscu.
 *
 * Audyt z 27.07.2026 wykazał `grep -c "<main"` = 0 na wszystkich 31 trasach
 * publicznych oraz zero linków pomijających nawigację. Obie rzeczy są
 * naprawiane tutaj, a nie na 31 stronach osobno — bo `Shell` opakowuje każdą
 * stronę publiczną, a naprawa rozsypana po stronach oznaczałaby, że kolejna
 * dodana podstrona znowu nie ma `<main>`. Dokładnie tak powstał ten brak.
 *
 * 1. SKIP-LINK (WCAG 2.4.1 „Bypass Blocks")
 *    Nagłówek portalu to pasek górny, logo, mega-menu z 11 kategoriami
 *    i pasek pilnych wiadomości. Użytkownik klawiatury lub czytnika ekranu
 *    musiał przejść przez kilkadziesiąt linków, żeby dotrzeć do treści —
 *    na KAŻDEJ podstronie. Link jest pierwszym elementem w kolejności
 *    czytania i widoczny wyłącznie po otrzymaniu fokusu (klasa `skip-link`
 *    w izbica-v4-ext.css), więc nie zmienia wyglądu strony.
 *
 * 2. <main id="tresc"> (WCAG 1.3.1 „Info and Relationships")
 *    Bez tego znacznika czytnik ekranu nie ma punktu orientacyjnego
 *    „główna treść", a skip-link nie miałby celu. `tabindex="-1"` jest
 *    konieczne: bez niego przeglądarki Safari i część wersji Chrome
 *    przewijają stronę, ale NIE przenoszą fokusu klawiatury — kolejny Tab
 *    wracałby na początek nawigacji i link byłby pozorny.
 *
 * Znacznik jest bezpieczny dla szaty: w arkuszach v4 nie ma ani jednego
 * selektora `body > *` (sprawdzone), więc dodatkowy poziom zagnieżdżenia
 * nie zmienia żadnej reguły.
 */
export const Shell: FC<{
  children?: Child
  activeCategory?: string
  showBreaking?: boolean
}> = ({ children, activeCategory, showBreaking = true }) => (
  <>
    <a href="#tresc" class="skip-link">
      Przejdź do treści
    </a>
    <Topbar />
    <Header activeCategory={activeCategory} />
    {showBreaking ? <BreakingBar /> : null}
    <main id="tresc" tabindex={-1}>
      {children}
    </main>
    <Footer />
  </>
)

// ─────────────────────────────────────────── WSPÓLNE ELEMENTY POWTARZALNE
export const SectionHeader: FC<{
  title: string
  small?: string
  colorVar?: string
  moreHref?: string
  moreLabel?: string
  id?: string
}> = ({ title, small, colorVar = 'var(--red)', moreHref, moreLabel }) => (
  <header class="sec-header">
    <h2 class="sec-title">
      <span class="sec-title-bar" style={`--c:${colorVar}`}></span>
      {title}
      {small ? <small>{small}</small> : null}
    </h2>
    {moreHref ? (
      <a href={moreHref} class="sec-more">
        {moreLabel || 'Zobacz wszystkie'}
      </a>
    ) : null}
  </header>
)

export const Breadcrumbs: FC<{ items: Array<{ label: string; href?: string }> }> = ({ items }) => (
  <nav class="crumbs" aria-label="Ścieżka nawigacji">
    <a href="/">Strona główna</a>
    {items.map((it) => (
      <>
        <span class="crumbs-sep">›</span>
        {it.href ? <a href={it.href}>{it.label}</a> : <span aria-current="page">{it.label}</span>}
      </>
    ))}
  </nav>
)

export const ArticleMeta: FC<{ article: Article; showAuthor?: boolean }> = ({
  article,
  showAuthor = true,
}) => (
  <div class="meta">
    {showAuthor ? <strong>{article.author.name}</strong> : null}
    {showAuthor ? <span class="meta-dot"></span> : null}
    <time datetime={article.publishedAtISO}>{article.publishedAt}</time>
    <span class="meta-dot"></span>
    <span>{article.readingMinutes} min</span>
    {article.views ? <span class="meta-dot"></span> : null}
    {article.views ? <span>{article.views.toLocaleString('pl-PL')} odsłon</span> : null}
    {article.commentCount ? <span class="meta-dot"></span> : null}
    {article.commentCount ? <span>{article.commentCount} komentarzy</span> : null}
  </div>
)
