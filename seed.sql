-- SANDBOX C — task C11-C13: Seed data for local development

-- Users
INSERT OR IGNORE INTO users (email, display_name, role, email_verified) VALUES
  ('redakcja@izbica24.pl', 'Redakcja izbica24.pl', 'editor', 1),
  ('anna.kowalska@izbica24.pl', 'Anna Kowalska', 'author', 1),
  ('tomasz.lewandowski@izbica24.pl', 'Tomasz Lewandowski', 'author', 1),
  ('marta.s@izbica24.pl', 'Marta S.', 'author', 1),
  ('admin@izbica24.pl', 'Admin', 'admin', 1);

-- Categories
INSERT OR IGNORE INTO categories (slug, title, description, color, sort_order) VALUES
  ('wiadomosci', 'Wiadomości', 'Najnowsze wiadomości z gminy Izbica Kujawska', '#c0392b', 1),
  ('samorzad', 'Samorząd', 'Rada Miejska, Urząd Miejski, sołectwa', '#1a3a5c', 2),
  ('kujawianka', 'Kujawianka', 'Klub piłkarski Kujawianka Izbica Kujawska', '#1e7a4f', 3),
  ('kultura', 'Kultura', 'MGCK, Biblioteka, KGW, wydarzenia', '#7b2d8b', 4),
  ('historia', 'Historia', 'Dzieje gminy, Wietrzychowice', '#b8860b', 5),
  ('sport', 'Sport', 'Sport amatorski, młodzieżówka', '#1e7a4f', 6),
  ('zdrowie', 'Zdrowie', 'SPZOZ, apteki, profilaktyka', '#27ae60', 7),
  ('edukacja', 'Edukacja', 'Szkoły, przedszkola', '#3498db', 8),
  ('inwestycje', 'Inwestycje', 'Drogi, sieci, fundusze', '#c0392b', 9),
  ('rolnictwo', 'Rolnictwo', 'ARiMR, KGW, doradztwo', '#d4ac0d', 10),
  ('srodowisko', 'Środowisko', 'Ochrona środowiska, OZE', '#16a085', 11),
  ('spoleczne', 'Społeczne', 'MGOPS, Caritas, wolontariat', '#e67e22', 12),
  ('komunikaty', 'Komunikaty', 'Ogłoszenia urzędowe', '#34495e', 13);

-- Tags
INSERT OR IGNORE INTO tags (slug, title) VALUES
  ('inwestycje', 'Inwestycje'),
  ('drogi', 'Drogi'),
  ('mgck', 'MGCK'),
  ('kujawianka', 'Kujawianka'),
  ('osp', 'OSP'),
  ('mgops', 'MGOPS'),
  ('caritas', 'Caritas'),
  ('budzet', 'Budżet'),
  ('wodociag', 'Wodociąg'),
  ('rolnictwo', 'Rolnictwo');

-- Sample articles (referencing seed users + categories)
INSERT OR IGNORE INTO articles (slug, category_id, title, lede, body_html, hero_image, author_id, author_display, reading_minutes, status, source, published_at)
SELECT
  'remont-koscielnej-zakonczony',
  c.id,
  'Remont ulicy Kościelnej zakończony przed terminem',
  'Po sześciu miesiącach prac modernizacyjnych ulica Kościelna w centrum Izbicy została w pełni przebudowana.',
  '<p>Treść artykułu...</p>',
  'https://images.unsplash.com/photo-1545987796-200677ee1011?w=1200&h=675&fit=crop',
  u.id,
  'Anna Kowalska',
  4,
  'published',
  'manual',
  '2026-05-25 09:30:00'
FROM categories c, users u
WHERE c.slug = 'inwestycje' AND u.email = 'anna.kowalska@izbica24.pl';

-- Alerts seed
INSERT INTO alerts (kind, status, title, description, source, affected_areas, starts_at, ends_at, is_active) VALUES
  ('prad', 'ok', 'Brak planowanych wyłączeń', 'Energa-Operator nie zgłasza prac', 'Energa', NULL, NULL, NULL, 1),
  ('woda', 'warn', 'Płukanie sieci — Smolsk, Naczachowo', 'Możliwe zmętnienie 9:00–13:00', 'ZGK', 'Smolsk, Naczachowo', '2026-05-25 09:00:00', '2026-05-25 13:00:00', 1),
  ('cieplo', 'ok', 'Sezon grzewczy zakończony', 'Standardowy harmonogram letni', 'MEC', NULL, NULL, NULL, 1),
  ('internet', 'warn', 'Słaby zasięg LTE — Modzerowo', 'Operatorzy potwierdzają lokalne problemy', 'T-Mobile/Plus', 'Modzerowo', '2026-05-24 00:00:00', '2026-05-27 23:59:59', 1);

-- Events seed (week of 25-31 May 2026)
INSERT INTO events (title, description, category, starts_at, location_name, location_solectwo) VALUES
  ('Sesja KGW Sadłno', 'Posiedzenie Koła Gospodyń Wiejskich', 'spoleczne', '2026-05-25 17:00:00', 'Świetlica wiejska', 'Sadłno'),
  ('Spotkanie OSP Izbica', 'Comiesięczne spotkanie strażaków', 'spoleczne', '2026-05-26 18:00:00', 'Remiza OSP', 'Izbica Kujawska'),
  ('Sesja Rady Miejskiej', 'XXX sesja Rady Miejskiej', 'samorzad', '2026-05-27 18:00:00', 'Sala konferencyjna UMiG', 'Izbica Kujawska'),
  ('Wernisaż MGCK', 'Wystawa fotografii artystycznej', 'kultura', '2026-05-28 17:30:00', 'MGCK Izbica', 'Izbica Kujawska'),
  ('Koncert w bibliotece', 'Recital muzyki klasycznej', 'kultura', '2026-05-29 19:00:00', 'Biblioteka MGCK', 'Izbica Kujawska'),
  ('Mecz Kujawianka–Polonia', 'Klasa okręgowa, 27. kolejka', 'sport', '2026-05-30 17:00:00', 'Stadion Izbica', 'Izbica Kujawska'),
  ('Festyn rodzinny', 'Piknik dla mieszkańców sołectwa', 'spoleczne', '2026-05-31 14:00:00', 'Świetlica wiejska', 'Mchówek');

-- API tokens — przykład (HASH = sha256('test-token-secret'))
INSERT OR IGNORE INTO api_tokens (name, token_hash, scopes, rate_limit_per_minute) VALUES
  ('n8n-production', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'incoming:write,alerts:write,events:write', 120),
  ('mobile-app-readonly', 'b3a8e0e1f9ab1bfe3a147b30bbb6cea2dc41c4c2a3aacf4dcb8e6b65c5a05c11', 'articles:read,categories:read,alerts:read,events:read', 60);

-- Statistics
SELECT '=== SEED COMPLETE ===' AS status;
SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'api_tokens', COUNT(*) FROM api_tokens;
