# Izbica24.pl — wdrożenie szaty graficznej v4

## Co zostało zrobione

Szata graficzna z Zendpad Design została przeniesiona **literalnie** i podłączona do warstwy danych portalu.

### 1. Szata graficzna 1:1
- `public/static/v4/izbica-v4.css` — **619 linii CSS wyekstrahowanych bez zmian** z `index.html` (linie 12–630). Zero modyfikacji: te same zmienne, kolory, typografia (Barlow Condensed / Barlow / Source Serif 4), siatki, breakpointy.
- `public/static/v4/izbica-v4-ext.css` — rozszerzenia **w osobnym pliku** (podstrony, mega-menu, poprawki integracyjne). Oryginał pozostaje nietknięty.
- `public/static/v4/izbica-v4.js` — skrypty z szaty (reveal-on-scroll z 4 safety nets, filtry, taby Kujawianki, smooth scroll) + nowe funkcje.
- 20 zdjęć w 3 formatach (AVIF 2,4 MB / WebP 3,3 MB / JPG 4,6 MB) w `public/static/img/v4/`.

### 2. Strona główna — wszystkie sekcje w oryginalnej kolejności
Hero (16:10 + „Najważniejsze dziś") → Na sygnale (3 duże + 4 średnie, czarny pas) → Wiadomości (filtry + 1 feat + 5 kart) → Split Kujawianka/Samorząd → Stats bar → Feature Wietrzychowice (21:9) → Kultura → Ludzie → Przegląd Mediów → Życie codzienne → Sołectwa → Multimedia → Ogłoszenia (12 kafli) → Footer premium.

**Kujawianka ma 5 klikalnych zakładek** zgodnie ze specyfikacją: Aktualności / Mecze / Tabela / Kadra / Junior — z pełną tabelą ligową, terminarzem, kadrą 23 zawodników i sztabem.

### 3. Belka górna — funkcja, o którą prosiłeś
Zamiast samej listy podkategorii, każda kategoria ma **mega-panel**:
- lewa kolumna — klikalne podkategorie z licznikami,
- prawa kolumna — **4 karty artykułów (zdjęcie + tytuł + zajawka), które automatycznie rotują co 4 s**; aktywna karta staje się wiodącą (większa),
- kropki nawigacyjne + pauza rotacji przy najechaniu,
- przełączanie podkategorii podmienia zestaw kart.

Zweryfikowane testem automatycznym: rotacja zmienia materiał, kliknięcie podkategorii przełącza panel.

### 4. Widoki podstron (wszystkie w szacie)
| Widok | Ścieżka |
|---|---|
| Kategoria (+ kafle podkategorii ze zdjęciami) | `/wiadomosci` |
| Podkategoria | `/na-sygnale/pozary` |
| 3. poziom taksonomii | `/kultura/parafie/blenna` |
| Artykuł | `/wiadomosci/inwestycje/{slug}` |
| Galeria (lightbox: klawiatura, licznik) | `/multimedia/galerie/kultura/dni-izbicy-2025` |
| Sołectwa (34) + pojedyncze | `/solectwa`, `/solectwa/pasieka` |
| Tag, wyszukiwarka | `/tag/osp`, `/szukaj?q=` |

### 5. Taksonomia — kompletna wg specyfikacji
12 kategorii głównych, **67 podkategorii, 12 pozycji 3. poziomu** (parafie, wideo, podcast, galerie), 34 sołectwa jako tagi.

### 6. Widok artykułu — wszystkie typy materiałów
Renderuje 13 typów bloków: akapit, nagłówek, lista (num./wypunktowana), cytat, zdjęcie z podpisem, **galeria**, **wideo** (plik lub YouTube), **audio z odtwarzaczem**, embed, **plik do pobrania (PDF)**, tabela, ramka informacyjna.

Dodatkowo: pasek narzędzi (udostępnij / drukuj / A+ / A−), pasek postępu czytania, sekcja komentarzy z formularzem, box autora, powiązane materiały, sidebar (najczęściej czytane, więcej z kategorii, newsletter), **oznaczenie materiałów AI** — zgodnie z wymogiem ze stopki.

Typy treści obsłużone w modelu: `article`, `gallery`, `video`, `audio`, `live` (Na sygnale), `media-review`, `announcement`, `event`, `infographic`.

### 7. Naprawione błędy, które istniały w projekcie
Potwierdziłem testem (przez `git stash`), że **przed moimi zmianami** 8 stron zwracało 500/404: `/rodo`, `/o-portalu`, `/telefony`, `/dolacz`, `/faq`, `/pomoc`, `/mapa-strony`, `/linki`, `/sponsorzy`, `/dostepnosc`. Wszystkie odbudowane w szacie v4 z rzeczywistą treścią (RODO z tabelą podstaw prawnych, telefony alarmowe, FAQ, deklaracja dostępności WCAG). Dodane: `/newsletter`, `/mapa-gminy`, `/ogloszenia/dodaj` (formularz), `favicon.ico`.

**Konsola przeglądarki: 0 błędów** (było 7).

### 8. Usunięty martwy kod
W trakcie pracy w repo pojawiła się druga, równoległa implementacja warstwy danych (`content.ts`, `content-2.ts`, `data-site.ts`, `data-kujawianka.ts`, `repo.ts` — 180 kB). Zweryfikowałem, że **żaden plik ich nie importuje**, i usunąłem. Została jedna warstwa: `taxonomy.ts` + `content-types.ts` + `content-db.ts`.

## Architektura

```
src/v4/
├── taxonomy.ts        12 kategorii, 67 podkategorii, 34 sołectwa
├── content-types.ts   modele: Article, ContentBlock, MediaAsset, Gallery
├── content-db.ts      treści + API zapytań (byCategory, related, search…)
├── renderer.tsx       <head> zgodny z szatą + OG/Twitter
├── router.tsx         trasy publiczne (3 poziomy taksonomii)
├── info-routes.tsx    strony informacyjne i formularze
├── components/Layout  Topbar, Header+MegaNav, Breaking, Footer, Shell
└── pages/             Home, Category, Article, Misc, Info
```

Warstwa zapytań ma sygnatury gotowe pod D1 — podmiana źródła nie wymusi zmian w komponentach.

## Uruchomienie
```bash
npm run build && pm2 start ecosystem.config.cjs
curl http://localhost:3000
```
Starsze wersje do porównania: `/v3`, `/v2`, `/archiwum/*`.

## Co pozostaje do zrobienia

1. **Panel redakcyjny (back-end)** — CRUD artykułów, upload mediów do R2, kreator galerii, publikacja/harmonogram. Modele danych (`ContentBlock`, `MediaAsset`, `Gallery`) są już zaprojektowane pod ten edytor — to następny krok.
2. **Migracja treści do D1** — zastąpienie `content-db.ts` zapytaniami SQL (API zapytań już ma docelowe sygnatury).
3. **Podłączenie API** — formularze (newsletter, komentarze, ogłoszenia) mają `action`, brakuje handlerów zapisujących do bazy.
4. **Sekcje z widokami specjalnymi** — Kujawianka jako pełna podstrona klubu, kalendarz wydarzeń, katalog firm.

## Uwaga o zdjęciach
Wygenerowano warianty AVIF/WebP (−48% transferu), ale komponent `<picture>` **nie jest jeszcze podłączony** — serwowane są JPG. To szybka optymalizacja do wdrożenia przy następnej iteracji.
