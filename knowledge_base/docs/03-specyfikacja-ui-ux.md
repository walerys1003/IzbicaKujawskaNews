# SPECYFIKACJA UI/UX — izbica24.pl
## Dokument dla Claude Code — poziom implementacyjny

## 1. ŚRODOWISKO TECHNICZNE
Stack: czysty HTML5 + CSS3 + vanilla JavaScript. Zero frameworków. Zero zależności npm. Jeden plik HTML, jeden CSS, jeden JS. Działa offline po załadowaniu fontów.
Fonty: Google Fonts CDN — Playfair+Display:wght@400;700;900 + Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400 + DM+Sans:wght@300;400;500;600. Preconnect w <head>.
Viewport: max-width: 1440px, wyśrodkowany. Sidebar pojawia się przy ≥1280px. Breakpointy: 1280px (sidebar on), 1024px (kompresja menu), 768px (mobile), 480px (small mobile).
Dane: wszystkie treści to realistyczne placeholdery — prawdziwe nazwy ulic, instytucji, sołectw, osób z Izbicy. Żadnych "Lorem ipsum". Daty realne (maj 2026). Artykuły brzmią jak prawdziwy portal.

## 2. CSS DESIGN TOKENS — KOMPLETNE
:root {
/* KOLORY BAZOWE */
- --paper:        #faf9f6;
- --paper-warm:   #f5f2ec;
- --paper-cool:   #f0f4f8;
- --paper-dark:   #f0ece4;
- --ink:          #0a0a0a;
- --ink-mid:      #2c2c2c;
- --ink-muted:    #555;
- --ink-faint:    #999;
- --ink-ghost:    #ccc;
- --rule:         #e0dbd3;
- --rule-light:   #ede9e3;

/* AKCENT GŁÓWNY */
- --red:          #c0392b;
- --red-bright:   #e74c3c;
- --red-dark:     #96281b;
- --red-bg:       rgba(192,57,43,0.07);

/* KATEGORIE */
- --c-wiadomosci: #c0392b;
- --c-sygnale:    #e74c3c;
- --c-samorzad:   #1a3a5c;
- --c-kujawianka: #1e7a4f;
- --c-kultura:    #7b2d8b;
- --c-historia:   #b8860b;
- --c-ludzie:     #c0392b;
- --c-zycie:      #2d6a4f;
- --c-przeglad:   #2563a8;
- --c-multimedia: #111827;
- --c-ogloszenia: #374151;

/* CIEMNE TŁA MODUŁÓW */
- --dark-navy:    #0d2137;
- --dark-charcoal:#2c2c2c;
- --dark-black:   #0a0a0a;
- --dark-deep:    #111;

/* TYPOGRAFIA */
- --serif:        'Playfair Display', Georgia, serif;
- --body:         'Source Serif 4', Georgia, serif;
- --ui:           'DM Sans', system-ui, sans-serif;

/* SKALE TYPOGRAFICZNE */
- --t-hero:       42px;
- --t-section:    28px;
- --t-card-lg:    22px;
- --t-card-md:    18px;
- --t-card-sm:    16px;
- --t-lead:       17px;
- --t-label:      11px;
- --t-meta:       12px;
- --t-ui:         13px;
- --t-micro:      10px;

/* SPACING SYSTEM (4px base) */
- --sp-2:  2px;
- --sp-4:  4px;
- --sp-8:  8px;
- --sp-12: 12px;
- --sp-16: 16px;
- --sp-20: 20px;
- --sp-24: 24px;
- --sp-32: 32px;
- --sp-40: 40px;
- --sp-48: 48px;
- --sp-64: 64px;
- --sp-80: 80px;

/* LAYOUT */
- --max-w:        1440px;
- --sidebar-w:    300px;
- --content-w:    calc(var(--max-w) - var(--sidebar-w) - 48px);
- --gutter:       24px;

/* EFEKTY */
- --shadow-sm:    0 1px 3px rgba(0,0,0,0.08);
- --shadow-md:    0 4px 12px rgba(0,0,0,0.10);
- --shadow-lg:    0 8px 32px rgba(0,0,0,0.14);
- --shadow-card:  0 2px 8px rgba(0,0,0,0.07);
- --radius-sm:    2px;
- --radius-md:    4px;
- --radius-lg:    8px;

/* TIMING */
- --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
- --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
- --t-fast:       150ms;
- --t-mid:        250ms;
- --t-slow:       400ms;
}


## 3. STRUKTURA DOKUMENTU HTML
<body>
#super-header           ← 36px, sticky top, fade on scroll
#main-nav               ← 72px→56px sticky, z-index:100
#breaking-bar           ← conditional, full-width

<main id="page-main">
<div class="content-with-sidebar">
<div id="content-col">
#hero               ← moduł 1
#wiadomosci         ← moduł 3
#na-sygnale-full    ← moduł 4
#kujawianka         ← moduł 5
#samorzad-media     ← moduł 6
#kultura-historia   ← moduł 7
#ludzie             ← moduł 8
#zycie-codzienne    ← moduł 9
#dzis-w-izbicy      ← moduł 10
#solectwa           ← moduł 11
#ogloszenia         ← moduł 12
#multimedia         ← moduł 13
</div>
<aside id="sidebar">
.sidebar-weather
.sidebar-newsletter
.sidebar-top5
.sidebar-tips
.sidebar-ad
.sidebar-phones
.sidebar-fb
</aside>
</div>
</main>

<footer id="footer">
.footer-main (4 kolumny)
.footer-sub
</footer>
</body>


## 4. SUPER-HEADER — specyfikacja
Wymiary: height: 36px, width: 100%, background: var(--dark-black), position: sticky, top: 0, z-index: 200.
Zachowanie scroll: JavaScript nasłuchuje window.scrollY. Gdy > 80px → opacity: 0; transform: translateY(-36px); pointer-events: none. Gdy <= 80px → powrót. Transition: opacity 300ms ease, transform 300ms var(--ease-out).
Layout: display: flex; align-items: center; justify-content: space-between; padding: 0 var(--gutter).
Lewa strefa:
font: 500 12px/36px var(--ui);
color: #aaa;
content: "Piątek, 23 maja 2026"

Środkowa strefa:
display: flex; align-items: center; gap: 8px;
[SVG ikona słońca 14px] [18°C] [separator ·] [Izbica Kujawska]
font: 400 12px var(--ui); color: #888;

SVG ikony pogody — inline, 5 wariantów: słońce / chmury / deszcz / śnieg / burza. Przełączane klasą JS.
Prawa strefa:
cursor: pointer;
font: 500 12px var(--ui); color: #ccc;
content: "📧 Newsletter tygodniowy"

Po kliknięciu: display: flex inline formularza poniżej belki — height: 0 → 48px z overflow: hidden; transition: height 300ms var(--ease-out). W formularzu: input type=email + button "Zapisz się". Zamknięcie: klik poza lub ESC.

## 5. NAWIGACJA GŁÓWNA — specyfikacja
Stan normalny: height: 72px; background: var(--paper); border-bottom: 3px solid var(--red); position: sticky; top: 36px; z-index: 100.
Stan sticky (po scroll > 80px): height: 56px; box-shadow: 0 2px 12px rgba(0,0,0,0.10); top: 0. Przejście: height 250ms var(--ease-out), box-shadow 250ms.
Layout wewnętrzny:
max-width: 1440px; margin: auto; padding: 0 24px;
display: grid;
grid-template-columns: 200px 1fr auto;
align-items: center;
height: inherit;

Logo — specyfikacja dokładna:
<a id="logo" href="/">
<span class="logo-main">izbica</span><span class="logo-num">24</span>
<span class="logo-sub">.pl</span>
<small class="logo-tagline">Portal Gminy Izbica Kujawska</small>
</a>

#logo { display: flex; flex-direction: column; line-height: 1; }
.logo-main { font: 900 30px var(--serif); color: var(--ink); }
.logo-num  { font: 900 30px var(--serif); color: var(--red); }
.logo-sub  { font: 700 30px var(--serif); color: var(--ink-muted); }
.logo-tagline { font: 400 9px/1.4 var(--ui); color: var(--ink-faint);
letter-spacing: 0.08em; margin-top: 2px; }

Menu — 12 pozycji:
nav ul {
display: flex; gap: 0; list-style: none;
height: 100%; align-items: stretch;
}
nav ul li {
position: relative;
display: flex; align-items: center;
}
nav ul li > a {
font: 600 11px/1 var(--ui);
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(--ink-mid);
padding: 0 12px;
height: 100%;
display: flex; align-items: center;
border-bottom: 2px solid transparent;
transition: color var(--t-fast), border-color var(--t-fast);
}
nav ul li:hover > a {
color: var(--ink);
border-bottom-color: var(--category-color, var(--red));
}

Każde <li> ma CSS custom property --category-color ustawioną inline na kolor kategorii.
Dropdown:
.dropdown {
position: absolute; top: 100%; left: 0;
min-width: 220px;
background: white;
border-top: 2px solid var(--category-color);
box-shadow: var(--shadow-lg);
opacity: 0; visibility: hidden;
transform: translateY(-6px);
transition: opacity var(--t-mid), transform var(--t-mid) var(--ease-out),
visibility var(--t-mid);
z-index: 500;
}
nav ul li:hover .dropdown {
opacity: 1; visibility: visible; transform: translateY(0);
}
.dropdown a {
display: block; padding: 10px 16px;
font: 400 13px var(--ui); color: var(--ink-mid);
border-bottom: 1px solid var(--rule-light);
transition: background var(--t-fast), color var(--t-fast);
}
.dropdown a:hover {
background: var(--paper); color: var(--category-color);
}

Prawa część nav:
display: flex; align-items: center; gap: 8px;

[🔍] — button, 36px×36px, hover: background var(--paper-warm)
[🔔] — button, 36px×36px, opacity: 0.4 (przyszłość)
["OGŁOŚ"] — button: background var(--red); color white;
font: 600 11px var(--ui); letter-spacing: 0.06em;
padding: 8px 16px; border-radius: var(--radius-sm);
hover: background var(--red-dark); transition: 150ms


## 6. HERO — specyfikacja piksel po pikselu
Kontener:
#hero {
display: grid;
grid-template-columns: 55fr 25fr 20fr;
gap: 1px;           /* gap = linie między kolumnami */
background: var(--rule);  /* widoczny jako linie między kolumnami */
margin-bottom: 0;
}

### 6a. Kolumna główna (55%)
.hero-main {
background: var(--paper);
position: relative;
overflow: hidden;
}
.hero-main .img-wrap {
position: relative;
aspect-ratio: 16/9;
overflow: hidden;
}
.hero-main img {
width: 100%; height: 100%;
object-fit: cover;
transition: transform 600ms var(--ease-out);
}
.hero-main:hover img { transform: scale(1.02); }

/* Gradient overlay na zdjęciu */
.hero-main .img-overlay {
position: absolute; inset: 0;
background: linear-gradient(
to bottom,
transparent 40%,
rgba(0,0,0,0.15) 60%,
rgba(0,0,0,0.72) 100%
);
}

/* Etykieta kategorii — na zdjęciu, lewy górny róg */
.hero-main .cat-label {
position: absolute; top: 16px; left: 16px;
font: 700 10px/1 var(--ui);
letter-spacing: 0.14em; text-transform: uppercase;
background: var(--red); color: white;
padding: 5px 10px;
z-index: 2;
}

/* Tytuł — na gradiencie, dolna tercja */
.hero-main .hero-title-over {
position: absolute; bottom: 0; left: 0; right: 0;
padding: 20px 24px;
z-index: 2;
}
.hero-main .hero-title-over h1 {
font: 900 40px/1.12 var(--serif);
color: white;
text-shadow: 0 2px 8px rgba(0,0,0,0.4);
margin-bottom: 8px;
}

/* Treść pod zdjęciem */
.hero-main .hero-body {
padding: 20px 24px 24px;
}
.hero-main .lead {
font: 400 16px/1.65 var(--body);
color: var(--ink-mid);
margin-bottom: 16px;
}
.hero-main .read-more {
font: 600 12px var(--ui);
color: var(--red);
letter-spacing: 0.05em;
text-transform: uppercase;
display: inline-flex; align-items: center; gap: 4px;
}
.hero-main .read-more::after {
content: '→';
transition: transform var(--t-fast);
}
.hero-main .read-more:hover::after { transform: translateX(4px); }

.hero-main .byline {
margin-top: 12px;
font: 400 11px var(--ui); color: var(--ink-faint);
display: flex; align-items: center; gap: 8px;
}

### 6b. Kolumna środkowa "NAJWAŻNIEJSZE" (25%)
.hero-secondary {
background: var(--paper);
padding: 20px 16px;
}
.hero-secondary .section-label {
display: flex; align-items: center; gap: 8px;
margin-bottom: 16px;
}
.hero-secondary .section-label::before {
content: '';
display: block; width: 3px; height: 14px;
background: var(--red);
}
.hero-secondary .section-label span {
font: 700 10px/1 var(--ui);
letter-spacing: 0.14em; text-transform: uppercase;
color: var(--ink-muted);
}

/* Artykuł w liście */
.hero-secondary .art-item {
display: grid;
grid-template-columns: 80px 1fr;
gap: 10px;
padding: 12px 0;
border-bottom: 1px solid var(--rule);
cursor: pointer;
transition: background var(--t-fast);
}
.hero-secondary .art-item:last-child { border-bottom: none; }
.hero-secondary .art-item:hover { background: var(--paper-warm); margin: 0 -8px; padding: 12px 8px; }

.hero-secondary .art-thumb {
width: 80px; height: 58px;
object-fit: cover;
flex-shrink: 0;
}
.hero-secondary .art-meta .cat {
font: 700 9px/1 var(--ui);
letter-spacing: 0.12em; text-transform: uppercase;
color: var(--category-color);
margin-bottom: 4px;
}
.hero-secondary .art-meta h3 {
font: 600 15px/1.3 var(--serif);
color: var(--ink);
margin-bottom: 4px;
}
.hero-secondary .art-meta time {
font: 400 11px var(--ui); color: var(--ink-faint);
}

### 6c. Kolumna NA SYGNALE (20%)
.hero-sygnale {
background: var(--red);
padding: 20px 16px;
display: flex; flex-direction: column;
}
.hero-sygnale .sygnale-header {
font: 800 11px/1 var(--ui);
letter-spacing: 0.12em; text-transform: uppercase;
color: white;
margin-bottom: 16px;
display: flex; align-items: center; gap: 6px;
}
.live-dot {
width: 8px; height: 8px;
background: white; border-radius: 50%;
animation: pulse-live 2s ease-in-out infinite;
}
@keyframes pulse-live {
0%, 100% { opacity: 1; transform: scale(1); }
50%       { opacity: 0.5; transform: scale(1.4); }
}

.sygnale-item {
padding: 10px 0;
border-bottom: 1px solid rgba(255,255,255,0.15);
cursor: pointer;
transition: background var(--t-fast);
}
.sygnale-item:hover { background: rgba(255,255,255,0.08); margin: 0 -16px; padding: 10px 16px; }

.sygnale-time {
font: 700 13px/1 var(--ui);
color: rgba(255,255,255,0.7);
font-variant-numeric: tabular-nums;
margin-bottom: 3px;
}
.sygnale-type {
display: inline-flex; align-items: center; gap: 4px;
font: 600 9px var(--ui); letter-spacing: 0.1em;
text-transform: uppercase; color: rgba(255,255,255,0.6);
margin-bottom: 4px;
}
.sygnale-desc {
font: 400 13px/1.4 var(--body);
color: white;
}

.sygnale-all-link {
margin-top: auto; padding-top: 16px;
font: 600 11px var(--ui); letter-spacing: 0.06em;
text-transform: uppercase; color: rgba(255,255,255,0.8);
display: flex; align-items: center; gap: 4px;
}
.sygnale-all-link:hover { color: white; }


## 7. BREAKING BAR — specyfikacja
#breaking-bar {
height: 40px;
background: var(--dark-black);
display: flex; align-items: center;
overflow: hidden;
}
#breaking-bar.hidden { display: none; }

.breaking-label {
flex-shrink: 0;
padding: 0 16px;
height: 100%;
background: var(--red);
display: flex; align-items: center;
font: 800 10px/1 var(--ui);
letter-spacing: 0.14em; text-transform: uppercase;
color: white;
}

.ticker-wrap {
flex: 1; overflow: hidden;
position: relative;
}
.ticker-track {
display: flex; gap: 60px;
white-space: nowrap;
animation: ticker-scroll 60s linear infinite;
}
.ticker-wrap:hover .ticker-track { animation-play-state: paused; }

@keyframes ticker-scroll {
from { transform: translateX(0); }
to   { transform: translateX(-50%); }
}

.ticker-item {
display: inline-flex; align-items: center; gap: 8px;
font: 400 13px var(--ui); color: #ddd;
cursor: pointer;
transition: color var(--t-fast);
}
.ticker-item:hover { color: white; }
.ticker-item::before {
content: '◆';
font-size: 7px; color: var(--red);
}

JavaScript: ticker duplikuje ticker-track żeby efekt był bezszwowy. Sprawdza articleAge < 6h przed pokazaniem breaking-bara.

## 8. SEKCJA HEADER — wzorzec reużywalny
Każdy moduł używa identycznego headera sekcji:
<header class="section-header">
<div class="section-title">
<div class="section-rule" style="--color: var(--c-wiadomosci)"></div>
<h2 class="section-name">WIADOMOŚCI</h2>
<span class="section-sub">— Gmina Izbica Kujawska</span>
</div>
<a href="/wiadomosci" class="section-more">Wszystkie →</a>
</header>

.section-header {
display: flex; align-items: baseline; justify-content: space-between;
margin-bottom: var(--sp-24);
padding-bottom: var(--sp-12);
border-bottom: 1px solid var(--rule);
}
.section-title { display: flex; align-items: center; gap: 10px; }
.section-rule {
width: 4px; height: 20px;
background: var(--color, var(--red));
flex-shrink: 0;
}
.section-name {
font: 700 13px/1 var(--ui);
letter-spacing: 0.1em; text-transform: uppercase;
color: var(--ink);
}
.section-sub {
font: 400 12px var(--ui); color: var(--ink-faint);
}
.section-more {
font: 600 11px var(--ui); letter-spacing: 0.05em;
color: var(--ink-faint); text-transform: uppercase;
transition: color var(--t-fast);
}
.section-more:hover { color: var(--red); }


## 9. MODUŁ WIADOMOŚCI — layout grid
#wiadomosci { padding: var(--sp-48) 0; }

.news-grid {
display: grid;
grid-template-columns: 2fr 1fr 1fr;
grid-template-rows: auto auto;
gap: var(--sp-24);
}

/* Artykuł główny — zajmuje 2 kolumny, 2 rzędy */
.news-main {
grid-column: 1;
grid-row: 1 / 3;
}
.news-main .img-wrap {
aspect-ratio: 4/3; overflow: hidden; margin-bottom: 16px;
}
.news-main img { transition: transform 500ms var(--ease-out); }
.news-main:hover img { transform: scale(1.03); }
.news-main h2 {
font: 700 24px/1.25 var(--serif); color: var(--ink);
margin-bottom: 10px;
}
.news-main .lead {
font: 400 15px/1.65 var(--body); color: var(--ink-mid);
margin-bottom: 14px;
}

/* Karty boczne — 4 artykuły w 2 kolumnach */
.news-card {
display: flex; flex-direction: column;
cursor: pointer;
}
.news-card .img-wrap {
aspect-ratio: 16/9; overflow: hidden; margin-bottom: 10px;
}
.news-card img { transition: transform 400ms var(--ease-out); }
.news-card:hover img { transform: scale(1.04); }
.news-card h3 {
font: 600 16px/1.3 var(--serif); color: var(--ink);
margin-bottom: 6px;
}
.news-card time {
font: 400 11px var(--ui); color: var(--ink-faint);
margin-top: auto;
}

/* Pasek filtrów podkategorii */
.news-filter-bar {
display: flex; gap: 0;
margin-top: var(--sp-32);
border-top: 1px solid var(--rule);
border-bottom: 1px solid var(--rule);
overflow-x: auto;
}
.filter-tag {
flex-shrink: 0;
padding: 10px 18px;
font: 500 11px/1 var(--ui);
letter-spacing: 0.08em; text-transform: uppercase;
color: var(--ink-muted);
cursor: pointer;
border-right: 1px solid var(--rule);
transition: background var(--t-fast), color var(--t-fast);
}
.filter-tag:hover, .filter-tag.active {
background: var(--ink); color: white;
}

JavaScript: .filter-tag kliknięcie → toggle class .active + fetch('/wp-json/...') → re-render kart. Na demie: toggle visibility class na kartach z data-cat atrybutem.

## 10. MODUŁ KUJAWIANKA — dark section
#kujawianka {
background: var(--dark-navy);
padding: var(--sp-40) var(--sp-24);
position: relative;
overflow: hidden;
}

/* Subtelny wzór boiska w tle */
#kujawianka::before {
content: '';
position: absolute; inset: 0;
background-image: repeating-linear-gradient(
90deg,
rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px,
transparent 1px, transparent 60px
);
pointer-events: none;
}

.kujawianka-grid {
display: grid;
grid-template-columns: 3fr 4fr 3fr;
gap: 1px;
background: rgba(255,255,255,0.08);
position: relative; z-index: 1;
}
.kujawianka-grid > * {
background: var(--dark-navy);
padding: var(--sp-24);
}

/* Strefa wynik */
.k-score { text-align: center; }
.k-score .team-name {
font: 600 10px/1 var(--ui);
letter-spacing: 0.12em; text-transform: uppercase;
color: rgba(255,255,255,0.5);
margin-bottom: 8px;
}
.k-score .score-num {
font: 900 64px/1 var(--serif);
color: white; letter-spacing: -2px;
}
.k-score .score-vs {
font: 300 24px var(--ui); color: rgba(255,255,255,0.3);
margin: 0 12px;
}
.k-score .match-meta {
margin-top: 12px;
font: 400 11px var(--ui); color: rgba(255,255,255,0.4);
}
.k-countdown {
font: 700 14px var(--ui); color: #f0c040;
margin-top: 8px; letter-spacing: 0.02em;
}

/* Strefa tabela */
.k-table table { width: 100%; border-collapse: collapse; }
.k-table th {
font: 700 9px/1 var(--ui); letter-spacing: 0.1em;
text-transform: uppercase; color: rgba(255,255,255,0.3);
text-align: right; padding: 0 6px 8px;
}
.k-table th:first-child { text-align: left; }
.k-table td {
font: 400 12px/1 var(--ui); color: rgba(255,255,255,0.7);
text-align: right; padding: 7px 6px;
font-variant-numeric: tabular-nums;
}
.k-table td:first-child { text-align: left; color: white; }
.k-table tr.highlight td {
color: #f0c040; font-weight: 600;
}
.k-table tr { border-bottom: 1px solid rgba(255,255,255,0.06); }

/* Strefa artykuły */
.k-articles .art-card {
display: grid; grid-template-columns: 80px 1fr; gap: 10px;
padding: 12px 0;
border-bottom: 1px solid rgba(255,255,255,0.08);
}
.k-articles .art-card img {
width: 80px; height: 56px; object-fit: cover;
}
.k-articles .art-card h3 {
font: 600 14px/1.3 var(--serif); color: white;
}
.k-articles .art-card time {
font: 400 10px var(--ui); color: rgba(255,255,255,0.4);
}
.k-scorers {
margin-top: 16px; padding-top: 12px;
border-top: 1px solid rgba(255,255,255,0.1);
}
.k-scorers h4 {
font: 700 9px/1 var(--ui); letter-spacing: 0.1em;
text-transform: uppercase; color: rgba(255,255,255,0.3);
margin-bottom: 8px;
}
.scorer-item {
display: flex; justify-content: space-between;
font: 400 12px var(--ui); color: rgba(255,255,255,0.6);
padding: 4px 0;
}
.scorer-goals { color: #f0c040; font-weight: 700; }


## 11. MODUŁ SOŁECTWA — kluczowy unikat
#solectwa {
padding: var(--sp-64) var(--sp-24);
background: #eef2f6;
}
.solectwa-grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: var(--sp-40);
align-items: start;
}

/* SVG Mapa */
.map-container {
position: relative;
}
.map-container svg {
width: 100%; height: auto;
cursor: pointer;
}
.map-container svg path {
fill: #d0dce8;
stroke: #b0bec8;
stroke-width: 0.5;
transition: fill 150ms;
}
.map-container svg path:hover { fill: var(--red); }
.map-container svg path.active { fill: var(--red-dark); }

/* Tooltip mapy */
.map-tooltip {
position: absolute;
background: var(--ink);
color: white;
padding: 8px 12px;
border-radius: var(--radius-sm);
font: 400 12px var(--ui);
pointer-events: none;
opacity: 0;
transition: opacity 150ms;
z-index: 10;
min-width: 160px;
}
.map-tooltip.visible { opacity: 1; }
.map-tooltip .tt-name { font-weight: 700; margin-bottom: 2px; }
.map-tooltip .tt-count { color: #aaa; font-size: 11px; }

/* Lista sołectw */
.solectwa-list {
columns: 3; column-gap: var(--sp-16);
}
.solectwa-list .sol-item {
display: flex; justify-content: space-between; align-items: baseline;
padding: 5px 0;
border-bottom: 1px solid rgba(0,0,0,0.06);
break-inside: avoid;
cursor: pointer;
font: 400 13px var(--ui); color: var(--ink-mid);
transition: color var(--t-fast);
}
.solectwa-list .sol-item:hover { color: var(--red); }
.sol-count {
font: 700 10px var(--ui); color: var(--ink-faint);
background: var(--rule);
padding: 1px 5px; border-radius: 10px;
margin-left: 6px;
}

JavaScript dla mapy:
path.addEventListener('mouseenter', showTooltip) — tooltip pozycjonowany przez getBoundingClientRect()
path.addEventListener('click', navigateToTag) — window.location = '/tag/' + path.dataset.slug
Każdy path w SVG ma data-slug="sadlno" i data-name="Sadłno" i data-count="12"

## 12. SIDEBAR — struktura stref
#sidebar {
width: var(--sidebar-w);
flex-shrink: 0;
display: flex; flex-direction: column;
gap: var(--sp-24);
padding-top: var(--sp-24);
}

/* Wspólny styl bloku sidebar */
.sb-block {
background: white;
border: 1px solid var(--rule);
border-radius: var(--radius-sm);
overflow: hidden;
}
.sb-block-header {
padding: 10px 14px;
border-bottom: 2px solid var(--accent-color, var(--red));
font: 700 10px/1 var(--ui);
letter-spacing: 0.12em; text-transform: uppercase;
color: var(--ink);
display: flex; align-items: center; gap: 6px;
}
.sb-block-body { padding: 14px; }

/* Strefa TOP 5 */
.top5-item {
display: grid;
grid-template-columns: 24px 1fr;
gap: 10px; padding: 8px 0;
border-bottom: 1px solid var(--rule-light);
cursor: pointer;
}
.top5-num {
font: 800 14px/1 var(--ui);
color: var(--rule);
}
.top5-item:first-child .top5-num { color: var(--red); }
.top5-title {
font: 600 13px/1.3 var(--serif); color: var(--ink);
}
.top5-cat {
font: 400 10px var(--ui); color: var(--ink-faint); margin-top: 2px;
}

/* Strefa MASZ TEMAT */
.sb-tip-box {
background: #fffbeb;
border-color: #f0c040;
}
.sb-tip-box textarea {
width: 100%; resize: none; height: 72px;
border: 1px solid var(--rule); border-radius: var(--radius-sm);
padding: 8px; font: 400 13px var(--body);
margin-bottom: 8px;
}
.sb-tip-box button {
width: 100%;
background: var(--ink); color: white;
font: 600 11px var(--ui); letter-spacing: 0.06em;
padding: 9px; border: none; cursor: pointer;
transition: background var(--t-fast);
}
.sb-tip-box button:hover { background: var(--red); }

/* Ważne telefony */
.phone-item {
display: flex; align-items: center; gap: 10px;
padding: 7px 0;
border-bottom: 1px solid var(--rule-light);
font: 400 13px var(--ui);
}
.phone-icon { font-size: 16px; flex-shrink: 0; }
.phone-name { color: var(--ink-mid); flex: 1; }
.phone-num  { font: 600 13px var(--ui); color: var(--ink); font-variant-numeric: tabular-nums; }


## 13. ANIMACJE WEJŚCIA — Intersection Observer
// Każdy moduł ma klasę .reveal
// CSS bazowe:
// .reveal { opacity: 0; transform: translateY(24px); transition: opacity 400ms ease-out, transform 400ms var(--ease-out); }
// .reveal.visible { opacity: 1; transform: translateY(0); }

const observer = new IntersectionObserver((entries) => {
entries.forEach((entry, i) => {
if (entry.isIntersecting) {
setTimeout(() => {
entry.target.classList.add('visible');
}, i * 80);
observer.unobserve(entry.target);
}
});
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

prefers-reduced-motion: jeśli ustawione → .reveal od razu opacity: 1; transform: none.

## 14. OGŁOSZENIA — emocjonalna gradacja
#ogloszenia {
background: var(--dark-charcoal);
padding: var(--sp-48) var(--sp-24);
}

.ogl-grid {
display: grid;
grid-template-columns: repeat(7, 1fr);
gap: 1px;
background: rgba(255,255,255,0.08);
margin-bottom: var(--sp-24);
}

.ogl-tile {
background: #333;
padding: var(--sp-20) var(--sp-16);
text-align: center;
cursor: pointer;
transition: background var(--t-fast);
}
.ogl-tile:hover { background: #3d3d3d; }
.ogl-icon { font-size: 24px; margin-bottom: 8px; display: block; }
.ogl-name {
font: 700 11px/1 var(--ui);
letter-spacing: 0.08em; text-transform: uppercase;
color: white; margin-bottom: 4px;
}
.ogl-count {
font: 700 16px/1 var(--ui);
color: var(--accent-color, #888);
}

/* Nekrologi — inne traktowanie */
.ogl-tile.nekrologi {
background: #2a2a2a;
border: 1px solid #444;
}
.ogl-tile.nekrologi .ogl-name {
font-weight: 400; letter-spacing: 0.04em;
}
.ogl-tile.nekrologi .ogl-sub {
font: 300 10px/1.4 var(--ui); color: #666;
margin-top: 4px; display: block;
content: "Z żałobną czcią";
}
/* Bez .ogl-count dla nekrologi — nie liczymy śmierci w sposób krzykliwy */

.ogl-cta {
text-align: center;
}
.ogl-cta a {
display: inline-flex; align-items: center; gap: 8px;
background: var(--red); color: white;
font: 600 12px var(--ui); letter-spacing: 0.08em;
text-transform: uppercase; padding: 14px 32px;
transition: background var(--t-fast);
}
.ogl-cta a:hover { background: var(--red-dark); }


## 15. FOOTER — layout dokładny
#footer { background: var(--dark-black); }

.footer-top-rule {
height: 3px; background: var(--red);
}

.footer-main {
max-width: var(--max-w); margin: auto;
padding: var(--sp-64) var(--sp-24) var(--sp-48);
display: grid;
grid-template-columns: 260px 1fr 180px 240px;
gap: var(--sp-48);
}

.footer-col h4 {
font: 700 10px/1 var(--ui);
letter-spacing: 0.12em; text-transform: uppercase;
color: #555; margin-bottom: var(--sp-16);
padding-bottom: var(--sp-8);
border-bottom: 1px solid #222;
}

/* Kolumna 1 — Logo + misja */
.footer-logo {
font: 900 26px var(--serif); color: white;
margin-bottom: var(--sp-12);
}
.footer-logo span { color: var(--red); }
.footer-mission {
font: 300 13px/1.6 var(--body); color: #666;
margin-bottom: var(--sp-16);
}
.footer-socials { display: flex; gap: 8px; }
.footer-socials a {
width: 32px; height: 32px;
background: #1a1a1a;
display: flex; align-items: center; justify-content: center;
font-size: 14px; color: #666;
transition: background var(--t-fast), color var(--t-fast);
}
.footer-socials a:hover { background: var(--red); color: white; }

/* Kolumna 2 — Kategorie, 2 pod-kolumny */
.footer-cats {
display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
}
.footer-cats a {
font: 400 12px var(--ui); color: #555;
padding: 4px 0;
transition: color var(--t-fast);
display: flex; align-items: center; gap: 6px;
}
.footer-cats a::before {
content: '';
width: 4px; height: 4px;
background: #333; border-radius: 50%;
flex-shrink: 0;
}
.footer-cats a:hover { color: white; }
.footer-cats a:hover::before { background: var(--red); }

/* Sub-footer */
.footer-sub {
background: #060606;
padding: var(--sp-16) var(--sp-24);
max-width: var(--max-w); margin: auto;
display: flex; justify-content: space-between; align-items: center;
flex-wrap: wrap; gap: 12px;
}
.footer-sub a, .footer-sub span {
font: 400 11px var(--ui); color: #444;
transition: color var(--t-fast);
}
.footer-sub a:hover { color: #888; }
.footer-ai-note {
font: 300 11px var(--ui); color: #333;
font-style: italic;
}


## 16. MOBILE — breakpoints
≤ 1280px — sidebar znika:
#sidebar { display: none; }
.content-with-sidebar { display: block; }

Zawartość sidebaru pojawia się jako karty wplecione między moduły.
≤ 1024px:
.hero { grid-template-columns: 60fr 40fr; }
.hero-sygnale { display: none; } /* przeniesione wyżej jako moduł 4 */
.news-grid { grid-template-columns: 1fr 1fr; }
nav ul { gap: 0; } /* Menu się zagęszcza */
nav ul li > a { padding: 0 8px; font-size: 10px; }

≤ 768px:
/* Hamburger */
.nav-menu { display: none; }
.nav-menu.open {
display: flex; flex-direction: column;
position: fixed; inset: 0;
background: var(--dark-black); z-index: 999;
padding: 80px var(--sp-24) var(--sp-24);
overflow-y: auto;
}
.hamburger { display: flex; }

/* Hero — stack pionowy */
#hero { grid-template-columns: 1fr; }
.hero-secondary { display: none; }

/* Moduły — jedna kolumna */
.news-grid { grid-template-columns: 1fr; }
.kujawianka-grid { grid-template-columns: 1fr; }
.solectwa-grid { grid-template-columns: 1fr; }
.samorzad-media-grid { grid-template-columns: 1fr; }

/* Ogłoszenia — 3 kolumny zamiast 7 */
.ogl-grid { grid-template-columns: repeat(3, 1fr); }


## 17. DANE DEMO — wymagania
Wszystkie placeholder-dane muszą być realistyczne lokalnie:
Artykuły: "Remont ulicy Kościelnej zakończony przed terminem", "Sesja Rady Miejskiej – relacja z 22 maja", "OSP Izbica interweniowała przy pożarze stodoły w Bierzynie"
Sołectwa: Sadłno, Bierzyn, Błenna, Sarnowo, Pasieka, Wietrzychowice, Modzerowo i pozostałe 27 z danych gminy
Kujawianka: liga okręgowa, konkretne wyniki i nazwiska
Telefony: prawdziwe numery OSP Izbica, SPZOZ, Posterunku Policji
Pogoda: Izbica Kujawska, województwo kujawsko-pomorskie
Źródła Przeglądu Mediów: ddwloclawek.pl, nwloclawek.pl, pomorska.pl, kujawy.info
Zero "Lorem ipsum". Zero "Artykuł przykładowy". To jest demo które można pokazać inwestorowi.

To jest kompletna specyfikacja implementacyjna. Każda właściwość CSS nazwana, każde zachowanie JS opisane, każda decyzja projektowa uzasadniona. Claude Code może budować moduł po module bez żadnych pytań.
