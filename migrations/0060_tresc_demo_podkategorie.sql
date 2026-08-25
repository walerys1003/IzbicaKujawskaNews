-- 0060_tresc_demo_podkategorie.sql
--
-- PLIK WYGENEROWANY — nie edytuj recznie.
-- Zrodlo: scripts/d6-generuj-tresc-demo.mjs (czyta src/v4/taxonomy.ts)
-- Regeneracja:
--   node scripts/d6-generuj-tresc-demo.mjs > migrations/0060_tresc_demo_podkategorie.sql
--
-- CO NAPRAWIA
--
-- Taksonomia deklaruje 67 podkategorii, router rejestruje trase dla kazdej,
-- a baza miala tresc dla 12. Pozostale 55 stron zwracalo 200 i pokazywalo
-- wylacznie komunikat „Brak materialow w tej podkategorii”.
--
-- Trzy sekcje strony glownej byly puste, bo filtruja po TYPIE materialu,
-- a w bazie bylo 30/30 artykulow typu 'article':
--   .sygnale-big/.sygnale-md  <- type='live'          + incident
--   .media-card               <- type='media-review'  + externalSource
--   .mm-card                  <- type='gallery'/'video'
--
-- Kategoria 'przeglad-mediow' nie istniala w tabeli categories.
--
-- CHARAKTER TRESCI
--
-- Migracja 0058 ustalila zasade: wymyslona informacja jest gorsza od
-- widocznego braku, bo mieszkaniec nie odrozni jej od prawdziwej. Ta
-- migracja jej nie lamie — zaden material NIE PODAJE zmyslonych liczb,
-- kwot, nazwisk, wynikow ani dat zdarzen. Kazdy opisuje, CO w danej
-- rubryce bedzie publikowane (tekst z opisu podkategorii, napisanego
-- przez redakcje), i zawiera blok 'info' mowiacy wprost, ze jest
-- materialem demonstracyjnym. Wszystkie maja ai_assisted=1, wiec szata
-- rysuje adnotacje o udziale AI.
--
-- Nazwy wlasne pochodza wylacznie z src/v4/instytucje.ts oraz tabeli
-- solectwa (37 potwierdzonych nazw). Zadna nie jest wymyslona.
--
-- USUNIECIE CALOSCI JEDNYM ZAPYTANIEM
--   DELETE FROM articles WHERE slug LIKE 'demo-%';
-- (article_blocks i article_tags maja ON DELETE CASCADE albo zostana
--  usuniete razem z artykulem — patrz sekcja koncowa tego pliku.)
--
-- Materialow w tym pliku: 55

-- ─────────────────────────────────────────────────────────────────────
-- Kategoria 'przeglad-mediow' — brakowalo jej w tabeli categories, wiec
-- zaden artykul nie mogl trafic do tego dzialu. order_index jest NOT NULL.
-- ─────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (slug, name, order_index, description)
VALUES ('przeglad-mediow', 'Przegląd Mediów', 23, 'O Izbicy piszą inni — publikacje mediów zewnętrznych.');

-- Autorem jest konto redakcyjne z seeda 0051. Gdyby go nie bylo,
-- author_id zostanie NULL i szata pokaze „Redakcja izbica24.pl”
-- (fallback REDAKCJA w src/v4/content-source.ts).

-- na-sygnale/wypadki · typ live
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-na-sygnale-wypadki',
  'Wypadki i kolizje — czym jest ten dział',
  'Zdarzenia drogowe na drogach gminy i powiatu włocławskiego. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'na-sygnale'),
  'wypadki',
  'live',
  'published',
  '/static/img/v4/19-policja-patrol.jpg',
  'Wypadki i kolizje',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"incident":{"time":"—:—","dayLabel":"przyklad","kind":"Wypadki i kolizje","icon":"🚗","place":"gmina Izbica Kujawska","source":"KM PSP Włocławek · Posterunek Policji w Izbicy Kujawskiej"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-na-sygnale-wypadki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wypadki i kolizje</strong> — Zdarzenia drogowe na drogach gminy i powiatu włocławskiego."}', 'Wypadki i kolizje — Zdarzenia drogowe na drogach gminy i powiatu włocławskiego.'
  FROM articles WHERE slug = 'demo-na-sygnale-wypadki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-na-sygnale-wypadki';

-- na-sygnale/pozary · typ live
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-na-sygnale-pozary',
  'Pożary — czym jest ten dział',
  'Pożary budynków, stodół, lasów, traw i pojazdów — interwencje OSP i PSP. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'na-sygnale'),
  'pozary',
  'live',
  'published',
  '/static/img/v4/02-osp-pozar-stodola.jpg',
  'Pożary',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"incident":{"time":"—:—","dayLabel":"przyklad","kind":"Pożary","icon":"🔥","place":"gmina Izbica Kujawska","source":"OSP Izbica Kujawska · KM PSP Włocławek"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-na-sygnale-pozary';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Pożary</strong> — Pożary budynków, stodół, lasów, traw i pojazdów — interwencje OSP i PSP."}', 'Pożary — Pożary budynków, stodół, lasów, traw i pojazdów — interwencje OSP i PSP.'
  FROM articles WHERE slug = 'demo-na-sygnale-pozary';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-na-sygnale-pozary';

-- na-sygnale/interwencje · typ live
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-na-sygnale-interwencje',
  'Interwencje ratunkowe — czym jest ten dział',
  'Zdarzenia medyczne, poszukiwania osób, akcje ratownicze, ćwiczenia. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'na-sygnale'),
  'interwencje',
  'live',
  'published',
  '/static/img/v4/09-spzoz-pielegniarka.jpg',
  'Interwencje ratunkowe',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"incident":{"time":"—:—","dayLabel":"przyklad","kind":"Interwencje ratunkowe","icon":"🏥","place":"gmina Izbica Kujawska","source":"SPZOZ Izbica Kujawska · OSP"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-na-sygnale-interwencje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Interwencje ratunkowe</strong> — Zdarzenia medyczne, poszukiwania osób, akcje ratownicze, ćwiczenia."}', 'Interwencje ratunkowe — Zdarzenia medyczne, poszukiwania osób, akcje ratownicze, ćwiczenia.'
  FROM articles WHERE slug = 'demo-na-sygnale-interwencje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-na-sygnale-interwencje';

-- na-sygnale/policja · typ live
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-na-sygnale-policja',
  'Kronika policyjna — czym jest ten dział',
  'Zatrzymania, kradzieże, oszustwa, włamania, kontrole drogowe. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'na-sygnale'),
  'policja',
  'live',
  'published',
  '/static/img/v4/19-policja-patrol.jpg',
  'Kronika policyjna',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"incident":{"time":"—:—","dayLabel":"przyklad","kind":"Kronika policyjna","icon":"🚓","place":"gmina Izbica Kujawska","source":"Posterunek Policji w Izbicy Kujawskiej"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-na-sygnale-policja';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Kronika policyjna</strong> — Zatrzymania, kradzieże, oszustwa, włamania, kontrole drogowe."}', 'Kronika policyjna — Zatrzymania, kradzieże, oszustwa, włamania, kontrole drogowe.'
  FROM articles WHERE slug = 'demo-na-sygnale-policja';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-na-sygnale-policja';

-- na-sygnale/awarie · typ live
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-na-sygnale-awarie',
  'Pogotowie i awarie — czym jest ten dział',
  'Awarie wodociągów, kanalizacji, sieci energetycznej i gazowej. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'na-sygnale'),
  'awarie',
  'live',
  'published',
  '/static/img/v4/16-srodowisko-odpady.jpg',
  'Pogotowie i awarie',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"incident":{"time":"—:—","dayLabel":"przyklad","kind":"Pogotowie i awarie","icon":"💧","place":"gmina Izbica Kujawska","source":"ZGKiW Izbica Kujawska · PGE Dystrybucja"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-na-sygnale-awarie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Pogotowie i awarie</strong> — Awarie wodociągów, kanalizacji, sieci energetycznej i gazowej."}', 'Pogotowie i awarie — Awarie wodociągów, kanalizacji, sieci energetycznej i gazowej.'
  FROM articles WHERE slug = 'demo-na-sygnale-awarie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-na-sygnale-awarie';

-- samorzad/urzad · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-samorzad-urzad',
  'Urząd Miejski — czym jest ten dział',
  'Zarządzenia burmistrza, informacje urzędowe, godziny pracy, zmiany kadrowe. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'samorzad'),
  'urzad',
  'article',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Urząd Miejski',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-samorzad-urzad';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Urząd Miejski</strong> — Zarządzenia burmistrza, informacje urzędowe, godziny pracy, zmiany kadrowe."}', 'Urząd Miejski — Zarządzenia burmistrza, informacje urzędowe, godziny pracy, zmiany kadrowe.'
  FROM articles WHERE slug = 'demo-samorzad-urzad';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-samorzad-urzad';

-- samorzad/rada · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-samorzad-rada',
  'Rada Miejska — czym jest ten dział',
  'Relacje z sesji, uchwały z komentarzem, interpelacje radnych, komisje. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'samorzad'),
  'rada',
  'article',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Rada Miejska',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-samorzad-rada';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Rada Miejska</strong> — Relacje z sesji, uchwały z komentarzem, interpelacje radnych, komisje."}', 'Rada Miejska — Relacje z sesji, uchwały z komentarzem, interpelacje radnych, komisje.'
  FROM articles WHERE slug = 'demo-samorzad-rada';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-samorzad-rada';

-- samorzad/budzet · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-samorzad-budzet',
  'Budżet i finanse — czym jest ten dział',
  'Budżet gminy, dotacje UE, fundusze rządowe, zmiany budżetowe. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'samorzad'),
  'budzet',
  'article',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Budżet i finanse',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-samorzad-budzet';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Budżet i finanse</strong> — Budżet gminy, dotacje UE, fundusze rządowe, zmiany budżetowe."}', 'Budżet i finanse — Budżet gminy, dotacje UE, fundusze rządowe, zmiany budżetowe.'
  FROM articles WHERE slug = 'demo-samorzad-budzet';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-samorzad-budzet';

-- samorzad/powiat · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-samorzad-powiat',
  'Powiat — czym jest ten dział',
  'Starostwo: drogi powiatowe, pozwolenia, edukacja ponadpodstawowa, PUP. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'samorzad'),
  'powiat',
  'article',
  'published',
  '/static/img/v4/01-hero-ulica-koscielna.jpg',
  'Powiat',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-samorzad-powiat';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Powiat</strong> — Starostwo: drogi powiatowe, pozwolenia, edukacja ponadpodstawowa, PUP."}', 'Powiat — Starostwo: drogi powiatowe, pozwolenia, edukacja ponadpodstawowa, PUP.'
  FROM articles WHERE slug = 'demo-samorzad-powiat';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-samorzad-powiat';

-- samorzad/wybory · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-samorzad-wybory',
  'Wybory i referenda — czym jest ten dział',
  'Kandydaci, programy, wyniki, frekwencja, okręgi i komisje wyborcze. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'samorzad'),
  'wybory',
  'article',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Wybory i referenda',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-samorzad-wybory';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wybory i referenda</strong> — Kandydaci, programy, wyniki, frekwencja, okręgi i komisje wyborcze."}', 'Wybory i referenda — Kandydaci, programy, wyniki, frekwencja, okręgi i komisje wyborcze.'
  FROM articles WHERE slug = 'demo-samorzad-wybory';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-samorzad-wybory';

-- sport/aktualnosci · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-aktualnosci',
  'Aktualności — czym jest ten dział',
  'Transfery, treningi, sparingi, kontuzje, komunikaty zarządu, sponsoring. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'aktualnosci',
  'article',
  'published',
  '/static/img/v4/04-kujawianka-celebracja.jpg',
  'Aktualności',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-aktualnosci';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Aktualności</strong> — Transfery, treningi, sparingi, kontuzje, komunikaty zarządu, sponsoring."}', 'Aktualności — Transfery, treningi, sparingi, kontuzje, komunikaty zarządu, sponsoring.'
  FROM articles WHERE slug = 'demo-kujawianka-aktualnosci';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-aktualnosci';

-- sport/mecze · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-mecze',
  'Mecze — czym jest ten dział',
  'Zapowiedzi meczowe i relacje pomeczowe: wynik, bramki, przebieg, ocena. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'mecze',
  'article',
  'published',
  '/static/img/v4/04-kujawianka-celebracja.jpg',
  'Mecze',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-mecze';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Mecze</strong> — Zapowiedzi meczowe i relacje pomeczowe: wynik, bramki, przebieg, ocena."}', 'Mecze — Zapowiedzi meczowe i relacje pomeczowe: wynik, bramki, przebieg, ocena.'
  FROM articles WHERE slug = 'demo-kujawianka-mecze';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-mecze';

-- sport/tabela · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-tabela',
  'Wyniki — czym jest ten dział',
  'Tabela Klasy Okręgowej gr. 2 oraz terminarz rozgrywek — aktualizacja po kolejce. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'tabela',
  'article',
  'published',
  '/static/img/v4/04-kujawianka-celebracja.jpg',
  'Wyniki',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-tabela';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wyniki</strong> — Tabela Klasy Okręgowej gr. 2 oraz terminarz rozgrywek — aktualizacja po kolejce."}', 'Wyniki — Tabela Klasy Okręgowej gr. 2 oraz terminarz rozgrywek — aktualizacja po kolejce.'
  FROM articles WHERE slug = 'demo-kujawianka-tabela';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-tabela';

-- sport/kadra · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-kadra',
  'Kadra — czym jest ten dział',
  'Lista zawodników, sztab szkoleniowy, zarząd klubu. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'kadra',
  'article',
  'published',
  '/static/img/v4/12-portret-pilkarz.jpg',
  'Kadra',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-kadra';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Kadra</strong> — Lista zawodników, sztab szkoleniowy, zarząd klubu."}', 'Kadra — Lista zawodników, sztab szkoleniowy, zarząd klubu.'
  FROM articles WHERE slug = 'demo-kujawianka-kadra';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-kadra';

-- sport/junior · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-junior',
  'Junior — czym jest ten dział',
  'Drużyny juniorskie, młodzieżowe, szkółka piłkarska — wyniki i turnieje. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'junior',
  'article',
  'published',
  '/static/img/v4/12-portret-pilkarz.jpg',
  'Junior',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-junior';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Junior</strong> — Drużyny juniorskie, młodzieżowe, szkółka piłkarska — wyniki i turnieje."}', 'Junior — Drużyny juniorskie, młodzieżowe, szkółka piłkarska — wyniki i turnieje.'
  FROM articles WHERE slug = 'demo-kujawianka-junior';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-junior';

-- sport/historia · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-historia',
  'Historia — czym jest ten dział',
  'Od 1949 roku do dziś: sezony, sukcesy, legendy klubu, old boys, rocznice. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'historia',
  'article',
  'published',
  '/static/img/v4/04-kujawianka-celebracja.jpg',
  'Historia',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-historia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Historia</strong> — Od 1949 roku do dziś: sezony, sukcesy, legendy klubu, old boys, rocznice."}', 'Historia — Od 1949 roku do dziś: sezony, sukcesy, legendy klubu, old boys, rocznice.'
  FROM articles WHERE slug = 'demo-kujawianka-historia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-historia';

-- sport/galeria · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kujawianka-galeria',
  'Galeria — czym jest ten dział',
  'Zdjęcia z meczów, treningów i wydarzeń klubowych. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'sport'),
  'galeria',
  'article',
  'published',
  '/static/img/v4/04-kujawianka-celebracja.jpg',
  'Galeria',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kujawianka-galeria';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Galeria</strong> — Zdjęcia z meczów, treningów i wydarzeń klubowych."}', 'Galeria — Zdjęcia z meczów, treningów i wydarzeń klubowych.'
  FROM articles WHERE slug = 'demo-kujawianka-galeria';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kujawianka-galeria';

-- kultura/mgck · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-mgck',
  'MGCK – Centrum Kultury — czym jest ten dział',
  'Wydarzenia, warsztaty, koncerty, Dni Izbicy, dożynki, zajęcia i wystawy. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'mgck',
  'article',
  'published',
  '/static/img/v4/06-dni-izbicy-koncert.jpg',
  'MGCK – Centrum Kultury',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-mgck';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>MGCK – Centrum Kultury</strong> — Wydarzenia, warsztaty, koncerty, Dni Izbicy, dożynki, zajęcia i wystawy."}', 'MGCK – Centrum Kultury — Wydarzenia, warsztaty, koncerty, Dni Izbicy, dożynki, zajęcia i wystawy.'
  FROM articles WHERE slug = 'demo-kultura-mgck';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-mgck';

-- kultura/biblioteka · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-biblioteka',
  'Biblioteka — czym jest ten dział',
  'Spotkania autorskie, nowe książki, warsztaty czytelnicze, konkursy. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'biblioteka',
  'article',
  'published',
  '/static/img/v4/13-tochman-bibl.jpg',
  'Biblioteka',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-biblioteka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Biblioteka</strong> — Spotkania autorskie, nowe książki, warsztaty czytelnicze, konkursy."}', 'Biblioteka — Spotkania autorskie, nowe książki, warsztaty czytelnicze, konkursy.'
  FROM articles WHERE slug = 'demo-kultura-biblioteka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-biblioteka';

-- kultura/parafie · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-parafie',
  'Kościół i parafie — czym jest ten dział',
  'Życie religijne w gminie — trzy parafie i dekanat izbicki. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'parafie',
  'article',
  'published',
  '/static/img/v4/14-pielgrzymka-blenna.jpg',
  'Kościół i parafie',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-parafie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Kościół i parafie</strong> — Życie religijne w gminie — trzy parafie i dekanat izbicki."}', 'Kościół i parafie — Życie religijne w gminie — trzy parafie i dekanat izbicki.'
  FROM articles WHERE slug = 'demo-kultura-parafie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-parafie';

-- kultura/orionisci · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-orionisci',
  'Orioniści – DPS — czym jest ten dział',
  'Dom Pomocy Społecznej im. ks. Karola Sterpi — życie podopiecznych, uroczystości. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'orionisci',
  'article',
  'published',
  '/static/img/v4/09-spzoz-pielegniarka.jpg',
  'Orioniści – DPS',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-orionisci';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Orioniści – DPS</strong> — Dom Pomocy Społecznej im. ks. Karola Sterpi — życie podopiecznych, uroczystości."}', 'Orioniści – DPS — Dom Pomocy Społecznej im. ks. Karola Sterpi — życie podopiecznych, uroczystości.'
  FROM articles WHERE slug = 'demo-kultura-orionisci';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-orionisci';

-- kultura/kgw · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-kgw',
  'KGW i tradycja — czym jest ten dział',
  'Notecianki, Pasieczanki, Świszewy, Świętosławice — imprezy, tradycje kujawskie. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'kgw',
  'article',
  'published',
  '/static/img/v4/15-kgw-pasieka-chleb.jpg',
  'KGW i tradycja',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-kgw';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>KGW i tradycja</strong> — Notecianki, Pasieczanki, Świszewy, Świętosławice — imprezy, tradycje kujawskie."}', 'KGW i tradycja — Notecianki, Pasieczanki, Świszewy, Świętosławice — imprezy, tradycje kujawskie.'
  FROM articles WHERE slug = 'demo-kultura-kgw';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-kgw';

-- kultura/rozrywka · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-kultura-rozrywka',
  'Rozrywka — czym jest ten dział',
  'Fenix Club, koncerty, eventy, majówki, festyny i pikniki. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'kultura'),
  'rozrywka',
  'article',
  'published',
  '/static/img/v4/06-dni-izbicy-koncert.jpg',
  'Rozrywka',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-kultura-rozrywka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Rozrywka</strong> — Fenix Club, koncerty, eventy, majówki, festyny i pikniki."}', 'Rozrywka — Fenix Club, koncerty, eventy, majówki, festyny i pikniki.'
  FROM articles WHERE slug = 'demo-kultura-rozrywka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-kultura-rozrywka';

-- historia/dzieje · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-dzieje',
  'Dzieje Izbicy Kujawskiej — czym jest ten dział',
  'Od neolitu przez prawa miejskie 1750, zabory, wojny, PRL po współczesność. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'dzieje',
  'article',
  'published',
  '/static/img/v4/18-szlak-megality.jpg',
  'Dzieje Izbicy Kujawskiej',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-dzieje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Dzieje Izbicy Kujawskiej</strong> — Od neolitu przez prawa miejskie 1750, zabory, wojny, PRL po współczesność."}', 'Dzieje Izbicy Kujawskiej — Od neolitu przez prawa miejskie 1750, zabory, wojny, PRL po współczesność.'
  FROM articles WHERE slug = 'demo-historia-dzieje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-dzieje';

-- historia/wietrzychowice · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-wietrzychowice',
  'Wietrzychowice – Polskie Piramidy — czym jest ten dział',
  'Park Kulturowy, grobowce kujawskie sprzed 5 500 lat, badania archeologiczne. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'wietrzychowice',
  'article',
  'published',
  '/static/img/v4/05-wietrzychowice-megality.jpg',
  'Wietrzychowice – Polskie Piramidy',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-wietrzychowice';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wietrzychowice – Polskie Piramidy</strong> — Park Kulturowy, grobowce kujawskie sprzed 5 500 lat, badania archeologiczne."}', 'Wietrzychowice – Polskie Piramidy — Park Kulturowy, grobowce kujawskie sprzed 5 500 lat, badania archeologiczne.'
  FROM articles WHERE slug = 'demo-historia-wietrzychowice';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-wietrzychowice';

-- historia/spolecznosc-zydowska · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-spolecznosc-zydowska',
  'Społeczność żydowska — czym jest ten dział',
  'Historia Żydów w Izbicy, synagoga 1880–1895, cmentarz, jesziwa, Zagłada, pamięć. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'spolecznosc-zydowska',
  'article',
  'published',
  '/static/img/v4/18-szlak-megality.jpg',
  'Społeczność żydowska',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-spolecznosc-zydowska';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Społeczność żydowska</strong> — Historia Żydów w Izbicy, synagoga 1880–1895, cmentarz, jesziwa, Zagłada, pamięć."}', 'Społeczność żydowska — Historia Żydów w Izbicy, synagoga 1880–1895, cmentarz, jesziwa, Zagłada, pamięć.'
  FROM articles WHERE slug = 'demo-historia-spolecznosc-zydowska';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-spolecznosc-zydowska';

-- historia/stare-zdjecia · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-stare-zdjecia',
  'Dawna Izbica w fotografii — czym jest ten dział',
  'Archiwalne zdjęcia z komentarzem — „poznajesz to miejsce?”. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'stare-zdjecia',
  'article',
  'published',
  '/static/img/v4/18-szlak-megality.jpg',
  'Dawna Izbica w fotografii',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-stare-zdjecia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Dawna Izbica w fotografii</strong> — Archiwalne zdjęcia z komentarzem — „poznajesz to miejsce?”."}', 'Dawna Izbica w fotografii — Archiwalne zdjęcia z komentarzem — „poznajesz to miejsce?”.'
  FROM articles WHERE slug = 'demo-historia-stare-zdjecia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-stare-zdjecia';

-- historia/zabytki · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-zabytki',
  'Zabytki i architektura — czym jest ten dział',
  'Gotycki kościół NMP, dwór w Izbicy-Zagrodnicy, rynek historyczny, kapliczki. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'zabytki',
  'article',
  'published',
  '/static/img/v4/14-pielgrzymka-blenna.jpg',
  'Zabytki i architektura',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-zabytki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Zabytki i architektura</strong> — Gotycki kościół NMP, dwór w Izbicy-Zagrodnicy, rynek historyczny, kapliczki."}', 'Zabytki i architektura — Gotycki kościół NMP, dwór w Izbicy-Zagrodnicy, rynek historyczny, kapliczki.'
  FROM articles WHERE slug = 'demo-historia-zabytki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-zabytki';

-- historia/sylwetki · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-sylwetki',
  'Sylwetki historyczne — czym jest ten dział',
  'Biogramy zasłużonych mieszkańców i postaci historycznych związanych z miastem. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'sylwetki',
  'article',
  'published',
  '/static/img/v4/11-portret-bibliotekarka.jpg',
  'Sylwetki historyczne',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-sylwetki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Sylwetki historyczne</strong> — Biogramy zasłużonych mieszkańców i postaci historycznych związanych z miastem."}', 'Sylwetki historyczne — Biogramy zasłużonych mieszkańców i postaci historycznych związanych z miastem.'
  FROM articles WHERE slug = 'demo-historia-sylwetki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-sylwetki';

-- historia/tego-dnia · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-tego-dnia',
  'Tego dnia w Izbicy — czym jest ten dział',
  'Cykl „co wydarzyło się tego dnia w historii Izbicy Kujawskiej”. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'tego-dnia',
  'article',
  'published',
  '/static/img/v4/18-szlak-megality.jpg',
  'Tego dnia w Izbicy',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-tego-dnia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Tego dnia w Izbicy</strong> — Cykl „co wydarzyło się tego dnia w historii Izbicy Kujawskiej”."}', 'Tego dnia w Izbicy — Cykl „co wydarzyło się tego dnia w historii Izbicy Kujawskiej”.'
  FROM articles WHERE slug = 'demo-historia-tego-dnia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-tego-dnia';

-- historia/publikacje · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-historia-publikacje',
  'Artykuły naukowe i publikacje — czym jest ten dział',
  'Zapiski Kujawsko-Dobrzyńskie, prace archeologiczne, publikacje diecezjalne. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'historia'),
  'publikacje',
  'article',
  'published',
  '/static/img/v4/13-tochman-bibl.jpg',
  'Artykuły naukowe i publikacje',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-historia-publikacje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Artykuły naukowe i publikacje</strong> — Zapiski Kujawsko-Dobrzyńskie, prace archeologiczne, publikacje diecezjalne."}', 'Artykuły naukowe i publikacje — Zapiski Kujawsko-Dobrzyńskie, prace archeologiczne, publikacje diecezjalne.'
  FROM articles WHERE slug = 'demo-historia-publikacje';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-historia-publikacje';

-- ludzie/wywiady · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ludzie-wywiady',
  'Wywiady — czym jest ten dział',
  'Rozmowy z burmistrzem, dyrektorami, proboszczem, sołtysami, trenerem, działaczami. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ludzie'),
  'wywiady',
  'article',
  'published',
  '/static/img/v4/10-portret-burmistrz.jpg',
  'Wywiady',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ludzie-wywiady';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wywiady</strong> — Rozmowy z burmistrzem, dyrektorami, proboszczem, sołtysami, trenerem, działaczami."}', 'Wywiady — Rozmowy z burmistrzem, dyrektorami, proboszczem, sołtysami, trenerem, działaczami.'
  FROM articles WHERE slug = 'demo-ludzie-wywiady';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ludzie-wywiady';

-- ludzie/sylwetki · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ludzie-sylwetki',
  'Sylwetki mieszkańców — czym jest ten dział',
  'Najstarsi mieszkańcy, rzemieślnicy, rolnicy, pasjonaci, wolontariusze, strażacy. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ludzie'),
  'sylwetki',
  'article',
  'published',
  '/static/img/v4/11-portret-bibliotekarka.jpg',
  'Sylwetki mieszkańców',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ludzie-sylwetki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Sylwetki mieszkańców</strong> — Najstarsi mieszkańcy, rzemieślnicy, rolnicy, pasjonaci, wolontariusze, strażacy."}', 'Sylwetki mieszkańców — Najstarsi mieszkańcy, rzemieślnicy, rolnicy, pasjonaci, wolontariusze, strażacy.'
  FROM articles WHERE slug = 'demo-ludzie-sylwetki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ludzie-sylwetki';

-- ludzie/sukcesy · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ludzie-sukcesy',
  'Sukcesy — czym jest ten dział',
  'Uczniowie, sportowcy, odznaczeni mieszkańcy, nagrodzone firmy i rolnicy. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ludzie'),
  'sukcesy',
  'article',
  'published',
  '/static/img/v4/12-portret-pilkarz.jpg',
  'Sukcesy',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ludzie-sukcesy';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Sukcesy</strong> — Uczniowie, sportowcy, odznaczeni mieszkańcy, nagrodzone firmy i rolnicy."}', 'Sukcesy — Uczniowie, sportowcy, odznaczeni mieszkańcy, nagrodzone firmy i rolnicy.'
  FROM articles WHERE slug = 'demo-ludzie-sukcesy';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ludzie-sukcesy';

-- ludzie/wspomnienia · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ludzie-wspomnienia',
  'Wspomnienia — czym jest ten dział',
  'Wspomnienia pośmiertne, życiorysy i hołdy dla zasłużonych mieszkańców. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ludzie'),
  'wspomnienia',
  'article',
  'published',
  '/static/img/v4/11-portret-bibliotekarka.jpg',
  'Wspomnienia',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ludzie-wspomnienia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wspomnienia</strong> — Wspomnienia pośmiertne, życiorysy i hołdy dla zasłużonych mieszkańców."}', 'Wspomnienia — Wspomnienia pośmiertne, życiorysy i hołdy dla zasłużonych mieszkańców.'
  FROM articles WHERE slug = 'demo-ludzie-wspomnienia';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ludzie-wspomnienia';

-- zycie/poradnik · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-poradnik',
  'Poradnik mieszkańca — czym jest ten dział',
  'Wnioski, harmonogramy, godziny pracy urzędu, rozkłady busów, dokumenty. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'poradnik',
  'article',
  'published',
  '/static/img/v4/01-hero-ulica-koscielna.jpg',
  'Poradnik mieszkańca',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-poradnik';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Poradnik mieszkańca</strong> — Wnioski, harmonogramy, godziny pracy urzędu, rozkłady busów, dokumenty."}', 'Poradnik mieszkańca — Wnioski, harmonogramy, godziny pracy urzędu, rozkłady busów, dokumenty.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-poradnik';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-poradnik';

-- zycie/zdrowie · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-zdrowie',
  'Zdrowie i profilaktyka — czym jest ten dział',
  'Godziny SPZOZ, badania w powiecie, szczepienia, program 40 PLUS. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'zdrowie',
  'article',
  'published',
  '/static/img/v4/09-spzoz-pielegniarka.jpg',
  'Zdrowie i profilaktyka',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-zdrowie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Zdrowie i profilaktyka</strong> — Godziny SPZOZ, badania w powiecie, szczepienia, program 40 PLUS."}', 'Zdrowie i profilaktyka — Godziny SPZOZ, badania w powiecie, szczepienia, program 40 PLUS.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-zdrowie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-zdrowie';

-- zycie/rolnictwo · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-rolnictwo',
  'Rolnictwo i doradztwo — czym jest ten dział',
  'Terminy ARiMR, szkolenia KPODR, ceny skupu, susze i melioracje. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'rolnictwo',
  'article',
  'published',
  '/static/img/v4/07-rolnictwo-rzepak.jpg',
  'Rolnictwo i doradztwo',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-rolnictwo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Rolnictwo i doradztwo</strong> — Terminy ARiMR, szkolenia KPODR, ceny skupu, susze i melioracje."}', 'Rolnictwo i doradztwo — Terminy ARiMR, szkolenia KPODR, ceny skupu, susze i melioracje.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-rolnictwo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-rolnictwo';

-- zycie/turystyka · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-turystyka',
  'Turystyka i rekreacja — czym jest ten dział',
  'Szlak megalitów, synagoga, trasy rowerowe, Jezioro Głuszyńskie, Brdów. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'turystyka',
  'article',
  'published',
  '/static/img/v4/18-szlak-megality.jpg',
  'Turystyka i rekreacja',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-turystyka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Turystyka i rekreacja</strong> — Szlak megalitów, synagoga, trasy rowerowe, Jezioro Głuszyńskie, Brdów."}', 'Turystyka i rekreacja — Szlak megalitów, synagoga, trasy rowerowe, Jezioro Głuszyńskie, Brdów.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-turystyka';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-turystyka';

-- zycie/edukacja · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-edukacja',
  'Edukacja i rozwój — czym jest ten dział',
  'Rekrutacja ZS Kasprowicza, kursy LGD, dotacje na działalność, oferty PUP. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'edukacja',
  'article',
  'published',
  '/static/img/v4/08-edukacja-szkola.jpg',
  'Edukacja i rozwój',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-edukacja';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Edukacja i rozwój</strong> — Rekrutacja ZS Kasprowicza, kursy LGD, dotacje na działalność, oferty PUP."}', 'Edukacja i rozwój — Rekrutacja ZS Kasprowicza, kursy LGD, dotacje na działalność, oferty PUP.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-edukacja';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-edukacja';

-- zycie/bezpieczenstwo · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-bezpieczenstwo',
  'Bezpieczeństwo — czym jest ten dział',
  'Posterunek Policji, dzielnicowi, zgłaszanie przestępstw, oszustwa. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'bezpieczenstwo',
  'article',
  'published',
  '/static/img/v4/19-policja-patrol.jpg',
  'Bezpieczeństwo',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-bezpieczenstwo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Bezpieczeństwo</strong> — Posterunek Policji, dzielnicowi, zgłaszanie przestępstw, oszustwa."}', 'Bezpieczeństwo — Posterunek Policji, dzielnicowi, zgłaszanie przestępstw, oszustwa.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-bezpieczenstwo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-bezpieczenstwo';

-- zycie/dom · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-dom',
  'Dom i ogród — czym jest ten dział',
  'Kalendarz ogrodnika Kujawy, przeglądy pieców, programy termomodernizacji. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'dom',
  'article',
  'published',
  '/static/img/v4/17-swietlica-wiejska.jpg',
  'Dom i ogród',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-dom';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Dom i ogród</strong> — Kalendarz ogrodnika Kujawy, przeglądy pieców, programy termomodernizacji."}', 'Dom i ogród — Kalendarz ogrodnika Kujawy, przeglądy pieców, programy termomodernizacji.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-dom';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-dom';

-- zycie/pogoda · typ article
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-zycie-codzienne-pogoda',
  'Pogoda i sezon — czym jest ten dział',
  'Prognoza dla rolników, sezon grzewczy, stan dróg, poziom wody w kanale. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'zycie'),
  'pogoda',
  'article',
  'published',
  '/static/img/v4/20-pogoda-kujawy.jpg',
  'Pogoda i sezon',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-pogoda';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Pogoda i sezon</strong> — Prognoza dla rolników, sezon grzewczy, stan dróg, poziom wody w kanale."}', 'Pogoda i sezon — Prognoza dla rolników, sezon grzewczy, stan dróg, poziom wody w kanale.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-pogoda';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-zycie-codzienne-pogoda';

-- przeglad-mediow/portale · typ media-review
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-przeglad-mediow-portale',
  'Portale informacyjne — czym jest ten dział',
  'ddwloclawek.pl, nwloclawek.pl, portalwloclawek.pl, gloswloclawianina.pl. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'przeglad-mediow'),
  'portale',
  'media-review',
  'published',
  '/static/img/v4/01-hero-ulica-koscielna.jpg',
  'Portale informacyjne',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"externalSource":{"name":"Portale lokalne","url":"https://ddwloclawek.pl/","badgeColor":"#1d4ed8"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-portale';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Portale informacyjne</strong> — ddwloclawek.pl, nwloclawek.pl, portalwloclawek.pl, gloswloclawianina.pl."}', 'Portale informacyjne — ddwloclawek.pl, nwloclawek.pl, portalwloclawek.pl, gloswloclawianina.pl.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-portale';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-portale';

-- przeglad-mediow/gazeta-pomorska · typ media-review
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-przeglad-mediow-gazeta-pomorska',
  'Gazeta Pomorska — czym jest ten dział',
  'Artykuły z pomorska.pl dotyczące Izbicy i powiatu włocławskiego. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'przeglad-mediow'),
  'gazeta-pomorska',
  'media-review',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Gazeta Pomorska',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"externalSource":{"name":"Gazeta Pomorska","url":"https://pomorska.pl/","badgeColor":"#b91c1c"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-gazeta-pomorska';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Gazeta Pomorska</strong> — Artykuły z pomorska.pl dotyczące Izbicy i powiatu włocławskiego."}', 'Gazeta Pomorska — Artykuły z pomorska.pl dotyczące Izbicy i powiatu włocławskiego.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-gazeta-pomorska';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-gazeta-pomorska';

-- przeglad-mediow/tv-radio · typ media-review
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-przeglad-mediow-tv-radio',
  'Telewizja i radio — czym jest ten dział',
  'TV Kujawy, TVP3 Bydgoszcz, Radio Kujawy, Radio Włocławek, Radio PiK. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'przeglad-mediow'),
  'tv-radio',
  'media-review',
  'published',
  '/static/img/v4/06-dni-izbicy-koncert.jpg',
  'Telewizja i radio',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"externalSource":{"name":"TV i radio","url":"https://www.radiopik.pl/","badgeColor":"#7c2d12"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-tv-radio';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Telewizja i radio</strong> — TV Kujawy, TVP3 Bydgoszcz, Radio Kujawy, Radio Włocławek, Radio PiK."}', 'Telewizja i radio — TV Kujawy, TVP3 Bydgoszcz, Radio Kujawy, Radio Włocławek, Radio PiK.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-tv-radio';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-tv-radio';

-- przeglad-mediow/social-media · typ media-review
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-przeglad-mediow-social-media',
  'Media społecznościowe — czym jest ten dział',
  'Przetworzone posty z publicznych profili instytucji i grup lokalnych. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'przeglad-mediow'),
  'social-media',
  'media-review',
  'published',
  '/static/img/v4/17-swietlica-wiejska.jpg',
  'Media społecznościowe',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"externalSource":{"name":"Media społecznościowe","url":"https://www.izbicakuj.pl/","badgeColor":"#0f766e"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-social-media';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Media społecznościowe</strong> — Przetworzone posty z publicznych profili instytucji i grup lokalnych."}', 'Media społecznościowe — Przetworzone posty z publicznych profili instytucji i grup lokalnych.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-social-media';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-przeglad-mediow-social-media';

-- multimedia/wideo · typ video
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-multimedia-wideo',
  'Wideo — czym jest ten dział',
  'Materiały wideo z życia gminy — reportaże, relacje, wywiady, drony. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'multimedia'),
  'wideo',
  'video',
  'published',
  '/static/img/v4/06-dni-izbicy-koncert.jpg',
  'Wideo',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"video":{"src":"","poster":"/static/img/v4/06-dni-izbicy-koncert.jpg","durationLabel":"—:—","provider":"demo"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-multimedia-wideo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Wideo</strong> — Materiały wideo z życia gminy — reportaże, relacje, wywiady, drony."}', 'Wideo — Materiały wideo z życia gminy — reportaże, relacje, wywiady, drony.'
  FROM articles WHERE slug = 'demo-multimedia-wideo';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-multimedia-wideo';

-- multimedia/podcast · typ audio
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-multimedia-podcast',
  'Podcast „Głos Izbicy” — czym jest ten dział',
  'Audio: podsumowania tygodnia, rozmowy i historia na ucho. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'multimedia'),
  'podcast',
  'audio',
  'published',
  '/static/img/v4/10-portret-burmistrz.jpg',
  'Podcast „Głos Izbicy”',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"audio":{"src":"","durationLabel":"—:—","series":"Głos Izbicy"}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-multimedia-podcast';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Podcast „Głos Izbicy”</strong> — Audio: podsumowania tygodnia, rozmowy i historia na ucho."}', 'Podcast „Głos Izbicy” — Audio: podsumowania tygodnia, rozmowy i historia na ucho.'
  FROM articles WHERE slug = 'demo-multimedia-podcast';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-multimedia-podcast';

-- multimedia/galerie · typ gallery
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-multimedia-galerie',
  'Galerie zdjęć — czym jest ten dział',
  'Galerie pogrupowane tematycznie — każde wydarzenie to galeria. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'multimedia'),
  'galerie',
  'gallery',
  'published',
  '/static/img/v4/06-dni-izbicy-koncert.jpg',
  'Galerie zdjęć',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-multimedia-galerie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Galerie zdjęć</strong> — Galerie pogrupowane tematycznie — każde wydarzenie to galeria."}', 'Galerie zdjęć — Galerie pogrupowane tematycznie — każde wydarzenie to galeria.'
  FROM articles WHERE slug = 'demo-multimedia-galerie';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-multimedia-galerie';

-- multimedia/infografiki · typ infographic
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-multimedia-infografiki',
  'Infografiki — czym jest ten dział',
  'Budżet gminy, statystyki demograficzne, wyniki wyborów, podsumowania. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'multimedia'),
  'infografiki',
  'infographic',
  'published',
  '/static/img/v4/03-sesja-rady-miejskiej.jpg',
  'Infografiki',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  NULL
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-multimedia-infografiki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Infografiki</strong> — Budżet gminy, statystyki demograficzne, wyniki wyborów, podsumowania."}', 'Infografiki — Budżet gminy, statystyki demograficzne, wyniki wyborów, podsumowania.'
  FROM articles WHERE slug = 'demo-multimedia-infografiki';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-multimedia-infografiki';

-- ogloszenia/rocznice · typ announcement
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ogloszenia-rocznice',
  'Rocznice i podziękowania — czym jest ten dział',
  'Rocznice śmierci, podziękowania za kondolencje, życzenia jubileuszowe. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ogloszenia'),
  'rocznice',
  'announcement',
  'published',
  '/static/img/v4/14-pielgrzymka-blenna.jpg',
  'Rocznice i podziękowania',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"announcement":{"paid":false}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ogloszenia-rocznice';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Rocznice i podziękowania</strong> — Rocznice śmierci, podziękowania za kondolencje, życzenia jubileuszowe."}', 'Rocznice i podziękowania — Rocznice śmierci, podziękowania za kondolencje, życzenia jubileuszowe.'
  FROM articles WHERE slug = 'demo-ogloszenia-rocznice';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ogloszenia-rocznice';

-- ogloszenia/drobne · typ announcement
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ogloszenia-drobne',
  'Kupię / Sprzedam / Zamienię — czym jest ten dział',
  'Darmowe ogłoszenia drobne dla mieszkańców gminy. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ogloszenia'),
  'drobne',
  'announcement',
  'published',
  '/static/img/v4/17-swietlica-wiejska.jpg',
  'Kupię / Sprzedam / Zamienię',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"announcement":{"paid":false}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ogloszenia-drobne';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Kupię / Sprzedam / Zamienię</strong> — Darmowe ogłoszenia drobne dla mieszkańców gminy."}', 'Kupię / Sprzedam / Zamienię — Darmowe ogłoszenia drobne dla mieszkańców gminy.'
  FROM articles WHERE slug = 'demo-ogloszenia-drobne';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ogloszenia-drobne';

-- ogloszenia/uslugi · typ announcement
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ogloszenia-uslugi',
  'Usługi — czym jest ten dział',
  'Hydraulik, elektryk, mechanik, korepetycje, transport. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ogloszenia'),
  'uslugi',
  'announcement',
  'published',
  '/static/img/v4/01-hero-ulica-koscielna.jpg',
  'Usługi',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"announcement":{"paid":false}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ogloszenia-uslugi';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Usługi</strong> — Hydraulik, elektryk, mechanik, korepetycje, transport."}', 'Usługi — Hydraulik, elektryk, mechanik, korepetycje, transport.'
  FROM articles WHERE slug = 'demo-ogloszenia-uslugi';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ogloszenia-uslugi';

-- ogloszenia/firmy · typ announcement
INSERT OR IGNORE INTO articles (
  slug, title, lead, category_id, subcategory_slug, content_type, status,
  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,
  reading_minutes, view_count, comment_count, featured, breaking,
  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json
) VALUES (
  'demo-ogloszenia-firmy',
  'Katalog firm — czym jest ten dział',
  'Baza lokalnych przedsiębiorców — wizytówki firm z gminy i okolic. Materiał demonstracyjny — rubryka czeka na treści redakcyjne.',
  (SELECT id FROM categories WHERE slug = 'ogloszenia'),
  'firmy',
  'announcement',
  'published',
  '/static/img/v4/17-swietlica-wiejska.jpg',
  'Katalog firm',
  'fot. archiwum izbica24.pl',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  2, 0, 0, 0, 0,
  1,
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.',
  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),
  '2026-01-02 08:00:00',
  '{"announcement":{"paid":false}}'
);
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 0, 'info', '{"type":"info","variant":"warning","title":"Materiał demonstracyjny","html":"To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale."}', 'To materiał demonstracyjny, dodany po to, aby rubryka nie była pusta podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'
  FROM articles WHERE slug = 'demo-ogloszenia-firmy';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 1, 'paragraph', '{"type":"paragraph","html":"<strong>Katalog firm</strong> — Baza lokalnych przedsiębiorców — wizytówki firm z gminy i okolic."}', 'Katalog firm — Baza lokalnych przedsiębiorców — wizytówki firm z gminy i okolic.'
  FROM articles WHERE slug = 'demo-ogloszenia-firmy';
INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)
SELECT id, 2, 'paragraph', '{"type":"paragraph","html":"Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na <a href=\"mailto:redakcja@izbica24.pl\">redakcja@izbica24.pl</a>."}', 'Redakcja izbica24.pl przygotowuje materiały do tego działu. Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, napisz na redakcja@izbica24.pl.'
  FROM articles WHERE slug = 'demo-ogloszenia-firmy';

-- ─────────────────────────────────────────────────────────────────────
-- Kontrola: ile materialow demonstracyjnych jest w bazie.
--   SELECT count(*) FROM articles WHERE slug LIKE 'demo-%';   -> 55
-- Usuniecie wraz z blokami:
--   DELETE FROM article_blocks WHERE article_id IN
--     (SELECT id FROM articles WHERE slug LIKE 'demo-%');
--   DELETE FROM articles WHERE slug LIKE 'demo-%';
-- ─────────────────────────────────────────────────────────────────────
