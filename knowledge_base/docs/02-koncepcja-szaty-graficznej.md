## izbica24.pl — Pełna koncepcja szaty graficznej

https://www.reuters.com/

### FILOZOFIA PROJEKTOWA
Strona ma jedno zadanie: sprawić żeby mieszkaniec Izbicy otwierał ją rano z kawą zamiast Facebooka. Każdy element projektu podporządkowany jest tej zasadzie. Nie budujemy "ładnej strony" — budujemy nawyk.
Reuters daje strukturę i powagę. Le Monde daje typograficzny charakter. Ale trzecia inspiracja jest najważniejsza i najmniej oczywista: stara lokalna gazeta papierowa — ta którą dziadek kładł na stole w kuchni. Ciepło papieru, hierarchia ważności, poczucie że ktoś to dla ciebie ułożył. To jest emocja którą chcemy wywołać u mieszkańca Izbicy, tylko w cyfrowym opakowaniu klasy światowej.

### PALETA I ATMOSFERA
Tło nie jest białe — jest kremowo-papierowe (#faf9f6), lekko ciepłe, jak papier gazetowy z lat 90. Nagłówki i tekst nie są czarne — są głęboko grafitowe (#0a0a0a), co daje cieplejszy odbiór na ekranie. Główny akcent to głęboka czerwień (#c0392b) — kolor alarmu, pilności, krwi w żyłach lokalnej prasy. Używana oszczędnie: etykiety kategorii, linia pod logiem, breaking bar, "NA SYGNALE".
Każda główna kategoria ma swój pomocniczy kolor — używany tylko do akcentów, nie jako tło całych sekcji:
Samorząd → granat (#1a3a5c)
Kujawianka → zieleń boiska (#1e7a4f)
Historia → złoto sepii (#b8860b)
Na Sygnale → ostra czerwień (#e74c3c)
Kultura → burgund (#7b2d8b)
Przegląd Mediów → stalowy niebieski (#2563a8)
Ogłoszenia → ciemny szary (#333)
Sekcja Historii ma subtelną teksturę tła — delikatny szum ziarna, jak zeskanowany papier. Reszta strony jest czysta.

### TYPOGRAFIA
Playfair Display — dla wszystkich nagłówków artykułów i tytułu portalu. Szeryfowy, elegancki, prasowy, rozpoznawalny. W wersji 900 (black) dla hero, 700 dla sekcji, 400 dla podtytułów.
Source Serif 4 — dla leadów, treści artykułów, opisów. Bardzo czytelna na ekranie w każdym rozmiarze, lekko literacka.
DM Sans — dla całego UI: etykiety kategorii, daty, przyciski, menu, liczniki, ticki. Nowoczesny sans-serif kontrastujący z szeryfami — tworzy napięcie między "gazetą" a "portalem".
Hierarchia typograficzna jest rygorystyczna i nigdy nie jest łamana:
Tytuł hero: Playfair 42px / line-height 1.15
Tytuł sekcja duża: Playfair 28px
Tytuł kafelek mały: Playfair 18px
Lead: Source Serif 17px / line-height 1.7 / kolor #2c2c2c
Etykieta kategorii: DM Sans 11px / letter-spacing 0.12em / uppercase / bold / kolor kategorii
Data i autor: DM Sans 12px / kolor #999
Menu: DM Sans 13px / letter-spacing 0.05em

### BELKA INFORMACYJNA (super-header)
Cienka, 36px wysokości, tło #0a0a0a. Trzy strefy:
Lewa: Dziś jest [dzień tygodnia], [data] — DM Sans 12px, kolor #aaa.
Środek: Ikona pogody SVG + temperatura + "Izbica Kujawska" — ściągane z API pogodowego.
Prawa: "📧 Newsletter tygodniowy" — klik otwiera inline rozwijany formularz (pole e-mail + "Zapisz się") bez przeładowania strony.
Ta belka nie scrolluje — znika po 80px scrollowania z płynnym fade-out. Wraca gdy user scrolluje do góry.

### NAWIGACJA GŁÓWNA
Wysokość 72px. Tło kremowe, identyczne z body — brak ciężkiego paska. Oddziela ją od reszty strony tylko pozioma linia 3px w kolorze akcentu.
Logo "izbica24" — po lewej. Playfair Display Black 32px. Czarne. Dolne "24" w czerwieni. Żadnego logo-grafiki — sama typografia jest logiem. Pod spodem mikroskopijny napis "Portal Gminy Izbica Kujawska" DM Sans 10px, muted.
Menu — 12 pozycji. DM Sans 13px uppercase. Przy hoverze kolor danej kategorii pojawia się jako podkreślenie 2px. Każda pozycja ma dropdown z podkategoriami — pojawiają się z delikatnym fade + translate(0, -4px), nie skaczą.
Prawa część nawigacji: ikona lupy (wyszukiwarka), ikona dzwonka (powiadomienia — na przyszłość), przycisk "Ogłoś" w kolorze akcentu (CTA do dodawania ogłoszeń płatnych).
Przy scrollu: nawigacja "klei się" do góry z cienkim box-shadow. Super-header chowa się. Nawigacja staje się nieco węższa (56px) z płynną animacją.

### MODUŁ 1 — HERO
Najważniejszy moduł. Zajmuje całą szerokość viewportu minus sidebar. Układ asymetryczny.
Główny artykuł (55% szerokości): Pełne zdjęcie w proporcji 16:9, bez ramki, wychodzące do krawędzi modułu. Nad zdjęciem w lewym górnym rogu: etykieta kategorii (czerwona, DM Sans uppercase). Na zdjęciu, w dolnej tercji — gradient czarny od dołu, na nim: Playfair 42px tytuł w bieli. Poniżej zdjęcia (na kremowym tle): lead 2 zdania, potem "Czytaj dalej →" i dane autora + czas.
Kolumna środkowa (25%): Nagłówek sekcji: czerwona pionowa kreska 3px + "NAJWAŻNIEJSZE" DM Sans uppercase 11px. Poniżej 4 artykuły pionowo. Każdy: miniatura 80×60px po lewej, obok etykieta kategorii + tytuł Playfair 16px + data. Oddzielone poziomą linią #e0dbd3.
Prawa kolumna — NA SYGNALE (20%): Tło głębokiej czerwieni (#c0392b). Białe napisy. Nagłówek: "🚨 NA SYGNALE" DM Sans bold uppercase. Poniżej 5 ostatnich zdarzeń: każde ma godzinę (DM Sans mono bold, bardzo widoczna), typ zdarzenia ikoną (🚒🚑🚔), jednozdaniowy opis. Między zdarzeniami cienka linia rgba(255,255,255,0.2). Na dole: "Wszystkie zdarzenia →" link w bieli.
Ta kolumna jest żywa — powinna mieć subtelny puls lub wskaźnik "LIVE" jeśli ostatnie zdarzenie jest z ostatnich 2 godzin.

### MODUŁ 2 — BREAKING BAR
Pełna szerokość. Tło #0a0a0a. Lewa strona: "PILNE" na czerwonym tle, uppercase bold. Prawa: scrollujący ticker z nagłówkami — nie agresywny, ale wyraźny. Prędkość scrollu: 40px/s. Przy hoverze zatrzymuje się. Kliknięcie przenosi do artykułu.
Pojawia się tylko gdy jest co najmniej 1 artykuł z ostatnich 6 godzin oznaczony jako "pilne". Jeśli nie ma — moduł znika i strona nie ma "dziury".

### MODUŁ 3 — WIADOMOŚCI GŁÓWNE
Pełny tytuł sekcji: pionowa czerwona kreska + "WIADOMOŚCI" DM Sans uppercase + "— Gmina Izbica Kujawska" muted + "Wszystkie →" po prawej stronie na tej samej linii.
Układ: jeden duży artykuł po lewej (40%) z pełnym zdjęciem + Playfair 26px + lead + 3 podkategorie jako tagi. Po prawej (60%): dwie kolumny po 3 artykuły — tylko miniatura + etykieta podkategorii + Playfair 17px tytuł + data. Siatka z wyraźnymi odstępami, bez ciasnych granic.
Pod całym modułem: poziomy pasek podkategorii Wiadomości — 7 clickable tagów: Inwestycje | Edukacja | Zdrowie | Społeczne | Komunikaty | Środowisko | Rolnictwo. Przy kliknięciu filtruje artykuły na bieżąco bez przeładowania.

### MODUŁ 4 — NA SYGNALE (rozwinięty)
Tu NA SYGNALE dostaje pełny moduł — nie tylko sidebar. Tło lekko szare (#f0ece4), lewa bordura 6px czerwona.
Lewy blok (60%): ostatni duży incydent — zdjęcie (jeśli jest), Playfair 24px, lead, godzina, kategoria (Pożary / Wypadki / Policja / Interwencje / Awarie).
Prawy blok (40%): lista 6 wcześniejszych zdarzeń — format "timeline": pionowa linia czasu z godzinami po lewej (DM Sans mono bold czerwony), ikoną służb, jednozdaniowym opisem. Ostatnie zdarzenie ma pulsującą czerwoną kropkę przy godzinie — sygnał "live".

### MODUŁ 5 — KUJAWIANKA FC
Pełna szerokość. Tło #0d2137 — głęboki granat nocnego boiska. Żółte i białe akcenty.
Trzy strefy w poziomie:
Strefa wynik (30%): Centralnie: "KUJAWIANKA IZBICA" - duże cyfry wyniku - "RYWAL FC". Pod spodem: data meczu, runda, liga. Jeśli mecz jutro: odliczanie do meczu. Jeśli mecz live: pulsujące "TRWA" na czerwono.
Strefa tabela (40%): Skrócona tabela ligowa — top 8, Kujawianka wyróżniona złotą linią. Kolumny: M W R P Pkt. DM Sans 12px, mono dla cyfr.
Strefa artykuły (30%): 2 najnowsze artykuły sportowe — białe karty na granatowym tle. Miniatura + tytuł + data. Na dole: "Klasyfikacja strzelców" — top 3 z liczbą goli.

### MODUŁ 6 — SAMORZĄD + PRZEGLĄD MEDIÓW
Dwie kolumny oddzielone pionową linią.
SAMORZĄD (58%): Etykieta z granatem. 3 artykuły w formacie horyzontalnym (miniatura + treść obok). Każdy artykuł ma podkategorię (Urząd Miejski / Rada / Budżet / Sołectwa / Powiat) jako kolorowy tag. Ostatni artykuł ma dłuższy lead — bo sprawy samorządowe wymagają kontekstu.
Pod artykułami: "🏛️ Następna sesja Rady Miejskiej: [data]" — mały baner z kalendarzem, link do porządku obrad.
PRZEGLĄD MEDIÓW (42%): Etykieta z niebieskim. Nagłówek: "CO PISZĄ O IZBICY" + mały dopisek "(opracowanie AI, weryfikacja redakcji)".
5 wpisów. Każdy wpis: logo źródła (DDWłocławek, NWłocławek, Gazeta Pomorska, TVP3, Radio Kujawy) + tytuł Playfair 16px + 1 zdanie streszczenia AI + "czytaj w źródle →" link. Przy każdym wpisie mała ikonka AI ✦ i data opracowania.
Tło tego bloku lekko inne — #f0f4f8, chłodniejsze, żeby odróżnić treść redakcyjną od agregowanej.

### MODUŁ 7 — KULTURA & HISTORIA (dwie kolumny równe)
KULTURA (50%): Jeden duży artykuł z pełnym zdjęciem — konferencja, spektakl, wernisaż, festyn. Poniżej: "NAJBLIŻSZE WYDARZENIA" — mini kalendarz 3 wydarzeń z datą w formacie "14 cze" w boxie, nazwą i miejscem. Na dole link do MGCK.
HISTORIA (50%): Tło tej kolumny ma subtelną teksturę (szum 2% opacity) — lekko stary papier. Złote akcenty. Nagłówek: "TEGO DNIA W IZBICY" + podzagłówek "Historia lokalna".
Jeden artykuł historyczny: sepia-toned miniatura (filtr CSS, nie prawdziwe zdjęcie sepia), Playfair italic 22px tytuł, krótki lead. Pod spodem: "Z ARCHIWUM" — 2 mniejsze artykuły historyczne w formacie listy.

### MODUŁ 8 — LUDZIE IZBICY
Pełna szerokość, kremowe tło z poziomą linią na górze. Nagłówek: "LUDZIE" + podtytuł "Mieszkańcy, którzy tworzą gminę".
Układ horyzontalny — 4 karty obok siebie. Każda karta: kwadratowe zdjęcie osoby (proporcja 1:1, lekko zaokrąglone), imię i nazwisko bold, krótki opis kim jest (2 słowa: "strażak OSP", "nauczycielka", "sołtys Pasieki"), tytuł wywiadu Playfair italic 16px, link "Czytaj →".
Pod kartami: "Poznaj więcej mieszkańców →" + link do sekcji Ludzie.
To jest moduł który mieszkańcy klikają ze względów emocjonalnych — widzą kogoś kogo znają.

### MODUŁ 9 — ŻYCIE CODZIENNE
Jasne, użytkowe, praktyczne. Tło #f5f2ec. Nagłówek: "ŻYCIE CODZIENNE — Przydatne informacje dla mieszkańców".
8 kafelków podkategorii w układzie 4+4 (dwie rzędy). Każdy kafelek: ikona SVG (np. 🗓️ dla Poradnika, 🏥 dla Zdrowia, 🌾 dla Rolnictwa, 🗺️ dla Turystyki), nazwa kategorii bold, liczba artykułów muted, ostatni artykuł jako jeden tytuł Playfair 14px.
Pod kafelkami: jeden wyróżniony artykuł "PORADNIK TYGODNIA" — żółte tło, bold tytuł, lead. To jest sekcja SEO — Poradnik mieszkańca to najczęściej szukane treści przez nowych użytkowników.

### MODUŁ 10 — DZIŚ W IZBICY (AI Evergreen)
Pełna szerokość. Pionowa czerwona kreska po lewej (6px). Tło kremowe.
Lewa strona (70%): etykieta "✦ DZIŚ W IZBICY" DM Sans uppercase + mały dopisek kursywą "artykuł sezonowy, opracowany przez AI, zatwierdzony przez redakcję". Playfair 32px tytuł. Lead 3–4 zdania. Autor: "Redakcja izbica24.pl / AI".
Prawa strona (30%): zdjęcie z zaokrąglonymi rogami 8px, lekki box-shadow.

### MODUŁ 11 — SOŁECTWA (mapa interaktywna)
Pełna szerokość, tło #eef2f6. Nagłówek: "34 SOŁECTWA GMINY IZBICA KUJAWSKA".
Po lewej (50%): uproszczona wektorowa mapa gminy SVG z zaznaczonymi sołectwami. Hover na sołectwie: podświetlenie + tooltip z nazwą sołtysem i ostatnim artykułem oznaczonym tym tagiem. Klik: przejście do artykułów z tagu sołectwa.
Po prawej (50%): lista alfabetyczna 34 sołectw w 3 kolumnach. Każde klikalne. Obok nazwy mała cyfra — liczba artykułów z danego sołectwa.
To jest element który nie istnieje na żadnym innym portalu lokalnym w Polsce. Daje poczucie że TWÓJ WIEŚ jest ważna.

### MODUŁ 12 — OGŁOSZENIA
Tło ciemnoszare (#2c2c2c). Białe napisy. Nagłówek: "OGŁOSZENIA" w Playfair biały + "Bezpłatne dla mieszkańców".
7 kafelek w układzie 7 kolumn (jedna linia): Nekrologi | Rocznice | Praca | Sprzedam | Nieruchomości | Usługi | Katalog Firm. Każdy kafelek: ikona, nazwa, liczba aktywnych ogłoszeń w kolorze akcentu kategorii, przycisk "Przeglądaj".
Nekrologi mają osobne, spokojne traktowanie — szara ramka, bez liczby ogłoszeń krzykliwie, podtytuł "Z żałobną czcią". Emocjonalna różnica jest celowa.
Na dole: duży przycisk "➕ Dodaj ogłoszenie — bezpłatnie" na czerwonym tle.

### MODUŁ 13 — MULTIMEDIA
Tło #111. Trzy kolumny.
Wideo (40%): Embed YouTube placeholder z miniaturą i ikoną play na środku. Tytuł reportażu biały Playfair 20px. Podkategoria (Reportaże / Relacje / Drony).
Galerie (35%): Mozaika 4 zdjęć (2+2 nierówne kafelki). Overlay z tytułem galerii i liczbą zdjęć. "Zobacz wszystkie galerie →".
Podcast (25%): Ciemna karta z ikoną mikrofonu, tytuł odcinka, czas trwania, mini player (play/pauza, pasek postępu). Dwa linki: Spotify i Apple Podcasts.

### SIDEBAR (stały przez całą stronę)
Szerokość 300px. Pojawia się przy viewporcie 1280px+. Na mobile i tablecie chowa się.
Strefowo od góry:
Strefa 1 — Pogoda: 7-dniowa prognoza, ikony, temperatury min/max, "Izbica Kujawska". Subtelne, nie krzykliwe.
Strefa 2 — Newsletter: Box z czerwoną górną krawędzią. "📨 TYDZIEŃ W IZBICY" bold. "Co niedzielę — przegląd tygodnia". Pole e-mail + przycisk. Pod spodem: "Dołącz do [X] subskrybentów".
Strefa 3 — Najczęściej czytane: "🔥 TOP 5 TEGO TYGODNIA". 5 artykułów ponumerowanych 01–05 bold czerwony + tytuł + kategoria.
Strefa 4 — Masz temat? Żółte tło. "Widziałeś coś ważnego? Napisz do nas." Pole tekstowe + "Wyślij newsa". To jest UGC (user generated content) — mieszkańcy stają się źródłem newsów.
Strefa 5 — Reklama lokalna: Baner 300×250px. "Twoja reklama tutaj — zasięg: gmina Izbica Kujawska". Dla lokalnych firm.
Strefa 6 — Ważne telefony: 6 najważniejszych numerów z ikonami: 🚒 OSP, 🚑 SPZOZ, 🚔 Policja, 🏛️ Urząd, 💧 ZGKiW, 📞 Ogólny alarmowy.
Strefa 7 — Facebook embed: Ostatnie 3 posty z oficjalnego profilu portalu.

### MODUŁ 14 — FOOTER
Tło #0a0a0a. Górna linia czerwona 3px.
Cztery kolumny:
1. Portal: Logo izbica24 białe. Misja 2 zdania. Ikony social media (Facebook, YouTube, Spotify). "Niezależny portal informacyjny gminy Izbica Kujawska od [rok]."
2. Kategorie: Dwie pod-kolumny z wszystkimi 12 kategoriami jako linki białe. Hover: czerwony.
3. Informacje: O portalu | Redakcja | Kontakt | Reklama | Dołącz do nas | Mapa gminy | Ważne telefony | Linki.
4. Newsletter + Kontakt: Powtórzony box zapisu na newsletter (footer jest widoczny przez chwilę gdy user doczyta do końca — to dobry moment na CTA). Pod spodem: redakcja@izbica24.pl i adres.
Dolna belka (sub-footer): #060606. Regulamin | Polityka prywatności | RODO | "Portal używa AI do tworzenia części treści — wszystkie materiały weryfikowane przez redakcję" | © 2026 izbica24.pl.

### ANIMACJE I RUCH
Przy ładowaniu strony: Belka nawigacji wjeżdża z góry (200ms). Hero pojawia się fade-in (300ms). Moduły poniżej wchodzą sekwencyjnie przy scrollu — każdy z translateY(20px) do translateY(0) + opacity 0→1, 400ms, ease-out. Staggered: każdy moduł 80ms po poprzednim.
NA SYGNALE live indicator: Pulsująca czerwona kropka @keyframes pulse — scale 1→1.4→1, opacity 1→0.5→1, 2s infinite.
Ticker breaking bar: CSS animation: scroll linear infinite. Pause on hover.
Hover na artykułach: box-shadow rośnie, translateY(-2px) — poczucie "unoszenia się".
Hover na menu kategoriach: Kolor podkreślenia zmienia się z transparent do koloru kategorii z transition: 200ms.
Mapa sołectw: SVG path fill zmienia kolor przy hoverze z transition: fill 150ms.
Kujawianka odliczanie: Licznik live setInterval aktualizowany co sekundę.

### MOBILE (do 768px)
Menu staje się hamburgerem. Drawer wysuwa się z lewej strony. Hero: jedna kolumna, NA SYGNALE pod artykułem. Kujawianka: pionowo (wynik → tabela → artykuły). Sidebar: ukryty w całości, treści sidebaru rozmieszczone między modułami jako karty. Footer: jedna kolumna, akordeon dla kategorii. Ticker: wolniejszy, większy tekst. Mapa sołectw: zastąpiona listą z searchem.

### CO SPRAWIA ŻE TO JEST IZBICA, NIE KAŻDA INNA GMINA
Mapa sołectw SVG — tylko gmina Izbica Kujawska ma te 34 konkretne sołectwa. Widget Kujawianki — tylko ten klub, tylko ta tabela. Zdjęcia tła w sekcji Historia — synagoga izbicka, megality z Wietrzychowic. Kolorystyka złoto-sierpniowa w sekcji rolniczej — Kujawy to kraj pszenicy. Czcionki mają ciepło starych gazet kujawskich. Portal nie mógłby być omyłkowo wzięty za portal z Poznania czy Lublina.

Gotowy do budowania?
