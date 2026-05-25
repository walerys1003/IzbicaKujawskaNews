# izbica24.pl — Portal Gminy Izbica Kujawska

**Działający prototyp** kompletnego portalu informacyjnego z silnikiem AI-newsroom + baza wiedzy projektu (RAG).

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

### 3. Szata graficzna portalu (PRIORYTET)
Implementacja **1:1 wg specyfikacji UI/UX** z dostarczonych dokumentów:

#### 14 modułów strony głównej:
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
