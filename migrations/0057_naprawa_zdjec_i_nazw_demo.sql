-- 0056_naprawa_zdjec_i_nazw_demo.sql
--
-- Migracja naprawia DWIE usterki w danych demonstracyjnych zasianych
-- migracja 0013_seed_demo_articles.sql. Obie ujawnily sie dopiero po
-- sprawdzeniu KAZDEGO zasobu strony glownej przegladarka — samo "200 OK"
-- na stronie ich nie pokazywalo.
--
-- ─────────────────────────────────────────────────────────────────────
-- USTERKA 1: 30 nieistniejacych zdjec (kazdy artykul na stronie glownej)
-- ─────────────────────────────────────────────────────────────────────
-- Seed 0013 ustawil hero_image_r2_key na 'demo/<slug>.jpg'. Funkcja
-- mediaUrl() (src/v4/content-source.ts:161) zamienia taki klucz na
-- '/media/demo/<slug>.jpg', a trasa /media/* (src/routes/media-serve.ts)
-- szuka go w kubelku R2. Kubelek nie zawiera zadnego z tych plikow —
-- nigdy nie zostaly wgrane, bo nie istnieja. Skutek: 30 zapytan 404 i
-- 30 pustych ramek na stronie glownej.
--
-- Dlaczego nie wgrywamy plikow do R2: to dane DEMONSTRACYJNE. Wiazanie
-- ich z R2 oznaczaloby, ze lokalne srodowisko deweloperskie wymaga
-- dostepu do chmury, zeby strona glowna wygladala poprawnie — a takze,
-- ze po wdrozeniu na produkcje trzeba pamietac o rownoleglym wgraniu 30
-- plikow. Zdjecia szaty v4 sa juz w repozytorium (public/static/img/v4/,
-- po 3 formaty: jpg/webp/avif) i sa serwowane statycznie.
--
-- mediaUrl() przepuszcza bez zmian kazdy klucz zaczynajacy sie od '/'
-- (linia 163), wiec podanie sciezki statycznej jest obslugiwane bez
-- zmian w kodzie. To swiadomy wybor: naprawiamy dane, nie logike.
--
-- Przypisanie zdjec jest TEMATYCZNE, nie losowe — zdjecie sesji rady
-- trafia do artykulow samorzadowych, straz do "Na sygnale" itd. Zdjecie
-- niezgodne z trescia byloby w portalu informacyjnym gorsze niz brak
-- zdjecia, bo wprowadzaloby czytelnika w blad.
--
-- ─────────────────────────────────────────────────────────────────────
-- USTERKA 2: zmyslone nazwy miejscowosci w bazie (Sadlno, Pamiecin)
-- ─────────────────────────────────────────────────────────────────────
-- Poprzednia korekta (commit 3141a73) usunela zmyslone nazwy z
-- src/v4/content-db.ts — czyli z danych demonstracyjnych w KODZIE.
-- Baza D1 ma jednak wlasny, niezalezny zestaw tresci (seed 0013) i tam
-- nazwy zostaly. Strona glowna czyta z bazy, wiec "Sadlno" i "Pamiecin"
-- nadal byly widoczne dla czytelnika.
--
-- Ani "Sadlno", ani "Pamiecin" nie wystepuja w gminie Izbica Kujawska
-- (weryfikacja: data/solectwa-osm.json — 37 potwierdzonych nazw, oraz
-- migracja 0055_solectwa_poprawka). Sadlno to wies w gminie Lubraniec,
-- Pamiecin — w gminie Kruszwica. Publikowanie inwestycji gminnych pod
-- nazwa miejscowosci z innej gminy to blad merytoryczny, ktory w
-- portalu lokalnym podwaza zaufanie do calego serwisu.
--
-- Mapowanie zgodne z korekta w content-db.ts, zeby oba zrodla tresci
-- mowily to samo:
--   Sadlno   → Augustynowo  (potwierdzone solectwo)
--   Pamiecin → Grochowiska  (potwierdzone solectwo)
--
-- Slugi zmieniamy razem z trescia. Adresy artykulow demo nie byly
-- publikowane ani indeksowane, wiec nie zostawiamy przekierowan 301 —
-- inaczej niz przy /mapa-gminy → /mapa, gdzie adres byl w uzyciu.
--
-- Wyzwalacze FTS (trg_articles_szukaj_au / trg_articles_fts_update)
-- przepisza indeks wyszukiwania automatycznie przy UPDATE, wiec nie
-- trzeba go odbudowywac recznie.

-- ── 1. Zmiana nazw: Sadlno → Augustynowo ────────────────────────────

UPDATE articles SET
  slug         = 'budowa-wodociagu-augustynowo-etap-2',
  title        = 'Budowa wodociągu w Augustynowie — rusza etap 2',
  content_md   = '# Budowa wodociągu w Augustynowie — rusza etap 2' || char(10) || char(10) ||
                 'Gmina podpisała umowę z wykonawcą kolejnego odcinka.' || char(10) || char(10) ||
                 'Treść demonstracyjna — do zastąpienia materiałem redakcyjnym.'
WHERE slug = 'budowa-wodociagu-sadlno-etap-2';

UPDATE articles SET
  slug         = 'nowy-wodociag-w-augustynowie-oddany-do-uzytku',
  title        = 'Nowy wodociąg w Augustynowie oddany do użytku',
  lead         = 'Drugi etap budowy wodociągu w Augustynowie zakończony. Podłączono 34 gospodarstwa.',
  content_md   = '# Nowy wodociąg w Augustynowie oddany do użytku' || char(10) || char(10) ||
                 'Drugi etap budowy wodociągu w Augustynowie zakończony. Podłączono 34 gospodarstwa.'
WHERE slug = 'nowy-wodociag-w-sadlnie-oddany-do-uzytku';

UPDATE articles SET
  slug         = 'dom-augustynowo-na-sprzedaz',
  title        = 'Dom w Augustynowie na sprzedaż — nowa oferta',
  content_md   = '# Dom w Augustynowie na sprzedaż — nowa oferta' || char(10) || char(10) ||
                 'Dom 120 m² z działką 1200 m² i garażem.' || char(10) || char(10) ||
                 'Treść demonstracyjna — do zastąpienia materiałem redakcyjnym.'
WHERE slug = 'dom-sadlno-na-sprzedaz';

-- ── 2. Zmiana nazw: Pamiecin → Grochowiska ──────────────────────────

UPDATE articles SET
  slug         = 'grochowiska-festyn-rodzinny',
  title        = 'Grochowiska zapraszają na festyn rodzinny',
  content_md   = '# Grochowiska zapraszają na festyn rodzinny' || char(10) || char(10) ||
                 'Sołectwo organizuje dzień dziecka i konkurs kulinarny.' || char(10) || char(10) ||
                 'Treść demonstracyjna — do zastąpienia materiałem redakcyjnym.'
WHERE slug = 'pamiecin-festyn-rodzinny';

-- Sprzatanie tresci HTML — te same nazwy wystepuja w content_html.
-- REPLACE dziala na kazdym wierszu, wiec nie trzeba wskazywac slugow.
UPDATE articles SET content_html = REPLACE(content_html, 'Sadlnie',  'Augustynowie') WHERE content_html LIKE '%Sadlnie%';
UPDATE articles SET content_html = REPLACE(content_html, 'Sadłnie',  'Augustynowie') WHERE content_html LIKE '%Sadłnie%';
UPDATE articles SET content_html = REPLACE(content_html, 'Sadlno',   'Augustynowo')  WHERE content_html LIKE '%Sadlno%';
UPDATE articles SET content_html = REPLACE(content_html, 'Sadłno',   'Augustynowo')  WHERE content_html LIKE '%Sadłno%';
UPDATE articles SET content_html = REPLACE(content_html, 'Pamięcin', 'Grochowiska')  WHERE content_html LIKE '%Pamięcin%';
UPDATE articles SET content_html = REPLACE(content_html, 'Pamiecin', 'Grochowiska')  WHERE content_html LIKE '%Pamiecin%';

UPDATE articles SET lead = REPLACE(lead, 'Sadlnie',  'Augustynowie') WHERE lead LIKE '%Sadlnie%';
UPDATE articles SET lead = REPLACE(lead, 'Sadłnie',  'Augustynowie') WHERE lead LIKE '%Sadłnie%';
UPDATE articles SET lead = REPLACE(lead, 'Pamięcin', 'Grochowiska')  WHERE lead LIKE '%Pamięcin%';

-- ── 3. Podmiana nieistniejacych zdjec na realne pliki statyczne ─────
-- Dobor tematyczny. Zdjecia (opisy skrocone):
--   01 remont ulicy Koscielnej      11 portret bibliotekarki
--   02 OSP / pozar stodoly          12 portret pilkarza
--   03 sesja rady miejskiej         13 biblioteka
--   04 Kujawianka — celebracja      14 pielgrzymka Blenna
--   05 Wietrzychowice megality      15 KGW Pasieka — chleb
--   06 Dni Izbicy koncert           16 srodowisko / odpady
--   07 rolnictwo rzepak             17 swietlica wiejska
--   08 edukacja szkola              18 szlak megality
--   09 SPZOZ pielegniarka           19 policja patrol
--   10 portret burmistrza           20 pogoda Kujawy

UPDATE articles SET hero_image_r2_key = '/static/img/v4/01-hero-ulica-koscielna.jpg' WHERE slug = 'remont-ulicy-koscielnej-zakonczony-przed-terminem';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/01-hero-ulica-koscielna.jpg' WHERE slug = 'wideo-otwarcie-ulicy-koscielnej';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/01-hero-ulica-koscielna.jpg' WHERE slug = 'powiat-remont-przepustu-swietosl';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/03-sesja-rady-miejskiej.jpg' WHERE slug = 'sesja-rady-maj-2026-podsumowanie';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/03-sesja-rady-miejskiej.jpg' WHERE slug = 'rada-przeglosowala-zmiany-budzetu';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/03-sesja-rady-miejskiej.jpg' WHERE slug = 'test-przeplywu-redakcyjnego-faza-2';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/19-policja-patrol.jpg'      WHERE slug = 'wypadek-na-dk62-bez-ofiar';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/02-osp-pozar-stodola.jpg'    WHERE slug = 'maria-kowalska-osp-portret';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/04-kujawianka-celebracja.jpg' WHERE slug = 'kujawianka-wygrywa-z-wloclavia';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/12-portret-pilkarz.jpg'       WHERE slug = 'kujawianka-mlodzicy-z-nowym-trenerem';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/05-wietrzychowice-megality.jpg' WHERE slug = 'wietrzychowice-sezon-turystyczny';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/18-szlak-megality.jpg'          WHERE slug = 'dziedzictwo-kujaw-nowa-wystawa';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/06-dni-izbicy-koncert.jpg' WHERE slug = 'mgck-lato-w-izbicy-2026';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/06-dni-izbicy-koncert.jpg' WHERE slug = 'kalendarz-wydarzen-koniec-maja';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/13-tochman-bibl.jpg'       WHERE slug = 'biblioteka-startuje-z-klubem-czytelniczym';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/07-rolnictwo-rzepak.jpg' WHERE slug = 'doplaty-obszarowe-terminy-armir';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/07-rolnictwo-rzepak.jpg' WHERE slug = 'szkolenie-dla-rolnikow-ekoschematy';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/08-edukacja-szkola.jpg' WHERE slug = 'przedszkole-nabor-uzupelniajacy';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/08-edukacja-szkola.jpg' WHERE slug = 'rekrutacja-zs-kasprowicz-2026';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/09-spzoz-pielegniarka.jpg' WHERE slug = 'spzoz-nowe-godziny-pediatry';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/09-spzoz-pielegniarka.jpg' WHERE slug = 'badania-profilaktyczne-na-rynku';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/16-srodowisko-odpady.jpg' WHERE slug = 'program-czyste-solectwo-wystartowal';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/16-srodowisko-odpady.jpg' WHERE slug = 'kanal-zglowiaczki-prace-melioracyjne';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/16-srodowisko-odpady.jpg' WHERE slug = 'jak-uzyskac-doplate-do-wymiany-pieca';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/17-swietlica-wiejska.jpg' WHERE slug = 'grochowiska-festyn-rodzinny';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/17-swietlica-wiejska.jpg' WHERE slug = 'budowa-wodociagu-augustynowo-etap-2';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/17-swietlica-wiejska.jpg' WHERE slug = 'nowy-wodociag-w-augustynowie-oddany-do-uzytku';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/17-swietlica-wiejska.jpg' WHERE slug = 'dom-augustynowo-na-sprzedaz';

UPDATE articles SET hero_image_r2_key = '/static/img/v4/15-kgw-pasieka-chleb.jpg' WHERE slug = 'poradnik-jak-przygotowac-ogrod-na-lato';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/14-pielgrzymka-blenna.jpg' WHERE slug = 'nekrolog-stanislaw-kowalski';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/10-portret-burmistrz.jpg'  WHERE slug = 'mieszkancy-pytaja-o-autobus-sobota';
UPDATE articles SET hero_image_r2_key = '/static/img/v4/11-portret-bibliotekarka.jpg' WHERE slug = 'praca-kierowca-ce-izbica';

-- ── 4. Siatka bezpieczenstwa ────────────────────────────────────────
-- Gdyby w bazie pozostal jakikolwiek klucz 'demo/...' (np. dodany
-- pozniej innym seedem), zamieniamy go na zdjecie ogolne zamiast
-- zostawiac zepsuty odnosnik. Puste zdjecie jest w kodzie obslugiwane
-- (Layout.tsx:186 sprawdza a.heroImage), ale 404 juz nie — dlatego
-- lepszy jest podmieniony obrazek niz klucz prowadzacy w pustke.
UPDATE articles
   SET hero_image_r2_key = '/static/img/v4/20-pogoda-kujawy.jpg'
 WHERE hero_image_r2_key LIKE 'demo/%';
