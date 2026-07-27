-- =====================================================================
-- 0055 — poprawa listy sołectw + współrzędne dla mapy (etap I10)
--
-- PLIK GENEROWANY. Nie edytuj ręcznie.
--   node scripts/i10-generuj-migracje.mjs > migrations/0055_solectwa_poprawka.sql
--
-- Migracja 0053 wstawiła listę, w której 16 nazw nie było sołectwami
-- gminy Izbica Kujawska. Bierzyn i Lubomin należą do gminy Boniewo,
-- Sarnowo do gminy Lubraniec — portal przypisywał sobie teren obcych
-- gmin. Pozostałych OpenStreetMap nie zna w tym rejonie.
--
-- Źródła ustalonej listy:
--   Wikipedia (pl), „Izbica Kujawska (gmina)", sekcja Sołectwa
--   OpenStreetMap / Overpass, relacja 2643810 (TERYT 0418083)
--   ODbL — wymagane oznaczenie „© OpenStreetMap contributors"
-- =====================================================================

-- ── 1. Usunięcie wpisów nieistniejących ─────────────────────────────
-- Warunek `soltys IS NULL AND description IS NULL` chroni pracę
-- redakcji: wiersz, w którym ktoś wpisał nazwisko sołtysa albo opis,
-- NIE zostanie usunięty. Taki wiersz trzeba obejrzeć ręcznie —
-- zapytanie kontrolne na końcu tego pliku go pokaże.
DELETE FROM solectwa
 WHERE slug IN ('sadlno', 'bierzyn', 'sarnowo', 'lubomin', 'cieszyno', 'krzeszyn', 'rzezno', 'bartlomiejowice', 'orle', 'smarliny', 'popowo', 'szczerkowo', 'zagrodnica', 'augustowo', 'konary', 'debianki', 'wolka-komorowska-stara')
   AND soltys IS NULL
   AND description IS NULL;

-- ── 2. Wstawienie/aktualizacja sołectw ze współrzędnymi ─────────────
-- ON CONFLICT aktualizuje wyłącznie nazwę i współrzędne. `soltys`,
-- `population`, `area_ha` i `description` zostają nietknięte —
-- migracja nie ma prawa nadpisać danych wpisanych przez człowieka.
INSERT INTO solectwa (slug, name, soltys, news_count, latitude, longitude, updated_at) VALUES
  ('izbica-kujawska', 'Izbica Kujawska', NULL, 0, 52.41925, 18.76435, CURRENT_TIMESTAMP),
  ('augustynowo', 'Augustynowo', NULL, 0, 52.433223, 18.770186, CURRENT_TIMESTAMP),
  ('blenna', 'Błenna', NULL, 0, 52.3844, 18.87943, CURRENT_TIMESTAMP),
  ('blenna-a', 'Błenna A', NULL, 0, 52.379596, 18.895338, CURRENT_TIMESTAMP),
  ('blenna-b', 'Błenna B', NULL, 0, 52.367476, 18.897395, CURRENT_TIMESTAMP),
  ('chociszewo', 'Chociszewo', NULL, 0, 52.382706, 18.811295, CURRENT_TIMESTAMP),
  ('cieplinki', 'Cieplinki', NULL, 0, 52.34738, 18.833333, CURRENT_TIMESTAMP),
  ('ciepliny', 'Ciepliny', NULL, 0, 52.36706, 18.84293, CURRENT_TIMESTAMP),
  ('dlugie', 'Długie', NULL, 0, 52.399561, 18.751802, CURRENT_TIMESTAMP),
  ('gasiorowo', 'Gąsiorowo', NULL, 0, 52.378889, 18.921111, CURRENT_TIMESTAMP),
  ('grochowiska', 'Grochowiska', NULL, 0, 52.413656, 18.72514, CURRENT_TIMESTAMP),
  ('helenowo', 'Helenowo', NULL, 0, 52.386898, 18.860833, CURRENT_TIMESTAMP),
  ('hulanka', 'Hulanka', NULL, 0, 52.430556, 18.725278, CURRENT_TIMESTAMP),
  ('joasin', 'Joasin', NULL, 0, 52.355833, 18.860556, CURRENT_TIMESTAMP),
  ('jozefowo', 'Józefowo', NULL, 0, 52.415493, 18.781631, CURRENT_TIMESTAMP),
  ('kazanki', 'Kazanki', NULL, 0, 52.401535, 18.817473, CURRENT_TIMESTAMP),
  ('kazimierowo', 'Kazimierowo', NULL, 0, 52.442222, 18.738056, CURRENT_TIMESTAMP),
  ('komorowo', 'Komorowo', NULL, 0, 52.390983, 18.797281, CURRENT_TIMESTAMP),
  ('mchowek', 'Mchówek', NULL, 0, 52.41867, 18.68712, CURRENT_TIMESTAMP),
  ('mieczyslawowo', 'Mieczysławowo', NULL, 0, 52.357205, 18.790692, CURRENT_TIMESTAMP),
  ('modzerowo', 'Modzerowo', NULL, 0, 52.34794, 18.77023, CURRENT_TIMESTAMP),
  ('naczachowo', 'Naczachowo', NULL, 0, 52.406093, 18.842876, CURRENT_TIMESTAMP),
  ('nowa-wies', 'Nowa Wieś', NULL, 0, 52.369248, 18.818298, CURRENT_TIMESTAMP),
  ('obalki', 'Obałki', NULL, 0, 52.42133, 18.838957, CURRENT_TIMESTAMP),
  ('pasieka', 'Pasieka', NULL, 0, 52.45184, 18.79812, CURRENT_TIMESTAMP),
  ('skarbanowo', 'Skarbanowo', NULL, 0, 52.43007, 18.820894, CURRENT_TIMESTAMP),
  ('sokolowo', 'Sokołowo', NULL, 0, 52.423594, 18.796992, CURRENT_TIMESTAMP),
  ('szczkowek', 'Szczkówek', NULL, 0, 52.380003, 18.840546, CURRENT_TIMESTAMP),
  ('slazewo', 'Ślazewo', NULL, 0, 52.4006, 18.731061, CURRENT_TIMESTAMP),
  ('smiely', 'Śmieły', NULL, 0, 52.40169, 18.8743, CURRENT_TIMESTAMP),
  ('swietoslawice', 'Świętosławice', NULL, 0, 52.388768, 18.73885, CURRENT_TIMESTAMP),
  ('swiszewy', 'Świszewy', NULL, 0, 52.43781, 18.72736, CURRENT_TIMESTAMP),
  ('tymien', 'Tymień', NULL, 0, 52.400744, 18.774493, CURRENT_TIMESTAMP),
  ('wietrzychowice', 'Wietrzychowice', NULL, 0, 52.41238, 18.85958, CURRENT_TIMESTAMP),
  ('wiszczelice', 'Wiszczelice', NULL, 0, 52.370456, 18.874961, CURRENT_TIMESTAMP),
  ('wolka-komorowska', 'Wólka Komorowska', NULL, 0, 52.381547, 18.775993, CURRENT_TIMESTAMP),
  ('zdzislawin', 'Zdzisławin', NULL, 0, 52.368, 18.855525, CURRENT_TIMESTAMP)
ON CONFLICT(slug) DO UPDATE SET
  name       = excluded.name,
  latitude   = excluded.latitude,
  longitude  = excluded.longitude,
  updated_at = CURRENT_TIMESTAMP;

-- ── 3. Zerowanie wymyślonych liczników ──────────────────────────────
-- 0053 wpisała tu liczby przeniesione z `articleCount` w taxonomy.ts.
-- Były wymyślone: żaden artykuł nie ma ustawionego solectwo_slug.
-- „12 materiałów" przy wsi bez ani jednego to obietnica wobec
-- czytelnika, której kliknięcie nie spełnia.
UPDATE solectwa
   SET news_count = (
         SELECT COUNT(*) FROM articles a
          WHERE a.solectwo_slug = solectwa.slug
            AND a.status = 'published'
            AND a.deleted_at IS NULL
       ),
       updated_at = CURRENT_TIMESTAMP;

-- ── 4. Indeks pod zapytania mapy ────────────────────────────────────
-- Mapa pobiera wszystkie punkty z niepustymi współrzędnymi. Przy 37
-- wierszach skan tabeli jest tani, ale indeks częściowy kosztuje
-- kilkaset bajtów i zabezpiecza zapytanie, gdy dojdą przysiółki.
CREATE INDEX IF NOT EXISTS idx_solectwa_wspolrzedne
  ON solectwa (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ── Kontrola po migracji (uruchom ręcznie) ──────────────────────────
-- Wiersze zachowane mimo braku na ustalonej liście (wpisany sołtys/opis):
--   SELECT slug, name, soltys FROM solectwa
--    WHERE slug IN ('sadlno', 'bierzyn', 'sarnowo', 'lubomin', …);
-- Sołectwa bez współrzędnych (nie powinno być żadnego):
--   SELECT slug FROM solectwa WHERE latitude IS NULL;
