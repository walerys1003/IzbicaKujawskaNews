// izbica24.pl — Reuters-tier homepage (refactored to consume /static/reuters.css)
// All emojis replaced with inline SVG icons (Heroicons-outline). Hairline rules,
// monochrome categories, ALL-CAPS eyebrows, IZBICA datelines, no shadows/radius.

import {
  HERO_MAIN, HERO_SECONDARY, NA_SYGNALE, BREAKING,
  NEWS_MAIN, NEWS_CARDS, KUJAWIANKA, SAMORZAD, PRZEGLAD_MEDIOW,
  KULTURA_MAIN, KULTURA_EVENTS, HISTORIA_MAIN, HISTORIA_ARCHIWUM,
  LUDZIE, ZYCIE, DZIS_W_IZBICY, SOLECTWA, OGLOSZENIA, MULTIMEDIA,
  SIDEBAR_TOP5, SIDEBAR_PHONES, WEEK_FORECAST,
} from '../data'
import { Icon, IconForEmoji } from './icons'

// Helper: clean emoji prefix from type strings ("🚒 OSP" → "OSP", emoji → "🚒")
const splitTypeEmoji = (type: string): { emoji: string; short: string } => {
  const m = type.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u)
  if (m) return { emoji: m[1], short: m[2] }
  return { emoji: '', short: type }
}

const stripEmoji = (s: string): string =>
  s.replace(/^(\p{Extended_Pictographic}\uFE0F?)\s*/u, '').trim()

// ============================================================================
// BREAKING BAR — Reuters red strip with pulsing dot
// ============================================================================
export const BreakingBar = () => (
  <div id="breaking-bar">
    <div class="container breaking-inner">
      <div class="breaking-label">PILNE</div>
      <div class="breaking-content ticker-wrap">
        <div class="ticker-track">
          {BREAKING.map((t) => <span class="ticker-item">{t}<span class="sep"> · </span></span>)}
          {BREAKING.map((t) => <span class="ticker-item">{t}<span class="sep"> · </span></span>)}
        </div>
      </div>
    </div>
  </div>
)

// ============================================================================
// HERO — 2/3 main + 1/3 secondary list (Reuters "Latest" style)
// ============================================================================
export const Hero = () => (
  <section id="hero" class="reveal">
    <div class="container hero-grid">
      {/* MAIN HERO */}
      <article class="hero-main">
        <div class="hero-image">
          <img src={HERO_MAIN.image} alt={HERO_MAIN.title} loading="eager" />
        </div>
        <div class="hero-eyebrow">
          <span>{(HERO_MAIN.subcategory || HERO_MAIN.category).toUpperCase()}</span>
        </div>
        <h1 class="hero-title">
          <span class="dateline">IZBICA —</span> {HERO_MAIN.title}
        </h1>
        <p class="hero-lead">{HERO_MAIN.lead}</p>
        <div class="hero-meta">
          <span class="hero-author">{HERO_MAIN.author}</span>
          <span class="dot"></span>
          <time>{HERO_MAIN.time}</time>
          <span class="dot"></span>
          <span>Czytaj dalej →</span>
        </div>
      </article>

      {/* HERO SECONDARY — Reuters "Latest" */}
      <aside class="hero-secondary">
        {HERO_SECONDARY.map((a) => (
          <article class="hero-sec-item">
            <div class="text">
              <span class="eyebrow">{(a.subcategory || a.category).toUpperCase()}</span>
              <h3 class="hero-sec-title">{a.title}</h3>
              <time class="time">{a.time}</time>
            </div>
            <img class="thumb" src={a.image} alt="" loading="lazy" />
          </article>
        ))}
      </aside>
    </div>
  </section>
)

// ============================================================================
// NA SYGNALE — kompaktowy live feed (Reuters live blog style)
// ============================================================================
export const NaSygnaleFull = () => (
  <section id="na-sygnale" class="reveal">
    <div class="container">
      <div class="na-sygnale-header">
        <div class="na-sygnale-label">NA SYGNALE — LIVE</div>
        <span class="na-sygnale-meta">Interwencje służb · ostatnie 24h</span>
        <a href="#" class="section-link" style="margin-left: auto;">Wszystkie zdarzenia</a>
      </div>
      <ul class="na-sygnale-feed">
        {NA_SYGNALE.map((s) => {
          const { emoji, short } = splitTypeEmoji(s.type)
          return (
            <li class={`na-sygnale-item ${s.live ? 'na-sygnale-live' : ''}`}>
              <time class="na-sygnale-time">{s.time}</time>
              <span class="na-sygnale-type">
                {emoji && <IconForEmoji emoji={emoji} size={14} className="ico" />}
                <span>{short}</span>
              </span>
              <span class="na-sygnale-desc">{s.desc}</span>
              {s.live && <span class="na-sygnale-live-tag">LIVE</span>}
            </li>
          )
        })}
      </ul>
    </div>
  </section>
)

// ============================================================================
// WIADOMOŚCI — Reuters classic: 1 large + list of 6
// ============================================================================
export const Wiadomosci = () => (
  <section id="wiadomosci" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Wiadomości</h2>
        <span class="section-subtitle">— Gmina Izbica Kujawska</span>
        <a href="/wiadomosci" class="section-link">Wszystkie</a>
      </header>
      <div class="news-grid">
        <article class="news-main-card">
          <div class="news-main-image">
            <img src={NEWS_MAIN.image} alt="" loading="lazy" />
          </div>
          <div class="eyebrow">{NEWS_MAIN.subcategory.toUpperCase()}</div>
          <h2 class="news-main-title">
            <span class="dateline">IZBICA —</span> {NEWS_MAIN.title}
          </h2>
          <p class="news-main-lead">{NEWS_MAIN.lead}</p>
          <div class="news-main-meta">
            <span class="hero-author">{NEWS_MAIN.author}</span>
            <span class="dot"></span>
            <time>{NEWS_MAIN.time}</time>
            {NEWS_MAIN.tags && NEWS_MAIN.tags.length > 0 && (
              <>
                <span class="dot"></span>
                <span>{NEWS_MAIN.tags.join(' · ')}</span>
              </>
            )}
          </div>
        </article>

        <ul class="news-cards-list">
          {NEWS_CARDS.map((n) => (
            <li class="news-card" data-cat={n.subcategory}>
              <div>
                <div class="eyebrow">{n.subcategory.toUpperCase()}</div>
                <h3 class="news-card-title">{n.title}</h3>
                <div class="news-card-meta">
                  <span>{n.author}</span>
                  <span class="dot"></span>
                  <time>{n.time}</time>
                </div>
              </div>
              <img class="news-card-image" src={n.image} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
)

// ============================================================================
// KUJAWIANKA — match score + table + scorers (Reuters sports box)
// ============================================================================
export const Kujawianka = () => {
  const lm = KUJAWIANKA.lastMatch
  const isHomeUs = lm.home.includes('KUJAWIANKA')
  return (
    <section id="kujawianka" class="reveal">
      <div class="container">
        <header class="section-header kuj-header">
          <h2 class="section-title">
            <Icon.Soccer size={14} className="svg-icon" /> Kujawianka
          </h2>
          <span class="section-subtitle">— Klasa Okręgowa, grupa 2 · od 1949 r.</span>
          <a href="#" class="section-link">Klub</a>
        </header>
        <div class="kuj-grid">
          <div class="kuj-match">
            <div class="kuj-meta">{lm.round} · {lm.date}</div>
            <div class="kuj-match-teams">
              <span class={`kuj-team-name ${isHomeUs ? 'us' : ''}`}>{lm.home}</span>
              <span class="kuj-score">{lm.homeScore} <span class="sep">:</span> {lm.awayScore}</span>
              <span class={`kuj-team-name ${!isHomeUs ? 'us' : ''}`}>{lm.away}</span>
            </div>
            <div class="kuj-meta" style="margin-top: 12px;">
              <strong>Następny:</strong> {stripEmoji(KUJAWIANKA.nextMatch.home)} vs {stripEmoji(KUJAWIANKA.nextMatch.away)}
              <br />{KUJAWIANKA.nextMatch.date} · {KUJAWIANKA.nextMatch.venue}
            </div>
          </div>

          <div>
            <table class="kuj-table">
              <thead>
                <tr><th>#</th><th>Zespół</th><th>M</th><th>W</th><th>R</th><th>P</th><th>Pkt</th></tr>
              </thead>
              <tbody>
                {KUJAWIANKA.table.map((row) => (
                  <tr class={row.highlight ? 'us' : ''}>
                    <td>{row.pos}</td>
                    <td>{row.team}</td>
                    <td>{row.m}</td>
                    <td>{row.w}</td>
                    <td>{row.d}</td>
                    <td>{row.l}</td>
                    <td><strong>{row.pts}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 style="font: 600 11px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--rule-dark);">Top strzelcy</h4>
            <ul class="kuj-scorers" style="list-style: none; padding: 0;">
              {KUJAWIANKA.scorers.map((s) => (
                <li><span class="name">{s.name}</span><span class="goals">{s.goals}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SAMORZĄD + PRZEGLĄD MEDIÓW — hairline lists in 2 columns
// ============================================================================
export const SamorzadMedia = () => (
  <section id="samorzad" class="reveal">
    <div class="container sam-grid">
      <div>
        <header class="section-header">
          <h2 class="section-title">Samorząd</h2>
          <span class="section-subtitle">— władze gminy</span>
          <a href="#" class="section-link">Wszystkie</a>
        </header>
        <ul class="sam-list">
          {SAMORZAD.map((s) => (
            <li>
              <strong>{s.title}</strong>
              <div class="meta">
                <span>{s.cat}</span>
                <span class="dot"></span>
                <time>{s.time}</time>
              </div>
              <p style="font: 400 13px/1.5 var(--body); color: var(--ink-mid); margin-top: 6px;">{s.lead}</p>
            </li>
          ))}
        </ul>
        <div class="sam-banner" style="margin-top: 16px; padding: 12px 14px; background: var(--paper-warm); border-left: 3px solid var(--red); font: 500 12px/1.4 var(--ui);">
          <Icon.Government size={14} className="svg-icon" /> &nbsp; Następna sesja Rady Miejskiej: <strong>czw. 28 maja 2026, 14:00</strong> · <a href="#" style="color: var(--red);">porządek obrad</a>
        </div>
      </div>

      <div>
        <header class="section-header">
          <h2 class="section-title">Przegląd mediów</h2>
          <span class="section-subtitle">— AI · weryfikacja redakcji</span>
          <a href="#" class="section-link">Archiwum</a>
        </header>
        <ul class="prz-list">
          {PRZEGLAD_MEDIOW.map((m) => (
            <li>
              <div class="meta" style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                <strong style="color: var(--red);">{m.src}</strong>
                <span class="dot"></span>
                <time>{m.date}</time>
                <span class="ai-badge" style="margin-left: auto; font: 600 9px/1 var(--ui); letter-spacing: 0.1em; padding: 3px 6px; border: 1px solid var(--rule-dark); color: var(--ink-muted);">AI ✦</span>
              </div>
              <strong>{m.title}</strong>
              <p style="font: 400 13px/1.5 var(--body); color: var(--ink-mid); margin-top: 6px;">{m.summary}</p>
              <a href={`https://${m.srcUrl}`} target="_blank" rel="noopener" style="font: 500 11px/1 var(--ui); color: var(--ink-muted); margin-top: 8px; display: inline-block;">{m.srcUrl} →</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
)

// ============================================================================
// KULTURA + HISTORIA — feature image + events list
// ============================================================================
export const KulturaHistoria = () => (
  <section id="kultura-historia" class="reveal">
    <div class="container">
      <div class="cult-grid">
        <div class="cult-main">
          <header class="section-header" style="padding-top: 0;">
            <h2 class="section-title">Kultura</h2>
            <span class="section-subtitle">— MGCK</span>
            <a href="#" class="section-link">Kalendarz</a>
          </header>
          <article>
            <img src={KULTURA_MAIN.img} alt="" loading="lazy" />
            <div class="eyebrow" style="font: 600 11px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; color: var(--red); margin-bottom: 8px;">DNI IZBICY 2026</div>
            <h3><span class="dateline">IZBICA —</span> {KULTURA_MAIN.title}</h3>
            <p style="font: 400 14px/1.55 var(--body); color: var(--ink-mid);">{KULTURA_MAIN.lead}</p>
            <time style="font: 500 11px/1 var(--ui); color: var(--ink-muted); margin-top: 10px; display: block;">{KULTURA_MAIN.time}</time>
          </article>
        </div>

        <div>
          <header class="section-header" style="padding-top: 0;">
            <h2 class="section-title">Najbliższe wydarzenia</h2>
            <a href="#" class="section-link">Wszystkie</a>
          </header>
          <ul class="cult-events-list">
            {KULTURA_EVENTS.map((e) => (
              <li>
                <div class="date">
                  <span>{e.mon}</span>
                  <span class="day">{e.day}</span>
                </div>
                <div>
                  <strong>{e.title}</strong>
                  <div style="font: 400 11px/1.3 var(--ui); color: var(--ink-muted); margin-top: 2px;">{e.venue}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
)

export const Historia = () => (
  <section id="historia" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Tego dnia w Izbicy</h2>
        <span class="section-subtitle">— historia lokalna</span>
        <a href="#" class="section-link">Archiwum</a>
      </header>
      <div class="hist-grid" style="grid-template-columns: 1.5fr 1fr;">
        <div class="hist-main">
          <img src={HISTORIA_MAIN.img} alt="" loading="lazy" />
          <div class="eyebrow" style="font: 600 11px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; color: var(--red); margin-bottom: 8px;">25 MAJA 1940</div>
          <h3><span class="dateline">IZBICA —</span> {HISTORIA_MAIN.title}</h3>
          <p style="font: 400 14px/1.55 var(--body); color: var(--ink-mid);">{HISTORIA_MAIN.lead}</p>
        </div>
        <div>
          <h4 style="font: 600 11px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--rule-dark);">Z archiwum</h4>
          <ul class="sam-list">
            {HISTORIA_ARCHIWUM.map((a) => (
              <li>
                <strong>{a.title}</strong>
                <div class="meta"><time>{a.time}</time></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
)

// ============================================================================
// LUDZIE — 4 portrety bez tła, lekka desaturacja
// ============================================================================
export const Ludzie = () => (
  <section id="ludzie" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Ludzie</h2>
        <span class="section-subtitle">— mieszkańcy, którzy tworzą gminę</span>
        <a href="#" class="section-link">Wywiady</a>
      </header>
      <div class="ludzie-grid">
        {LUDZIE.map((p) => (
          <article class="ludzie-card">
            <img src={p.img} alt={p.name} loading="lazy" />
            <h4>{p.name}</h4>
            <div class="role">{p.role}</div>
            <p>„{p.title}"</p>
          </article>
        ))}
      </div>
    </div>
  </section>
)

// ============================================================================
// ŻYCIE CODZIENNE — siatka 4×2 z hairline divider grid
// ============================================================================
export const ZycieCodzienne = () => (
  <section id="zycie" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Życie codzienne</h2>
        <span class="section-subtitle">— przydatne informacje dla mieszkańców</span>
        <a href="#" class="section-link">Wszystkie poradniki</a>
      </header>
      <div class="zycie-grid">
        {ZYCIE.map((z) => (
          <article class="zycie-tile">
            <IconForEmoji emoji={z.icon} size={24} className="ico" />
            <h4>{z.name}</h4>
            <p>{z.last}</p>
            <div style="font: 500 10px/1 var(--ui); color: var(--ink-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: auto; padding-top: 8px;">{z.count} artykułów</div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

// ============================================================================
// DZIŚ W IZBICY — AI evergreen (3-kolumnowy dashboard-like blok)
// ============================================================================
export const DzisWIzbicy = () => (
  <section id="dzis-w-izbicy" class="reveal">
    <div class="container dzis-grid">
      <div class="dzis-block">
        <h4>Dziś w Izbicy</h4>
        <article>
          <div class="eyebrow" style="font: 600 10px/1 var(--ui); letter-spacing: 0.12em; text-transform: uppercase; color: var(--red); margin-bottom: 8px;">AI ✦ EVERGREEN · 25 MAJA</div>
          <h3 style="font: 600 17px/1.3 var(--serif); margin-bottom: 8px;">
            <span class="dateline">IZBICA —</span> {DZIS_W_IZBICY.title}
          </h3>
          <p style="font: 400 13px/1.55 var(--body); color: var(--ink-mid);">{DZIS_W_IZBICY.lead}</p>
          <div style="font: 500 11px/1 var(--ui); color: var(--ink-muted); margin-top: 10px;">{DZIS_W_IZBICY.author}</div>
        </article>
      </div>

      <div class="dzis-block">
        <h4>Pogoda &amp; sezon</h4>
        <ul>
          <li><span>Temperatura</span><span class="time">19°C</span></li>
          <li><span>Wschód słońca</span><span class="time">04:42</span></li>
          <li><span>Zachód słońca</span><span class="time">20:33</span></li>
          <li><span>Gleba 5 cm</span><span class="time">12°C</span></li>
          <li><span>Wilg. powietrza</span><span class="time">62%</span></li>
        </ul>
        <div style="margin-top: 12px;">
          <img src={DZIS_W_IZBICY.img} alt="" loading="lazy" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; filter: grayscale(0.2);" />
        </div>
      </div>

      <div class="dzis-block">
        <h4>Najczęściej czytane</h4>
        <ul>
          {SIDEBAR_TOP5.slice(0, 5).map((t, i) => (
            <li>
              <span><span style="color: var(--red); font-weight: 700; margin-right: 6px;">{String(i + 1).padStart(2, '0')}</span>{t.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
)

// ============================================================================
// SOŁECTWA — monochrome SVG hexgrid map
// ============================================================================
const SolectwaMapSVG = () => {
  const pts: { x: number; y: number; r: number; sol: typeof SOLECTWA[number] }[] = []
  let i = 0
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (i >= SOLECTWA.length) break
      const sol = SOLECTWA[i++]
      const x = 60 + col * 80 + (row % 2 === 1 ? 40 : 0)
      const y = 50 + row * 75
      const r = 16 + Math.min(sol.count, 24) * 0.5
      pts.push({ x, y, r, sol })
    }
  }
  return (
    <svg viewBox="0 0 540 530" preserveAspectRatio="xMidYMid meet" aria-label="Mapa sołectw gminy Izbica Kujawska">
      <defs>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="0.4" fill="#1a1a1a" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="540" height="530" fill="url(#dots)" />
      <path d="M 30,100 Q 200,180 380,150 T 520,400" fill="none" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="2,3" opacity="0.4" />
      <text x="270" y="220" font-family="Inter, sans-serif" font-size="8" fill="#1a1a1a" opacity="0.5" text-anchor="middle" letter-spacing="0.1em">KANAŁ ZGŁOWIĄCZKI</text>
      {pts.map((p) => (
        <g class="sol-node" data-name={p.sol.name} data-count={p.sol.count}>
          <circle cx={p.x} cy={p.y} r={p.r} fill="#ffffff" stroke="#1a1a1a" stroke-width="0.75" />
          <text x={p.x} y={p.y + 2} font-family="Inter, sans-serif" font-size="7" font-weight="500" fill="#1a1a1a" text-anchor="middle" style="pointer-events: none;">
            {p.sol.name.length > 9 ? p.sol.name.slice(0, 8) + '.' : p.sol.name}
          </text>
        </g>
      ))}
      <g>
        <circle cx="270" cy="265" r="26" fill="#1a1a1a" />
        <text x="270" y="264" font-family="Inter, sans-serif" font-size="10" font-weight="700" fill="white" text-anchor="middle" letter-spacing="0.08em">IZBICA</text>
        <text x="270" y="276" font-family="Inter, sans-serif" font-size="6" fill="#fa6400" text-anchor="middle" letter-spacing="0.05em">KUJAWSKA</text>
      </g>
    </svg>
  )
}

export const Solectwa = () => (
  <section id="solectwa" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">34 Sołectwa</h2>
        <span class="section-subtitle">— każda wieś ma swój głos · gmina Izbica Kujawska</span>
        <a href="#" class="section-link">Lista</a>
      </header>
      <div class="solectwa-wrap">
        <div class="solectwa-map-box">
          <SolectwaMapSVG />
        </div>
        <div>
          <ul class="solectwa-list">
            {SOLECTWA.map((s) => (
              <li data-slug={s.name.toLowerCase()}>
                <span class="name">{s.name}</span>
                <span class="num">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
)

// ============================================================================
// OGŁOSZENIA — gęsta hairline siatka 7 kategorii
// ============================================================================
export const Ogloszenia = () => (
  <section id="ogloszenia" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Ogłoszenia</h2>
        <span class="section-subtitle">— bezpłatne dla mieszkańców</span>
        <a href="#" class="section-link">+ Dodaj ogłoszenie</a>
      </header>
      <div class="ogl-grid">
        {OGLOSZENIA.map((o) => (
          <a href="#" class={`ogl-item ${o.name === 'Nekrologi' ? 'nekrologi' : ''}`}>
            <span class="ogl-type">
              <IconForEmoji emoji={o.icon} size={18} className="ico" />
            </span>
            <span class="ogl-title">{o.name}</span>
            {o.name === 'Nekrologi'
              ? <span class="ogl-meta">{o.sub}</span>
              : <span class="ogl-price">{o.count}</span>
            }
          </a>
        ))}
      </div>
    </div>
  </section>
)

// ============================================================================
// MULTIMEDIA — wideo + mozaika galerii + podcast
// ============================================================================
export const Multimedia = () => (
  <section id="multimedia" class="reveal">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">Multimedia</h2>
        <span class="section-subtitle">— wideo · podcast · galerie</span>
        <a href="#" class="section-link">Archiwum</a>
      </header>
      <div class="multi-grid">
        <article class="multi-item">
          <div class="multi-thumb" style="position: relative;">
            <img src={MULTIMEDIA.video.thumb} alt="" loading="lazy" />
            <span class="multi-play">
              <Icon.Play size={32} />
            </span>
          </div>
          <span class="multi-type">
            <Icon.Video size={12} className="svg-icon" /> {MULTIMEDIA.video.cat.toUpperCase()}
          </span>
          <h3>{MULTIMEDIA.video.title}</h3>
        </article>

        {MULTIMEDIA.galleries.slice(0, 2).map((g) => (
          <article class="multi-item">
            <div class="multi-thumb">
              <img src={g.img} alt="" loading="lazy" />
            </div>
            <span class="multi-type">
              <Icon.Camera size={12} className="svg-icon" /> GALERIA · {g.count} ZDJĘĆ
            </span>
            <h3>{g.title}</h3>
          </article>
        ))}

        <article class="multi-item">
          <div class="multi-thumb" style="background: var(--ink); aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
            <Icon.Audio size={48} className="svg-icon" />
          </div>
          <span class="multi-type">
            <Icon.Audio size={12} className="svg-icon" /> PODCAST
          </span>
          <h3>{MULTIMEDIA.podcast.title}</h3>
          <div class="multi-duration">
            <Icon.Clock size={12} className="svg-icon" /> {MULTIMEDIA.podcast.duration} · Spotify · Apple Podcasts
          </div>
        </article>
      </div>
    </div>
  </section>
)

// ============================================================================
// SIDEBAR — Reuters-style widgets z hairline rules
// ============================================================================
export const Sidebar = () => (
  <aside id="sidebar" class="sidebar">
    {/* WEATHER */}
    <div class="sidebar-widget sidebar-weather">
      <h4>
        <Icon.CloudSun size={14} className="svg-icon" /> Pogoda · Izbica Kujawska
      </h4>
      <div class="weather-today">
        <Icon.Sun size={36} className="svg-icon-lg" />
        <div>
          <div class="temp">19°C</div>
          <div class="date">25 maja 2026 · poniedziałek</div>
        </div>
      </div>
      <ul class="weather-week">
        {WEEK_FORECAST.map((d) => (
          <li>
            <span class="day">{d.day}</span>
            <IconForEmoji emoji={d.icon} size={14} className="ico" />
            <span class="temp-w">{d.t}°</span>
          </li>
        ))}
      </ul>
    </div>

    {/* NEWSLETTER */}
    <div class="sidebar-widget">
      <h4>
        <Icon.Mail size={14} className="svg-icon" /> Tydzień w Izbicy
      </h4>
      <p style="font: 400 12px/1.5 var(--body); color: var(--ink-muted); margin-bottom: 10px;">
        Co niedzielę — przegląd tygodnia prosto na e-mail.
      </p>
      <form>
        <input type="email" placeholder="twoj@email.pl" />
        <button type="submit">Zapisz się</button>
      </form>
      <div style="font: 500 11px/1 var(--ui); color: var(--ink-muted); margin-top: 8px;">
        Dołącz do <strong style="color: var(--ink);">1 247</strong> subskrybentów
      </div>
    </div>

    {/* TOP 5 */}
    <div class="sidebar-widget sidebar-top5">
      <h4>
        <Icon.Fire size={14} className="svg-icon" /> Top 5 tego tygodnia
      </h4>
      <ol>
        {SIDEBAR_TOP5.map((t, i) => (
          <li>
            <span class="num">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <a href="#" class="title">{t.title}</a>
              <div class="meta">{t.cat.toUpperCase()}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>

    {/* TIP */}
    <div class="sidebar-widget" style="background: var(--paper-warm); border-left: 3px solid var(--red);">
      <h4>
        <Icon.Megaphone size={14} className="svg-icon" /> Masz temat?
      </h4>
      <p style="font: 400 12px/1.5 var(--body); color: var(--ink-mid); margin-bottom: 10px;">
        Widziałeś coś ważnego? Napisz do redakcji.
      </p>
      <form>
        <textarea placeholder="Opisz krótko co się dzieje..."></textarea>
        <button type="submit">Wyślij newsa</button>
      </form>
    </div>

    {/* PHONES */}
    <div class="sidebar-widget sidebar-phones">
      <h4>
        <Icon.Phone size={14} className="svg-icon" /> Ważne telefony
      </h4>
      <ul>
        {SIDEBAR_PHONES.map((p) => (
          <li>
            <IconForEmoji emoji={p.icon} size={14} className="ico" />
            <span class="name">{p.name}</span>
            <a href={`tel:${p.num.replace(/\s/g, '')}`} class="num">{p.num}</a>
          </li>
        ))}
      </ul>
    </div>

    {/* AD */}
    <div class="sidebar-widget" style="background: var(--paper-warm); text-align: center; padding: 18px 14px;">
      <div style="font: 600 9px/1 var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 8px;">Reklama</div>
      <div style="font: 500 13px/1.4 var(--ui); color: var(--ink-mid);">Twoja reklama tutaj</div>
      <div style="font: 400 11px/1.4 var(--ui); color: var(--ink-muted); margin-top: 4px;">zasięg: gmina Izbica Kujawska · 5 400 mieszkańców</div>
    </div>
  </aside>
)
