# izbica24.pl — portal informacyjny gminy Izbica Kujawska (v4)

## Przegląd projektu
- **Nazwa**: izbica24.pl (`izbica24-portal`)
- **Cel**: społeczno-lokalny portal informacyjny gminy Izbica Kujawska (5 400 mieszkańców, 34 sołectwa, 147 km², powiat włocławski)
- **Szata graficzna v4**: wdrożona **literalnie 1:1** z dostarczonego mockupu `index.html` (styl TVN24) — CSS przeniesiony bez modyfikacji, markup odtworzony element po elemencie
- **Stack**: Hono 4 + JSX SSR + Cloudflare Pages/Workers, Vite 6, Wrangler 4

## Status wdrożenia v4

### ✅ Zrobione
**Szata graficzna (1:1 z mockupu)**
- `public/static/v4/izbica-v4.css` — CSS przeniesiony literalnie z mockupu (linie 12–630), + `izbica-v4-ext.css` (widoki dodatkowe)
- `public/static/v4/izbica-v4.js` — przeniesione zachowania: reveal observer (4 zabezpieczenia), filtry `.news-filter` / `.mm-filter`, zakładki `.k-tab`, smooth scroll, mobile menu, rotator mega-menu
- Fonty: Barlow Condensed + Barlow + Source Serif 4 (jak w mockupie)
- 20 zdjęć + warianty `.webp` i `.avif` (60 plików) w `public/static/img/v4/`

**Weryfikacja parytetu z mockupem** (element po elemencie, HTML render vs mockup):
`hero-side-item 4/4 · sygnale-big 6/6 · sygnale-md 8/8 · news-filter 9/9 · news-card 10/10 · news-feat 2/2 · k-tab 12/12 · k-panel 5/5 · stat 4/4 · cult-card 6/6 · portrait-card 3/3 · media-card 14/14 · zycie-card 16/16 · sstat 3/3 · mm-filter 9/9 · pc-ep 13/13 · footer-col 4/4` — **wszystkie zgodne**

**Wszystkie 16 sekcji strony głównej w oryginalnej kolejności**: topbar → header → nav → breaking ticker → hero grid → Na sygnale → Wiadomości → split (Kujawianka + Samorząd) → stats bar → feature Wietrzychowice → Kultura → Ludzie → Przegląd mediów → Życie codzienne → Sołectwa → Multimedia → Ogłoszenia → footer

**Rozszerzenie belki górnej (mega-menu) — zgodnie z życzeniem**
- Kliknięcie/hover kategorii głównej → panel z listą podkategorii (lewa kolumna) **+ karty artykułów** (prawa kolumna)
- Dla **każdej z 67 podkategorii dokładnie 4 karty**: zdjęcie + tytuł + krótka zajawka + data + czas czytania
- Karty rotują automatycznie co 4 s, z kropkami nawigacyjnymi; przełączenie podkategorii zmienia zestaw kart
- Automatyczne dopełnianie do 4 kart (pula kategorii → pula całego portalu), tag każdej karty odpowiada faktycznej podkategorii materiału

**Warstwa danych** (`src/v4/`)
- `taxonomy.ts` — 12 kategorii głównych, 67 podkategorii, 3. poziom (`kultura/parafie/*`, `multimedia/wideo|podcast|galerie/*`), 34 sołectwa
- `content-types.ts` — model treści: `ContentType` (article/gallery/video/audio/live/media-review/announcement/event/infographic), `ContentBlock` (paragraph/heading/list/quote/image/gallery/video/audio/embed/file/table/info), `MediaAsset`, `Gallery`, `Author`
- `content-db.ts` — **58 materiałów demo**, 3 galerie, 24 zasoby medialne, 4 autorzy + selektory zapytań
- `data-kujawianka.ts` — dane 5 zakładek (ostatni mecz, tabela mini/pełna, strzelcy, terminarz, kadra 23 os., junior)
- `data-site.ts` — topbar, header, filtry, karta samorządu, statystyki, sołectwa, kafle ogłoszeń, stopka

**Widoki (wszystkie działają, HTTP 200)**
| Widok | Trasa | Status |
|---|---|---|
| Strona główna | `/` | ✅ |
| Kategoria (12) | `/wiadomosci`, `/na-sygnale`, `/samorzad`, `/kujawianka`, `/kultura`, `/historia`, `/ludzie`, `/zycie-codzienne`, `/przeglad-mediow`, `/multimedia`, `/ogloszenia` | ✅ |
| Podkategoria (67) | `/wiadomosci/inwestycje`, `/na-sygnale/pozary`, `/kujawianka/tabela`, … | ✅ |
| 3. poziom | `/kultura/parafie/blenna`, `/multimedia/wideo/reportaze`, … | ✅ |
| Artykuł | `/wiadomosci/inwestycje/remont-ulicy-koscielnej-zakonczony` | ✅ |
| Galeria | `/multimedia/galerie/:sekcja/:slug` | ✅ |
| Sołectwa | `/solectwa`, `/solectwa/sadlno` (34) | ✅ |
| Tag | `/tag/:tag` | ✅ |
| Szukaj | `/szukaj?q=` | ✅ |
| 404 | dowolna nieistniejąca | ✅ |

**Back-end / panel redakcji** (`/admin`)
`/admin` (dashboard) · `/admin/articles` · `/admin/articles/new` · `/admin/articles/:id/edit` · `/admin/media` · `/admin/ogloszenia` · `/admin/comments` · `/admin/users` · `/admin/settings` — wszystkie 200

### ⏳ Do zrobienia (kolejna faza)
- Podłączenie panelu redakcji do **trwałego zapisu w D1** (obecnie widoki + formularze; dane demo w TS)
- Migracje D1 dla modelu v4 + seed z `content-db.ts`; binding D1 w `wrangler.jsonc`
- Upload plików do R2 (zdjęcia, audio, wideo, dokumenty) z panelu
- Workflow publikacji (szkic → recenzja → publikacja) z rolami redakcyjnymi
- Odtworzenie logiki funkcjonalnej z dokumentów „Sesja N1–N6”
- Wdrożenie produkcyjne na Cloudflare Pages

## Architektura danych
- **Model treści**: `Article` z blokami `ContentBlock` (union dyskryminowany) — obsługa tekstu, zdjęć, galerii, wideo, audio, embedów, plików, tabel i ramek informacyjnych
- **Typy materiałów**: artykuł, galeria, wideo, audio/podcast, relacja live, przegląd mediów, ogłoszenie, wydarzenie, infografika
- **Docelowo**: Cloudflare D1 (treść, relacje), KV (cache, konfiguracja — 15 namespace'ów gotowych), R2 (media)

### Źródło treści — stan zmierzony 2026-07-28

Wcześniejsza wersja tego pliku podawała, że treść pochodzi z modułów TypeScript
„bez zapytań do bazy". To już nie jest prawda i było źródłem błędnych wniosków
(m.in. pozycja 1 w `TODO-590-AUDYT.md`). Stan faktyczny, ustalony przez odpytanie
tras i bazy, a nie przez czytanie kodu:

| Obszar | Źródło | Dowód |
|---|---|---|
| Strony portalu v4 (`/`, kategorie, artykuły) | ✅ **D1** | `src/v4/content-source.ts` → `loadSnapshot(c)`, 2 zapytania na żądanie |
| `GET /api/v1/articles`, `/articles/:slug` | ✅ **D1** | odpowiedź zgodna z `SELECT` z tabeli `articles` (30 wierszy `published`) |
| `/sitemap.xml`, `/news-sitemap.xml`, `/rss.xml` | ✅ **D1** | 45/45 adresów sitemapy = HTTP 200, 20/20 odnośników RSS = 200 |
| JSON-LD na stronie artykułu | ✅ **D1** | 3 bloki `application/ld+json` (`NewsArticle`, `BreadcrumbList`, `NewsMediaOrganization`) |
| `/api/search/*` (autocomplete, podpowiedzi, autorzy, tagi) | ❌ **mock** | zwraca tytuł z `data-articles.ts` („…— droga oddana mieszkańcom"), którego w D1 nie ma |
| `/api/rag/*` (3 miejsca) | ❌ **mock** | `ARTICLES` w `src/routes/rag.ts` |
| Widoki archiwalne `/v3`, `/v2` | ❌ **mock** | świadomie — to zamrożone porównanie szat graficznych |
| `buildArticleJsonLd` (stara wersja) | ⚠️ martwy kod | wołany wyłącznie przez test; portal używa `buildNewsArticleJsonLd` |

**Do zrobienia**: przeniesienie `/api/search/*` i `/api/rag/*` na D1 (tabele FTS
`articles_fts` już istnieją — migracje 0005, 0034, 0048, 0054, 0056).

## Uruchomienie lokalne
```bash
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000
```

## Wdrożenie
- **Platforma**: Cloudflare Pages
- **Status**: 🟡 gotowe do wdrożenia (weryfikacja lokalna zakończona)
- **Stack**: Hono + TypeScript + JSX SSR + CSS 1:1 z mockupu
- **Weryfikacja**: build ✅ (`dist/_worker.js` 977 kB) · 155 testów ✅ · 45/45 adresów sitemapy = 200
- **Kontrola typów**: `npm run lint` — 136 błędów, próg zapadkowy (może iść tylko w dół)
- **Ostatnia aktualizacja**: 2026-07-28
