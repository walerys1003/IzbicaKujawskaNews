/**
 * Etap I10 — generator migracji 0055: poprawa listy sołectw w bazie
 * i uzupełnienie współrzędnych.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CO NAPRAWIA I DLACZEGO OSTROŻNIE
 * ═══════════════════════════════════════════════════════════════════════
 * Migracja 0053 wstawiła do tabeli `solectwa` 34 wiersze z listy, w której
 * 16 nazw nie było sołectwami tej gminy (trzy leżą w gminach sąsiednich).
 * Trzeba je usunąć i wstawić 36 prawdziwych ze współrzędnymi.
 *
 * Usuwanie wierszy z bazy to operacja nieodwracalna, więc:
 *
 *   — NIE robimy `DELETE FROM solectwa`. Gdyby redakcja dopisała
 *     w panelu sołectwo albo nazwisko sołtysa, wyczyszczenie tabeli
 *     skasowałoby tę pracę bez ostrzeżenia.
 *   — Usuwamy WYŁĄCZNIE wiersze o slugach wymienionych imiennie
 *     (`DELETE … WHERE slug IN (…)`), i tylko te, które nie mają
 *     wpisanego sołtysa ani opisu — czyli takie, których nikt nie ruszał.
 *     Wiersz z wpisanym sołtysem zostaje i trafia do raportu; decyzja
 *     o nim należy do redakcji, nie do migracji.
 *   — Prawdziwe sołectwa wstawiamy przez `INSERT … ON CONFLICT DO UPDATE`,
 *     ale aktualizujemy tylko `name`, `latitude`, `longitude`. Pola
 *     `soltys`, `population`, `description` zostają nietknięte, jeśli
 *     ktoś je wypełnił.
 *
 * `news_count` ustawiamy na 0 (i nie nadpisujemy istniejącej wartości
 * większej od zera). W 0053 były tam liczby przeniesione z wymyślonych
 * `articleCount` — pokazywały „12 materiałów" dla wsi bez ani jednego.
 *
 * URUCHOMIENIE:
 *   node scripts/i10-generuj-migracje.mjs > migrations/0055_solectwa_poprawka.sql
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dane = JSON.parse(readFileSync(resolve(KORZEN, 'data/solectwa-osm.json'), 'utf8'))

/**
 * Slugi wstawione przez 0053, których nie ma na ustalonej liście.
 * Wypisane jawnie, nie wyliczane różnicą zbiorów — DELETE ma operować
 * na zamkniętym, widocznym w kodzie wykazie, żeby zmiana w pliku danych
 * nigdy nie mogła rozszerzyć zakresu usuwania.
 */
const DO_USUNIECIA = [
  'sadlno', 'bierzyn', 'sarnowo', 'lubomin', 'cieszyno', 'krzeszyn',
  'rzezno', 'bartlomiejowice', 'orle', 'smarliny', 'popowo',
  'szczerkowo', 'zagrodnica', 'augustowo', 'konary', 'debianki',
  'wolka-komorowska-stara',
]

const q = (s) => `'${String(s).replace(/'/g, "''")}'`

const punkty = dane.punkty
const solectwa = punkty.filter((p) => p.solectwo)

if (solectwa.length < 30) {
  console.error('[i10] Za mało sołectw (%d). Przerywam.', solectwa.length)
  process.exit(1)
}

const linie = []
const w = (s = '') => linie.push(s)

w('-- =====================================================================')
w('-- 0055 — poprawa listy sołectw + współrzędne dla mapy (etap I10)')
w('--')
w('-- PLIK GENEROWANY. Nie edytuj ręcznie.')
w('--   node scripts/i10-generuj-migracje.mjs > migrations/0055_solectwa_poprawka.sql')
w('--')
w('-- Migracja 0053 wstawiła listę, w której 16 nazw nie było sołectwami')
w('-- gminy Izbica Kujawska. Bierzyn i Lubomin należą do gminy Boniewo,')
w('-- Sarnowo do gminy Lubraniec — portal przypisywał sobie teren obcych')
w('-- gmin. Pozostałych OpenStreetMap nie zna w tym rejonie.')
w('--')
w('-- Źródła ustalonej listy:')
w(`--   ${dane.zrodla.listaSolectw}`)
w(`--   ${dane.zrodla.wspolrzedne}`)
w(`--   ${dane.zrodla.licencjaOsm}`)
w('-- =====================================================================')
w()

w('-- ── 1. Usunięcie wpisów nieistniejących ─────────────────────────────')
w('-- Warunek `soltys IS NULL AND description IS NULL` chroni pracę')
w('-- redakcji: wiersz, w którym ktoś wpisał nazwisko sołtysa albo opis,')
w('-- NIE zostanie usunięty. Taki wiersz trzeba obejrzeć ręcznie —')
w('-- zapytanie kontrolne na końcu tego pliku go pokaże.')
w('DELETE FROM solectwa')
w(` WHERE slug IN (${DO_USUNIECIA.map(q).join(', ')})`)
w('   AND soltys IS NULL')
w('   AND description IS NULL;')
w()

w('-- ── 2. Wstawienie/aktualizacja sołectw ze współrzędnymi ─────────────')
w('-- ON CONFLICT aktualizuje wyłącznie nazwę i współrzędne. `soltys`,')
w('-- `population`, `area_ha` i `description` zostają nietknięte —')
w('-- migracja nie ma prawa nadpisać danych wpisanych przez człowieka.')
w('INSERT INTO solectwa (slug, name, soltys, news_count, latitude, longitude, updated_at) VALUES')
const wiersze = punkty.map(
  (p) =>
    `  (${q(p.slug)}, ${q(p.nazwa)}, NULL, 0, ${p.lat}, ${p.lon}, CURRENT_TIMESTAMP)`
)
w(wiersze.join(',\n'))
w('ON CONFLICT(slug) DO UPDATE SET')
w('  name       = excluded.name,')
w('  latitude   = excluded.latitude,')
w('  longitude  = excluded.longitude,')
w('  updated_at = CURRENT_TIMESTAMP;')
w()

w('-- ── 3. Zerowanie wymyślonych liczników ──────────────────────────────')
w('-- 0053 wpisała tu liczby przeniesione z `articleCount` w taxonomy.ts.')
w('-- Były wymyślone: żaden artykuł nie ma ustawionego solectwo_slug.')
w('-- „12 materiałów" przy wsi bez ani jednego to obietnica wobec')
w('-- czytelnika, której kliknięcie nie spełnia.')
w('UPDATE solectwa')
w('   SET news_count = (')
w('         SELECT COUNT(*) FROM articles a')
w('          WHERE a.solectwo_slug = solectwa.slug')
w("            AND a.status = 'published'")
w('            AND a.deleted_at IS NULL')
w('       ),')
w('       updated_at = CURRENT_TIMESTAMP;')
w()

w('-- ── 4. Indeks pod zapytania mapy ────────────────────────────────────')
w('-- Mapa pobiera wszystkie punkty z niepustymi współrzędnymi. Przy 37')
w('-- wierszach skan tabeli jest tani, ale indeks częściowy kosztuje')
w('-- kilkaset bajtów i zabezpiecza zapytanie, gdy dojdą przysiółki.')
w('CREATE INDEX IF NOT EXISTS idx_solectwa_wspolrzedne')
w('  ON solectwa (latitude, longitude)')
w('  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;')
w()

w('-- ── Kontrola po migracji (uruchom ręcznie) ──────────────────────────')
w('-- Wiersze zachowane mimo braku na ustalonej liście (wpisany sołtys/opis):')
w('--   SELECT slug, name, soltys FROM solectwa')
w(`--    WHERE slug IN (${DO_USUNIECIA.slice(0, 4).map(q).join(', ')}, …);`)
w('-- Sołectwa bez współrzędnych (nie powinno być żadnego):')
w('--   SELECT slug FROM solectwa WHERE latitude IS NULL;')

process.stdout.write(linie.join('\n') + '\n')
console.error('[i10] wygenerowano migrację: %d punktów (%d sołectw), %d slugów do usunięcia',
  punkty.length, solectwa.length, DO_USUNIECIA.length)
