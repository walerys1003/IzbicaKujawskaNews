/* ===================================================================
   IZBICA24.PL v3.5 — MODUŁY STRONY GŁÓWNEJ (Sandbox G/H/I)
   24 modułów + reużywalne komponenty
   =================================================================== */

import { Icon } from './icons'
import { ARTICLES, CATEGORIES_MAP } from '../data-articles'
import {
  SOLECTWA, PARTNERS, SESJA_RADY, BUDZET_2026, INWESTYCJE,
  NEXT_MATCH, TOP_SCORERS, SPORT_AMATORSKI, HISTORIA_CARDS,
  KULTURA_EVENTS, EDUKACJA_NEWS, APTEKA_DYZUR, SPZOZ_INFO,
  KANAL_ZGLOWIACZKI, ROLNICTWO_PROGRAMY, LUDZIE_PORTRETY, WYWIAD_FEATURED,
  MIESZKANIEC_FEED, OPINIE, NAJ_KOMENTOWANE, VIDEO_FEATURED, VIDEO_THUMBS,
  PODCAST_LATEST, KALENDARZ_7DNI, NEKROLOGI, PRACA, NIERUCHOMOSCI,
  TOP10_TYDZIEN, ARCHIWUM,
} from '../data-modules'

/* ============ REUSABLE: MODULE HEADER ============ */
export const ModuleHead = ({ eyebrow, title, link, linkLabel = 'Zobacz wszystkie →' }: {
  eyebrow: string; title: string; link?: string; linkLabel?: string;
}) => (
  <div class="v3-module-head">
    <div class="v3-module-head-left">
      <div class="v3-module-eyebrow">{eyebrow}</div>
      <h2 class="v3-module-title">{title}</h2>
    </div>
    {link && <a href={link} class="v3-module-link">{linkLabel}</a>}
  </div>
)

/* ============ INICJAŁY (dla awatara) ============ */
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

/* ============ MAPOWANIE ZDJĘĆ (stock photos /static/img/) ============ */
const IMG = {
  inwestycje: {
    'koscielna-remont': '/static/img/inwestycje/01-droga.jpg',
    'wodociag-sadlno': '/static/img/inwestycje/02-kanalizacja.jpg',
    'plac-wolnosci': '/static/img/inwestycje/03-swietlica.jpg',
    'przedszkole-rozbudowa': '/static/img/inwestycje/04-fotowoltaika.jpg',
    'oswietlenie-led': '/static/img/inwestycje/05-osp.jpg',
  } as Record<string, string>,
  historia: {
    feature: '/static/img/historia/01-kurhany.jpg',
    'dzieje': '/static/img/historia/02-stare-miasto.jpg',
    'zydzi': '/static/img/historia/03-spolecznosc.jpg',
    'zabytki': '/static/img/historia/04-zabytki.jpg',
  } as Record<string, string>,
  kultura: {
    'koncert': '/static/img/kultura/01-koncert.jpg',
    'warsztaty': '/static/img/kultura/04-kgw.jpg',
    'event': '/static/img/kultura/05-festyn.jpg',
    'wystawa': '/static/img/kultura/02-mgck.jpg',
    'mgck': '/static/img/kultura/02-mgck.jpg',
    'biblioteka': '/static/img/kultura/03-biblioteka.jpg',
    'kgw': '/static/img/kultura/04-kgw.jpg',
  } as Record<string, string>,
  edukacja: {
    feature: '/static/img/edukacja/01-matura.jpg',
    przedszkole: '/static/img/edukacja/02-przedszkole.jpg',
    sp1: '/static/img/edukacja/03-sp1.jpg',
    matematyka: '/static/img/edukacja/04-matematyka.jpg',
    zajecia: '/static/img/edukacja/05-zajecia.jpg',
  } as Record<string, string>,
  zdrowie: {
    apteka: '/static/img/zdrowie/01-apteka.jpg',
    spzoz: '/static/img/zdrowie/02-spzoz.jpg',
    profilaktyka: '/static/img/zdrowie/03-profilaktyka.jpg',
    szczepienia: '/static/img/zdrowie/04-szczepienia.jpg',
  } as Record<string, string>,
  opinie: [
    '/static/img/opinie/01-redaktor1.jpg',
    '/static/img/opinie/02-redaktor2.jpg',
    '/static/img/opinie/03-redaktor3.jpg',
  ],
  ludzie: {
    burmistrz: '/static/img/ludzie/01-burmistrz.jpg',
    portrety: [
      '/static/img/ludzie/02-maria.jpg',
      '/static/img/ludzie/03-tadeusz.jpg',
      '/static/img/ludzie/04-anna.jpg',
      '/static/img/ludzie/05-piotr.jpg',
    ],
  },
  mieszkaniec: [
    '/static/img/mieszkaniec/01-krzysztof.jpg',
    '/static/img/mieszkaniec/02-halina.jpg',
    '/static/img/mieszkaniec/03-marek.jpg',
    '/static/img/mieszkaniec/04-katarzyna.jpg',
  ],
  kalendarz: [
    '/static/img/kalendarz/01-sesja.jpg',
    '/static/img/kalendarz/02-warsztaty.jpg',
    '/static/img/kalendarz/03-pradkujawski.jpg',
    '/static/img/kalendarz/04-spotkanie.jpg',
    '/static/img/kalendarz/05-wernisaz.jpg',
    '/static/img/kalendarz/06-festyn.jpg',
    '/static/img/kalendarz/07-dziecko.jpg',
  ],
  wiadomosci: [
    '/static/img/wiadomosci/01.jpg',
    '/static/img/wiadomosci/02.jpg',
    '/static/img/wiadomosci/03.jpg',
    '/static/img/wiadomosci/04.jpg',
    '/static/img/wiadomosci/05.jpg',
    '/static/img/wiadomosci/06.jpg',
  ],
  solectwaMap: '/static/img/solectwa/mapa-gminy-izbica.png',
}

/* ============ PODSERWISY SAMORZĄDU ============ */
const SAMORZAD_PODSERWISY = [
  { slug: 'burmistrz', name: 'Burmistrz', meta: 'Dorabiała Marek', icon: 'mayor' },
  { slug: 'rada', name: 'Rada Miejska', meta: '15 radnych · 4 komisje', icon: 'gavel' },
  { slug: 'komisje', name: 'Komisje', meta: 'Budżet · Oświata · Skarg', icon: 'committee' },
  { slug: 'konsultacje', name: 'Konsultacje', meta: '2 aktywne', icon: 'consult' },
]

/* ============ PODSERWISY KULTURY (MGCK / Biblioteka / 15 KGW) ============ */
const KULTURA_PODSERWISY = [
  { slug: 'mgck', name: 'MGCK', desc: 'Miejsko-Gminne Centrum Kultury. Koncerty, warsztaty, wystawy.', meta: 'ul. Narutowicza 49 · tel. 54 286 76 02', img: IMG.kultura.mgck },
  { slug: 'biblioteka', name: 'Biblioteka Publiczna', desc: 'Spotkania autorskie, ferie z książką, kursy online.', meta: 'ul. Marszałka Piłsudskiego 32 · 7 filii w gminie', img: IMG.kultura.biblioteka },
  { slug: 'kgw', name: '15 Kół Gospodyń Wiejskich', desc: 'Tradycja, kuchnia kujawska, festiwale, warsztaty.', meta: 'Aktywne we wszystkich sołectwach', img: IMG.kultura.kgw },
]

/* =================================================================
   [03] NA SYGNALE — ALERT STRIP (full-bleed burgundy)
   ================================================================= */
export const NaSygnaleStrip = () => (
  <section class="v3-alert-strip" aria-label="Na sygnale — alerty i komunikaty">
    <div class="v3-container">
      <div class="v3-alert-strip-inner">
        <div class="v3-alert-strip-label">
          <Icon.Alert size={18} />
          <span>NA SYGNALE</span>
        </div>
        <a href="/komunikaty/pge-wylaczenia-28-maja" class="v3-alert-card">
          <span class="v3-alert-card-icon"><Icon.Power size={18} /></span>
          <span class="v3-alert-card-text">
            <span class="v3-alert-card-type">Wyłączenia prądu</span>
            <span class="v3-alert-card-msg">28 maja, 8:00–14:00 — Smólsk, Świętosławice</span>
          </span>
        </a>
        <a href="/drogi/utrudnienia" class="v3-alert-card">
          <span class="v3-alert-card-icon"><Icon.MapPin size={18} /></span>
          <span class="v3-alert-card-text">
            <span class="v3-alert-card-type">Utrudnienia drogowe</span>
            <span class="v3-alert-card-msg">DW 270 — remont mostku, objazd przez Sadłno</span>
          </span>
        </a>
        <a href="/zdrowie/apteka-dyzurna" class="v3-alert-card">
          <span class="v3-alert-card-icon"><Icon.Heart size={18} /></span>
          <span class="v3-alert-card-text">
            <span class="v3-alert-card-type">Apteka dyżurna</span>
            <span class="v3-alert-card-msg">Medikus, Rynek 12 — dziś do 22:00</span>
          </span>
        </a>
      </div>
    </div>
  </section>
)

/* =================================================================
   [04] WIADOMOŚCI — 7-grid (1 feature 2x2 + 6 small) z chipami filtrów
   ================================================================= */
export const WiadomosciModule = () => {
  const featured = ARTICLES[0]
  const rest = ARTICLES.slice(1, 7)
  const subs = CATEGORIES_MAP.wiadomosci?.subcategories || []
  return (
    <section class="v3-module v3-wiadomosci-module" aria-labelledby="mod-wiad" style="--cat-color: #c0392b">
      <div class="v3-container">
        <ModuleHead eyebrow="Newsroom" title="Wiadomości z gminy" link="/wiadomosci" linkLabel="Wszystkie wiadomości →" />
        <div class="v3-chips">
          <a href="/wiadomosci" class="v3-chip v3-chip-active">Wszystkie</a>
          {subs.slice(0, 6).map(s => (
            <a href={`/wiadomosci/${s.slug}`} class="v3-chip">{s.title}</a>
          ))}
        </div>
        <div class="v3-news-grid">
          {/* Feature card 2x2 — z prawdziwym zdjęciem */}
          <article class="v3-news-card v3-news-card-feature" style={`--cat-color: ${featured.categoryColor}`}>
            <a href={`/wiadomosci/${featured.slug}`} class="v3-news-card-img">
              <img src={IMG.wiadomosci[0]} alt={featured.title} loading="lazy" />
              <span class="v3-news-card-cat">{featured.category}</span>
            </a>
            <div class="v3-news-card-body">
              <h3 class="v3-news-card-title"><a href={`/wiadomosci/${featured.slug}`}>{featured.title}</a></h3>
              <p class="v3-news-card-lede">{featured.lede}</p>
              <div class="v3-news-card-meta">
                <Icon.Clock size={12} /> {featured.readingMinutes} min · {featured.publishedAt}
              </div>
            </div>
          </article>
          {/* 6 small cards z prawdziwymi zdjęciami */}
          {rest.map((a, idx) => (
            <article class="v3-news-card" style={`--cat-color: ${a.categoryColor}`}>
              <a href={`/wiadomosci/${a.slug}`} class="v3-news-card-img">
                <img src={IMG.wiadomosci[(idx + 1) % IMG.wiadomosci.length] || IMG.wiadomosci[1]} alt={a.title} loading="lazy" />
                <span class="v3-news-card-cat">{a.category}</span>
              </a>
              <div class="v3-news-card-body">
                <h3 class="v3-news-card-title"><a href={`/wiadomosci/${a.slug}`}>{a.title}</a></h3>
                <div class="v3-news-card-meta">
                  <Icon.Clock size={12} /> {a.readingMinutes} min · {a.publishedAt}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================================================================
   [05] SAMORZĄD — 2-col (lead + lista) + sub-widgety (Sesja, Budżet)
   ================================================================= */
const BudzetDonut = () => {
  // Donut chart SVG — segmenty z BUDZET_2026
  const cx = 60, cy = 60, r = 42, sw = 16
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Budżet 2026 — donut">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0eee8" stroke-width={sw} />
      {BUDZET_2026.pozycje.map(p => {
        const len = (circ * p.percent) / 100
        const seg = (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={p.color}
            stroke-width={sw}
            stroke-dasharray={`${len} ${circ}`}
            stroke-dashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )
        offset += len
        return seg
      })}
      <text x={cx} y={cy} text-anchor="middle" dominant-baseline="middle" font-family="Playfair Display" font-weight="800" font-size="18" fill="#0a2540">{BUDZET_2026.total}</text>
      <text x={cx} y={cy + 16} text-anchor="middle" font-family="Inter" font-size="9" fill="#6b7280">mln zł</text>
    </svg>
  )
}

export const SamorzadModule = () => {
  const samorzadArticles = ARTICLES.filter(a => a.category === 'samorzad').slice(0, 4)
  const lead = samorzadArticles[0] || ARTICLES.find(a => a.slug === 'sesja-rady-22-maja') || ARTICLES[1]
  const list = samorzadArticles.slice(1).concat(ARTICLES.filter(a => a.category === 'komunikaty').slice(0, 2)).slice(0, 4)
  return (
    <section class="v3-module v3-samorzad-module" aria-labelledby="mod-samorzad">
      <div class="v3-container">
        <ModuleHead eyebrow="Władza lokalna" title="Samorząd" link="/samorzad" linkLabel="Wszystkie z samorządu →" />
        <div class="v3-samorzad-grid">
          <article class="v3-samorzad-lead">
            <div class="v3-img-placeholder v3-ph-news v3-ph-news-samorzad" style="aspect-ratio: 16/9; border-radius: 8px;"></div>
            <h3 class="v3-samorzad-lead-title">
              <a href={`/wiadomosci/${lead.slug}`}>{lead.title}</a>
            </h3>
            <p style="font:400 0.9rem/1.5 'Lora',serif; color:#475569; margin:0;">{lead.lede}</p>
            <div class="v3-samorzad-list">
              {list.map((a, i) => (
                <a class="v3-samorzad-list-item" href={`/wiadomosci/${a.slug}`}>
                  <span class="v3-samorzad-list-item-num">{String(i + 2).padStart(2, '0')}</span>
                  <div>
                    <div class="v3-samorzad-list-item-title">{a.title}</div>
                    <div style="font: 400 0.72rem/1 Inter,sans-serif; color: #6b7280; margin-top: 0.2rem;">{a.publishedAt}</div>
                  </div>
                </a>
              ))}
            </div>
          </article>
          <aside class="v3-samorzad-sidebar" aria-label="Sub-widgety samorządu">
            <div class="v3-widget-sesja">
              <div class="v3-widget-sesja-eyebrow">Najbliższa sesja Rady</div>
              <div class="v3-widget-sesja-num">Sesja {SESJA_RADY.numer}</div>
              <div class="v3-widget-sesja-date">{SESJA_RADY.data} · {SESJA_RADY.godzina}</div>
              <div class="v3-widget-sesja-meta">{SESJA_RADY.miejsce}</div>
              <ul class="v3-widget-sesja-agenda">
                {SESJA_RADY.agenda.slice(0, 4).map(a => <li>{a}</li>)}
              </ul>
              <a href={SESJA_RADY.link} style="display:inline-block; margin-top:0.85rem; font:700 0.78rem/1 Inter,sans-serif; color:#c8a951; text-decoration:none; letter-spacing:0.08em; text-transform:uppercase;">Pełny porządek obrad →</a>
            </div>
            <div class="v3-widget-budzet">
              <div class="v3-widget-budzet-eyebrow">Budżet gminy</div>
              <div class="v3-widget-budzet-title">Rok 2026</div>
              <div class="v3-widget-budzet-total">{BUDZET_2026.total} mln zł</div>
              <div class="v3-widget-budzet-grid">
                <BudzetDonut />
                <div class="v3-widget-budzet-list">
                  {BUDZET_2026.pozycje.map(p => (
                    <div class="v3-widget-budzet-list-item">
                      <span class="v3-widget-budzet-dot" style={`background: ${p.color}`}></span>
                      <span class="v3-widget-budzet-list-text">{p.name}</span>
                      <span class="v3-widget-budzet-list-val">{p.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
        {/* Podserwisy samorządu */}
        <div class="v3-samorzad-podserwisy" role="navigation" aria-label="Działy samorządu">
          {SAMORZAD_PODSERWISY.map(p => (
            <a class="v3-samorzad-podserwis" href={`/samorzad/${p.slug}`}>
              <span class="v3-samorzad-podserwis-icon">
                {p.icon === 'mayor' && <Icon.User size={18} />}
                {p.icon === 'gavel' && <Icon.Building size={18} />}
                {p.icon === 'committee' && <Icon.Wrench size={18} />}
                {p.icon === 'consult' && <Icon.Send size={18} />}
              </span>
              <span class="v3-samorzad-podserwis-text">
                <span class="v3-samorzad-podserwis-name">{p.name}</span>
                <span class="v3-samorzad-podserwis-meta">{p.meta}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================================================================
   [06] INWESTYCJE — Progress list 5-col
   ================================================================= */
export const InwestycjeModule = () => {
  const excerpts: Record<string, string> = {
    'koscielna-remont': 'Pełna modernizacja jezdni, chodników i odwodnienia. Oddana mieszkańcom przed terminem.',
    'wodociag-sadlno': 'Etap I (12 km sieci) zakończony. Etap II ruszył w marcu — woda dotrze do ostatnich gospodarstw jesienią.',
    'plac-wolnosci': 'Start prac w lipcu. W projekcie: fontanna, ławki, oświetlenie LED, zieleń. Cisi zwycięzcy konsultacji.',
    'przedszkole-rozbudowa': '4 nowe sale, kuchnia, świetlica. Liczba miejsc wzrośnie z 80 do 140 dzieci.',
    'oswietlenie-led': 'Wymiana 380 opraw na energooszczędne LED. Oszczędności rzędu 65% rocznie.',
  }
  return (
    <section class="v3-module v3-inwestycje-module" aria-labelledby="mod-inwest">
      <div class="v3-container">
        <ModuleHead eyebrow="Inwestycje gminne" title="Co się dziś buduje w gminie" link="/inwestycje" linkLabel="Mapa wszystkich inwestycji →" />
        <div class="v3-inwestycje-grid">
          {INWESTYCJE.map(i => {
            const statusLabel = i.status === 'completed' ? 'Zakończona' : i.status === 'in_progress' ? `W trakcie · ${i.progress}%` : 'Planowana'
            const statusClass = i.status === 'completed' ? 'status-done' : i.status === 'in_progress' ? 'status-progress' : 'status-planned'
            return (
              <a class="v3-investment-card" href={`/inwestycje/${i.slug}`}>
                <div class="v3-investment-card-img">
                  <img src={IMG.inwestycje[i.slug]} alt={i.title} loading="lazy" />
                </div>
                <div class="v3-investment-card-body">
                  <span class={`v3-investment-card-status ${statusClass}`}>{statusLabel}</span>
                  <h3 class="v3-investment-card-title">{i.title}</h3>
                  <p class="v3-investment-card-excerpt">{excerpts[i.slug]}</p>
                  {i.status !== 'planned' && (
                    <div class="v3-investment-card-progress">
                      <div class="v3-investment-card-progress-bar" style={`width: ${i.progress}%`}></div>
                    </div>
                  )}
                  <div class="v3-investment-card-meta">
                    <span>📍 {i.location}</span>
                    <span>⏱ {i.deadline}</span>
                    <span>💰 {i.budget}</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* =================================================================
   [07] KUJAWIANKA + SPORT — match card + next match + scorers + amateur
   ================================================================= */
export const SportModule = () => (
  <section class="v3-module v3-kujawianka" aria-labelledby="mod-sport">
    <div class="v3-container">
      <ModuleHead eyebrow="Sport lokalny" title="Kujawianka i sport gminy" link="/kujawianka" linkLabel="Wszystko o sporcie →" />
      {/* Główna karta meczu */}
      <div class="v3-kujawianka-card" style="margin-bottom: 1.25rem;">
        <div class="v3-kujawianka-match">
          <div class="v3-kujawianka-team">
            <div class="v3-kujawianka-team-logo" style="background: #1e7a4f;">K</div>
            <div class="v3-kujawianka-team-name">Kujawianka</div>
          </div>
          <div class="v3-kujawianka-score">3 : 1</div>
          <div class="v3-kujawianka-team">
            <div class="v3-kujawianka-team-logo" style="background: #34495e;">W</div>
            <div class="v3-kujawianka-team-name">Włocłavia</div>
          </div>
        </div>
        <div class="v3-kujawianka-meta">26. kolejka klasy okręgowej · 24 maja 2026, 19:45 · Stadion Włocłavia</div>
        <a href="/wiadomosci/kujawianka-wloclavia" class="v3-kujawianka-cta">Pełna relacja meczu →</a>
      </div>
      {/* Extras: next match + scorers + amateur */}
      <div class="v3-sport-extras">
        <div class="v3-sport-next-match">
          <div class="v3-sport-next-match-eyebrow">Następny mecz</div>
          <div class="v3-sport-next-match-vs">Kujawianka vs {NEXT_MATCH.rywal}</div>
          <div class="v3-sport-next-match-meta">{NEXT_MATCH.data} · {NEXT_MATCH.godzina} · {NEXT_MATCH.miejsce}</div>
          <span class="v3-sport-next-match-countdown">⏱ Za {NEXT_MATCH.daysLeft} dni · kolejka {NEXT_MATCH.kolejka}</span>
        </div>
        <div class="v3-sport-scorers">
          <div class="v3-sport-scorers-eyebrow">Top strzelcy sezonu</div>
          <ol class="v3-sport-scorers-list">
            {TOP_SCORERS.map(p => (
              <li><span>{p.player} <span style="font:400 0.72rem Inter; color:#6b7280; margin-left:.3rem;">{p.position}</span></span><b>{p.goals}</b></li>
            ))}
          </ol>
        </div>
      </div>
      {/* Amatorski */}
      <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        {SPORT_AMATORSKI.map(s => (
          <a href={`/sport/${s.cat}`} class="v3-chip">⚽ {s.title}</a>
        ))}
      </div>
    </div>
  </section>
)

/* =================================================================
   [09] KULTURA — calendar + cards
   ================================================================= */
export const KulturaModule = () => (
  <section class="v3-module v3-kultura-module" aria-labelledby="mod-kultura">
    <div class="v3-container">
      <ModuleHead eyebrow="Kultura · MGCK" title="Co dzieje się w kulturze" link="/kultura" linkLabel="Pełny kalendarz →" />
      {/* Najbliższe wydarzenia — karty z obrazami */}
      <div class="v3-kultura-grid">
        {KULTURA_EVENTS.map(e => (
          <a href={`/kultura/${e.cat}`} class="v3-kultura-card">
            <div class="v3-kultura-card-img">
              <img src={IMG.kultura[e.cat] || IMG.kultura['koncert']} alt={e.title} loading="lazy" />
            </div>
            <div class="v3-kultura-card-body">
              <div class="v3-kultura-card-eyebrow">{e.month} · {e.date} · {e.place}</div>
              <h3 class="v3-kultura-card-title">{e.title}</h3>
              <p class="v3-kultura-card-excerpt">
                {e.cat === 'koncert' && 'Kapela z Kujaw wraca na Rynek z autorskim repertuarem ludowym.'}
                {e.cat === 'warsztaty' && 'Wszystkie chętne dzieci od 6 do 12 lat — zapisy w MGCK do końca tygodnia.'}
                {e.cat === 'event' && 'Tradycyjne ognisko, koncert plenerowy, pokaz ognia. Wstęp wolny.'}
                {e.cat === 'wystawa' && 'Najlepsze zdjęcia mieszkańców gminy. Wystawa otwarta do końca lipca.'}
              </p>
            </div>
          </a>
        ))}
      </div>
      {/* Pod-serwisy: MGCK, Biblioteka, KGW */}
      <div class="v3-kultura-podserwisy">
        {KULTURA_PODSERWISY.map(p => (
          <a class="v3-kultura-podserwis" href={`/instytucje/${p.slug}`}>
            <div class="v3-kultura-podserwis-img">
              <img src={p.img} alt={p.name} loading="lazy" />
            </div>
            <div>
              <h3 class="v3-kultura-podserwis-name">{p.name}</h3>
              <p class="v3-kultura-podserwis-desc">{p.desc}</p>
              <div class="v3-kultura-podserwis-meta">{p.meta}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
)

/* =================================================================
   [10] EDUKACJA — feature ZS + lista
   ================================================================= */
export const EdukacjaModule = () => {
  const eduImgs = [IMG.edukacja.przedszkole, IMG.edukacja.sp1, IMG.edukacja.matematyka, IMG.edukacja.zajecia]
  return (
    <section class="v3-module v3-edukacja-module" aria-labelledby="mod-edu">
      <div class="v3-container">
        <ModuleHead eyebrow="Szkoły i przedszkola" title="Edukacja w gminie" link="/edukacja" linkLabel="Wszystkie szkoły →" />
        <div class="v3-edukacja-grid">
          <article class="v3-edukacja-feature">
            <div class="v3-edukacja-feature-img">
              <img src={IMG.edukacja.feature} alt="Maturzyści ZS im. Kasprowicza" loading="lazy" />
            </div>
            <div class="v3-edukacja-feature-body">
              <div class="v3-edukacja-feature-eyebrow">ZS im. Jana Kasprowicza</div>
              <h3 class="v3-edukacja-feature-title">Maturalne wyniki 2026 — 100% zdawalności w klasach humanistycznych</h3>
              <span class="v3-edukacja-feature-stat">98% średnia zdawalności</span>
              <p class="v3-edukacja-feature-lede">Tegoroczni maturzyści ZS im. Kasprowicza pobili rekord szkoły. W klasach humanistycznych zdawalność osiągnęła 100%. Dyrekcja ogłasza nabór na rok szkolny 2026/27.</p>
            </div>
          </article>
          <div class="v3-edukacja-list" aria-label="Aktualności edukacyjne">
            {EDUKACJA_NEWS.map((n, i) => (
              <a href={`/edukacja/${encodeURIComponent(n.title)}`} class="v3-edukacja-list-item">
                <div class="v3-edukacja-list-item-img">
                  <img src={eduImgs[i % eduImgs.length]} alt={n.title} loading="lazy" />
                </div>
                <div class="v3-edukacja-list-item-content">
                  <div class="v3-edukacja-list-item-title">{n.title}</div>
                  <div class="v3-edukacja-list-item-meta">{n.school} · {n.date}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* =================================================================
   [11] ZDROWIE — apteka + SPZOZ + profilaktyka
   ================================================================= */
export const ZdrowieModule = () => (
  <section class="v3-module v3-zdrowie-module" aria-labelledby="mod-zdro">
    <div class="v3-container">
      <ModuleHead eyebrow="Zdrowie i pomoc" title="Zdrowie w gminie" link="/zdrowie" linkLabel="Wszystko o zdrowiu →" />
      <div class="v3-zdrowie-grid">
        <div class="v3-zdrowie-apteka">
          <div class="v3-zdrowie-card-img">
            <img src={IMG.zdrowie.apteka} alt="Apteka dyżurna" loading="lazy" />
          </div>
          <span class="v3-zdrowie-apteka-badge">Dziś dyżur · 24h</span>
          <h3 class="v3-zdrowie-apteka-name">{APTEKA_DYZUR.nazwa}</h3>
          <div class="v3-zdrowie-apteka-info">📍 {APTEKA_DYZUR.adres}<br/>📞 {APTEKA_DYZUR.telefon}<br/>🕓 {APTEKA_DYZUR.godziny}</div>
          <a href={APTEKA_DYZUR.mapsUrl} class="v3-zdrowie-apteka-cta" target="_blank" rel="noopener">Pokaż na mapie →</a>
        </div>
        <div class="v3-zdrowie-spzoz">
          <div class="v3-zdrowie-card-img">
            <img src={IMG.zdrowie.spzoz} alt="SPZOZ Izbica" loading="lazy" />
          </div>
          <h3 class="v3-zdrowie-spzoz-title">SPZOZ Izbica — godziny przyjęć</h3>
          <ul class="v3-zdrowie-spzoz-list">
            <li><b>Pediatra</b><span>{SPZOZ_INFO.pediatra.dni} · {SPZOZ_INFO.pediatra.godziny}</span></li>
            <li><b>Rodzinny</b><span>{SPZOZ_INFO.rodzinny.dni} · {SPZOZ_INFO.rodzinny.godziny}</span></li>
            <li><b>Internista</b><span>{SPZOZ_INFO.internista.dni} · {SPZOZ_INFO.internista.godziny}</span></li>
          </ul>
        </div>
        <div class="v3-zdrowie-profilaktyka">
          <div class="v3-zdrowie-card-img">
            <img src={IMG.zdrowie.profilaktyka} alt="Profilaktyka zdrowotna" loading="lazy" />
          </div>
          <h3 class="v3-zdrowie-profilaktyka-title">Profilaktyka</h3>
          <ul style="list-style:none; padding:0; margin:0; font:400 0.8rem/1.45 Inter,sans-serif;">
            <li style="padding:0.35rem 0; border-top:1px solid #e5e7eb;"><b style="color:#27ae60;">●</b> Badania mammograficzne — 5 czerwca, Rynek</li>
            <li style="padding:0.35rem 0; border-top:1px solid #e5e7eb;"><b style="color:#27ae60;">●</b> Szczepienia HPV — termin do 30 czerwca</li>
            <li style="padding:0.35rem 0; border-top:1px solid #e5e7eb;"><b style="color:#27ae60;">●</b> Profilaktyka 40+ — zapisy w SPZOZ</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [12] ŚRODOWISKO + ROLNICTWO
   ================================================================= */
export const SrodowiskoRolnictwoModule = () => (
  <section class="v3-module v3-srod-module" aria-labelledby="mod-srod">
    <div class="v3-container">
      <ModuleHead eyebrow="Środowisko i rolnictwo" title="Zielona gmina" link="/srodowisko" linkLabel="Więcej o środowisku →" />
      <div class="v3-srod-grid">
        <div class="v3-srod-card">
          <div class="v3-srod-card-eyebrow">Środowisko · Kanał Zgłowiączki</div>
          <h3 class="v3-srod-card-title">Stan kanału i prace melioracyjne</h3>
          <div class="v3-srod-card-stat-row">
            <div class="v3-srod-card-stat">
              <div class="v3-srod-card-stat-val">Normalny</div>
              <div class="v3-srod-card-stat-label">Poziom wody</div>
            </div>
            <div class="v3-srod-card-stat">
              <div class="v3-srod-card-stat-val">14 km</div>
              <div class="v3-srod-card-stat-label">Wyczyszczono</div>
            </div>
            <div class="v3-srod-card-stat">
              <div class="v3-srod-card-stat-val">580 tys.</div>
              <div class="v3-srod-card-stat-label">Budżet 2026</div>
            </div>
          </div>
          <p style="font:400 0.85rem/1.5 Lora,serif; color:#475569; margin:0;">{KANAL_ZGLOWIACZKI.prace}. Ostatnia kontrola: {KANAL_ZGLOWIACZKI.ostatnia_kontrola}.</p>
        </div>
        <div class="v3-srod-card">
          <div class="v3-srod-card-eyebrow">Rolnictwo · Dopłaty i programy</div>
          <h3 class="v3-srod-card-title">Aktualne terminy dla rolników</h3>
          <ul class="v3-rol-programy">
            {ROLNICTWO_PROGRAMY.map(p => (
              <li class={`v3-rol-program v3-rol-program-${p.urgency}`}>
                <span>{p.title}</span>
                <span class="v3-rol-program-deadline">⏱ {p.deadline}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [13] LUDZIE — wywiad featured + 3 portrety
   ================================================================= */
export const LudzieModule = () => (
  <section class="v3-module v3-ludzie-module" aria-labelledby="mod-ludzie">
    <div class="v3-container">
      <ModuleHead eyebrow="Mieszkańcy gminy" title="Ludzie Izbicy" link="/ludzie" linkLabel="Wszystkie sylwetki →" />
      <div class="v3-ludzie-grid">
        <a href={`/wywiady/${WYWIAD_FEATURED.slug}`} class="v3-ludzie-wywiad" style="text-decoration:none;">
          <div class="v3-ludzie-wywiad-img">
            <img src={IMG.ludzie.burmistrz} alt={WYWIAD_FEATURED.name} loading="lazy" />
          </div>
          <div class="v3-ludzie-wywiad-body">
            <div class="v3-ludzie-wywiad-eyebrow">Wywiad miesiąca</div>
            <h3 class="v3-ludzie-wywiad-name">{WYWIAD_FEATURED.name}</h3>
            <div class="v3-ludzie-wywiad-role">{WYWIAD_FEATURED.role}</div>
            <blockquote class="v3-ludzie-wywiad-quote">{WYWIAD_FEATURED.quote}</blockquote>
            <div class="v3-ludzie-wywiad-meta">
              <Icon.Clock size={12} /> {WYWIAD_FEATURED.readingMinutes} min · {WYWIAD_FEATURED.publishedAt}
            </div>
          </div>
        </a>
        <div class="v3-ludzie-portrety">
          {LUDZIE_PORTRETY.map((p, i) => (
            <a class="v3-ludzie-portret" href={`/ludzie/${p.slug}`}>
              <div class="v3-ludzie-portret-img">
                <img src={IMG.ludzie.portrety[i % IMG.ludzie.portrety.length]} alt={p.name} loading="lazy" />
              </div>
              <div class="v3-ludzie-portret-content">
                <div class="v3-ludzie-portret-name">{p.name}</div>
                <div class="v3-ludzie-portret-role">{p.role}</div>
                <div class="v3-ludzie-portret-quote">„{p.quote}"</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [08] HISTORIA — featured Polskie Piramidy + 3 mini
   ================================================================= */
export const HistoriaModule = () => (
  <section class="v3-module v3-historia-module" aria-labelledby="mod-hist">
    <div class="v3-container">
      <ModuleHead eyebrow="Historia i dziedzictwo" title="Dziedzictwo Kujaw" link="/historia" linkLabel="Wszystkie tematy →" />
      <div class="v3-historia-grid">
        <a href="/wiadomosci/wietrzychowice-sezon" class="v3-historia-feature" style="text-decoration:none;">
          <div class="v3-historia-feature-img">
            <img src={IMG.historia.feature} alt="Neolityczne kurhany Wietrzychowice" loading="lazy" />
          </div>
          <div class="v3-historia-feature-body">
            <div class="v3-historia-feature-eyebrow">Polskie Piramidy · Wietrzychowice</div>
            <h3 class="v3-historia-feature-title">Neolityczne kurhany sprzed 5 500 lat — wizytówka gminy</h3>
            <p class="v3-historia-feature-lede">Muzeum Archeologiczne w Wietrzychowicach otwiera sezon 1 czerwca. W tym roku siedmioro nowych przewodników oprowadzi po unikatowym stanowisku, które rocznie przyciąga 18 tys. turystów.</p>
            <span style="display:inline-block; padding:0.5rem 0.85rem; background:#c8a951; color:#0a2540; font:700 0.78rem/1 Inter,sans-serif; border-radius:6px; letter-spacing:0.06em;">Zwiedzanie od 1 czerwca →</span>
          </div>
        </a>
        <div class="v3-historia-mini">
          {HISTORIA_CARDS.map(c => (
            <a class="v3-historia-mini-card" href={`/historia/${c.slug}`}>
              <div class="v3-historia-mini-card-img">
                <img src={IMG.historia[c.slug] || IMG.historia.feature} alt={c.title} loading="lazy" />
              </div>
              <div class="v3-historia-mini-card-body">
                <h4 class="v3-historia-mini-card-title">{c.title}</h4>
                <p class="v3-historia-mini-card-excerpt">{c.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [14] SOŁECTWA — INTERAKTYWNA MAPA + CHIPY + RECENT
   ================================================================= */
export const SolectwaModule = () => (
  <section class="v3-module v3-solectwa-module" aria-labelledby="mod-sol">
    <div class="v3-container">
      <ModuleHead eyebrow="15 sołectw gminy" title="Sołectwa Izbicy Kujawskiej" link="/solectwa" linkLabel="Pełna lista sołectw →" />
      <div class="v3-solectwa-grid">
        <div class="v3-solectwa-map">
          <div class="v3-solectwa-map-eyebrow">Mapa gminy Izbica Kujawska</div>
          <div class="v3-solectwa-map-wrap">
            <img src={IMG.solectwaMap} alt="Mapa gminy Izbica Kujawska — 15 sołectw" loading="lazy" />
          </div>
          <div class="v3-solectwa-legend">
            <span><span class="v3-solectwa-legend-dot" style="background:#c0392b;"></span>Wysoka aktywność</span>
            <span><span class="v3-solectwa-legend-dot" style="background:#c8a951;"></span>Średnia</span>
            <span><span class="v3-solectwa-legend-dot" style="background:#95a5a6;"></span>Niska</span>
          </div>
          <div class="v3-solectwa-map-credit">Mapa: OpenStreetMap contributors (ODbL)</div>
        </div>
        <div class="v3-solectwa-list">
          <div class="v3-solectwa-list-eyebrow">Wszystkie sołectwa</div>
          <div class="v3-solectwa-chips">
            {SOLECTWA.map(s => (
              <a class={`v3-solectwa-chip v3-solectwa-chip-${s.activity}`} href={`/solectwa/${s.slug}`}>{s.name}</a>
            ))}
          </div>
          <div class="v3-solectwa-recent">
            <div class="v3-solectwa-recent-title">Najnowsze wiadomości z sołectw</div>
            <ul class="v3-solectwa-recent-list">
              {SOLECTWA.filter(s => s.activity === 'high').slice(0, 4).map(s => (
                <li><b>{s.name}:</b> {s.lastNews}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [15] KALENDARZ TYGODNIA — 7 dni
   ================================================================= */
export const KalendarzModule = () => {
  // Mapa kategoria → indeks zdjęcia w IMG.kalendarz
  const calImg: Record<string, string> = {
    'sesja': IMG.kalendarz[0],
    'warsztaty': IMG.kalendarz[1],
    'koncert': IMG.kalendarz[2],
    'spotkanie': IMG.kalendarz[3],
    'wystawa': IMG.kalendarz[4],
    'festyn': IMG.kalendarz[5],
    'rekreacja': IMG.kalendarz[6],
  }
  let eventCounter = 0
  return (
    <section class="v3-module v3-kalendarz-module" aria-labelledby="mod-kal">
      <div class="v3-container">
        <ModuleHead eyebrow="Tydzień w gminie" title="Kalendarz wydarzeń" link="/kalendarz" linkLabel="Pełny kalendarz →" />
        <div class="v3-kalendarz-days">
          {KALENDARZ_7DNI.map(d => (
            <div class="v3-kalendarz-day">
              <div class="v3-kalendarz-day-head">
                <span class="v3-kalendarz-day-name">{d.dzien}</span>
                <span class="v3-kalendarz-day-date">{d.data}</span>
              </div>
              {d.eventy.map(e => {
                const img = calImg[e.cat] || IMG.kalendarz[eventCounter % IMG.kalendarz.length]
                eventCounter++
                return (
                  <div class={`v3-kalendarz-event v3-kalendarz-event-${e.cat}`}>
                    <div class="v3-kalendarz-event-img">
                      <img src={img} alt={e.title} loading="lazy" />
                    </div>
                    <div class="v3-kalendarz-event-body">
                      <span class="v3-kalendarz-event-time">{e.time}</span>
                      <span class="v3-kalendarz-event-title">{e.title}</span>
                    </div>
                  </div>
                )
              })}
              {d.eventy.length === 0 && <div style="font:400 0.7rem Inter,sans-serif; color:#9ca3af; padding:0.3rem 0;">brak wydarzeń</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =================================================================
   [16] MULTIMEDIA — featured video + thumbs + podcast
   ================================================================= */
export const MultimediaModule = () => (
  <section class="v3-module v3-multimedia-module" aria-labelledby="mod-multi">
    <div class="v3-container">
      <ModuleHead eyebrow="Wideo · Podcast · Galerie" title="Multimedia" link="/multimedia" linkLabel="Wszystkie materiały →" />
      <div class="v3-multimedia-grid">
        <a href={`/multimedia/wideo/${VIDEO_FEATURED.slug}`} class="v3-video-featured">
          <div class="v3-video-featured-play">
            <svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21" /></svg>
          </div>
          <div class="v3-video-featured-info">
            <div class="v3-video-featured-eyebrow">Wideo polecane</div>
            <h3 class="v3-video-featured-title">{VIDEO_FEATURED.title}</h3>
            <div class="v3-video-featured-meta">⏱ {VIDEO_FEATURED.duration} · 👁 {VIDEO_FEATURED.views} odsłon</div>
          </div>
        </a>
        <div>
          <div class="v3-video-thumbs">
            {VIDEO_THUMBS.map(v => (
              <a href={`/multimedia/wideo/${v.slug}`} class="v3-video-thumb">
                <div class="v3-video-thumb-img">
                  <span class="v3-video-thumb-duration">{v.duration}</span>
                </div>
                <div class="v3-video-thumb-title">{v.title}</div>
              </a>
            ))}
          </div>
          <a href="/multimedia/podcast" class="v3-podcast-banner">
            <div class="v3-podcast-icon">
              <Icon.PlayCircle size={24} />
            </div>
            <div class="v3-podcast-info">
              <div class="v3-podcast-eyebrow">Podcast · odc. {PODCAST_LATEST.episode}</div>
              <div class="v3-podcast-title">{PODCAST_LATEST.title}</div>
              <div class="v3-podcast-meta">⏱ {PODCAST_LATEST.duration} · {PODCAST_LATEST.publishedAt}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [17] MIESZKANIEC PYTA — Q&A feed
   ================================================================= */
export const MieszkaniecPytaModule = () => (
  <section class="v3-module v3-mieszkaniec-module" aria-labelledby="mod-mieszk">
    <div class="v3-container">
      <ModuleHead eyebrow="Głos mieszkańca" title="Mieszkaniec pyta — urząd odpowiada" link="/mieszkaniec-pyta" linkLabel="Wszystkie pytania →" />
      <div class="v3-mieszkaniec-feed">
        {MIESZKANIEC_FEED.map((m, i) => (
          <div class="v3-mieszkaniec-item">
            <div class="v3-mieszkaniec-item-head">
              <div class="v3-mieszkaniec-avatar">
                <img src={IMG.mieszkaniec[i % IMG.mieszkaniec.length]} alt={m.author} loading="lazy" />
              </div>
              <div class="v3-mieszkaniec-item-meta">
                <span class="v3-mieszkaniec-item-author"><b>{m.author}</b> · {m.solectwo}</span>
                <span class="v3-mieszkaniec-item-time">{m.time}</span>
              </div>
            </div>
            <h3 class="v3-mieszkaniec-item-q">{m.q}</h3>
            <p class="v3-mieszkaniec-item-a">{m.a}</p>
            <div class="v3-mieszkaniec-item-footer">
              <span class="v3-mieszkaniec-item-votes">👍 {m.votes}</span>
              <span>· odpowiedź urzędu</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

/* =================================================================
   [18] OPINIE & FELIETONY
   ================================================================= */
export const OpinieModule = () => (
  <section class="v3-module v3-opinie-module" aria-labelledby="mod-op">
    <div class="v3-container">
      <ModuleHead eyebrow="Komentarze · Felietony" title="Opinie redakcji" link="/opinie" linkLabel="Wszystkie felietony →" />
      <div class="v3-opinie-grid">
        <div class="v3-opinie-list">
          {OPINIE.map((o, i) => (
            <a class="v3-opinia" href={`/opinie/${o.slug}`} style={`--avatar-color: ${o.avatar}`}>
              <div class="v3-opinia-author-row">
                <div class="v3-opinia-avatar">
                  <img src={IMG.opinie[i % IMG.opinie.length]} alt={o.author} loading="lazy" />
                </div>
                <div class="v3-opinia-author">
                  <div class="v3-opinia-name">{o.author}</div>
                  <div class="v3-opinia-role">{o.authorRole}</div>
                </div>
              </div>
              <h3 class="v3-opinia-title">{o.title}</h3>
              <p class="v3-opinia-excerpt">{o.excerpt}</p>
              <div class="v3-opinia-meta">⏱ {o.readingMinutes} min</div>
            </a>
          ))}
        </div>
        <div class="v3-naj-komentowane">
          <div class="v3-naj-komentowane-title">Najbardziej komentowane</div>
          <ul class="v3-naj-komentowane-list">
            {NAJ_KOMENTOWANE.map(n => (
              <li><span>{n.title}</span><span class="v3-naj-komentowane-count">💬 {n.comments}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [19] NEWSLETTER — FULL BLEED
   ================================================================= */
export const NewsletterBleed = () => (
  <section class="v3-newsletter-bleed" aria-label="Newsletter izbica24.pl">
    <div class="v3-container">
      <div class="v3-newsletter-bleed-inner">
        <div>
          <div class="v3-newsletter-bleed-eyebrow">Newsletter izbica24.pl</div>
          <h2 class="v3-newsletter-bleed-title">Najważniejsze z gminy — co poniedziałek rano</h2>
          <p class="v3-newsletter-bleed-lede">Co tydzień zbieramy 7 najważniejszych wydarzeń, najbliższą sesję Rady, kalendarz MGCK, harmonogram zbiórek i ofert pracy. Bez spamu. Bez clickbaitu. Bezpłatnie.</p>
          <div class="v3-newsletter-bleed-stats">
            <span class="v3-newsletter-bleed-stat"><b>1 248</b>subskrybentów</span>
            <span class="v3-newsletter-bleed-stat"><b>87%</b>open rate</span>
            <span class="v3-newsletter-bleed-stat"><b>4.8/5</b>ocena czytelników</span>
          </div>
        </div>
        <form class="v3-newsletter-bleed-form" action="/api/v1/newsletter/subscribe" method="POST">
          <label for="nl-email" style="display:block; font:700 0.78rem/1 Inter,sans-serif; letter-spacing:0.1em; text-transform:uppercase; color:#c8a951; margin-bottom:0.5rem;">Twój email</label>
          <input id="nl-email" type="email" name="email" placeholder="np. jan.kowalski@interia.pl" required class="v3-newsletter-bleed-input" />
          <label class="v3-newsletter-bleed-check">
            <input type="checkbox" name="consent" required />
            <span>Wyrażam zgodę na otrzymywanie newslettera zgodnie z <a href="/polityka-prywatnosci" style="color:#c8a951;">polityką prywatności</a> RODO.</span>
          </label>
          <button type="submit" class="v3-newsletter-bleed-btn">Zapisz mnie</button>
        </form>
      </div>
    </div>
  </section>
)

/* =================================================================
   [20] OGŁOSZENIA — 3 KOLUMNY
   ================================================================= */
export const OgloszeniaModule = () => (
  <section class="v3-module v3-ogloszenia-module" aria-labelledby="mod-ogl">
    <div class="v3-container">
      <ModuleHead eyebrow="Ogłoszenia lokalne" title="Ogłoszenia mieszkańców" link="/ogloszenia" linkLabel="Dodaj ogłoszenie →" />
      <div class="v3-ogloszenia-grid">
        <div class="v3-ogl-col v3-ogl-col-nekro">
          <span class="v3-ogl-col-eyebrow">Nekrologi</span>
          <ul class="v3-ogl-list">
            {NEKROLOGI.map(n => (
              <li class="v3-ogl-item">
                <div class="v3-ogl-item-title">{n.name}</div>
                <div class="v3-ogl-item-meta">{n.dates}</div>
                <div class="v3-ogl-item-meta" style="margin-top: 0.25rem;">{n.text}</div>
              </li>
            ))}
          </ul>
          <a href="/ogloszenia/nekrologi" style="display:inline-block; margin-top:0.75rem; font:700 0.78rem/1 Inter,sans-serif; color:#2c2c2c; text-decoration:none; letter-spacing:0.06em; text-transform:uppercase;">Wszystkie nekrologi →</a>
        </div>
        <div class="v3-ogl-col v3-ogl-col-praca">
          <span class="v3-ogl-col-eyebrow">Praca</span>
          <ul class="v3-ogl-list">
            {PRACA.map(p => (
              <li class="v3-ogl-item">
                <div class="v3-ogl-item-title">{p.title}</div>
                <div class="v3-ogl-item-meta">{p.firm}</div>
                <div class="v3-ogl-item-meta" style="margin-top: 0.25rem;"><b>{p.stawka}</b></div>
              </li>
            ))}
          </ul>
          <a href="/ogloszenia/praca" style="display:inline-block; margin-top:0.75rem; font:700 0.78rem/1 Inter,sans-serif; color:#1a3a5c; text-decoration:none; letter-spacing:0.06em; text-transform:uppercase;">Wszystkie oferty →</a>
        </div>
        <div class="v3-ogl-col v3-ogl-col-nier">
          <span class="v3-ogl-col-eyebrow">Nieruchomości</span>
          <ul class="v3-ogl-list">
            {NIERUCHOMOSCI.map(n => (
              <li class="v3-ogl-item">
                <div class="v3-ogl-item-title">{n.title}</div>
                <div class="v3-ogl-item-meta" style="margin-top: 0.25rem;"><b>{n.price}</b></div>
              </li>
            ))}
          </ul>
          <a href="/ogloszenia/nieruchomosci" style="display:inline-block; margin-top:0.75rem; font:700 0.78rem/1 Inter,sans-serif; color:#8b1d2a; text-decoration:none; letter-spacing:0.06em; text-transform:uppercase;">Wszystkie nieruchomości →</a>
        </div>
      </div>
    </div>
  </section>
)

/* =================================================================
   [21] PARTNERZY — 7 INSTYTUCJI
   ================================================================= */
const PartnerIcon = ({ icon }: { icon: string }) => {
  // 7 prostych inline SVG dla 7 instytucji
  const size = 20
  if (icon === 'building') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 22h18v-2H3v2zm2-4h2v-9H5v9zm14 0h-2v-9h2v9zM10 4v3h4V4l5 3v11H5V7l5-3zm-1 8h6v-2H9v2zm0 4h6v-2H9v2z"/></svg>
  if (icon === 'palette') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.27-.38-.62-.38-1A1.5 1.5 0 0 1 14.23 16H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM9 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/></svg>
  if (icon === 'book') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h7v8l2.5-1.5L18 12V4v16z"/></svg>
  if (icon === 'heart') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  if (icon === 'flame') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14a8 8 0 0 0 16 0c0-4.16-2-7.88-6.5-13.33z"/></svg>
  if (icon === 'cross') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v6H4v4h6v6h4v-6h6v-4h-6V4h-4z"/></svg>
  if (icon === 'church') return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18 12.22V9l-5-2.5V5h2V3h-2V1h-2v2H9v2h2v1.5L6 9v3.22L2 14v8h8v-4c0-1.1.9-2 2-2s2 .9 2 2v4h8v-8l-4-1.78z"/></svg>
  return null
}

export const PartnerzyBar = () => (
  <section class="v3-partnerzy" aria-label="Partnerzy izbica24.pl">
    <div class="v3-container">
      <div class="v3-partnerzy-head">
        <div class="v3-partnerzy-eyebrow">Wspierają nas</div>
        <h2 class="v3-partnerzy-title">Instytucje gminy Izbica Kujawska</h2>
      </div>
      <div class="v3-partnerzy-grid">
        {PARTNERS.map(p => (
          <a class="v3-partner" href={p.url} aria-label={p.name}>
            <span class="v3-partner-icon" style={`background: ${p.color}`}>
              <PartnerIcon icon={p.icon} />
            </span>
            <span class="v3-partner-name">{p.short}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
)

/* =================================================================
   [22] TOP 10 CZYTANE TYGODNIA
   ================================================================= */
export const Top10Module = () => (
  <section class="v3-module v3-top10-module" aria-labelledby="mod-top10">
    <div class="v3-container">
      <ModuleHead eyebrow="Najpopularniejsze" title="Top 10 czytane w tym tygodniu" link="/top-tygodnia" linkLabel="Pełny ranking →" />
      <ol class="v3-top10-list">
        {TOP10_TYDZIEN.map((t, i) => (
          <li>
            <a class="v3-top10-item" href={`/wiadomosci/top/${i+1}`}>
              <div>
                <div class="v3-top10-item-title">{t.title}</div>
                <div class="v3-top10-item-views">👁 {t.views} odsłon</div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  </section>
)

/* =================================================================
   [23] ARCHIWUM — PASEK FILTRÓW
   ================================================================= */
export const ArchiwumBar = () => (
  <div class="v3-container">
    <div class="v3-archiwum" aria-label="Archiwum wiadomości">
      <div class="v3-archiwum-head">
        <span class="v3-archiwum-head-icon">📁</span>
        <span>Archiwum wiadomości</span>
      </div>
      <div class="v3-archiwum-row">
        <span class="v3-archiwum-label">Rok:</span>
        {ARCHIWUM.lata.map((rok, i) => (
          <a class={`v3-archiwum-chip ${i === 0 ? 'v3-archiwum-chip-current' : ''}`} href={`/archiwum/${rok}`}>{rok}</a>
        ))}
      </div>
      <div class="v3-archiwum-row">
        <span class="v3-archiwum-label">Miesiąc:</span>
        {ARCHIWUM.miesiace.map((m, i) => (
          <a class={`v3-archiwum-chip ${i === 4 ? 'v3-archiwum-chip-current' : ''}`} href={`/archiwum/2026/${i+1}`}>{m}</a>
        ))}
      </div>
      <div class="v3-archiwum-row">
        <span class="v3-archiwum-label">Kategoria:</span>
        {Object.entries(CATEGORIES_MAP).slice(0, 10).map(([slug, meta]) => (
          <a class="v3-archiwum-chip" href={`/${slug}`} style={`color: ${meta.color};`}>{meta.title}</a>
        ))}
      </div>
    </div>
  </div>
)
