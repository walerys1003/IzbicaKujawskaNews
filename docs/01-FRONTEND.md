# 01 — FRONT-END: audyt szczegółowy i plan prac

> **Stan realizacji: front publiczny 88% · panel admina 35%**

---

## CZĘŚĆ A — CO JEST ZREALIZOWANE

### A1. Szata graficzna — 100%, potwierdzona 1:1

| Element | Źródło | Stan |
|---|---|---|
| CSS bazowy | `izbica-v4.css` — linie 12–630 mockupu, bez modyfikacji | ✅ 47 kB |
| CSS widoków dodatkowych | `izbica-v4-ext.css` | ✅ 30 kB |
| JS zachowań | `izbica-v4.js` | ✅ 15 kB |
| Fonty | Barlow Condensed + Barlow + Source Serif 4 | ✅ identyczne z mockupem |
| Zmienne CSS | `--red:#d6121a`, `--c-news`, `--c-sygnale`, … 11 kolorów kategorii | ✅ 1:1 |
| Obrazy | 20 jpg + 20 webp + 20 avif | ✅ 60 plików |

**Weryfikacja parytetu** (liczba wystąpień klasy w mockupie vs w renderowanym HTML) — 17/17 grup zgodnych:

```
hero-side-item 4/4 · sygnale-big 6/6 · sygnale-md 8/8 · news-filter 9/9
news-card 10/10 · news-feat 2/2 · k-tab 12/12 · k-panel 5/5 · stat 4/4
cult-card 6/6 · portrait-card 3/3 · media-card 14/14 · zycie-card 16/16
sstat 3/3 · mm-filter 9/9 · pc-ep 13/13 · footer-col 4/4
```

### A2. Sekcje strony głównej — 16/16 w oryginalnej kolejności

topbar → header → nav → breaking ticker → hero grid → Na sygnale → Wiadomości → split (Kujawianka + Samorząd) → stats bar → feature Wietrzychowice → Kultura → Ludzie → Przegląd mediów → Życie codzienne → Sołectwa → Multimedia → Ogłoszenia → footer

### A3. Widoki publiczne — 88 tras, wszystkie HTTP 200

| Widok | Trasa | Plik |
|---|---|---|
| Strona główna | `/` | `src/v4/pages/Home.tsx` (1017 LOC) |
| Kategoria × 11 | `/wiadomosci` … `/ogloszenia` | `Category.tsx` |
| Podkategoria × 67 | `/wiadomosci/inwestycje` … | `Category.tsx` |
| Trzeci poziom × 12 | `/kultura/parafie/blenna`, `/multimedia/wideo/reportaze` | `Category.tsx` |
| Artykuł × 58 | `/{kat}/{podkat}/{slug}` | `Article.tsx` (609 LOC) |
| Galeria | `/multimedia/galerie/:sekcja/:slug` | `Article.tsx` |
| Sołectwa | `/solectwa` + 34 | `Misc.tsx` |
| Tag / Szukaj / 404 | `/tag/:tag`, `/szukaj?q=`, catch-all | `Misc.tsx` |

### A4. Mega-menu z rotującymi kartami — zrealizowane w pełni

Weryfikacja: **67 podkategorii × 4 karty × 4 kropki, 0 braków.**

- Lewa kolumna: lista podkategorii z licznikiem materiałów
- Prawa kolumna: 4 karty (zdjęcie + tytuł + zajawka + data + czas czytania)
- Automatyczna rotacja co 4 s + kropki nawigacyjne
- Przełączenie podkategorii zmienia zestaw kart
- Dopełnianie rotacyjne (pula kategorii → pula portalu) — karta nigdy nie jest pusta
- Tag karty odpowiada faktycznej podkategorii materiału

### A5. Interakcje JS — przeniesione z mockupu

| Funkcja | Stan |
|---|---|
Reveal observer (4 zabezpieczenia: threshold 0.85, timeout 3000 ms, `beforeprint`, `prefers-reduced-motion`) | ✅
Filtry `.news-filter` (9) | ✅
Filtry `.mm-filter` (9) | ✅
Zakładki Kujawianki `.k-tab` (5 paneli) | ✅
Smooth scroll z offsetem nagłówka | ✅
Menu mobilne (burger) | ✅
Rotator mega-menu | ✅

### A6. Jakość techniczna — sprawdzona

| Metryka | Wynik |
|---|---|
Build | ✅ 629 kB, 276 modułów, 2,5 s
Błędy konsoli przeglądarki | ✅ **0**
Czas odpowiedzi `/` | 70 ms
Warianty obrazów | ✅ jpg/webp/avif (naprawione 40 brakujących plików)

---

## CZĘŚĆ B — CZEGO BRAKUJE (front publiczny)

### B1. Komponenty interaktywne — nie istnieją

| Brak | Opis | Priorytet |
|---|---|---|
**Komentarze** | Brak formularza, listy, wątkowania, moderacji, captcha | Wysoki |
**Lightbox galerii** | Galerie wyświetlają siatkę miniatur, brak powiększenia, nawigacji strzałkami, swipe | Wysoki |
**Odtwarzacz audio/podcast** | `.pc-player` to statyczny HTML — pasek postępu nie działa, brak play/pause, prędkości, zapamiętania pozycji | Wysoki |
**Odtwarzacz wideo** | Brak playera, brak HLS, brak napisów | Wysoki |
**Newsletter (formularz)** | Pole e-mail w stopce nie wysyła nic — brak walidacji, potwierdzenia, double opt-in | Wysoki |
**Wyszukiwanie z podpowiedziami** | `/szukaj` filtruje stałe w TS; brak autouzupełniania, podświetlania trafień, filtrów fasetowych | Średni |
**Paginacja / infinite scroll** | Kategorie mają `PER_PAGE=12`, ale brak kontrolek nawigacji stron w UI | Wysoki |
**Udostępnianie społecznościowe** | Brak przycisków share (FB, X, WhatsApp, kopiuj link) | Średni |
**Ciemny motyw** | Brak — mockup go nie miał, ale to standard 2026 | Niski |
**Powiadomienia push (UI)** | Brak prośby o zgodę, brak panelu preferencji | Niski |
**Kalendarz wydarzeń** | Typ `event` istnieje w modelu, brak widoku kalendarza | Średni |
**Mapa sołectw** | `.sol-map-col` to obszar tekstowy — brak interaktywnej mapy 34 sołectw | Średni |
**Ogłoszenia (dodawanie)** | `/ogloszenia/dodaj` — brak formularza | Wysoki |
**Relacje live** | Typ `live` istnieje, brak widoku strumienia aktualizacji z auto-odświeżaniem | Średni |

### B2. Responsywność — niezweryfikowana

Stan: **5 zapytań `@media` w każdym z dwóch plików CSS** (przeniesione z mockupu).

Czego nie sprawdziłem (i trzeba sprawdzić):
- Wygląd na 320 / 375 / 414 / 768 / 1024 / 1440 / 1920 px
- Zachowanie mega-menu na dotyku (panel z 4 kartami × 67 podkategorii to dużo DOM na telefonie)
- Poziome przewijanie filtrów na wąskich ekranach
- Tabela Kujawianki na telefonie
- Siatka 34 sołectw na telefonie

**Uwaga techniczna:** mega-menu renderuje **1139 kart** w HTML strony głównej. To ~150 kB dodatkowego DOM. Na telefonie to obciążenie — wymaga strategii (lazy loading paneli albo osobny mobilny szablon nawigacji).

### B3. Dostępność (a11y) — nieaudytowana

| Brak | Opis |
|---|---|
Audyt WCAG 2.2 AA | Nie wykonany |
Nawigacja klawiaturą | Mega-menu działa na `hover` — nieosiągalne z klawiatury |
Focus trap | Brak w menu mobilnym |
`aria-expanded` / `aria-controls` | Częściowo (burger ma, mega-menu nie) |
Kontrast | Nie zmierzony (czerwień `#d6121a` na białym wymaga sprawdzenia dla małych rozmiarów) |
Skip link | Brak „przejdź do treści" |
Etykiety formularzy | Częściowo (`aria-label` w wyszukiwarce jest) |
Czytnik ekranu | Nie testowany |

**Kontekst prawny:** portal gminny w Polsce podlega **ustawie o dostępności cyfrowej** (implementacja dyrektywy 2016/2102). To nie jest opcjonalne — wymagany jest WCAG 2.1 AA minimum oraz deklaracja dostępności. Trasa `/dostepnosc` istnieje, ale treść wymaga uzupełnienia po audycie.

### B4. Wydajność — nieoptymalizowana

| Problem | Stan | Działanie |
|---|---|---|
Rozmiar HTML strony głównej | ~237 kB (mega-menu = 150 kB) | Lazy loading paneli nawigacji |
Core Web Vitals | Nie zmierzone | Pomiar Lighthouse: LCP, INP, CLS |
Obrazy responsywne | Brak `srcset` z szerokościami (są tylko formaty) | Dodać warianty 480/768/1200/1600 px |
Krytyczny CSS | Cały CSS blokuje render (77 kB) | Inline critical CSS, resztę async |
Cache przeglądarki | `max-age=120` dla HTML | Strategia cache per typ treści |
Preload obrazu hero | Brak | `<link rel=preload>` dla obrazu LCP |

### B5. SEO — częściowo

| Element | Stan |
|---|---|
`<title>`, `description`, OG, Twitter Card | ✅ per widok |
Canonical | ✅ w artykułach |
RSS | ✅ `/rss.xml` 200 |
Manifest PWA | ✅ 200 |
**Schema.org JSON-LD** | ⚠️ do weryfikacji — wymagane `NewsArticle`, `BreadcrumbList`, `Organization`, `LocalBusiness` |
**Sitemap XML** | ⚠️ trasa istnieje, wymaga weryfikacji kompletności (88 URL-i) |
**News sitemap** | ⚠️ wymagany dla Google News |
**hreflang** | ❌ brak (jeśli planowana wersja EN) |
**Breadcrumbs w UI** | ⚠️ do weryfikacji na wszystkich poziomach |

### B6. Panel admina (front) — 35%, szkielet UI

Co jest: 9 widoków renderuje statyczny HTML z danymi zapisanymi na stałe w pliku `admin.tsx`.

| Brak | Opis |
|---|---|
**Edytor WYSIWYG** | `<textarea>` bez formatowania. Potrzebny edytor blokowy (nagłówki, listy, cytaty, obrazy, galerie, wideo, audio, embed, tabele, ramki info) — pełne pokrycie `ContentBlock` |
**Wgrywanie plików** | Brak drag & drop, podglądu, progresu, kadrowania |
**Biblioteka mediów** | Widok istnieje, ale bez siatki, filtrów, wyszukiwania, podglądu, metadanych |
**Kreator galerii** | Brak przeciągania kolejności, wyboru okładki, opisów zdjęć |
**Podgląd na żywo** | Brak „jak to będzie wyglądać" |
**Autozapis / wersje** | Brak (migracja `0013_articles_versions.sql` istnieje, UI nie) |
**Panel AI** | ❌ **Kluczowy brak** — 25 akcji AI w API, zero UI. Szczegóły: `06-AI.md` |
**Planowanie publikacji** | Brak wyboru daty/godziny |
**Kolejka moderacji** | Widok komentarzy statyczny |
**Statystyki** | Kafle z liczbami wpisanymi na stałe |
**Zarządzanie użytkownikami** | Widok statyczny, brak CRUD, brak przypisywania ról |
**Ustawienia** | Widok statyczny, nic nie zapisuje |

---

## CZĘŚĆ C — ETAPY PRAC (front-end)

### Etap F1 — Weryfikacja i zamknięcie tego, co jest *(2–3 dni)*

**F1.1** Audyt responsywności na 7 szerokościach (320–1920 px) — zrzuty ekranu wszystkich typów widoków, lista defektów
**F1.2** Strategia mega-menu na urządzenia mobilne — decyzja: lazy loading paneli czy osobny szablon nawigacji
**F1.3** Naprawa nawigacji klawiaturą w mega-menu (`hover` → `focus-within` + obsługa Escape/strzałek)
**F1.4** Skip link + `aria-expanded`/`aria-controls` w całej nawigacji
**F1.5** Pomiar Lighthouse (mobile + desktop), zapis wyników bazowych

Kryterium odbioru: brak defektów układu na 7 szerokościach; mega-menu w pełni obsługiwalne z klawiatury; Lighthouse a11y ≥ 90.

### Etap F2 — Komponenty interaktywne — priorytet wysoki *(5–7 dni)*

**F2.1** Lightbox galerii (klawiatura, swipe, licznik, podpisy, preload sąsiednich)
**F2.2** Odtwarzacz audio/podcast (play/pause, przewijanie, prędkość 0,75–2×, zapamiętanie pozycji w `localStorage`, Media Session API)
**F2.3** Odtwarzacz wideo (HTML5 + HLS dla strumieniowania, plakat, napisy WebVTT)
**F2.4** Paginacja w widokach kategorii i podkategorii (numery stron + „poprzednia/następna", `rel=prev/next`)
**F2.5** Formularz newslettera (walidacja, stany, obsługa błędów, komunikat o double opt-in)
**F2.6** Formularz komentarzy (walidacja, honeypot + Turnstile, stany optymistyczne)
**F2.7** Lista komentarzy (wątkowanie 2 poziomy, sortowanie, zgłaszanie, doładowywanie)
**F2.8** Formularz dodawania ogłoszenia (kategoria, treść, zdjęcia, kontakt, regulamin)
**F2.9** Przyciski udostępniania (Web Share API + fallback)

Kryterium odbioru: każdy komponent działa bez błędów konsoli, obsługiwalny z klawiatury, testowany na telefonie.

### Etap F3 — Widoki specjalistyczne *(4–5 dni)*

**F3.1** Interaktywna mapa 34 sołectw (SVG z podświetlaniem, powiązanie z artykułami)
**F3.2** Kalendarz wydarzeń (widok miesiąca/listy, filtry, eksport iCal)
**F3.3** Widok relacji live (strumień aktualizacji, auto-odświeżanie, znaczniki czasu, przypięte podsumowanie)
**F3.4** Wyszukiwanie zaawansowane (autouzupełnianie, podświetlanie trafień, filtry: kategoria/data/typ/autor/sołectwo)
**F3.5** Strona autora (biogram, materiały, statystyki)
**F3.6** Widok infografiki (powiększanie, pobieranie)

### Etap F4 — Panel redakcji: edytor *(7–10 dni)*

**F4.1** Edytor blokowy — wszystkie typy `ContentBlock`: akapit, nagłówek, lista, cytat, obraz, galeria, wideo, audio, embed, plik, tabela, ramka info
**F4.2** Pasek narzędzi + skróty klawiszowe + tryb pełnoekranowy + licznik słów/czasu czytania
**F4.3** Wgrywanie mediów (drag & drop, wielokrotne, progres, kadrowanie, alt-text)
**F4.4** Biblioteka mediów (siatka/lista, filtry po typie, wyszukiwanie, metadane, gdzie użyte)
**F4.5** Kreator galerii (przeciąganie kolejności, okładka, podpisy zbiorczo)
**F4.6** Autozapis co 30 s + historia wersji z porównaniem różnic
**F4.7** Podgląd na żywo (obok edytora, przełączanie desktop/mobile)
**F4.8** **Panel AI w edytorze** → szczegółowa specyfikacja w `06-AI.md`

### Etap F5 — Panel redakcji: pozostałe widoki *(4–5 dni)*

**F5.1** Lista artykułów (filtry, sortowanie, akcje zbiorcze, paginacja, statusy)
**F5.2** Kolejka moderacji komentarzy (akceptuj/odrzuć/oznacz, akcje zbiorcze, ocena AI)
**F5.3** CRUD użytkowników + przypisywanie ról
**F5.4** Panel ogłoszeń (weryfikacja, publikacja, wygaśnięcie)
**F5.5** Panel newslettera (kreator, segmenty, planowanie, statystyki wysyłek)
**F5.6** Ustawienia (dane portalu, kategorie, klucze API, przełączniki funkcji)
**F5.7** Dashboard z realnymi statystykami z bazy

### Etap F6 — Dostępność i wydajność *(3–4 dni)*

**F6.1** Pełny audyt WCAG 2.2 AA + naprawa defektów
**F6.2** Test czytnikiem ekranu (NVDA/VoiceOver) na kluczowych ścieżkach
**F6.3** Uzupełnienie deklaracji dostępności `/dostepnosc`
**F6.4** Obrazy responsywne `srcset` (480/768/1200/1600 px)
**F6.5** Inline critical CSS + async resztę
**F6.6** Preload obrazu LCP, optymalizacja Core Web Vitals
**F6.7** Lazy loading paneli mega-menu (redukcja HTML z 237 kB)

### Etap F7 — SEO i dane strukturalne *(2 dni)*

**F7.1** JSON-LD: `NewsArticle`, `BreadcrumbList`, `Organization`, `LocalBusiness`, `Event`, `VideoObject`, `PodcastEpisode`
**F7.2** Weryfikacja kompletności sitemap (88 URL-i) + news sitemap
**F7.3** Breadcrumbs w UI na wszystkich poziomach
**F7.4** Walidacja w Google Rich Results Test

---

## Szacunek pracy — front-end

| Etap | Dni |
|---|---|
F1 Weryfikacja i zamknięcie | 2–3 |
F2 Komponenty interaktywne | 5–7 |
F3 Widoki specjalistyczne | 4–5 |
F4 Edytor | 7–10 |
F5 Panel — pozostałe | 4–5 |
F6 A11y + wydajność | 3–4 |
F7 SEO | 2 |
**Razem** | **27–36 dni** |

**Zależność krytyczna:** etapy F4 i F5 wymagają działającego back-endu i bazy (dokumenty `02` i `03`). Bez nich powstanie kolejny szkielet UI, który nic nie zapisuje.
