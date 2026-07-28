-- 0058_tresc_artykulow_i_zaslepka.sql
--
-- DWIE USTERKI TRESCI ARTYKULOW, ZMIERZONE.
--
-- (1) Zadny artykul nie mial tresci poza leadem.
--       SELECT count(*) FROM article_blocks;                  ->  0
--     Strona artykulu powstaje WYLACZNIE z tabeli article_blocks
--     (ARTICLES_SQL w src/v4/content-source.ts nie pobiera content_html).
--     Pomiar HTML strony /wiadomosci/inwestycje/remont-ulicy-koscielnej-…:
--     w znaczniku <article> byl DOKLADNIE JEDEN akapit tresci — sam lead.
--
-- (2) Kolumna content_html zawiera zaslepke deweloperska.
--       SELECT content_html FROM articles WHERE id=1;
--       -> '<p>Prace drogowe…</p><p>Demo content dla migracji fazy 1.3.</p>'
--     Zdanie „Demo content dla migracji fazy 1.3.” to notatka z migracji,
--     nie tresc redakcyjna. Po wlaczeniu odczytu content_html (poprawka w
--     content-source.ts) zostalaby POKAZANA MIESZKANCOWI. Usuwamy je z bazy,
--     zamiast filtrowac w szacie — zaslepka nie ma prawa byc trescia artykulu.
--
-- CZEGO TA MIGRACJA NIE ROBI — i dlaczego.
--
-- Pelne teksty redakcyjne (naglowki, wypunktowania, cytaty) istnieja w
-- src/data-articles.ts w polu `body`, ale tylko dla 12 artykulow, z czego
-- do wierszy bazy da sie dopasowac 4 (baza ma 30 artykulow i inne tematy;
-- tytuly w bazie sa skrocone, np. „…przed terminem” wobec „…przed terminem
-- — droga oddana mieszkancom”, dopasowanie po wspolnym prefiksie slow).
--
-- Dla pozostalych 26 artykulow tresci NIE MA W ZADNYM ZRODLE. Nie dopisujemy
-- jej, bo wymyslony tekst na portalu informacyjnym gminy jest gorszy od
-- widocznego braku: mieszkaniec nie ma jak odroznic zmyslonej informacji od
-- prawdziwej. Te artykuly pokazuja lead i tyle — stan zgodny z zawartoscia
-- bazy. Wypelnienie ich to zadanie redakcji, nie migracji.


-- id=1  „Remont ulicy Kościelnej zakończony przed terminem”
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 0, 'paragraph', '{"type":"paragraph","html":"Po sześciu miesiącach intensywnych prac modernizacyjnych, ulica Kościelna w centrum Izbicy Kujawskiej została <strong>w pełni przebudowana</strong> i oddana mieszkańcom. Nowa nawierzchnia bitumiczna, chodniki z kostki brukowej, energooszczędne oświetlenie LED oraz kompleksowy system odwodnienia kosztowały gminę 2,8 mln zł."}', 'Po sześciu miesiącach intensywnych prac modernizacyjnych, ulica Kościelna w centrum Izbicy Kujawskiej została w pełni przebudowana i oddana mieszkańcom. Nowa nawierzchnia bitumiczna, chodniki z kostki brukowej, energooszczędne oświetlenie LED oraz kompleksowy system odwodnienia kosztowały gminę 2,8 mln zł.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 1, 'heading', '{"type":"heading","level":2,"text":"Inwestycja przed terminem"}', 'Inwestycja przed terminem');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 2, 'paragraph', '{"type":"paragraph","html":"Wykonawca, firma DROGBUD ze Włocławka, oddała inwestycję <strong>dwa tygodnie przed terminem umownym</strong>. — „To duży sukces. Pogoda nam sprzyjała, a zespół wykonawcy zaplanował prace bardzo dokładnie\" — komentuje burmistrz Marek Dorabiała."}', 'Wykonawca, firma DROGBUD ze Włocławka, oddała inwestycję dwa tygodnie przed terminem umownym. — „To duży sukces. Pogoda nam sprzyjała, a zespół wykonawcy zaplanował prace bardzo dokładnie" — komentuje burmistrz Marek Dorabiała.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 3, 'heading', '{"type":"heading","level":2,"text":"Co zyskali mieszkańcy"}', 'Co zyskali mieszkańcy');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 4, 'paragraph', '{"type":"paragraph","html":"Ulica Kościelna to jedna z głównych arterii w centrum Izbicy. Codziennie przejeżdża nią ponad 1 200 pojazdów. Przed remontem nawierzchnia była w fatalnym stanie — pełna ubytków i kałuż."}', 'Ulica Kościelna to jedna z głównych arterii w centrum Izbicy. Codziennie przejeżdża nią ponad 1 200 pojazdów. Przed remontem nawierzchnia była w fatalnym stanie — pełna ubytków i kałuż.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 5, 'list', '{"type":"list","ordered":false,"items":["650 m nowej nawierzchni bitumicznej","1 200 m² chodników z kostki brukowej","32 lampy LED (oszczędność energii: 65%)","Nowy system odwodnienia (4 wpusty co 100 m)","Przejście dla pieszych przy ZS im. Kasprowicza"]}', '650 m nowej nawierzchni bitumicznej 1 200 m² chodników z kostki brukowej 32 lampy LED (oszczędność energii: 65%) Nowy system odwodnienia (4 wpusty co 100 m) Przejście dla pieszych przy ZS im. Kasprowicza');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 6, 'quote', '{"type":"quote","text":"To była najbardziej oczekiwana inwestycja drogowa ostatnich lat. Cieszę się, że udało nam się ją zrealizować pod budżet i przed terminem."}', 'To była najbardziej oczekiwana inwestycja drogowa ostatnich lat. Cieszę się, że udało nam się ją zrealizować pod budżet i przed terminem.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (1, 7, 'paragraph', '{"type":"paragraph","html":"Następna duża inwestycja drogowa — przebudowa ulicy Plac Wolności — ruszy w lipcu 2026 r."}', 'Następna duża inwestycja drogowa — przebudowa ulicy Plac Wolności — ruszy w lipcu 2026 r.');

-- id=2  „Sesja Rady Miejskiej — podsumowanie maja”
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (2, 0, 'paragraph', '{"type":"paragraph","html":"Sesja Rady Miejskiej w Izbicy Kujawskiej odbyła się 22 maja w sali konferencyjnej UMiG. W obradach wzięło udział 14 z 15 radnych. Najważniejszym punktem była zmiana w uchwale budżetowej."}', 'Sesja Rady Miejskiej w Izbicy Kujawskiej odbyła się 22 maja w sali konferencyjnej UMiG. W obradach wzięło udział 14 z 15 radnych. Najważniejszym punktem była zmiana w uchwale budżetowej.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (2, 1, 'heading', '{"type":"heading","level":2,"text":"Budżet 2026 — zmiany"}', 'Budżet 2026 — zmiany');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (2, 2, 'paragraph', '{"type":"paragraph","html":"Radni przeznaczyli dodatkowe 480 tys. zł na remont szkoły w Sadłnie. Środki pochodzą z nadwyżki za 2025 r."}', 'Radni przeznaczyli dodatkowe 480 tys. zł na remont szkoły w Sadłnie. Środki pochodzą z nadwyżki za 2025 r.');

-- id=4  „Kujawianka wygrywa 3:1 z Włocłavią”
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (4, 0, 'paragraph', '{"type":"paragraph","html":"Mecz 26. kolejki klasy okręgowej grupy 2 dostarczył kibicom emocji do ostatniego gwizdka. <strong>Kujawianka Izbica Kujawska pokonała na wyjeździe Włocłavię 3:1</strong>."}', 'Mecz 26. kolejki klasy okręgowej grupy 2 dostarczył kibicom emocji do ostatniego gwizdka. Kujawianka Izbica Kujawska pokonała na wyjeździe Włocłavię 3:1.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (4, 1, 'heading', '{"type":"heading","level":2,"text":"Skład Kujawianki"}', 'Skład Kujawianki');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (4, 2, 'paragraph', '{"type":"paragraph","html":"Trener Marek Lewandowski wystawił optymalny skład: Kowalski — Nowak, Wiśniewski, Kubiak, Mazur — Pawlak, Wójcik, Lewandowski Jr — Kowalczyk, Adamski, Szymański."}', 'Trener Marek Lewandowski wystawił optymalny skład: Kowalski — Nowak, Wiśniewski, Kubiak, Mazur — Pawlak, Wójcik, Lewandowski Jr — Kowalczyk, Adamski, Szymański.');

-- id=3  „MGCK ogłasza program „Lata w Izbicy 2026””
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (3, 0, 'paragraph', '{"type":"paragraph","html":"MGCK w Izbicy Kujawskiej zaprezentowało w piątek <strong>program „Lata w Izbicy 2026\"</strong>. Wakacyjny pakiet wydarzeń ruszy 1 lipca i potrwa do końca sierpnia."}', 'MGCK w Izbicy Kujawskiej zaprezentowało w piątek program „Lata w Izbicy 2026". Wakacyjny pakiet wydarzeń ruszy 1 lipca i potrwa do końca sierpnia.');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (3, 1, 'heading', '{"type":"heading","level":2,"text":"Co w programie"}', 'Co w programie');
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
VALUES (3, 2, 'paragraph', '{"type":"paragraph","html":"Główne atrakcje: kino plenerowe w każdy czwartek, warsztaty plastyczne dla dzieci, koncerty plenerowe na rynku w środy, piknik historyczny 15 sierpnia."}', 'Główne atrakcje: kino plenerowe w każdy czwartek, warsztaty plastyczne dla dzieci, koncerty plenerowe na rynku w środy, piknik historyczny 15 sierpnia.');

-- Usuniecie zaslepki deweloperskiej z tresci wszystkich artykulow.
UPDATE articles
   SET content_html = TRIM(REPLACE(content_html, '<p>Demo content dla migracji fazy 1.3.</p>', '')),
       updated_at = CURRENT_TIMESTAMP
 WHERE content_html LIKE '%Demo content dla migracji%';
