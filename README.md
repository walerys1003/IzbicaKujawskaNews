# izbica24.pl — Magazyn Gminy Izbica Kujawska

**Działający prototyp** kompletnego portalu informacyjnego z silnikiem AI-newsroom + baza wiedzy projektu (RAG).

---

## 🛠️ v3.7 — FIX-PACK #2 (2026-05-25, 16 poprawek pre-roadmap)

**Build**: `npm run build` → dist/_worker.js 268.61 kB, 68 modules, 1.45s
**HTTP**: localhost:3000 zwraca 200, HTML 125 KB (+28 KB vs v3.6)

### 16 napraw zgłoszonych po v3.6

| # | Element | Status |
|---|---------|--------|
| A | Hero text "Kościelna" — biały na białym → **czarny + burgundowy hover** | ✅ v3-fix.css:135-180 |
| B | **"Na Sygnale" przywrócone z paska do PEŁNEJ SEKCJI** (LIVE pulse + 5 chips + featured + 3 cards + telefony 112/998/997/999) | ✅ NaSygnaleSection |
| C | Chips podserwisów dodane: Samorząd (7), Kultura (6), Historia (5), Ludzie (4), Edukacja, Sport, Multimedia | ✅ |
| D | **Nowy moduł "Życie"** dodany do home (4 chips + 4 cards) | ✅ ZycieModule |
| E | Kujawianka — z generycznej karty → **editorial-grid** (feature + scoreboard + tabela 4.ligi + strzelcy) | ✅ |
| F | Zielona Gmina — `KANAL_ZGLOWIACZKI` feature card + 4× `ROLNICTWO_PROGRAMY` z urgency (foto+excerpt+slug) | ✅ |
| G | Ogłoszenia — 3 kolumny ze zdjęciami 90px (nekrolog/praca/nieruchomości) + sepia filter dla nekrologów | ✅ |
| H | **Top 10 czytane** — 10 kart z rank+cat badge + foto + tytuł + zajawka + odsłony | ✅ |
| I | Historia/Dziedzictwo Kujaw — twin grid (2 mniejsze zdjęcia zamiast 1 długiego) | ✅ |
| J | Inwestycje gminne — stats-bar (5 inwestycji / 12,4 mln / 68% / 2 zakończone) | ✅ |
| K | Edukacja — stats-bar (4 szkoły / 6 przedszkoli / 1 LO / 1487 uczniów / 98%) | ✅ |
| L | Multimedia — video-hero (1.4fr+1fr) + 4-thumb grid + podcast-hero (fioletowy gradient) | ✅ |
| M | Newsletter — białe litery na granatowym tle (utwardzenie regułami `!important`) | ✅ |
| N | Opinie redakcji — zdjęcia są (potwierdzone z v3.6, `IMG.opinie` array) | ✅ verified |
| O | Wszystkie podserwisy z chips — kolor kategorii via `--cat-color` CSS var | ✅ |
| P | 22 nowe placeholder JPG (Picsum stable seeds) w `public/static/img/{srodowisko,ogloszenia,zycie,nasygnale,wiadomosci}/` | ✅ |

### Pliki zmienione w v3.7
- `public/static/v3-fix.css` — 989 → **1791 linii** (+802)
- `src/data-modules.ts` — rozszerzono 6 stałych + dodano 4 nowe (ZYCIE_*, NA_SYGNALE_*)
- `src/components/home-v3-modules.tsx` — major refactor 8 modułów + 1 nowy (ZycieModule)
- `src/components/home-v3.tsx` — NaSygnaleSection + ZycieModule w layout

### Render verification (curl localhost:3000)
```
v3-nasygnale-section              1  ✅
v3-zycie-grid                     1  ✅
v3-top10-grid                     1  ✅
v3-kujawianka-editorial-grid      1  ✅
v3-historia-twin                 15  ✅
v3-srod-kanal-card                1  ✅
v3-ogl-list-photo                 3  ✅
v3-multimedia-spacious            1  ✅
v3-chips                         10  ✅
v3-chip                          84  ✅
v3-inwest-stats-bar               1  ✅
v3-edu-stats-bar                  1  ✅
```

---

## 🛠️ v3.6 — FIX-PACK (2026-05-25, krytyka użytkownika → jedna duża fala)

### Naprawa 12 problemów zgłoszonych po v3.5

Po krytycznej analizie wizualnej (12 punktów: kontrast, brak zdjęć, brak struktury, mapa, duplikaty), wykonano kompleksową falę napraw w **6 falach równoległych**:

**FALA A — KONTRAST** (5 sekcji)
- Sesja Rady widget: gradient navy + cream tekst (było: białe na cream — niewidoczne)
- Wywiad burmistrza: cream cytat + gold border-left
- Top strzelcy: ciemne nazwiska
- Naj komentowane + Newsletter: wzmocniony kontrast tekstu
- Historia feature: uspokojona paleta (#1a1410→#2d2418→#3d3018, cream tekst)

**FALA B — HERO**
- Tytuł: `clamp(1.5rem, 2.5vw + 0.5rem, 2.5rem)` zamiast statycznych 5rem (był nieproporcjonalny)

**FALA C — STRUKTURA**
- Samorząd: **4 podserwisy** (Burmistrz, Rada Miejska, Komisje, Konsultacje)
- Kultura: **3 podserwisy** z prawdziwymi obrazami (MGCK, Biblioteka Publiczna, 15 KGW)
- Usunięto duplikat `<KujawiankaSection/>` — pozostaje tylko rozbudowany `SportModule`

**FALA D — ZDJĘCIA** (48 stockowych zdjęć)
- Źródła: Unsplash, Pexels, Picsum (CC0/free for commercial)
- 11 podkatalogów: inwestycje/historia/kultura/edukacja/zdrowie/opinie/ludzie/mieszkaniec/kalendarz/wiadomosci/solectwa
- **IMG mapping** — TypeScript lookup table `slug → /static/img/...`
- Refactoring 11 modułów: Inwestycje (z excerpts + status), Kultura (kafelki + podserwisy), Edukacja (feature + miniatury), Zdrowie (image headers), Historia (feature + mini), Opinie (round photo avatars), Ludzie (burmistrz feature + portrety), Mieszkaniec Pyta (real avatars), Kalendarz (thumbnails per event), Wiadomości (featured + 6 cards)

**FALA E — MAPA SOŁECTW**
- Pre-renderowana **PNG mapa OpenStreetMap** 1200×900 (`mapa-gminy-izbica.png`)
- Wygenerowana via `staticmap` + `PIL` (Python pipeline w `/tmp/gen-map.py`)
- 16 markerów (Izbica center navy + 15 sołectw kolory wg aktywności high/medium/low)
- Białe pill-labels z nazwami sołectw + legenda + atrybucja ODbL
- Zastąpiła paskudną SVG z nakładającymi się labelami

**FALA F — CSS POLISH**
- `public/static/v3-fix.css` (966 linii) — wszystkie override w jednym pliku, `!important` dla pewnej precedencji
- Załadowany jako ostatni stylesheet (po v3-footer.css)
- 6 nowych klas image wrap (aspect-ratio + object-fit:cover + border-radius)

### 📊 Weryfikacja v3.6
- ✅ Build OK: 68 modułów, `dist/_worker.js` 246.7 KB
- ✅ HTTP 200, 97 KB HTML (vs 93 KB w v3.5 — +4 KB z `<img>` tagów)
- ✅ **44 obrazy aktywnie używane** + mapa PNG
- ✅ Screenshot AI verification: 11/12 GOOD, mapa + opinie potwierdzone GOOD przez `understand_images`
- ✅ Wszystkie 16/16 markerów obecności w HTML (curl + grep)
- ✅ Push do GitHub: `0a0b5f7..32fda1c main`

### 🎯 Mapowanie 12 napraw → kommit
| # | Problem | Naprawa | Status |
|---|---------|---------|--------|
| 1 | Hero tytuł za duży | clamp(1.5rem...) | ✅ |
| 2 | Samorząd brak pod-serwisów | 4 podserwisy (Burmistrz/Rada/Komisje/Konsultacje) | ✅ |
| 3 | Sesja Rady biały na cream | navy gradient + cream tekst | ✅ |
| 4 | Inwestycje brak zdjęć i zajawek | 5 stock photos + excerpts | ✅ |
| 5 | Duplikat Kujawianka | Usunięto `<KujawiankaSection/>` | ✅ |
| 6 | Kultura "AI-generated" | 3 podserwisy z obrazami + struktura MGCK/Biblioteka/KGW | ✅ |
| 7 | Edukacja brak zdjęć | feature + miniatury news | ✅ |
| 8 | Zdrowie brak wizualizacji | image headers per karta | ✅ |
| 9 | Historia biały/czerwony kicz | uspokojona paleta + feature image | ✅ |
| 10 | Sołectwa SVG paskudna | PNG OSM mapa 1200×900 | ✅ |
| 11 | Kalendarz brak zdjęć | thumbnail per event | ✅ |
| 12 | Mieszkaniec słaba forma | real photo avatars | ✅ |
| 13 | Opinie brak zdjęć | round photo avatars (3 felietonistów) | ✅ |
| 14 | Naj komentowane kontrast | wzmocniony kontrast | ✅ |
| 15 | Newsletter czarny słabo | cream tekst + gold akcenty | ✅ |

---

## 🚀 v3.5 — 24 MODUŁY MAGAZYNOWE (2026-05-25, sesja wieczorna)

### Krytyczne rozszerzenie: z 6 → 24 modułów na home

Po krytycznej samoocenie ("6 modułów to zdecydowanie za mało dla portalu informacyjnego klasy premium z setkami tysięcy odwiedzin"), wykonano **drugą falę** redesignu w **3 równoległych sandboxach × 30 zadań = 90 zadań**:

### 🗺️ Plan informacyjny (decyzje wagi)
- **Waga ↑↑↑**: NaSygnale (alerty), Wiadomości (lead newsroom), Samorząd, Inwestycje
- **Waga ↑↑**: Kujawianka+Sport, Kultura, Edukacja, Zdrowie
- **Waga ↑**: Środowisko+Rolnictwo, Ludzie, Sołectwa (mapa), Mieszkaniec Pyta
- **Waga ↓** (niżej): Historia, Kalendarz, Multimedia, Opinie, Top10, Archiwum
- **Chrome**: Newsletter, Ogłoszenia, Partnerzy

### 📐 Kolejność 24 modułów (zgodnie z user request: „Historię niżej, submoduły wewnątrz kategorii")
1. **[01] Hero** (asymetryczny grid)
2. **[02] TopStrip 6 KPI** — Pogoda · Paliwa · Alerty · Apteka · **Sesja Rady** · **Inwestycje 2026** (rozszerzono z 4 do 6)
3. **[03] NaSygnale** — alert strip (burgundy full-bleed, 3 cards: prąd/wypadek/zaginiona osoba)
4. **[04] Wiadomości** — feature 2×2 + 6 small + chip filters
5. **[05] Samorząd** — lead + sub-widget „Sesja Rady XLVII" (navy) + sub-widget „Budżet 2026 donut" (inline SVG 6-segment)
6. **[06] Inwestycje** — 5 projektów progress (modernizacja dróg, kanalizacja, świetlica, fotowoltaika, OSP)
7. **[07] Kujawianka + Sport** — match + next + scorers + amatorzy
8. **[08] Kultura** — events list (5) + featured cards (przed Historią — user request)
9. **[09] Edukacja** — feature ZS + lista 4
10. **[10] Zdrowie** — apteka dyżurna + SPZOZ info + profilaktyka
11. **[11] Środowisko + Rolnictwo** — kanał Zgłowiączki + 3 programy
12. **[12] Ludzie** — wywiad featured + 3 portrety
13. **[13] Historia** (niżej!) — Polskie Piramidy + 3 mini cards
14. **[14] Sołectwa** — **interaktywna SVG minimapa gminy** z 15 pinezkami activity-color (high/medium/low) + chipy + ostatnia aktywność
15. **[15] Kalendarz 7-dni** — 7-col grid z color-coded events per kategoria
16. **[16] Multimedia** — video featured 16:9 + 4 thumbs + podcast banner
17. **[17] Mieszkaniec Pyta** — Q&A feed 2-col
18. **[18] Opinie** — 3 felietony + naj komentowane (2fr/1fr)
19. **[19] Newsletter** — full-bleed navy + gold radial
20. **[20] Ogłoszenia** — 3-col (nekrologi/praca/nieruchomości)
21. **[21] Top 10 tygodnia** — numbered list 2-col
22. **[22] Partnerzy** — 7 instytucji z inline SVG icons: **Urząd, MGCK, Biblioteka, Caritas, OSP, Dom Orionistów, parafia Izbica Kujawska** (user verbatim)
23. **[23] Archiwum** — rok + miesiąc + kategoria chip bar

### 🎨 Decyzje design (user verbatim)
- ✅ **Usunięto WSZYSTKIE animacje tekstu hover** (gold underline, scale transform, letter-spacing) — `v3-modules-ext3.css` ma blok CLEAN-UP z `!important` overrides
- ✅ **Zostały tylko**: color transition, box-shadow deepening, smooth scroll, ticker marquee, fade-in lazy load (user: „subtelny kolor, change, box shadow, smooth, scroll")
- ✅ **Sub-widgety WEWNĄTRZ kategorii** (Samorząd = lead + sesja + budżet, Sport = match + scorers + amateur — nie osobne sekcje)
- ✅ **SVG minimapa sołectw** — schematyczna „octagonal blob" + grid pattern + symbol Izbicy w centrum + rzeka Zgłowiączka + 15 pinezek z kolorami activity
- ✅ **Inline SVG dla 7 partnerów** — własne ikony PartnerIcon per slug

### 📦 Pliki utworzone w v3.5
- **`src/data-modules.ts`** (16.5 KB) — mock data dla 24 modułów: SOLECTWA × 15, PARTNERS × 7, SESJA_RADY, BUDZET_2026 (38.2 mln zł, 6 segmentów), INWESTYCJE × 5, NEXT_MATCH/TOP_SCORERS/SPORT_AMATORSKI, HISTORIA_CARDS, KULTURA_EVENTS, EDUKACJA_NEWS, APTEKA_DYZUR, SPZOZ_INFO, KANAL_ZGLOWIACZKI, ROLNICTWO_PROGRAMY, LUDZIE_PORTRETY + WYWIAD_FEATURED, MIESZKANIEC_FEED, OPINIE, NAJ_KOMENTOWANE, VIDEO_FEATURED + VIDEO_THUMBS, PODCAST_LATEST, KALENDARZ_7DNI, NEKROLOGI/PRACA/NIERUCHOMOSCI, TOP10_TYDZIEN, ARCHIWUM
- **`public/static/v3-modules-ext.css`** (15.8 KB) — moduły [03]-[08]
- **`public/static/v3-modules-ext2.css`** (21.0 KB) — moduły [09]-[17]
- **`public/static/v3-modules-ext3.css`** (13.0 KB) — moduły [18]-[23] + **CLEAN-UP block** z `!important` overrides + 6-col TopStrip override
- **`src/components/home-v3-modules.tsx`** (45.0 KB) — 22 komponenty modułów + `ModuleHead` reusable + `BudzetDonut` SVG + `SolectwaMapa` SVG + `PartnerIcon` SVG (per slug)
- **`src/components/icons.tsx`** — dodano `Icon.Power` (lightning bolt) dla NaSygnale „wyłączenia prądu" (łącznie 52 ikony)
- **`src/renderer.tsx`** — dodane 3 linki CSS (ext, ext2, ext3) przed article-v2.css
- **`src/components/home-v3.tsx`** — `HomeV3` zaimportował 22 moduły, zastąpił TopStories/MagazineGrid/MainLayout 22 nowymi sekcjami w nowej kolejności, TopStrip rozszerzony z 4 do 6 KPI

### 📊 Metryki v3.5
- **Build**: 68 modules transformed (było 66), worker 243 KB (było 203 KB)
- **HTML size**: 93 KB (było ~40 KB) — 22 moduły + dane + SVG icons
- **CSS total**: 96.5 KB (poprzednio 47 KB) — dodano 49.8 KB w 3 plikach ext
- **Zadania**: 90/90 ukończone (Sandbox G + H + I)

---

## 🎨 v3 REDESIGN — „Magazyn Kujawski Premium" (2026-05-25)

### Totalny redesign inspirowany Interia.pl + The Guardian + NYT Magazine

Po decyzji użytkownika o **całkowitym redesignie** ("kiczowate jak z lat 90", marginesy zbyt duże, hero źle rozmieszczony, brak optymalizacji mobile), wykonano kompleksową refaktoryzację warstwy prezentacji w **3 równoległych sandboxach po 40 zadań każdy + orchestrator** (łącznie 120+ zadań projektowych).

### 🎨 Sandbox D — Design System (40 tasks)
- **`public/static/design-tokens.css`** (6.5 KB) — pełna paleta tokenów: `--c-navy: #0a2540`, `--c-burgundy: #8b1d2a`, `--c-gold: #c8a951`, `--c-heraldic-green: #2d5a3d`, `--c-cream: #faf7f2` (zastępuje stary `#fa6400`)
- **`public/static/v3-base.css`** (8.3 KB) — reset + body z `font-feature-settings`, fluid typography przez `clamp()`, container responsywny (var(--max-w)), `.v3-eyebrow`, `.v3-section-head` z burgundowym ::after, btn-primary/gold/ghost, img-placeholder z diagonalnymi paskami
- **Typografia v3**: Playfair Display (display serif h1-h3) + Lora (body serif) + Inter (UI sans) — koniec Source Serif 4
- **Dark mode** przygotowany przez `[data-theme="dark"]`

### 🏛️ Sandbox E — Layout & Hero (40 tasks)
- **`public/static/v3-header.css`** (10.5 KB) — utility bar (navy), header z herbem (cream), sticky nav z backdrop-blur, mega-menu hover, breaking ticker z marquee + pulse "NA ŻYWO" badge
- **`public/static/v3-hero.css`** (9.1 KB) — hero asymetryczny grid 2fr/1fr, hero-main-title z `clamp(2.5rem, 5vw+1rem, 5rem)` + złota animowana podkreślenie na hover, 3 stacked aside cards, top-strip 4 KPI (Pogoda/Paliwo/Alerty/Apteka), stories-grid z featured card span-2
- **Herb Izbicy** jako **inline SVG component** (`HerbIzbica`): tarcza heraldyczna ze złotą obwódką + czerwone pole z gradientem (`#b8302a→#8b1d2a`) + zielone wzgórze (`#3d6e4f→#2d5a3d`) + czarny krzyż łaciński — uproszczona wersja z opisu heraldycznego z 1534 r.

### 📰 Sandbox F — Modules & Footer (40 tasks)
- **`public/static/v3-modules.css`** (14.5 KB) — main-layout 2-col (content + sticky 340-380px sidebar), Kujawianka section (heraldic green gradient + score 3:1 + Top 5 mini-table), magazine-grid z feature card (dark navy + texture), sidebar widgets: weather (gradient navy), top-list (numbered counter), alerts (burgundy header), newsletter (navy + gold radial)
- **`public/static/v3-footer.css`** (8.5 KB) — footer-top mission band NAVY (NIE czarny!) z herbem + statystykami (5400 mieszkańców · 137 km² · 1394 prawa miejskie), footer-main 4-col grid (Brand/Kategorie/Portal/Gmina), footer-bottom z AI badge + legal, scroll-top fixed circular button
- **`public/static/v3-app.js`** (8.5 KB) — scroll-top toggle >400px, mobile hamburger menu z ESC + click-outside, smooth scroll dla anchorów, **⌘K shortcut** dla szukania, dark mode toggle + localStorage, ticker pause on hover, intersection observer lazy placeholders, live clock

### 🧩 Orchestrator (12 tasks)
- **`src/components/home-v3.tsx`** (29.9 KB) — pełny HomeV3 component: HerbIzbica SVG + UtilityBar + Header + Nav (10 kategorii × subs) + BreakingTicker + HeroSection + TopStrip + TopStories + KujawiankaSection + MagazineGrid + MainLayout + Footer + ScrollTopBtn
- **`src/components/icons.tsx`** — dodano 10 nowych ikon: Alert, ArrowUp, Bell, Heart, MapPin, PlayCircle, Plus, Rss, Send, User (łącznie 51 ikon w namespace)
- **`src/renderer.tsx`** — przepisany: nowy font-stack (Playfair Display 400-900 + Lora 400-700 + Inter 300-900), v3 CSS chain (design-tokens → base → header → hero → modules → footer), favicon SVG inline z herbem, `theme-color="#0a2540"`, viewport-fit=cover dla PWA
- **`src/index.tsx`** — route `/` używa `<HomeV3 />`, stara wersja zachowana pod `/v2` (archiwum, dodane do reserved paths w catch-all `/:cat`)

### 🎯 Co zostało rozwiązane (lista feedback'u użytkownika)

| Problem (przed) | Rozwiązanie (po) |
|---|---|
| ❌ Pomarańczowy `#fa6400` kiczowaty | ✅ Paleta Premium: Navy + Burgundy + Gold + Heraldic Green + Cream |
| ❌ Czarna stopka średnia | ✅ Navy mission-band z herbem + statystyki gminy + cream paper main 4-col |
| ❌ Ciemna górna belka nieciekawa | ✅ Cream header z herbem + brand "izbica**24**.pl" + utility bar navy thin |
| ❌ Układy kanciaste, kwadratowe | ✅ Asymetryczny hero 2fr/1fr, magazine grid 1.2fr/1fr/1fr, sticky sidebar, rounded radii |
| ❌ Marginesy lewa/prawa za duże | ✅ Container `var(--max-w: 1380px)` z fluid padding `clamp(1rem, 4vw, 2.5rem)` |
| ❌ Hero źle rozstawione, puste miejsca | ✅ Hero main + 3 aside cards stacked, fluid clamp() title, no empty gaps |
| ❌ Brak optymalizacji mobile/tablet | ✅ Mobile-first: hamburger <1024px, top-strip 1col→4col, hero 1col→2col, magazine 1col→3col |
| ❌ Brak loga gminy | ✅ Inline SVG **HerbIzbica** (red shield + black Latin cross + green hill + gold border) — w headerze + footerze + favicon |
| ❌ Standardowa typografia | ✅ Playfair Display dla h1-h3 (display serif), Lora dla body, Inter dla UI |

### 📊 Metryki redesignu
- **Pliki utworzone**: 7 (6 CSS + 1 JSX + 1 JS = 47 KB CSS + 30 KB JSX + 8.5 KB JS)
- **Pliki zmodyfikowane**: 3 (icons.tsx, renderer.tsx, index.tsx)
- **Build**: 66 modułów, 203 KB worker, 1.47s
- **HTTP test**: home 45 KB / 0.02s, wszystkie endpointy (/, /v2, /wiadomosci/:slug, /szukaj, /samorzad, /sitemap.xml, /rss.xml, /manifest.json) zwracają 200 OK
- **Wszystkie 7 zasobów v3 (CSS+JS)**: 200 OK, łącznie ~66 KB
- **Konsola browser**: ZERO błędów JS, `[izbica24 v3] "Magazyn Kujawski Premium" zainicjalizowany ✓`

### 🌐 URL produkcyjny prototypu
- **Główna v3**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai/
- **Archiwum v2**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai/v2

---

## 🚀 90-task parallel build — Articles + REST API + D1 + SEO (2026-05-25, commit `fff685b`)

Ultra-szybkie budowanie wielomodułowe w 3 strefach równolegle (Sandbox A/B/C, 30+ zadań każda):

### 🎨 Sandbox A — Frontend/UX/UI (30+ tasks)
- **`src/components/article.tsx`** — Strona artykułu Reuters-tier: breadcrumb · dateline „IZBICA —" · byline z avatarem · hero z podpisem · **sticky share** (64px column) · body z **dropcap 4.2em #fa6400** · tagi · author card · related grid (3-col) · komentarze stub
- **`src/components/category.tsx`** — Listing kategorii: hero z opisem · filter pills (podkategorie) · 3-col card grid · paginacja
- **`src/components/search.tsx`** — `SearchPage` (formularz, suggestion pills, wyniki z `<mark>` highlight) + `NotFoundPage` (404 z code 120px serif, helpful links)
- **`public/static/article-v2.css`** (15 KB) — `.article-container` max-1080px, `.cat-grid` 3-col responsive, `.notfound-code` 120px serif, scroll-top-btn, reading-progress bar

### ⚙️ Sandbox B — Backend / REST API (30+ tasks)
- **`src/data-articles.ts`** — 12 mock artykułów PL + 13 kategorii (`CATEGORIES_MAP`) + helpery `findArticle()`, `articlesByCategory()`, `searchArticles()`
- **`src/api/v1.ts`** — Hono sub-app `/api/v1/*` z **17 endpointami REST**:

| Metoda | Endpoint | Funkcja |
|--------|----------|---------|
| GET | `/api/v1/health` | Status API |
| GET | `/api/v1/articles?limit&offset&category` | Lista artykułów (paginacja, filter) |
| GET | `/api/v1/articles/:slug` | Szczegóły artykułu |
| GET | `/api/v1/categories` | Lista kategorii |
| GET | `/api/v1/categories/:slug` | Kategoria + jej artykuły |
| GET | `/api/v1/search?q=` | Wyszukiwanie |
| GET | `/api/v1/alerts` | Aktywne alerty |
| GET | `/api/v1/roads` | Stan dróg |
| GET | `/api/v1/weather` | Pogoda |
| GET | `/api/v1/fuel` | Ceny paliw |
| GET | `/api/v1/events?week=` | Kalendarz wydarzeń |
| GET | `/api/v1/duty` | Dyżury (apteka/lekarz) |
| GET | `/api/v1/rag/search?q=` | Wyszukiwanie semantyczne RAG |
| POST | `/api/v1/newsletter/subscribe` | Subskrypcja (email regex + GDPR consent) |
| GET | `/api/v1/newsletter/unsubscribe?token=` | Wypisanie |
| POST | `/api/v1/articles/:slug/comments` | Komentarz (moderowany) |
| POST | `/api/v1/articles/:slug/share` | Telemetria share |
| POST | `/api/v1/incoming` | Bridge dla n8n (Bearer auth) |

### 🗄️ Sandbox C — Database / SEO (30+ tasks)
- **`migrations/0001_initial_schema.sql`** — **10 tabel produkcyjnych** Cloudflare D1: `users`, `categories`, `articles`, `tags`, `article_tags` (M2M), `comments` (z moderacją + IP hash), `newsletter_subscribers` (z `consent_version`), `alerts`, `events`, `incoming_queue` (z dedup hash), `api_tokens`. FOREIGN KEY + CHECK + INDEX.
- **`migrations/0002_indexes_and_views.sql`** — 3 VIEWs (`published_articles_view`, `active_alerts_view`, `top_week_view`) + 5 TRIGGERów (auto `updated_at`, tag `usage_count` inc/dec, `comment_count` inc/dec na zmianę statusu)
- **`seed.sql`** — 5 użytkowników, 13 kategorii, 10 tagów, 4 alerty, 7 eventów (tydzień 25–31 maja 2026), 2 tokeny API z sha256
- **`src/seo.ts`** — generatory:
  - **`/sitemap.xml`** — kompletna mapa strony
  - **`/news-sitemap.xml`** — Google News (artykuły z ostatnich 48h)
  - **`/rss.xml`** — RSS 2.0 z enclosures
  - **`/robots.txt`** — GPTBot blocked, ClaudeBot allowed, Googlebot allowed
  - **`/manifest.json`** — PWA manifest
  - **`/humans.txt`** + **`/.well-known/security.txt`**
  - `buildOgTags()` (Open Graph), `buildArticleJsonLd()` (schema.org NewsArticle), `buildOrganizationJsonLd()`

### 🔗 Krytyczny fix: routing order
`/:cat` jako catch-all wymagał reorganizacji — wszystkie konkretne route'y (`/szukaj`, SEO endpoints) **MUSZĄ** być zarejestrowane przed `/:cat`, bo Hono dopasowuje w kolejności rejestracji. Skip-list dla `/:cat`: `['api', 'static', 'downloads', 'szukaj', 'plan', 'wiedza', 'rss.xml', 'sitemap.xml', 'news-sitemap.xml', 'robots.txt', 'manifest.json', 'humans.txt', '_debug-layout.js']`.

### ✅ Walidacja końcowa (wszystko 200 OK)
- 9/9 SEO/szukaj endpoints ✓
- 9/9 stron + kategorii ✓
- 5/5 artykułów (real slugs) + 1/1 404 dla nieistniejącego ✓
- 13/13 endpointów API v1 + POST newsletter ✓
- Playwright: zero JS errors, correct titles, `OK_ZERO_MARGINS`
- Build: **65 modułów, 177.12 kB worker bundle w 1.19s**

---

## 🆕 Layout v2 + 11 nowych modułów rezydenckich (2026-05-25)

**Cel:** zero marginesów po bokach + dynamiczna kompozycja zaplanowana strategicznie.

### Naprawione marginesy
- `--max-w: 1440px` (z 1200px) — szersza wersja na FHD/4K
- **Full-bleed pattern** dla: `#super-header`, `#main-nav`, `#breaking-bar`, `#hero`, `#na-sygnale`, `footer`, `.newsletter-inline`
  - Mechanizm: `width: 100vw; margin-left: calc(50% - 50vw)` — wystaje poza rodzica
  - Wszystkie elementy mają **L=0px R=0px** (potwierdzone Playwright)
- Treść contained do 1440px, sticky sidebar 320–400px (zależnie od viewport)

### 11 nowych modułów (analiza potrzeb mieszkańca gminy 5400-osobowej)

| # | Moduł | Funkcja | Lokalne dane |
|---|-------|---------|--------------|
| 1 | **SkrotDnia** | 6 KPI: pogoda, prąd, drogi, dyżur, sesja, zbiórki | wszystkie dziś rano |
| 2 | **AwarieIUtrudnienia** | Energa + ZGK + MEC + LTE — status live | Smolsk, Naczachowo, Modzerowo |
| 3 | **DrogiKomunikacja** | DK62, S10, DW270, PKS — utrudnienia | Izbica–Lubraniec, Włocławek |
| 4 | **DyzuryGodziny** | Apteka, lekarz, urząd, MGOPS, policja, OSP | NZOZ Medikus, ul. Rynek |
| 5 | **CenyPaliw** | Ranking lokalnych stacji + trend | Orlen, BP, Circle K |
| 6 | **PomagamyRazem** | Zbiórki OSP/MGOPS z paskiem postępu | aktywne kampanie |
| 7 | **KronikaRodzinna** | Narodziny, śluby, jubileusze, nekrologi | parafia + USC |
| 8 | **KalendarzTygodnia** | 7-dniowy event-grid: msze, sport, kultura | Kujawianka, MGCK |
| 9 | **TopTygodnia** | Top-5 najczytanych (BM25-style ranking) | algorytm lokalny |
| 10 | **MowiaMieszkancy** | 4 cytaty z FB/komentarzy (moderowane) | głosy z gminy |
| 11 | **NewsletterInline** | Full-bleed dark band + email signup | mid-page CTA |

**Łącznie: 25 modułów na home** (14 oryginalnych + 11 nowych) ułożonych w 7 strategicznych pasach narracyjnych — od "orientacji w dniu" przez "twarde informacje" do "ranking tygodnia".

### Pliki
- `public/static/layout-v2.css` (8 KB) — full-bleed pattern + asymmetric grid
- `public/static/modules-v2.css` (21 KB) — Reuters-tier styling 11 modułów
- `src/components/home-v2.tsx` (23 KB) — 11 nowych komponentów + `IconByKey` helper
- `public/static/_debug-layout.js` — diagnostyka layoutu (aktywacja: `?debug=1`)

## 📦 Artefakty backend N1-N6 (v1.0.0, 2026-05-25)

| Pakiet | Rozmiar | Zawartość | Pobierz |
|--------|---------|-----------|---------|
| `izbica24-newsroom-1.0.0.zip` | 68 KB | WordPress plugin (28 plików PHP) — CPT, REST `/incoming`, Token/Rate/Dedup, Queue admin, PublishPress bridge, Prompts CPT z 12 polskimi promptami, Cost Guard, Telegram bot, Monthly PDF, WP-CLI | [⬇](public/downloads/izbica24-newsroom-1.0.0.zip) |
| `izbica24-n8n-stack-1.0.0.tar.gz` | 23 KB | n8n stack na osobny VPS (Hetzner CX22) — docker-compose (n8n + 2 workery + Postgres 16 + Redis 7 + Caddy), 17 workflowów JSON, scripts (setup/backup/restore/update/cron), migracje SQL | [⬇](public/downloads/izbica24-n8n-stack-1.0.0.tar.gz) |

**Status wszystkich 6 sesji: ✓ ZIELONE** — szczegóły na stronie `/plan`.

**Jakość kodu:**
- PHP lint: **0 błędów** w 28 plikach (sprawdzone przez `php -l` na PHP 8.4)
- JSON validation: **17/17 workflowów** OK
- Reuters-tier visual: monochrome design + #fa6400 accent + Inter/Source Serif 4

## 🌐 URL serwisu (sandbox)

- **Główna (makieta portalu)**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai/
- **Plan wdrożenia**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai/plan
- **Baza wiedzy (RAG)**: https://3000-ilphadxwtch7dg25penfb-ecea8f22.sandbox.novita.ai/wiedza

## 🎯 Co zostało zrobione

### 1. Konwersja dokumentów źródłowych
- 10 plików DOCX → Markdown (300 576 znaków, ~81 tys. tokenów)
- Wszystkie dokumenty zapisane w `knowledge_base/docs/`

### 2. Baza wiedzy / RAG
- **Chunking semantyczny** po nagłówkach (`#`, `##`, `###`) z merge'owaniem krótkich i splitem długich sekcji
- **459 chunków** (śr. 711 znaków każdy)
- **Indeks BM25** z TF-IDF: 6 389 unikalnych terminów + polish stop-words
- Pliki indeksu w `knowledge_base/index/` (chunks.json, bm25_index.json, stats.json)
- **Python CLI** do wyszukiwania: `python3 knowledge_base/retrieve.py "twoje pytanie"`
- **Client-side JS** RAG na stronie `/wiedza` — odpowiedzi w &lt; 100 ms

### 3. Szata graficzna portalu (PRIORYTET) — **v2: ZERO MARGIN + 11 NOWYCH MODUŁÓW**

#### 🆕 Update v2 (25 maja 2026, commit `14adf8d`):

**LAYOUT FIX — zero marginesów bocznych:**
- `public/static/layout-v2.css` (7908 znaków) — universal `.full-bleed` pattern
  `width: 100vw; margin-left: calc(50% - 50vw)`
- Wymusza pełną szerokość na: `#super-header`, `#main-nav`, `#breaking-bar`,
  `#hero`, `#na-sygnale`, `.skrot-dnia`, `.newsletter-inline`, `footer`
- Nowy `--max-w: 1440px` (zamiast 1200px w reuters.css)
- Asymetryczny `.main-grid` (1fr + 320px sticky sidebar, breakpoint @1280→360px, @1600→400px)
- Mobile breakpoints @1080/768/480 px
- **Walidacja Playwright**: `verdict: OK_ZERO_MARGINS`, 11/11 modułów, `hScroll: false`

**11 NOWYCH MODUŁÓW STRATEGICZNYCH (Reuters-tier):**

| # | Moduł | Cel UX/Pain Point |
|---|-------|-------------------|
| 1 | **SkrotDnia** (6-KPI strip full-bleed) | Pogoda / awarie / drogi / dyżur / sesja / zbiórki w 5 sek. |
| 2 | **AwarieIUtrudnienia** | Prąd/Woda/Ciepło/Internet — status dots ok/warn/high |
| 3 | **DrogiKomunikacja** | DK62/S10/DW270/PKS z severity bars |
| 4 | **DyzuryGodziny** | apteka / lekarz / urząd / MGOPS / policja / OSP z tel: links |
| 5 | **CenyPaliw** | Ranking 4 stacji + trend arrows (↓ green / ↑ red) |
| 6 | **PomagamyRazem** | 3 zbiórki OSP/MGOPS/siepomaga z progress bars |
| 7 | **KronikaRodzinna** | Narodziny / śluby / jubileusze / nekrologi |
| 8 | **KalendarzTygodnia** | 7-dniowy event-grid PN-ND |
| 9 | **TopTygodnia** | Top-5 najczęściej czytane (rank numerals serif #fa6400) |
| 10 | **MowiaMieszkancy** | Cytaty z FB/email z border-left orange |
| 11 | **NewsletterInline** | Full-bleed CTA: czarny bg + orange 6px stripe |

**STRATEGIA UKŁADU (7-pass jak w głównych portalach informacyjnych):**
1. Orientacja w dniu — Hero + SkrotDnia (full-bleed top)
2. Twarde informacje — Wiadomości + Awarie/Drogi (cards-grid-2)
3. Społeczność — Kujawianka + Samorząd + NaSygnaleFull (full-bleed)
4. Usługi praktyczne — Dyżury + CenyPaliw (.section-zebra)
5. Kultura+Ludzie+Codzienność — w `.main-grid` z TopTygodnia/Pomagamy/Kronika w sticky sidebar
6. Ogłoszenia + Multimedia
7. NewsletterInline (full-bleed bottom)

**Łącznie: 25 modułów na stronie głównej** (14 oryginalnych + 11 v2).

#### 14 oryginalnych modułów (v1):
1. **Super-header** (sticky, hide-on-scroll, data + pogoda + newsletter)
2. **Main Nav** (12 kategorii z dropdownami, sticky compaction)
3. **Breaking bar** (ticker z animacją CSS, pause-on-hover)
4. **HERO** (3 kolumny 55/25/20: główny artykuł + NAJWAŻNIEJSZE + NA SYGNALE live)
5. **Wiadomości** (2fr/1fr/1fr grid + filter bar 7 podkategorii)
6. **Na Sygnale rozwinięty** (artykuł + timeline z pulsującą kropką live)
7. **Kujawianka** (granatowe tło 3-kolumnowe: wynik + tabela + artykuły/scorers)
8. **Samorząd + Przegląd mediów** (58/42, AI badge)
9. **Kultura + Historia** (50/50, sepia filter na historii)
10. **Ludzie** (4 karty osób z portretami)
11. **Życie codzienne** (8 kafelków + Poradnik tygodnia)
12. **Dziś w Izbicy** (AI evergreen z czerwoną kreską po lewej)
13. **Sołectwa** (mapa SVG interaktywna 34 wsi + lista 3-kolumnowa)
14. **Ogłoszenia** (7 kafelków na ciemnym tle, Nekrologi szczególne)
15. **Multimedia** (wideo + galerie mozaika + podcast player)

#### Specyfikacja techniczna:
- **Stack**: Hono + Cloudflare Pages, czysty CSS3, vanilla JS
- **Fonty**: Playfair Display + Source Serif 4 + DM Sans (Google Fonts)
- **Paleta**: papier kremowy `#faf9f6` + grafit `#0a0a0a` + krew `#c0392b`
- **11 kolorów kategorii** (Wiadomości czerwień, Samorząd granat, Kujawianka zieleń, Historia złoto sepii, etc.)
- **Responsywność**: 4 breakpointy (1280/1024/768/480)
- **Animacje**: Intersection Observer reveal + pulse-live + ticker scroll
- `prefers-reduced-motion` support
- **Sidebar 300px**: pogoda 7-dniowa, newsletter, TOP 5, "Masz temat?", reklama, telefony, Facebook

#### Realistyczne dane lokalne (zero Lorem ipsum):
- Burmistrz Marek Dorabiała, parafie (NMP, Błenna, Modzerowo), MGCK, MGOPS, ZGKiW
- 34 sołectwa gminy Izbica Kujawska (Sadłno, Bierzyn, Pasieka, Wietrzychowice, Modzerowo, etc.)
- Klub Kujawianka — tabela klasy okręgowej, top strzelcy, kalendarz meczów
- OSP Izbica, SPZOZ, KMP Włocławek, dzielnicowi
- Megality Wietrzychowice (Polskie Piramidy), synagoga izbicka, kanał Zgłowiączki
- Realne źródła Przeglądu mediów: ddwloclawek.pl, nwloclawek.pl, pomorska.pl, kujawy.info, TVP3

### 4. Plan wdrożenia (strona `/plan`)
- Roadmapa 6 sesji backendowych N1-N6 (wtyczka WP, queue, PublishPress, prompty Claude, n8n, monitoring)
- 4 fazy uruchamiania (infra → backend → frontend → onboarding → multimedia)
- Kalkulacja kosztów (~300 PLN/mies.)
- Krytyczne ryzyka i mitygacje

## 🚀 URI / endpointy

| Ścieżka | Co robi |
|---------|---------|
| `GET /` | Strona główna — pełna makieta portalu (14 modułów) |
| `GET /plan` | Plan wdrożenia projektu (roadmapa N1-N6) |
| `GET /wiedza` | Baza wiedzy projektu — RAG search po 459 chunkach |
| `GET /data/bm25_index.json` | Indeks BM25 (ładowany client-side) |
| `GET /data/chunks.json` | Wszystkie chunki bazy wiedzy |
| `GET /api/stats` | Statystyki RAG |
| `GET /api/health` | Health check |
| `GET /static/style.css` | CSS portalu (~58 KB) |
| `GET /static/app.js` | JS portalu + RAG client (~12 KB) |

## 🏗️ Architektura kodu

```
webapp/
├── src/
│   ├── index.tsx              # Routing Hono (/, /plan, /wiedza, API)
│   ├── renderer.tsx           # HTML layout (head, fonty)
│   ├── data.ts                # Wszystkie dane portalu (artykuły, sołectwa)
│   ├── rag.ts                 # Server-side stats RAG
│   ├── rag-stats.json         # Statystyki indeksu
│   └── components/
│       ├── layout.tsx         # SuperHeader, MainNav, Footer, DemoStrip
│       ├── home.tsx           # 14 modułów strony głównej + Sidebar
│       ├── plan.tsx           # Strona /plan
│       └── wiedza.tsx         # Strona /wiedza
├── public/
│   ├── static/
│   │   ├── style.css          # 1500+ linii CSS wg spec
│   │   └── app.js             # Interactivity + client-side BM25
│   └── data/
│       ├── bm25_index.json    # 651 KB (indeks RAG)
│       └── chunks.json        # 464 KB (chunki wiedzy)
└── knowledge_base/
    ├── raw/                   # Oryginalne DOCX
    ├── docs/                  # Markdown
    ├── index/                 # JSON indeks + chunki
    ├── extract_docx.py        # Konwerter DOCX → MD
    ├── build_rag.py           # Builder chunków + BM25
    └── retrieve.py            # CLI RAG retriever
```

## 🛠️ Stos technologiczny

- **Frontend**: vanilla HTML5/CSS3/JS (zero zależności CDN poza fontami)
- **Backend**: Hono 4.12 + Cloudflare Pages
- **Build**: Vite 6 + @hono/vite-build
- **RAG**: własna implementacja BM25 (Python build-time + JS runtime)
- **Tokenizacja**: regex + polish stop-words

## 🎨 Filozofia projektowa (wg dostarczonych dokumentów)

> "Strona ma jedno zadanie: sprawić żeby mieszkaniec Izbicy otwierał ją rano z kawą zamiast Facebooka. Każdy element projektu podporządkowany jest tej zasadzie. Nie budujemy 'ładnej strony' — budujemy nawyk."
>
> Inspiracje: Reuters (struktura) + Le Monde (typografia) + **stara lokalna gazeta papierowa** (ciepło, hierarchia, poczucie że ktoś to dla ciebie ułożył).

## 🚧 Co jest następne (do dalszej implementacji)

1. **Backend WordPress** — sesje N1-N6 (wg dokumentów w `knowledge_base/docs/05-10*.md`)
2. **Setup n8n** na osobnym VPS Hetzner CX22
3. **Konfiguracja Claude API + Perplexity** z Cost Guard
4. **Onboarding kontrybutorów** — 16 instytucji
5. **Migracja makiety** na motyw WordPress (jeśli wybierzemy WP) lub headless Hono+Cloudflare

## 🧪 Jak testować

```bash
# Strona główna
curl http://localhost:3000/

# RAG search (client-side w przeglądarce)
# Otwórz /wiedza, wpisz "Cost Guard limit Claude API"
# Lub w CLI:
python3 knowledge_base/retrieve.py "twoje pytanie" --k 5

# Statystyki bazy wiedzy
curl http://localhost:3000/api/stats
```

## ✅ Status

- ✅ Frontend portalu (14 modułów strony głównej) — **gotowe**
- ✅ Plan wdrożenia (roadmapa N1-N6) — **gotowe**
- ✅ Baza wiedzy / RAG (459 chunków, BM25, client-side search) — **gotowe**
- ✅ Wszystkie 3 strony zwracają HTTP 200, zero błędów JS
- ✅ Cloudflare Pages bundle: 109 KB Worker + 1.1 MB statycznych assetów
- ⏸️ Wdrożenie produkcyjne na Cloudflare Pages (gotowe do `npx wrangler pages deploy`)
- ⏸️ Backend WordPress (sesje N1-N6) — następne fazy

**Data ostatniej aktualizacji**: 25 maja 2026
