import {
  HERO_MAIN, HERO_SECONDARY, NA_SYGNALE, BREAKING,
  NEWS_MAIN, NEWS_CARDS, KUJAWIANKA, SAMORZAD, PRZEGLAD_MEDIOW,
  KULTURA_MAIN, KULTURA_EVENTS, HISTORIA_MAIN, HISTORIA_ARCHIWUM,
  LUDZIE, ZYCIE, DZIS_W_IZBICY, SOLECTWA, OGLOSZENIA, MULTIMEDIA,
  SIDEBAR_TOP5, SIDEBAR_PHONES, WEEK_FORECAST,
} from '../data'

// Pomocnicze: kolor kategorii inline
const catColor = (cat: string): string => {
  const map: Record<string, string> = {
    Wiadomości: '#c0392b', 'Na Sygnale': '#e74c3c',
    Samorząd: '#1a3a5c', Kujawianka: '#1e7a4f',
    Kultura: '#7b2d8b', Historia: '#b8860b',
  }
  return map[cat] || '#c0392b'
}

export const BreakingBar = () => (
  <div id="breaking-bar">
    <div class="breaking-inner">
      <div class="breaking-label">🚨 Pilne</div>
      <div class="ticker-wrap">
        <div class="ticker-track">
          {BREAKING.map((t) => <div class="ticker-item">{t}</div>)}
          {BREAKING.map((t) => <div class="ticker-item">{t}</div>)}
        </div>
      </div>
    </div>
  </div>
)

export const Hero = () => (
  <section id="hero" class="reveal">
    {/* MAIN */}
    <article class="hero-main">
      <div class="img-wrap">
        <img src={HERO_MAIN.image} alt={HERO_MAIN.title} loading="eager" />
        <div class="img-overlay"></div>
        <div class="cat-label">{HERO_MAIN.subcategory || HERO_MAIN.category}</div>
        <div class="hero-title-over">
          <h1>{HERO_MAIN.title}</h1>
        </div>
      </div>
      <div class="hero-body">
        <p class="lead">{HERO_MAIN.lead}</p>
        <a href="#" class="read-more">Czytaj dalej</a>
        <div class="byline">
          <span>{HERO_MAIN.author}</span>
          <span>·</span>
          <span>{HERO_MAIN.time}</span>
        </div>
      </div>
    </article>

    {/* SECONDARY — NAJWAŻNIEJSZE */}
    <aside class="hero-secondary">
      <div class="section-label"><span>Najważniejsze</span></div>
      {HERO_SECONDARY.map((a) => (
        <article class="art-item" style={`--cat: ${catColor(a.category)}`}>
          <img class="art-thumb" src={a.image} alt="" loading="lazy" />
          <div class="art-meta">
            <span class="cat-tag">{a.subcategory || a.category}</span>
            <h3>{a.title}</h3>
            <time>{a.time}</time>
          </div>
        </article>
      ))}
    </aside>

    {/* NA SYGNALE */}
    <aside class="hero-sygnale">
      <div class="sygnale-header">
        <span class="live-dot"></span>
        <span>🚨 Na Sygnale</span>
      </div>
      {NA_SYGNALE.map((s) => (
        <div class={`sygnale-item ${s.live ? 'live' : ''}`}>
          <div class="sygnale-time">{s.time}</div>
          <div class="sygnale-type">{s.type}</div>
          <div class="sygnale-desc">{s.desc}</div>
        </div>
      ))}
      <a href="#na-sygnale-full" class="sygnale-all-link">Wszystkie zdarzenia →</a>
    </aside>
  </section>
)

export const Wiadomosci = () => (
  <section id="wiadomosci" class="reveal">
    <header class="section-header">
      <div class="section-title">
        <div class="section-rule" style="--c: var(--c-wiadomosci)"></div>
        <span class="section-name">Wiadomości</span>
        <span class="section-sub">— Gmina Izbica Kujawska</span>
      </div>
      <a href="/wiadomosci" class="section-more">Wszystkie →</a>
    </header>
    <div class="news-grid">
      <article class="news-main" style="--cat: var(--c-wiadomosci)">
        <div class="img-wrap">
          <img src={NEWS_MAIN.image} alt="" loading="lazy" />
        </div>
        <span class="cat-tag" style="font: 700 11px var(--ui); letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-wiadomosci);">
          {NEWS_MAIN.subcategory}
        </span>
        <h2 style="margin-top: 8px;">{NEWS_MAIN.title}</h2>
        <p class="lead">{NEWS_MAIN.lead}</p>
        <div class="news-tags">
          {NEWS_MAIN.tags?.map((t) => <span class="news-tag">{t}</span>)}
        </div>
      </article>
      {NEWS_CARDS.map((n) => (
        <article class="news-card" style="--cat: var(--c-wiadomosci)" data-cat={n.subcategory}>
          <div class="img-wrap">
            <img src={n.image} alt="" loading="lazy" />
          </div>
          <span class="cat-tag">{n.subcategory}</span>
          <h3>{n.title}</h3>
          <time>{n.time}</time>
        </article>
      ))}
    </div>
    <div class="news-filter-bar">
      {['Wszystkie', 'Inwestycje', 'Edukacja', 'Zdrowie', 'Społeczne', 'Komunikaty', 'Środowisko', 'Rolnictwo'].map((f, i) => (
        <button class={`filter-tag ${i === 0 ? 'active' : ''}`} data-filter={f}>{f}</button>
      ))}
    </div>
  </section>
)

export const NaSygnaleFull = () => (
  <section id="na-sygnale-full" class="reveal">
    <header class="section-header" style="margin-bottom: 18px;">
      <div class="section-title">
        <div class="section-rule" style="--c: var(--c-sygnale)"></div>
        <span class="section-name">Na Sygnale</span>
        <span class="section-sub">— interwencje służb</span>
      </div>
      <a href="#" class="section-more">Wszystkie →</a>
    </header>
    <div class="sygnale-grid">
      <article class="sygnale-big">
        <div class="img-wrap">
          <img src="https://images.unsplash.com/photo-1582550945154-aaf7ea2c4c80?w=900&h=506&fit=crop" alt="" loading="lazy" />
        </div>
        <span class="cat-tag">🚒 Pożary</span>
        <h2>Pożar stodoły w Bierzynie — w akcji 3 zastępy OSP</h2>
        <p class="lead">
          O godzinie 07:42 do OSP Izbica Kujawska wpłynęło zgłoszenie pożaru stodoły w gospodarstwie rolnym w Bierzynie. Na miejsce skierowano 3 zastępy z OSP Izbica, OSP Pasieka i KM PSP Włocławek. Nikt z mieszkańców nie ucierpiał, akcja trwała do godziny 11:15.
        </p>
        <div class="meta">
          <time>07:42</time>
          <span>·</span>
          <span>Pożary</span>
          <span>·</span>
          <span>OSP Izbica Kujawska</span>
        </div>
      </article>
      <div class="sygnale-timeline">
        {NA_SYGNALE.map((s, i) => (
          <div class={`timeline-item ${i === 0 ? 'live' : ''}`}>
            <div class="timeline-time">{s.time}</div>
            <div class="timeline-type">{s.type}</div>
            <div class="timeline-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export const Kujawianka = () => {
  const lm = KUJAWIANKA.lastMatch
  return (
    <section id="kujawianka" class="reveal">
      <div class="kuj-section-header">
        <h2>
          ⚽ Kujawianka <span class="sub">— Klub od 1949 roku</span>
        </h2>
        <a href="#">Wszystkie →</a>
      </div>
      <div class="kujawianka-grid">
        <div class="k-score">
          <div class="team-line">{lm.home}</div>
          <div class="score-display">
            <div class="score-num">{lm.homeScore}</div>
            <div class="score-vs">:</div>
            <div class="score-num">{lm.awayScore}</div>
          </div>
          <div class="team-line" style="color: #f0c040;">{lm.away}</div>
          <div class="match-meta">
            {lm.date}<br />
            {lm.round} · {lm.league}
          </div>
          <div class="next-match">
            <div class="next-label">Następny mecz</div>
            <div class="next-teams">{KUJAWIANKA.nextMatch.home} vs {KUJAWIANKA.nextMatch.away.replace('KUJAWIANKA Izbica Kujawska', '')}</div>
            <div class="next-date">{KUJAWIANKA.nextMatch.date} · {KUJAWIANKA.nextMatch.venue}</div>
          </div>
        </div>

        <div class="k-table">
          <table>
            <caption>Tabela — Klasa Okręgowa, grupa 2</caption>
            <thead>
              <tr>
                <th>#</th><th>Zespół</th><th>M</th><th>W</th><th>R</th><th>P</th><th>Pkt</th>
              </tr>
            </thead>
            <tbody>
              {KUJAWIANKA.table.map((row) => (
                <tr class={row.highlight ? 'highlight' : ''}>
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

        <div class="k-articles">
          {KUJAWIANKA.articles.map((a) => (
            <div class="art-card">
              <img src={a.img} alt="" />
              <div>
                <h3>{a.title}</h3>
                <time>{a.time}</time>
              </div>
            </div>
          ))}
          <div class="k-scorers">
            <h4>Top strzelcy</h4>
            {KUJAWIANKA.scorers.map((s) => (
              <div class="scorer-item">
                <span>{s.name}</span>
                <span class="scorer-goals">{s.goals} bramek</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export const SamorzadMedia = () => (
  <section id="samorzad-media" class="reveal">
    <div class="sm-grid">
      <div class="sam-block">
        <header class="section-header">
          <div class="section-title">
            <div class="section-rule" style="--c: var(--c-samorzad)"></div>
            <span class="section-name">Samorząd</span>
            <span class="section-sub">— władze gminy</span>
          </div>
          <a href="#" class="section-more">Wszystkie →</a>
        </header>
        {SAMORZAD.map((s) => (
          <article class="samorzad-item">
            <img src={s.img} alt="" loading="lazy" />
            <div>
              <span class="cat-tag">{s.cat}</span>
              <h3>{s.title}</h3>
              <p>{s.lead}</p>
              <time>{s.time}</time>
            </div>
          </article>
        ))}
        <div class="sam-banner">
          🏛️ Następna sesja Rady Miejskiej: <strong>czwartek, 28 maja 2026, godz. 14:00</strong> · porządek obrad →
        </div>
      </div>

      <aside class="media-block">
        <div class="media-header">
          <h2>Co piszą o Izbicy</h2>
          <div class="ai-note">opracowanie AI · weryfikacja redakcji</div>
        </div>
        {PRZEGLAD_MEDIOW.map((m) => (
          <article class="media-item">
            <div class="media-src">
              <span>{m.src}</span>
              <span class="ai-badge">✦ AI</span>
            </div>
            <h3>{m.title}</h3>
            <p class="summary">{m.summary}</p>
            <a href={`https://${m.srcUrl}`} target="_blank" rel="noopener" class="src-link">{m.srcUrl} →</a>
          </article>
        ))}
      </aside>
    </div>
  </section>
)

export const KulturaHistoria = () => (
  <section id="kultura-historia" class="reveal">
    <div class="kh-grid">
      <div class="kh-kult">
        <header class="section-header">
          <div class="section-title">
            <div class="section-rule" style="--c: var(--c-kultura)"></div>
            <span class="section-name">Kultura</span>
          </div>
          <a href="#" class="section-more">MGCK →</a>
        </header>
        <article class="feature">
          <div class="img-wrap"><img src={KULTURA_MAIN.img} alt="" loading="lazy" /></div>
          <h2>{KULTURA_MAIN.title}</h2>
          <p>{KULTURA_MAIN.lead}</p>
        </article>
        <div class="events-mini-cal">
          <h3>Najbliższe wydarzenia</h3>
          {KULTURA_EVENTS.map((e) => (
            <div class="event-item">
              <div class="event-date">
                <span class="day">{e.day}</span>
                <span class="mon">{e.mon}</span>
              </div>
              <div>
                <div class="event-name">{e.title}</div>
                <div class="event-venue">{e.venue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div class="kh-hist">
        <div class="hist-header">
          <h2 style="margin: 0;">Tego dnia w Izbicy</h2>
          <span class="sub">— historia lokalna</span>
        </div>
        <article class="feature">
          <div class="img-wrap"><img src={HISTORIA_MAIN.img} alt="" loading="lazy" /></div>
          <h3>{HISTORIA_MAIN.title}</h3>
          <p>{HISTORIA_MAIN.lead}</p>
        </article>
        <div class="hist-archive">
          <h4>Z archiwum</h4>
          {HISTORIA_ARCHIWUM.map((a) => (
            <div class="hist-archive-item">
              <h5>{a.title}</h5>
              <time>{a.time}</time>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export const Ludzie = () => (
  <section id="ludzie" class="reveal">
    <div class="ludzie-header">
      <h2>Ludzie Izbicy</h2>
      <div class="sub">Mieszkańcy, którzy tworzą gminę</div>
    </div>
    <div class="ludzie-grid">
      {LUDZIE.map((p) => (
        <article class="person-card">
          <div class="photo"><img src={p.img} alt={p.name} loading="lazy" /></div>
          <div class="person-name">{p.name}</div>
          <div class="person-role">{p.role}</div>
          <div class="person-title">„{p.title}"</div>
          <a class="read-more">Czytaj wywiad</a>
        </article>
      ))}
    </div>
    <div class="ludzie-cta">
      <a href="#">Poznaj więcej mieszkańców →</a>
    </div>
  </section>
)

export const ZycieCodzienne = () => (
  <section id="zycie" class="reveal">
    <div class="zycie-inner">
      <header class="section-header" style="border-color: rgba(0,0,0,0.08);">
        <div class="section-title">
          <div class="section-rule" style="--c: var(--c-zycie)"></div>
          <span class="section-name">Życie codzienne</span>
          <span class="section-sub">— przydatne informacje dla mieszkańców</span>
        </div>
        <a href="#" class="section-more">Wszystkie →</a>
      </header>
      <div class="zycie-grid">
        {ZYCIE.map((z) => (
          <article class="zycie-card">
            <span class="zycie-icon">{z.icon}</span>
            <div class="zycie-name">{z.name}</div>
            <div class="zycie-count">{z.count} artykułów</div>
            <div class="zycie-last">{z.last}</div>
          </article>
        ))}
      </div>
      <div class="poradnik-week">
        <div class="poradnik-label">★ Poradnik tygodnia</div>
        <div class="poradnik-title">Harmonogram odbioru odpadów — czerwiec 2026</div>
        <div class="poradnik-lead">Pełny harmonogram dla wszystkich 34 sołectw gminy Izbica Kujawska, z podziałem na frakcje: zmieszane, segregowane, BIO, gabaryty.</div>
      </div>
    </div>
  </section>
)

export const DzisWIzbicy = () => (
  <section id="dzis-w-izbicy" class="reveal">
    <div class="dzis-grid">
      <div>
        <div class="dzis-label">Dziś w Izbicy</div>
        <div class="dzis-sub">artykuł sezonowy, opracowany przez AI, zatwierdzony przez redakcję</div>
        <h2>{DZIS_W_IZBICY.title}</h2>
        <p>{DZIS_W_IZBICY.lead}</p>
        <div class="dzis-author">{DZIS_W_IZBICY.author}</div>
      </div>
      <div class="dzis-img">
        <img src={DZIS_W_IZBICY.img} alt="" loading="lazy" />
      </div>
    </div>
  </section>
)

// Generator stylizowanej mapy sołectw — hexagonowa siatka
const SolectwaMapSVG = () => {
  // generujemy układ ~34 punktów rozłożonych pseudoorganicznie
  const pts: { x: number; y: number; r: number; sol: typeof SOLECTWA[number] }[] = []
  let i = 0
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (i >= SOLECTWA.length) break
      const sol = SOLECTWA[i++]
      const x = 60 + col * 80 + (row % 2 === 1 ? 40 : 0)
      const y = 50 + row * 75
      // rozmiar = trochę zależny od liczby artykułów
      const r = 16 + Math.min(sol.count, 24) * 0.6
      pts.push({ x, y, r, sol })
    }
  }
  return (
    <svg viewBox="0 0 540 530" preserveAspectRatio="xMidYMid meet" aria-label="Mapa sołectw">
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.5" fill="#b0bec8" opacity="0.3" />
        </pattern>
        <path id="rivPath" d="M 30,100 Q 200,180 380,150 T 520,400" />
      </defs>
      <rect width="540" height="530" fill="url(#dots)" />
      {/* Symboliczna rzeka — Kanał Zgłowiączki */}
      <path d="M 30,100 Q 200,180 380,150 T 520,400" fill="none" stroke="#7bb3d6" stroke-width="3" stroke-linecap="round" opacity="0.6" />
      <text x="270" y="220" font-family="DM Sans" font-size="9" fill="#7bb3d6" opacity="0.7" text-anchor="middle">Kanał Zgłowiączki</text>
      {/* Punkty sołectw */}
      {pts.map((p) => (
        <g class="sol-node" data-name={p.sol.name} data-count={p.sol.count}>
          <circle cx={p.x} cy={p.y} r={p.r} fill="#d0dce8" stroke="#b0bec8" stroke-width="1" />
          <text x={p.x} y={p.y + 3} font-family="DM Sans" font-size="8" font-weight="600" fill="#4a5566" text-anchor="middle" style="pointer-events: none;">
            {p.sol.name.length > 9 ? p.sol.name.slice(0, 8) + '.' : p.sol.name}
          </text>
        </g>
      ))}
      {/* Środek Izbica */}
      <g>
        <circle cx="270" cy="265" r="30" fill="#c0392b" stroke="white" stroke-width="3" />
        <text x="270" y="263" font-family="Playfair Display" font-size="11" font-weight="900" fill="white" text-anchor="middle">IZBICA</text>
        <text x="270" y="275" font-family="DM Sans" font-size="7" fill="white" text-anchor="middle" opacity="0.85">Kujawska</text>
      </g>
    </svg>
  )
}

export const Solectwa = () => (
  <section id="solectwa" class="reveal">
    <div class="solectwa-inner">
      <div class="solectwa-header">
        <h2>34 sołectwa Gminy Izbica Kujawska</h2>
        <div class="sub">Każda wieś ma swój głos · twoje sołectwo na mapie</div>
      </div>
      <div class="solectwa-grid">
        <div class="map-container">
          <SolectwaMapSVG />
          <div class="map-tooltip" id="mapTooltip">
            <div class="tt-name">Nazwa sołectwa</div>
            <div class="tt-count">0 artykułów</div>
          </div>
        </div>
        <div>
          <div class="solectwa-list">
            {SOLECTWA.map((s) => (
              <div class="sol-item" data-slug={s.name.toLowerCase()}>
                <span>{s.name}</span>
                <span class="sol-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)

export const Ogloszenia = () => (
  <section id="ogloszenia" class="reveal">
    <div class="ogl-inner">
      <div class="ogl-header">
        <h2>Ogłoszenia</h2>
        <div class="sub">bezpłatne dla mieszkańców Izbicy</div>
      </div>
      <div class="ogl-grid">
        {OGLOSZENIA.map((o) => (
          <div class={`ogl-tile ${o.name === 'Nekrologi' ? 'nekrologi' : ''}`} style={`--c: ${o.color}`}>
            <span class="ogl-icon">{o.icon}</span>
            <div class="ogl-name">{o.name}</div>
            {o.name === 'Nekrologi'
              ? <div class="ogl-sub">{o.sub}</div>
              : <div class="ogl-count">{o.count}</div>
            }
          </div>
        ))}
      </div>
      <div class="ogl-cta">
        <a href="#">+ Dodaj ogłoszenie — bezpłatnie</a>
      </div>
    </div>
  </section>
)

export const Multimedia = () => (
  <section id="multimedia" class="reveal">
    <div class="mm-inner">
      <div class="mm-header">
        <h2>Multimedia</h2>
      </div>
      <div class="mm-grid">
        <div class="mm-video">
          <div class="video-wrap">
            <img src={MULTIMEDIA.video.thumb} alt="" loading="lazy" />
            <div class="play-button">▶</div>
          </div>
          <span class="cat-tag">{MULTIMEDIA.video.cat}</span>
          <h3>{MULTIMEDIA.video.title}</h3>
        </div>

        <div class="mm-galleries">
          <div class="gallery-mosaic">
            {MULTIMEDIA.galleries.slice(0, 4).map((g) => (
              <div class="gallery-tile">
                <img src={g.img} alt="" loading="lazy" />
                <div class="overlay">
                  <div>
                    <div class="gtitle">{g.title}</div>
                    <div class="gcount">{g.count} zdjęć</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <a class="gall-link" href="#">Wszystkie galerie →</a>
        </div>

        <div class="mm-podcast">
          <div class="mic">🎙️</div>
          <h3>{MULTIMEDIA.podcast.title}</h3>
          <div class="duration">⏱ {MULTIMEDIA.podcast.duration}</div>
          <div class="player">
            <button class="play-mini">▶</button>
            <div class="progress"></div>
          </div>
          <div class="podcast-links">
            <a class="podcast-link" href="#">Spotify</a>
            <a class="podcast-link" href="#">Apple</a>
          </div>
        </div>
      </div>
    </div>
  </section>
)

// =========== SIDEBAR ===========
export const Sidebar = () => (
  <aside id="sidebar">
    <div class="sb-block sb-weather">
      <div class="sb-block-header">🌤 Pogoda Izbica Kujawska</div>
      <div class="sb-block-body">
        <div class="weather-now">
          <div class="now-icon">☀️</div>
          <div>
            <div class="now-temp">19°C</div>
            <div class="now-city">Izbica Kujawska, 25 maja 2026</div>
          </div>
        </div>
        <div class="week-grid">
          {WEEK_FORECAST.map((d) => (
            <div>
              <div class="wday">{d.day}</div>
              <div class="wicon">{d.icon}</div>
              <div class="wtemp">{d.t}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div class="sb-block sb-newsletter">
      <div class="sb-block-header">📨 Tydzień w Izbicy</div>
      <div class="sb-block-body">
        <p style="font: 400 12px/1.5 var(--body); color: var(--ink-muted); margin-bottom: 10px;">
          Co niedzielę — przegląd tygodnia prosto na e-mail.
        </p>
        <input type="email" placeholder="twoj@email.pl" />
        <button>Zapisz się</button>
        <div class="subs">Dołącz do <strong>1 247</strong> subskrybentów</div>
      </div>
    </div>

    <div class="sb-block">
      <div class="sb-block-header" style="--acc: var(--red);">🔥 TOP 5 tego tygodnia</div>
      <div class="sb-block-body" style="padding: 8px 14px;">
        {SIDEBAR_TOP5.map((t, i) => (
          <div class="top5-item">
            <div class="top5-num">0{i + 1}</div>
            <div>
              <div class="top5-title">{t.title}</div>
              <div class="top5-cat">{t.cat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div class="sb-tip-box">
      <h4>📣 Masz temat?</h4>
      <p>Widziałeś coś ważnego w Izbicy? Napisz do nas.</p>
      <textarea placeholder="Opisz krótko co się dzieje..."></textarea>
      <button>Wyślij newsa</button>
    </div>

    <div class="sb-block sb-ad">
      <div class="ad-label">Reklama</div>
      <div class="ad-text">Twoja reklama tutaj — zasięg: gmina Izbica Kujawska</div>
    </div>

    <div class="sb-block">
      <div class="sb-block-header">📞 Ważne telefony</div>
      <div class="sb-block-body" style="padding: 8px 14px;">
        {SIDEBAR_PHONES.map((p) => (
          <div class="phone-item">
            <span class="phone-icon">{p.icon}</span>
            <span class="phone-name">{p.name}</span>
            <span class="phone-num">{p.num}</span>
          </div>
        ))}
      </div>
    </div>

    <div class="sb-block sb-fb">
      <h4>Facebook · izbica24.pl</h4>
      <div class="fb-post">
        Dzień dobry mieszkańcom! Sesja Rady Miejskiej w czwartek 28 maja. Zapraszamy do śledzenia relacji.
        <div class="meta">2 godz. temu · 24 reakcje</div>
      </div>
      <div class="fb-post">
        Pożar w Bierzynie pod kontrolą — dziękujemy OSP Izbica, OSP Pasieka i PSP Włocławek!
        <div class="meta">5 godz. temu · 87 reakcji</div>
      </div>
      <div class="fb-post">
        ⚽ KUJAWIANKA wygrywa 3:1! Świetny mecz w Włocławku. Brawo chłopcy!
        <div class="meta">wczoraj · 156 reakcji</div>
      </div>
    </div>
  </aside>
)
