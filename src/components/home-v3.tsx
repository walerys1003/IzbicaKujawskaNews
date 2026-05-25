/* ===================================================================
   IZBICA24.PL v3 — HOME PAGE COMPONENT
   "Magazyn Kujawski Premium" — totalny redesign
   =================================================================== */

import { Icon } from './icons'
import { ARTICLES, CATEGORIES_MAP } from '../data-articles'
import {
  NaSygnaleStrip,
  WiadomosciModule,
  SamorzadModule,
  InwestycjeModule,
  SportModule,
  KulturaModule,
  EdukacjaModule,
  ZdrowieModule,
  SrodowiskoRolnictwoModule,
  LudzieModule,
  HistoriaModule,
  SolectwaModule,
  KalendarzModule,
  MultimediaModule,
  MieszkaniecPytaModule,
  OpinieModule,
  NewsletterBleed,
  OgloszeniaModule,
  PartnerzyBar,
  Top10Module,
  ArchiwumBar,
} from './home-v3-modules'

/* ================== HERB IZBICY (inline SVG, uproszczony) ================== */
export const HerbIzbica = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size * 1.125} viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" aria-label="Herb Izbicy Kujawskiej">
    {/* Tarcza herbowa */}
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8302a" />
        <stop offset="100%" stopColor="#8b1d2a" />
      </linearGradient>
      <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3d6e4f" />
        <stop offset="100%" stopColor="#2d5a3d" />
      </linearGradient>
    </defs>
    {/* Złota obwódka */}
    <path d="M40 88 C 22 86, 6 76, 4 56 L 4 12 C 4 8, 8 4, 12 4 L 68 4 C 72 4, 76 8, 76 12 L 76 56 C 74 76, 58 86, 40 88 Z"
      fill="#c8a951" />
    {/* Pole czerwone tarczy */}
    <path d="M40 84 C 24 82, 9 73, 8 56 L 8 14 C 8 11, 11 8, 14 8 L 66 8 C 69 8, 72 11, 72 14 L 72 56 C 71 73, 56 82, 40 84 Z"
      fill="url(#shieldGrad)" />
    {/* Zielone wzgórze */}
    <path d="M8 56 C 14 50, 22 48, 30 50 C 38 52, 42 54, 50 51 C 58 48, 66 50, 72 56 L 72 56 C 71 73, 56 82, 40 84 C 24 82, 9 73, 8 56 Z"
      fill="url(#hillGrad)" />
    {/* Czarny krzyż łaciński */}
    <g fill="#1a1a1a">
      <rect x="36" y="18" width="8" height="34" rx="0.5" />
      <rect x="26" y="28" width="28" height="7" rx="0.5" />
    </g>
    {/* Podświetlenie krzyża (subtelne) */}
    <g fill="rgba(255,255,255,0.12)">
      <rect x="36" y="18" width="2" height="34" />
      <rect x="26" y="28" width="28" height="1.5" />
    </g>
  </svg>
)

/* ================== UTILITY BAR ================== */
const UtilityBar = () => (
  <div class="v3-utility-bar">
    <div class="v3-utility-inner">
      <div class="v3-utility-left">
        <span class="v3-utility-date">Poniedziałek, 25 maja 2026</span>
        <span class="v3-utility-temp">
          <Icon.Sun size={14} />
          <span>19°C · Izbica Kujawska</span>
        </span>
      </div>
      <div class="v3-utility-right v3-utility-mobile-hide">
        <a href="/o-portalu" class="v3-utility-link">O portalu</a>
        <span class="v3-utility-sep">·</span>
        <a href="/redakcja" class="v3-utility-link">Redakcja</a>
        <span class="v3-utility-sep">·</span>
        <a href="/kontakt" class="v3-utility-link">Kontakt</a>
        <span class="v3-utility-sep">·</span>
        <a href="/reklama" class="v3-utility-link">Reklama</a>
      </div>
    </div>
  </div>
)

/* ================== HEADER z herbem ================== */
const Header = () => (
  <header class="v3-header">
    <div class="v3-header-inner">
      <a href="/" class="v3-brand" aria-label="izbica24.pl — strona główna">
        <HerbIzbica size={56} />
        <div class="v3-brand-text">
          <div class="v3-brand-main">
            izbica<span class="v3-brand-num">24</span><span class="v3-brand-tld">.pl</span>
          </div>
          <div class="v3-brand-tagline">Magazyn Gminy · Kujawy</div>
        </div>
      </a>
      <div class="v3-header-actions">
        <button class="v3-icon-btn" aria-label="Powiadomienia">
          <Icon.Bell size={20} />
        </button>
        <button class="v3-icon-btn" aria-label="Wyszukaj">
          <Icon.Search size={20} />
        </button>
        <a href="/dodaj-ogloszenie" class="v3-cta-btn">
          <Icon.Plus size={14} />
          <span class="v3-cta-btn-text">OGŁOŚ</span>
        </a>
        <button class="v3-hamburger" aria-label="Menu mobilne">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
)

/* ================== NAV ================== */
const NAV_ITEMS = [
  { slug: 'wiadomosci', label: 'Wiadomości', color: '#8b1d2a', subs: ['Inwestycje', 'Edukacja', 'Zdrowie', 'Społeczne', 'Komunikaty', 'Środowisko', 'Rolnictwo'] },
  { slug: 'na-sygnale', label: 'Na sygnale', color: '#b8302a', subs: ['Wypadki', 'Pożary', 'Interwencje', 'Kronika policyjna', 'Awarie'] },
  { slug: 'samorzad', label: 'Samorząd', color: '#0a2540', subs: ['Urząd Miejski', 'Rada Miejska', 'Budżet', 'Sołectwa', 'Powiat', 'Wybory'] },
  { slug: 'kujawianka', label: 'Kujawianka', color: '#2d5a3d', subs: ['Aktualności', 'Mecze', 'Tabela', 'Kadra', 'Historia klubu'] },
  { slug: 'kultura', label: 'Kultura', color: '#6b3d6e', subs: ['MGCK', 'Biblioteka', 'Parafia', 'Orioniści', 'KGW', 'Kalendarz'] },
  { slug: 'historia', label: 'Historia', color: '#8a6d2a', subs: ['Dzieje Izbicy', 'Wietrzychowice', 'Społeczność żydowska', 'Fotografie', 'Zabytki'] },
  { slug: 'ludzie', label: 'Ludzie', color: '#a64430', subs: ['Wywiady', 'Sylwetki', 'Sukcesy', 'Wspomnienia'] },
  { slug: 'zycie', label: 'Życie', color: '#3d6e4f', subs: ['Poradnik', 'Zdrowie', 'Rolnictwo', 'Turystyka'] },
  { slug: 'multimedia', label: 'Multimedia', color: '#2a2a2a', subs: ['Wideo', 'Podcast', 'Galerie', 'Infografiki'] },
  { slug: 'ogloszenia', label: 'Ogłoszenia', color: '#555555', subs: ['Nekrologi', 'Praca', 'Sprzedam', 'Nieruchomości', 'Firmy'] },
]
const Nav = () => (
  <nav class="v3-nav" aria-label="Główne menu">
    <div class="v3-nav-inner">
      <ul class="v3-nav-list">
        {NAV_ITEMS.map(item => (
          <li class="v3-nav-item" style={`--cat-color: ${item.color}`}>
            <a href={`/${item.slug}`} class={`v3-nav-link ${item.subs ? 'has-children' : ''}`}>
              {item.label}
            </a>
            {item.subs && (
              <div class="v3-mega">
                {item.subs.map(s => (
                  <a href={`/${item.slug}/${s.toLowerCase().replace(/\s+/g, '-').replace('ó','o').replace('ą','a').replace('ę','e').replace('ł','l').replace('ż','z').replace('ź','z').replace('ć','c').replace('ś','s').replace('ń','n')}`} class="v3-mega-link">{s}</a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <a href="/szukaj" class="v3-nav-search">
        <Icon.Search size={14} />
        <span>Szukaj…</span>
        <span class="v3-nav-search-kbd">⌘K</span>
      </a>
    </div>
  </nav>
)

/* ================== BREAKING NEWS TICKER ================== */
const BreakingTicker = () => {
  const items = [
    'Remont ulicy Kościelnej zakończony przed terminem',
    'Sesja Rady Miejskiej 22 maja — porządek obrad',
    'MGCK ogłasza program Lato w Mieście 2026',
    'Kujawianka awansuje po wyjazdowej wygranej',
    'PGE: planowe wyłączenia 28 maja w Smolsku',
  ]
  return (
    <div class="v3-breaking" role="region" aria-label="Najnowsze">
      <div class="v3-breaking-inner">
        <span class="v3-breaking-badge">
          <span class="v3-breaking-pulse"></span>
          NA ŻYWO
        </span>
        <div class="v3-breaking-track">
          <div class="v3-breaking-list">
            {[...items, ...items].map(it => (
              <span class="v3-breaking-item"><a href="#">{it}</a></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================== HERO SECTION ================== */
const HeroSection = () => {
  const main = ARTICLES[0]
  const aside = ARTICLES.slice(1, 4)
  const catColor = (cat: string) => {
    const c = CATEGORIES_MAP[cat]
    return c?.color || '#8b1d2a'
  }
  return (
    <section class="v3-hero">
      <div class="v3-container">
        <div class="v3-hero-grid">
          {/* MAIN — wielka karta */}
          <article class="v3-hero-main">
            <a href={`/wiadomosci/${main.slug}`} class="v3-hero-main-img">
              <div class={`v3-img-placeholder v3-ph-news v3-ph-news-${main.category === 'inwestycje' ? 'samorzad' : main.category}`}></div>
              <span class="v3-hero-main-cat v3-chip-cat" style={`background: ${catColor(main.category)}`}>
                {CATEGORIES_MAP[main.category]?.label || main.category}
              </span>
            </a>
            <div class="v3-hero-main-content">
              <h1 class="v3-hero-main-title">
                <a href={`/wiadomosci/${main.slug}`}>{main.title}</a>
              </h1>
              <p class="v3-hero-main-lede">{main.lede}</p>
              <div class="v3-hero-main-meta">
                <span class="v3-meta">
                  <Icon.User size={14} /> {main.author}
                </span>
                <span class="v3-meta-sep"></span>
                <span class="v3-meta">
                  <Icon.Clock size={14} /> {main.readingMinutes} min czytania
                </span>
                <span class="v3-meta-sep"></span>
                <span class="v3-meta">{main.publishedAt}</span>
              </div>
            </div>
          </article>
          {/* ASIDE — 3 mniejsze */}
          <aside class="v3-hero-aside" aria-label="Najważniejsze">
            {aside.map(a => (
              <a href={`/wiadomosci/${a.slug}`} class="v3-hero-card">
                <div class="v3-hero-card-img">
                  <div class={`v3-img-placeholder v3-ph-news`}></div>
                </div>
                <div class="v3-hero-card-content">
                  <span class="v3-hero-card-cat" style={`color: ${catColor(a.category)}`}>
                    {CATEGORIES_MAP[a.category]?.label || a.category}
                  </span>
                  <h3 class="v3-hero-card-title">{a.title}</h3>
                  <span class="v3-hero-card-time">{a.readingMinutes} min · {a.publishedAt}</span>
                </div>
              </a>
            ))}
          </aside>
        </div>
      </div>
    </section>
  )
}

/* ================== TOP STRIP — 4 KPI dziś ================== */
const TopStrip = () => (
  <section class="v3-top-strip" aria-label="Skrót dnia">
    <div class="v3-container">
      <div class="v3-top-strip-grid">
        <a href="/api/v1/weather" class="v3-strip-card">
          <span class="v3-strip-icon"><Icon.Sun size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Pogoda dziś</span>
            <span class="v3-strip-value">19°C · słonecznie</span>
          </span>
        </a>
        <a href="/api/v1/fuel" class="v3-strip-card v3-strip-card-gold">
          <span class="v3-strip-icon"><Icon.Car size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Ceny paliw</span>
            <span class="v3-strip-value">PB95: 6,29 zł</span>
          </span>
        </a>
        <a href="/api/v1/alerts" class="v3-strip-card">
          <span class="v3-strip-icon"><Icon.Alert size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Aktywne alerty</span>
            <span class="v3-strip-value">4 zgłoszenia</span>
          </span>
        </a>
        <a href="/api/v1/duty" class="v3-strip-card v3-strip-card-navy">
          <span class="v3-strip-icon"><Icon.Heart size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Apteka dyżurna</span>
            <span class="v3-strip-value">Medikus · Rynek</span>
          </span>
        </a>
        <a href="/samorzad" class="v3-strip-card">
          <span class="v3-strip-icon"><Icon.Building size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Sesja Rady</span>
            <span class="v3-strip-value">XLVII · 28.05 · 13:00</span>
          </span>
        </a>
        <a href="/inwestycje" class="v3-strip-card v3-strip-card-gold">
          <span class="v3-strip-icon"><Icon.Wrench size={22} /></span>
          <span class="v3-strip-text">
            <span class="v3-strip-label">Inwestycje 2026</span>
            <span class="v3-strip-value">5 projektów · 38,2 mln zł</span>
          </span>
        </a>
      </div>
    </div>
  </section>
)

/* ================== TOP STORIES GRID ================== */
const TopStories = () => {
  const stories = ARTICLES.slice(0, 7)
  const catColor = (cat: string) => CATEGORIES_MAP[cat]?.color || '#8b1d2a'
  const phClass = (cat: string) => {
    const map: Record<string, string> = {
      'kujawianka': 'v3-ph-news-sport',
      'historia': 'v3-ph-news-history',
      'kultura': 'v3-ph-news-culture',
      'samorzad': 'v3-ph-news-samorzad',
    }
    return map[cat] || ''
  }
  return (
    <section class="v3-top-stories">
      <div class="v3-container">
        <div class="v3-section-head">
          <div>
            <span class="v3-eyebrow">Najświeższe</span>
            <h2 class="v3-section-title">Z gminy i regionu</h2>
          </div>
          <a href="/wiadomosci" class="head-link">Wszystkie wiadomości →</a>
        </div>
        <div class="v3-stories-grid">
          {stories.map((s, i) => (
            <article class={`v3-story-card ${i === 0 ? 'v3-story-card-featured' : ''}`}>
              <a href={`/wiadomosci/${s.slug}`} class="v3-story-card-img">
                <div class={`v3-img-placeholder v3-ph-news ${phClass(s.category)}`}></div>
                <span class="v3-story-card-cat-floating v3-chip-cat" style={`background: ${catColor(s.category)}`}>
                  {CATEGORIES_MAP[s.category]?.label || s.category}
                </span>
              </a>
              <h3 class="v3-story-card-title">
                <a href={`/wiadomosci/${s.slug}`}>{s.title}</a>
              </h3>
              {i === 0 && <p class="v3-story-card-lede">{s.lede}</p>}
              <div class="v3-story-card-meta">
                <span class="v3-meta"><Icon.Clock size={12} /> {s.readingMinutes} min</span>
                <span class="v3-meta-sep"></span>
                <span class="v3-meta">{s.publishedAt}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================== KUJAWIANKA SECTION ================== */
const KujawiankaSection = () => (
  <section class="v3-kujawianka" aria-label="Kujawianka Izbica Kujawska">
    <div class="v3-container">
      <div class="v3-section-head">
        <div>
          <span class="v3-eyebrow" style="color: #c8a951">Klasa Okręgowa · Grupa Włocławek</span>
          <h2 class="v3-section-title" style="color: #faf7f2">⚽ Kujawianka</h2>
        </div>
        <a href="/kujawianka" class="head-link" style="color: #d9bd6c">Cały klub →</a>
      </div>
      <div class="v3-kujawianka-grid">
        <div class="v3-match-card">
          <div class="v3-match-meta">Sobota · 23 maja · 17:00 · stadion w Izbicy</div>
          <div class="v3-match-teams">
            <div class="v3-match-team">
              <div class="v3-match-team-logo">K</div>
              <div class="v3-match-team-name">Kujawianka</div>
            </div>
            <div class="v3-match-score">3 : 1</div>
            <div class="v3-match-team">
              <div class="v3-match-team-logo">W</div>
              <div class="v3-match-team-name">Włocłavia</div>
            </div>
          </div>
          <div class="v3-match-meta" style="text-align: center">⚽ Kowalski 23', 67' · Wiśniewski 45'</div>
        </div>
        <div class="v3-table-mini">
          <div class="v3-widget-title" style="border-bottom-color: #c8a951; color: #faf7f2">Tabela — Top 5</div>
          {[
            { pos: 1, team: 'Pogoń Mogilno', m: 24, pts: 56 },
            { pos: 2, team: 'Cuiavia Inowrocław', m: 24, pts: 51 },
            { pos: 3, team: 'KUJAWIANKA', m: 24, pts: 48, hi: true },
            { pos: 4, team: 'Sparta Janowiec', m: 24, pts: 42 },
            { pos: 5, team: 'Włocłavia', m: 24, pts: 38 },
          ].map(r => (
            <div class={`v3-table-mini-row ${r.hi ? 'is-kujawianka' : ''}`}>
              <span class="v3-table-mini-pos">{r.pos}.</span>
              <span class="v3-table-mini-team">{r.team}</span>
              <span style="color: rgba(255,255,255,0.5); text-align: right; font-size: 0.85rem">{r.m}</span>
              <span class="v3-table-mini-pts">{r.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

/* ================== MAGAZINE GRID (Historia / Kultura) ================== */
const MagazineGrid = () => {
  const histArticles = ARTICLES.filter(a => a.category === 'historia' || a.category === 'kultura').slice(0, 3)
  const fallback = ARTICLES.slice(7, 10)
  const articles = [...histArticles, ...fallback].slice(0, 3)
  const catColor = (cat: string) => CATEGORIES_MAP[cat]?.color || '#8b1d2a'
  return (
    <section class="v3-section v3-section-alt">
      <div class="v3-container">
        <div class="v3-section-head">
          <div>
            <span class="v3-eyebrow" style="color: #8a6d2a">Magazyn</span>
            <h2 class="v3-section-title">Historia, kultura, ludzie</h2>
          </div>
          <a href="/historia" class="head-link">Wszystkie tematy →</a>
        </div>
        <div class="v3-magazine-grid">
          <a href={`/wiadomosci/${articles[0]?.slug || 'wietrzychowice-sezon'}`} class="v3-mag-feature">
            <div class="v3-mag-feature-content">
              <div class="v3-mag-feature-eyebrow">Wietrzychowice · Reportaż</div>
              <h3 class="v3-mag-feature-title">Polskie Piramidy — sezon archeologiczny rozpoczęty</h3>
              <p class="v3-mag-feature-lede">Grobowce neolityczne sprzed 5500 lat. Tegoroczne wykopaliska mogą przynieść kolejne odkrycia.</p>
            </div>
          </a>
          {articles.slice(1, 3).map(a => (
            <a href={`/wiadomosci/${a.slug}`} class="v3-mag-item">
              <div class="v3-mag-item-img">
                <div class="v3-img-placeholder v3-ph-news v3-ph-news-history"></div>
              </div>
              <span class="v3-mag-item-cat" style={`color: ${catColor(a.category)}`}>
                {CATEGORIES_MAP[a.category]?.label || a.category}
              </span>
              <h3 class="v3-mag-item-title">{a.title}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================== MAIN LAYOUT — content + sidebar ================== */
const MainLayout = () => {
  const list = ARTICLES.slice(0, 6)
  const catColor = (cat: string) => CATEGORIES_MAP[cat]?.color || '#8b1d2a'
  return (
    <section class="v3-section">
      <div class="v3-container">
        <div class="v3-main-layout">
          <div class="v3-main-content">
            <div class="v3-section-head">
              <div>
                <span class="v3-eyebrow">Wybór redakcji</span>
                <h2 class="v3-section-title">Kontynuuj czytanie</h2>
              </div>
              <a href="/wiadomosci" class="head-link">Wszystkie →</a>
            </div>
            <div class="v3-news-list-large">
              {list.slice(0, 3).map(a => (
                <article class="v3-story-card">
                  <a href={`/wiadomosci/${a.slug}`} class="v3-story-card-img">
                    <div class="v3-img-placeholder v3-ph-news"></div>
                  </a>
                  <span class="v3-story-card-cat" style={`color: ${catColor(a.category)}`}>{CATEGORIES_MAP[a.category]?.label}</span>
                  <h3 class="v3-story-card-title">
                    <a href={`/wiadomosci/${a.slug}`}>{a.title}</a>
                  </h3>
                  <p class="v3-story-card-lede">{a.lede}</p>
                  <div class="v3-story-card-meta">
                    <span class="v3-meta"><Icon.Clock size={12} /> {a.readingMinutes} min</span>
                  </div>
                </article>
              ))}
            </div>
            <hr class="v3-section-rule" />
            <div class="v3-section-head">
              <div>
                <span class="v3-eyebrow">Z kategorii</span>
                <h2 class="v3-section-title">Samorząd i inwestycje</h2>
              </div>
              <a href="/samorzad" class="head-link">Cała kategoria →</a>
            </div>
            <div class="v3-news-list">
              {list.slice(3, 7).map(a => (
                <article class="v3-story-card">
                  <a href={`/wiadomosci/${a.slug}`} class="v3-story-card-img">
                    <div class="v3-img-placeholder v3-ph-news v3-ph-news-samorzad"></div>
                  </a>
                  <span class="v3-story-card-cat" style={`color: ${catColor(a.category)}`}>{CATEGORIES_MAP[a.category]?.label}</span>
                  <h3 class="v3-story-card-title">
                    <a href={`/wiadomosci/${a.slug}`}>{a.title}</a>
                  </h3>
                </article>
              ))}
            </div>
          </div>
          {/* SIDEBAR */}
          <aside class="v3-sidebar">
            {/* Weather widget */}
            <div class="v3-weather-widget">
              <div class="v3-weather-temp">19<sup>°C</sup></div>
              <div class="v3-weather-desc">Słonecznie · lekki wiatr</div>
              <div class="v3-weather-meta">
                <div class="v3-weather-meta-item">
                  <div class="v3-weather-meta-label">Wilg.</div>
                  <div class="v3-weather-meta-val">62%</div>
                </div>
                <div class="v3-weather-meta-item">
                  <div class="v3-weather-meta-label">Wiatr</div>
                  <div class="v3-weather-meta-val">12 km/h</div>
                </div>
                <div class="v3-weather-meta-item">
                  <div class="v3-weather-meta-label">Jutro</div>
                  <div class="v3-weather-meta-val">21°C</div>
                </div>
              </div>
            </div>
            {/* Top tygodnia */}
            <div class="v3-widget">
              <div class="v3-widget-title">Top tygodnia</div>
              <div class="v3-top-list">
                {ARTICLES.slice(0, 5).map(a => (
                  <div class="v3-top-list-item">
                    <div class="v3-top-list-content">
                      <h4 class="v3-top-list-title">
                        <a href={`/wiadomosci/${a.slug}`}>{a.title}</a>
                      </h4>
                      <div class="v3-top-list-meta">{a.readingMinutes} min · {CATEGORIES_MAP[a.category]?.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Alerts */}
            <div class="v3-alerts-widget">
              <div class="v3-alerts-header">
                <Icon.Alert size={14} />
                <span>Aktywne alerty gminne</span>
              </div>
              <div class="v3-alerts-list">
                <div class="v3-alert-item">
                  <span class="v3-alert-dot"></span>
                  <div class="v3-alert-content">
                    <div class="v3-alert-title">PGE: planowe wyłączenie</div>
                    <div class="v3-alert-meta">Smolsk · 28 maja 9:00-13:00</div>
                  </div>
                </div>
                <div class="v3-alert-item">
                  <span class="v3-alert-dot"></span>
                  <div class="v3-alert-content">
                    <div class="v3-alert-title">ZGK: awaria wodociągu</div>
                    <div class="v3-alert-meta">ul. Sadowska · trwa</div>
                  </div>
                </div>
                <div class="v3-alert-item">
                  <span class="v3-alert-dot"></span>
                  <div class="v3-alert-content">
                    <div class="v3-alert-title">DK62: utrudnienia</div>
                    <div class="v3-alert-meta">Izbica–Lubraniec · roboty</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Newsletter */}
            <div class="v3-newsletter-widget">
              <div class="v3-newsletter-icon"><Icon.Mail size={22} /></div>
              <h3 class="v3-newsletter-title">Newsletter Kujawski</h3>
              <p class="v3-newsletter-desc">Najważniejsze wiadomości z gminy. Co poniedziałek o 7:00 — prosto do skrzynki.</p>
              <form class="v3-newsletter-form" action="/api/v1/newsletter/subscribe" method="POST">
                <input type="email" name="email" class="v3-newsletter-input" placeholder="twoj@email.pl" required />
                <button type="submit" class="v3-newsletter-btn">Zapisz się</button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

/* ================== FOOTER ================== */
const Footer = () => (
  <footer class="v3-footer">
    {/* Top: mission band */}
    <div class="v3-footer-top">
      <div class="v3-container">
        <div class="v3-footer-top-grid">
          <div class="v3-footer-top-brand">
            <HerbIzbica size={64} />
            <div class="v3-footer-top-mission">
              <span class="accent">izbica24.pl</span> — niezależny magazyn lokalny tworzony przez mieszkańców, dla mieszkańców gminy Kujawskiej.
            </div>
          </div>
          <div class="v3-footer-top-cta">
            <div class="v3-footer-top-stats">
              <div class="v3-footer-stat">
                <span class="v3-footer-stat-val">5 400</span>
                <span class="v3-footer-stat-label">Mieszkańców</span>
              </div>
              <div class="v3-footer-stat">
                <span class="v3-footer-stat-val">137</span>
                <span class="v3-footer-stat-label">km²</span>
              </div>
              <div class="v3-footer-stat">
                <span class="v3-footer-stat-val">1394</span>
                <span class="v3-footer-stat-label">Prawa miejskie</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Main: columns */}
    <div class="v3-footer-main">
      <div class="v3-container">
        <div class="v3-footer-grid">
          <div class="v3-footer-col v3-footer-brand-col">
            <div class="v3-footer-brand-row">
              <HerbIzbica size={56} />
              <div>
                <div class="v3-footer-brand-name">izbica<span class="num">24</span></div>
                <div class="v3-brand-tagline">Magazyn Gminy · Kujawy</div>
              </div>
            </div>
            <p class="v3-footer-brand-desc">
              Niezależny portal informacyjny Gminy Izbica Kujawska. Tworzony przez mieszkańców z pomocą AI pod ścisłą kontrolą redakcyjną.
            </p>
            <div class="v3-footer-socials">
              <a href="#" class="v3-footer-social" aria-label="Facebook"><Icon.Mail size={16} /></a>
              <a href="#" class="v3-footer-social" aria-label="YouTube"><Icon.PlayCircle size={16} /></a>
              <a href="/rss.xml" class="v3-footer-social" aria-label="RSS"><Icon.Rss size={16} /></a>
              <a href="#" class="v3-footer-social" aria-label="Telegram"><Icon.Send size={16} /></a>
            </div>
            <div class="v3-footer-contact-card">
              <div class="v3-footer-contact-row">
                <Icon.Mail size={16} />
                <span>redakcja@izbica24.pl</span>
              </div>
              <div class="v3-footer-contact-row">
                <Icon.MapPin size={16} />
                <span>ul. Marszałka Piłsudskiego 32<br/>87-865 Izbica Kujawska</span>
              </div>
            </div>
          </div>
          <div class="v3-footer-col">
            <h4>Kategorie</h4>
            <ul>
              <li><a href="/wiadomosci">Wiadomości</a></li>
              <li><a href="/na-sygnale">Na sygnale</a></li>
              <li><a href="/samorzad">Samorząd</a></li>
              <li><a href="/kujawianka">Kujawianka</a></li>
              <li><a href="/kultura">Kultura</a></li>
              <li><a href="/historia">Historia</a></li>
              <li><a href="/ludzie">Ludzie</a></li>
              <li><a href="/multimedia">Multimedia</a></li>
            </ul>
          </div>
          <div class="v3-footer-col">
            <h4>Portal</h4>
            <ul>
              <li><a href="/o-portalu">O portalu</a></li>
              <li><a href="/redakcja">Redakcja</a></li>
              <li><a href="/kontakt">Kontakt</a></li>
              <li><a href="/reklama">Reklama</a></li>
              <li><a href="/dolacz">Dołącz do nas</a></li>
              <li><a href="/plan">Plan wdrożenia</a></li>
              <li><a href="/wiedza">Baza wiedzy · RAG</a></li>
              <li><a href="/sitemap.xml">Mapa strony</a></li>
            </ul>
          </div>
          <div class="v3-footer-col">
            <h4>Gmina</h4>
            <ul>
              <li><a href="/telefony">Ważne telefony</a></li>
              <li><a href="/linki">Przydatne linki</a></li>
              <li><a href="/mapa">Mapa gminy</a></li>
              <li><a href="/historia">Historia Izbicy</a></li>
              <li><a href="/historia/wietrzychowice">Wietrzychowice</a></li>
              <li><a href="/kujawianka">MGKS Kujawianka</a></li>
              <li><a href="/api/v1/health">API publiczne</a></li>
              <li><a href="/rss.xml">Kanał RSS</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    {/* Bottom bar */}
    <div class="v3-footer-bottom">
      <div class="v3-container">
        <div class="v3-footer-bottom-inner">
          <div class="v3-footer-legal">
            <a href="/regulamin">Regulamin</a>
            <a href="/polityka-prywatnosci">Polityka prywatności</a>
            <a href="/rodo">RODO</a>
            <a href="/polityka-cookies">Cookies</a>
          </div>
          <span class="v3-footer-ai-badge">Wspomagane AI · weryfikowane przez redakcję</span>
          <span class="v3-footer-copyright">© 2026 izbica24.pl</span>
        </div>
      </div>
    </div>
  </footer>
)

/* ================== EXPORT MAIN HOME PAGE ================== */
export const HomeV3 = () => (
  <>
    <UtilityBar />
    <Header />
    <Nav />
    <BreakingTicker />
    <main id="page-main">
      {/* [01] HERO + [02] TopStrip (6 KPI) */}
      <HeroSection />
      <TopStrip />
      {/* [03] Na Sygnale — alert strip (waga ↑↑↑) */}
      <NaSygnaleStrip />
      {/* [04] Wiadomości — feature 2x2 + 6 small + chips */}
      <WiadomosciModule />
      {/* [05] Samorząd — lead + sub-widget Sesja Rady + sub-widget Budżet donut (waga ↑↑) */}
      <SamorzadModule />
      {/* [06] Inwestycje — 5 projektów progress (waga ↑↑) */}
      <InwestycjeModule />
      {/* [07] Kujawianka + Sport — match + scorers + amatorzy (BEZ duplikatu KujawiankaSection — wszystko w SportModule) */}
      <SportModule />
      {/* [08] Kultura (przed Historią — user request) */}
      <KulturaModule />
      {/* [09] Edukacja */}
      <EdukacjaModule />
      {/* [10] Zdrowie — apteka + SPZOZ + profilaktyka */}
      <ZdrowieModule />
      {/* [11] Środowisko + Rolnictwo */}
      <SrodowiskoRolnictwoModule />
      {/* [12] Ludzie — wywiad + 3 portrety */}
      <LudzieModule />
      {/* [13] Historia (niżej — user request: "Historię niżej daj") */}
      <HistoriaModule />
      {/* [14] Sołectwa — SVG minimapa + chipy + ostatnia aktywność */}
      <SolectwaModule />
      {/* [15] Kalendarz 7 dni */}
      <KalendarzModule />
      {/* [16] Multimedia — video featured + 4 thumbs + podcast banner */}
      <MultimediaModule />
      {/* [17] Mieszkaniec Pyta — Q&A feed */}
      <MieszkaniecPytaModule />
      {/* [18] Opinie + naj komentowane */}
      <OpinieModule />
      {/* [19] Newsletter — full-bleed navy + gold radial */}
      <NewsletterBleed />
      {/* [20] Ogłoszenia — nekrologi/praca/nieruchomości */}
      <OgloszeniaModule />
      {/* [21] Top 10 tygodnia */}
      <Top10Module />
      {/* [22] Partnerzy — 7 instytucji (urząd, MGCK, biblioteka, Caritas, OSP, Orioniści, parafia) */}
      <PartnerzyBar />
      {/* [23] Archiwum — rok + miesiąc + kategoria chipy */}
      <ArchiwumBar />
    </main>
    <Footer />
    <button class="v3-scroll-top" id="scrollTopBtn" aria-label="Do góry">
      <Icon.ArrowUp size={20} />
    </button>
  </>
)

export { Header, Nav, Footer, UtilityBar, BreakingTicker }
