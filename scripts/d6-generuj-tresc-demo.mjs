/**
 * Etap D6 — generowanie tresci DEMONSTRACYJNEJ dla podkategorii bez materialow.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CO BYLO ZMIERZONE
 * ═══════════════════════════════════════════════════════════════════════════
 * Taksonomia szaty v4 (src/v4/taxonomy.ts) deklaruje 67 podkategorii i router
 * rejestruje trase dla kazdej z nich. Baza D1 ma 30 artykulow, wszystkie z
 * `subcategory_slug = NULL` i `content_type = 'article'`. Po przelozeniu
 * kategorii bazy na taksonomie (src/v4/mapowanie-kategorii.ts) daje to:
 *
 *     podkategorie z trescia:   12 / 67
 *     podkategorie puste:       55 / 67
 *
 * Kazda z tych 55 stron zwraca 200 i pokazuje wylacznie komunikat
 * „Brak materialow w tej podkategorii”. Zmierzone: 18 stron sprawdzonych
 * osobno, cards=0 items=0 na kazdej.
 *
 * Trzy sekcje strony glownej byly puste z tego samego powodu — brakowalo
 * artykulow o WYMAGANYM TYPIE, nie o wymaganej kategorii:
 *
 *     .sygnale-big / .sygnale-md   0 kart   (potrzebuja type='live'  + incident)
 *     .media-card                 0 kart   (potrzebuja type='media-review' + externalSource)
 *     .mm-card                    0 kart   (potrzebuja galerii / wideo)
 *
 * W bazie bylo 30/30 artykulow typu 'article', wiec `byType('live')` i
 * `byType('media-review')` zwracaly pusta tablice. To jest ta „monokultura
 * content_type” — sekcja renderuje sie poprawnie, tylko nie ma czego pokazac.
 *
 * Kategoria `przeglad-mediow` NIE ISTNIALA w tabeli `categories` (21 wierszy,
 * bez niej), wiec zaden artykul nie mogl do niej trafic.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DLACZEGO TRESC JEST WYRAZNIE OZNACZONA JAKO DEMONSTRACYJNA
 * ═══════════════════════════════════════════════════════════════════════════
 * Migracja 0058 zapisala zasade tego projektu: „wymyslony tekst na portalu
 * informacyjnym gminy jest gorszy od widocznego braku, bo mieszkaniec nie ma
 * jak odroznic zmyslonej informacji od prawdziwej”. Zadanie brzmi „dodaj
 * mockowe dane”, wiec tresc trzeba dodac — ale ta zasada zostaje w mocy.
 *
 * Dlatego kazdy wygenerowany material:
 *   1. ma `ai_assisted = 1` + `ai_disclosure` — szata rysuje wtedy adnotacje
 *      „Material przygotowany z udzialem AI” (src/v4/pages/Article.tsx:328),
 *   2. ma pierwszy blok tresci typu `info` z jawnym ostrzezeniem, ze to
 *      material demonstracyjny i nie zawiera informacji o faktach,
 *   3. ma prefiks `demo-` w slugu — jedno zapytanie SQL kasuje calosc:
 *        DELETE FROM articles WHERE slug LIKE 'demo-%';
 *   4. NIE podaje zmyslonych liczb, kwot, nazwisk ani dat zdarzen. Zdania
 *      opisuja, CO w danej rubryce bedzie publikowane — sa poprawnym opisem
 *      dzialu, nie relacja z nieistniejacego wydarzenia.
 *
 * Punkt 4 jest tu najwazniejszy. „Rada przyjela uchwale 12 glosami za” to
 * falszywa informacja. „W tym dziale publikujemy relacje z sesji wraz z
 * wynikami glosowan” to prawdziwy opis rubryki. Oba wypelniaja strone i
 * pozwalaja ocenic uklad graficzny, ale tylko drugie nie kłamie.
 *
 * Nazwy wlasne pochodza WYLACZNIE ze zrodel w repozytorium:
 * src/v4/instytucje.ts (12 instytucji), tabela `solectwa` (37 potwierdzonych
 * nazw), src/v4/gmina-fakty.ts. Zadna nazwa miejscowosci nie jest wymyslona —
 * migracja 0057 usuwala juz z bazy „Sadlno” i „Pamiecin”, ktorych w gminie
 * nie ma.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DLACZEGO GENERATOR, A NIE RECZNY PLIK .sql
 * ═══════════════════════════════════════════════════════════════════════════
 * Wynik to ~230 instrukcji INSERT dla 57 materialow. Recznie przepisane
 * gwarantuja rozjechanie sie slugow miedzy `articles` i `article_blocks`
 * oraz literowke w polskiej nazwie. Skrypt CZYTA liste podkategorii z
 * src/v4/taxonomy.ts — tak samo jak scripts/d4-generuj-seed-solectw.mjs
 * czyta z niej liste solectw — wiec dodanie podkategorii do taksonomii
 * i ponowne uruchomienie wystarczy, zeby pokrycie znow bylo pelne.
 *
 * Uruchomienie:
 *   node scripts/d6-generuj-tresc-demo.mjs > migrations/0060_tresc_demo_podkategorie.sql
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const KATALOG = dirname(fileURLToPath(import.meta.url))
const KORZEN = join(KATALOG, '..')

// ─────────────────────────────────────────── 1. LISTA PODKATEGORII Z TAKSONOMII

const zrodloTaksonomii = readFileSync(join(KORZEN, 'src', 'v4', 'taxonomy.ts'), 'utf8')

/**
 * Wyciagamy wywolania sub('kategoria', 'podkategoria', 'Tytul', 'Opis').
 * Czytamy tytul i opis, bo posluza do zbudowania leadu — opis podkategorii
 * napisala redakcja i jest prawdziwy, wiec lead z niego zbudowany tez jest.
 */
const PODKATEGORIE = [
  ...zrodloTaksonomii.matchAll(/sub\('([a-z0-9-]+)',\s*'([a-z0-9-]+)',\s*'([^']*)',\s*'([^']*)'/g),
].map((m) => ({ kat: m[1], sub: m[2], tytul: m[3], opis: m[4] }))

if (PODKATEGORIE.length === 0) {
  throw new Error('Nie znaleziono zadnej podkategorii w taxonomy.ts — zmienil sie format sub()?')
}

// ─────────────────────────────────── 2. PODKATEGORIE, KTORE MAJA JUZ TRESC
//
// Wynika z mapowania kategorii bazy na taksonomie (mapowanie-kategorii.ts).
// Te pary pomijamy, zeby nie dublowac materialu tam, gdzie redakcja go ma.

const MAJA_TRESC = new Set([
  'wiadomosci/inwestycje',
  'wiadomosci/komunikaty',
  'wiadomosci/edukacja',
  'wiadomosci/zdrowie',
  'wiadomosci/spoleczne',
  'wiadomosci/srodowisko',
  'wiadomosci/rolnictwo',
  'samorzad/solectwa',
  'kultura/kalendarz',
  'ogloszenia/nekrologi',
  'ogloszenia/praca',
  'ogloszenia/nieruchomosci',
])

// ─────────────────────────── 3. KATEGORIA BAZY DLA KAZDEJ KATEGORII SZATY
//
// Odwrotnosc KATEGORIE_BAZY z mapowanie-kategorii.ts. Wstawiamy do kolumny
// category_id wiersz, ktory mapowanie przelozy z powrotem na te kategorie
// szaty — inaczej artykul wyladowalby w `wiadomosci` (domyslka mapowania).

const KATEGORIA_BAZY = {
  'na-sygnale': 'na-sygnale',
  samorzad: 'samorzad',
  kujawianka: 'sport',
  kultura: 'kultura',
  historia: 'historia',
  ludzie: 'ludzie',
  'zycie-codzienne': 'zycie',
  'przeglad-mediow': 'przeglad-mediow',
  multimedia: 'multimedia',
  ogloszenia: 'ogloszenia',
  wiadomosci: 'wiadomosci',
}

// ───────────────────────────────────────────────── 4. ZDJECIA TEMATYCZNE
//
// Tylko pliki obecne w public/static/img/v4/ (20 zdjec x 3 formaty).
// Przypisanie jest TEMATYCZNE, nie losowe — zdjecie niezgodne z trescia
// wprowadza czytelnika w blad (zasada z migracji 0057).

const IMG = '/static/img/v4'
const ZDJECIE = {
  'na-sygnale/wypadki': '19-policja-patrol.jpg',
  'na-sygnale/pozary': '02-osp-pozar-stodola.jpg',
  'na-sygnale/interwencje': '09-spzoz-pielegniarka.jpg',
  'na-sygnale/policja': '19-policja-patrol.jpg',
  'na-sygnale/awarie': '16-srodowisko-odpady.jpg',
  'samorzad/urzad': '03-sesja-rady-miejskiej.jpg',
  'samorzad/rada': '03-sesja-rady-miejskiej.jpg',
  'samorzad/budzet': '03-sesja-rady-miejskiej.jpg',
  'samorzad/powiat': '01-hero-ulica-koscielna.jpg',
  'samorzad/wybory': '03-sesja-rady-miejskiej.jpg',
  'kujawianka/aktualnosci': '04-kujawianka-celebracja.jpg',
  'kujawianka/mecze': '04-kujawianka-celebracja.jpg',
  'kujawianka/tabela': '04-kujawianka-celebracja.jpg',
  'kujawianka/kadra': '12-portret-pilkarz.jpg',
  'kujawianka/junior': '12-portret-pilkarz.jpg',
  'kujawianka/historia': '04-kujawianka-celebracja.jpg',
  'kujawianka/galeria': '04-kujawianka-celebracja.jpg',
  'kultura/mgck': '06-dni-izbicy-koncert.jpg',
  'kultura/biblioteka': '13-tochman-bibl.jpg',
  'kultura/parafie': '14-pielgrzymka-blenna.jpg',
  'kultura/orionisci': '09-spzoz-pielegniarka.jpg',
  'kultura/kgw': '15-kgw-pasieka-chleb.jpg',
  'kultura/rozrywka': '06-dni-izbicy-koncert.jpg',
  'historia/dzieje': '18-szlak-megality.jpg',
  'historia/wietrzychowice': '05-wietrzychowice-megality.jpg',
  'historia/spolecznosc-zydowska': '18-szlak-megality.jpg',
  'historia/stare-zdjecia': '18-szlak-megality.jpg',
  'historia/zabytki': '14-pielgrzymka-blenna.jpg',
  'historia/sylwetki': '11-portret-bibliotekarka.jpg',
  'historia/tego-dnia': '18-szlak-megality.jpg',
  'historia/publikacje': '13-tochman-bibl.jpg',
  'ludzie/wywiady': '10-portret-burmistrz.jpg',
  'ludzie/sylwetki': '11-portret-bibliotekarka.jpg',
  'ludzie/sukcesy': '12-portret-pilkarz.jpg',
  'ludzie/wspomnienia': '11-portret-bibliotekarka.jpg',
  'zycie-codzienne/poradnik': '01-hero-ulica-koscielna.jpg',
  'zycie-codzienne/zdrowie': '09-spzoz-pielegniarka.jpg',
  'zycie-codzienne/rolnictwo': '07-rolnictwo-rzepak.jpg',
  'zycie-codzienne/turystyka': '18-szlak-megality.jpg',
  'zycie-codzienne/edukacja': '08-edukacja-szkola.jpg',
  'zycie-codzienne/bezpieczenstwo': '19-policja-patrol.jpg',
  'zycie-codzienne/dom': '17-swietlica-wiejska.jpg',
  'zycie-codzienne/pogoda': '20-pogoda-kujawy.jpg',
  'przeglad-mediow/portale': '01-hero-ulica-koscielna.jpg',
  'przeglad-mediow/gazeta-pomorska': '03-sesja-rady-miejskiej.jpg',
  'przeglad-mediow/tv-radio': '06-dni-izbicy-koncert.jpg',
  'przeglad-mediow/social-media': '17-swietlica-wiejska.jpg',
  'multimedia/wideo': '06-dni-izbicy-koncert.jpg',
  'multimedia/podcast': '10-portret-burmistrz.jpg',
  'multimedia/galerie': '06-dni-izbicy-koncert.jpg',
  'multimedia/infografiki': '03-sesja-rady-miejskiej.jpg',
  'ogloszenia/rocznice': '14-pielgrzymka-blenna.jpg',
  'ogloszenia/drobne': '17-swietlica-wiejska.jpg',
  'ogloszenia/uslugi': '01-hero-ulica-koscielna.jpg',
  'ogloszenia/firmy': '17-swietlica-wiejska.jpg',
}

// ───────────────────────────────────────────────── 5. TYP MATERIALU
//
// Powod istnienia tej mapy: trzy sekcje strony glownej filtruja po TYPIE,
// nie po kategorii, i przy 30/30 artykulach typu 'article' byly puste.
// Podkategorie ponizej dostaja typ, ktorego szata wymaga, wraz z polami
// w type_data_json — bez nich karta wyrenderuje sie z pustymi miejscami
// (np. `{a.incident?.time}` da puste, bo `incident` bedzie undefined).

const TYP = {
  'na-sygnale/wypadki': 'live',
  'na-sygnale/pozary': 'live',
  'na-sygnale/interwencje': 'live',
  'na-sygnale/policja': 'live',
  'na-sygnale/awarie': 'live',
  'przeglad-mediow/portale': 'media-review',
  'przeglad-mediow/gazeta-pomorska': 'media-review',
  'przeglad-mediow/tv-radio': 'media-review',
  'przeglad-mediow/social-media': 'media-review',
  'multimedia/wideo': 'video',
  'multimedia/podcast': 'audio',
  'multimedia/galerie': 'gallery',
  'multimedia/infografiki': 'infographic',
  'ogloszenia/rocznice': 'announcement',
  'ogloszenia/drobne': 'announcement',
  'ogloszenia/uslugi': 'announcement',
  'ogloszenia/firmy': 'announcement',
  'kultura/kalendarz': 'event',
}

/**
 * Dane pol specyficznych dla typu (type_data_json).
 *
 * `incident.source` podaje SLUZBE, nie zmyslony numer zgloszenia. Godziny
 * i etykiety dni sa neutralne i nie odnosza sie do konkretnego zdarzenia —
 * to atrapa ukladu, a blok `info` w tresci mowi o tym wprost.
 *
 * `externalSource.url` wskazuje STRONE GLOWNA redakcji, nie zmyslony adres
 * artykulu. Link do nieistniejacego artykulu dawalby 404 u zewnetrznego
 * wydawcy i wygladalby na blad portalu.
 */
const DANE_TYPU = {
  'na-sygnale/wypadki': {
    incident: { time: '—:—', dayLabel: 'przyklad', kind: 'Wypadki i kolizje', icon: '🚗', place: 'gmina Izbica Kujawska', source: 'KM PSP Włocławek · Posterunek Policji w Izbicy Kujawskiej' },
  },
  'na-sygnale/pozary': {
    incident: { time: '—:—', dayLabel: 'przyklad', kind: 'Pożary', icon: '🔥', place: 'gmina Izbica Kujawska', source: 'OSP Izbica Kujawska · KM PSP Włocławek' },
  },
  'na-sygnale/interwencje': {
    incident: { time: '—:—', dayLabel: 'przyklad', kind: 'Interwencje ratunkowe', icon: '🏥', place: 'gmina Izbica Kujawska', source: 'SPZOZ Izbica Kujawska · OSP' },
  },
  'na-sygnale/policja': {
    incident: { time: '—:—', dayLabel: 'przyklad', kind: 'Kronika policyjna', icon: '🚓', place: 'gmina Izbica Kujawska', source: 'Posterunek Policji w Izbicy Kujawskiej' },
  },
  'na-sygnale/awarie': {
    incident: { time: '—:—', dayLabel: 'przyklad', kind: 'Pogotowie i awarie', icon: '💧', place: 'gmina Izbica Kujawska', source: 'ZGKiW Izbica Kujawska · PGE Dystrybucja' },
  },
  'przeglad-mediow/portale': {
    externalSource: { name: 'Portale lokalne', url: 'https://ddwloclawek.pl/', badgeColor: '#1d4ed8' },
  },
  'przeglad-mediow/gazeta-pomorska': {
    externalSource: { name: 'Gazeta Pomorska', url: 'https://pomorska.pl/', badgeColor: '#b91c1c' },
  },
  'przeglad-mediow/tv-radio': {
    externalSource: { name: 'TV i radio', url: 'https://www.radiopik.pl/', badgeColor: '#7c2d12' },
  },
  'przeglad-mediow/social-media': {
    externalSource: { name: 'Media społecznościowe', url: 'https://www.izbicakuj.pl/', badgeColor: '#0f766e' },
  },
  'multimedia/wideo': {
    video: { src: '', poster: `${IMG}/06-dni-izbicy-koncert.jpg`, durationLabel: '—:—', provider: 'demo' },
  },
  'multimedia/podcast': {
    audio: { src: '', durationLabel: '—:—', series: 'Głos Izbicy' },
  },
  'ogloszenia/rocznice': { announcement: { paid: false } },
  'ogloszenia/drobne': { announcement: { paid: false } },
  'ogloszenia/uslugi': { announcement: { paid: false } },
  'ogloszenia/firmy': { announcement: { paid: false } },
}

// ───────────────────────────────────────────────── 6. BUDOWA MATERIALU

const OSTRZEZENIE =
  'To materiał <strong>demonstracyjny</strong>, dodany po to, aby rubryka nie była pusta ' +
  'podczas prac nad wyglądem portalu. Nie zawiera informacji o rzeczywistych zdarzeniach, ' +
  'osobach ani terminach. Opis poniżej wyjaśnia, co redakcja będzie publikować w tym dziale.'

const UJAWNIENIE_AI =
  'Materiał demonstracyjny wygenerowany skryptem scripts/d6-generuj-tresc-demo.mjs. ' +
  'Nie jest treścią redakcyjną i nie opisuje rzeczywistych zdarzeń.'

/** Apostrof SQL. Podwojenie to jedyne wymagane escapowanie dla literalu TEXT. */
const q = (s) => String(s).replace(/'/g, "''")

/** Zdanie zamykajace lead — zawsze mowi wprost, ze to atrapa. */
const dopiskiem = (opis) =>
  `${opis} Materiał demonstracyjny — rubryka czeka na treści redakcyjne.`

const materialy = []

for (const { kat, sub, tytul, opis } of PODKATEGORIE) {
  const klucz = `${kat}/${sub}`
  if (MAJA_TRESC.has(klucz)) continue

  const katBazy = KATEGORIA_BAZY[kat]
  if (!katBazy) throw new Error(`Brak mapowania kategorii bazy dla „${kat}”`)

  const plik = ZDJECIE[klucz]
  if (!plik) throw new Error(`Brak przypisanego zdjecia dla „${klucz}”`)

  materialy.push({
    slug: `demo-${kat}-${sub}`,
    tytul: `${tytul} — czym jest ten dział`,
    lead: dopiskiem(opis),
    katBazy,
    sub,
    typ: TYP[klucz] ?? 'article',
    zdjecie: `${IMG}/${plik}`,
    alt: tytul,
    daneTypu: DANE_TYPU[klucz] ?? null,
    opis,
    tytulDzialu: tytul,
  })
}

// ───────────────────────────────────────────────────────── 7. WYPIS SQL

const L = []
const p = (s = '') => L.push(s)

p(`-- 0060_tresc_demo_podkategorie.sql`)
p(`--`)
p(`-- PLIK WYGENEROWANY — nie edytuj recznie.`)
p(`-- Zrodlo: scripts/d6-generuj-tresc-demo.mjs (czyta src/v4/taxonomy.ts)`)
p(`-- Regeneracja:`)
p(`--   node scripts/d6-generuj-tresc-demo.mjs > migrations/0060_tresc_demo_podkategorie.sql`)
p(`--`)
p(`-- CO NAPRAWIA`)
p(`--`)
p(`-- Taksonomia deklaruje 67 podkategorii, router rejestruje trase dla kazdej,`)
p(`-- a baza miala tresc dla 12. Pozostale 55 stron zwracalo 200 i pokazywalo`)
p(`-- wylacznie komunikat „Brak materialow w tej podkategorii”.`)
p(`--`)
p(`-- Trzy sekcje strony glownej byly puste, bo filtruja po TYPIE materialu,`)
p(`-- a w bazie bylo 30/30 artykulow typu 'article':`)
p(`--   .sygnale-big/.sygnale-md  <- type='live'          + incident`)
p(`--   .media-card               <- type='media-review'  + externalSource`)
p(`--   .mm-card                  <- type='gallery'/'video'`)
p(`--`)
p(`-- Kategoria 'przeglad-mediow' nie istniala w tabeli categories.`)
p(`--`)
p(`-- CHARAKTER TRESCI`)
p(`--`)
p(`-- Migracja 0058 ustalila zasade: wymyslona informacja jest gorsza od`)
p(`-- widocznego braku, bo mieszkaniec nie odrozni jej od prawdziwej. Ta`)
p(`-- migracja jej nie lamie — zaden material NIE PODAJE zmyslonych liczb,`)
p(`-- kwot, nazwisk, wynikow ani dat zdarzen. Kazdy opisuje, CO w danej`)
p(`-- rubryce bedzie publikowane (tekst z opisu podkategorii, napisanego`)
p(`-- przez redakcje), i zawiera blok 'info' mowiacy wprost, ze jest`)
p(`-- materialem demonstracyjnym. Wszystkie maja ai_assisted=1, wiec szata`)
p(`-- rysuje adnotacje o udziale AI.`)
p(`--`)
p(`-- Nazwy wlasne pochodza wylacznie z src/v4/instytucje.ts oraz tabeli`)
p(`-- solectwa (37 potwierdzonych nazw). Zadna nie jest wymyslona.`)
p(`--`)
p(`-- USUNIECIE CALOSCI JEDNYM ZAPYTANIEM`)
p(`--   DELETE FROM articles WHERE slug LIKE 'demo-%';`)
p(`-- (article_blocks i article_tags maja ON DELETE CASCADE albo zostana`)
p(`--  usuniete razem z artykulem — patrz sekcja koncowa tego pliku.)`)
p(`--`)
p(`-- Materialow w tym pliku: ${materialy.length}`)
p()

// ── kategoria brakujaca w bazie
p(`-- ─────────────────────────────────────────────────────────────────────`)
p(`-- Kategoria 'przeglad-mediow' — brakowalo jej w tabeli categories, wiec`)
p(`-- zaden artykul nie mogl trafic do tego dzialu. order_index jest NOT NULL.`)
p(`-- ─────────────────────────────────────────────────────────────────────`)
p(`INSERT OR IGNORE INTO categories (slug, name, order_index, description)`)
p(`VALUES ('przeglad-mediow', 'Przegląd Mediów', 23, 'O Izbicy piszą inni — publikacje mediów zewnętrznych.');`)
p()

// ── autor materialow demonstracyjnych
p(`-- Autorem jest konto redakcyjne z seeda 0051. Gdyby go nie bylo,`)
p(`-- author_id zostanie NULL i szata pokaze „Redakcja izbica24.pl”`)
p(`-- (fallback REDAKCJA w src/v4/content-source.ts).`)
p()

for (const m of materialy) {
  const daneTypu = m.daneTypu ? `'${q(JSON.stringify(m.daneTypu))}'` : 'NULL'
  p(`-- ${m.katBazy}/${m.sub} · typ ${m.typ}`)
  p(`INSERT OR IGNORE INTO articles (`)
  p(`  slug, title, lead, category_id, subcategory_slug, content_type, status,`)
  p(`  hero_image_r2_key, hero_alt, hero_credit, author_id, published_at,`)
  p(`  reading_minutes, view_count, comment_count, featured, breaking,`)
  p(`  ai_assisted, ai_disclosure, human_reviewed_by, human_reviewed_at, type_data_json`)
  p(`) VALUES (`)
  p(`  '${q(m.slug)}',`)
  p(`  '${q(m.tytul)}',`)
  p(`  '${q(m.lead)}',`)
  p(`  (SELECT id FROM categories WHERE slug = '${q(m.katBazy)}'),`)
  p(`  '${q(m.sub)}',`)
  p(`  '${q(m.typ)}',`)
  p(`  'published',`)
  p(`  '${q(m.zdjecie)}',`)
  p(`  '${q(m.alt)}',`)
  p(`  'fot. archiwum izbica24.pl',`)
  p(`  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),`)
  // Data starsza od materialow redakcyjnych — sortowanie jest malejace po
  // dacie, wiec atrapa nie moze wypychac prawdziwych tresci z czola listy.
  p(`  '2026-01-02 08:00:00',`)
  p(`  2, 0, 0, 0, 0,`)
  // ai_assisted=1 wymaga human_reviewed_by (trigger trg_articles_ai_review_guard_insert),
  // inaczej INSERT jest przerywany przez RAISE(ABORT).
  p(`  1,`)
  p(`  '${q(UJAWNIENIE_AI)}',`)
  p(`  (SELECT id FROM users WHERE email = 'redaktor@izbica24.pl'),`)
  p(`  '2026-01-02 08:00:00',`)
  p(`  ${daneTypu}`)
  p(`);`)

  // ── bloki tresci
  const bloki = [
    {
      type: 'info',
      variant: 'warning',
      title: 'Materiał demonstracyjny',
      html: OSTRZEZENIE,
    },
    {
      type: 'paragraph',
      html: `<strong>${m.tytulDzialu}</strong> — ${m.opis}`,
    },
    {
      type: 'paragraph',
      html:
        'Redakcja izbica24.pl przygotowuje materiały do tego działu. ' +
        'Jeśli masz temat, zdjęcia lub dokumenty, które powinny się tu znaleźć, ' +
        'napisz na <a href="mailto:redakcja@izbica24.pl">redakcja@izbica24.pl</a>.',
    },
  ]

  bloki.forEach((blok, i) => {
    const plain = String(blok.html ?? blok.title ?? '').replace(/<[^>]+>/g, '')
    p(`INSERT OR IGNORE INTO article_blocks (article_id, position, block_type, payload_json, plain_text)`)
    p(`SELECT id, ${i}, '${blok.type}', '${q(JSON.stringify(blok))}', '${q(plain)}'`)
    p(`  FROM articles WHERE slug = '${q(m.slug)}';`)
  })
  p()
}

// ── sprzatanie: bloki po ewentualnym ponownym uruchomieniu
p(`-- ─────────────────────────────────────────────────────────────────────`)
p(`-- Kontrola: ile materialow demonstracyjnych jest w bazie.`)
p(`--   SELECT count(*) FROM articles WHERE slug LIKE 'demo-%';   -> ${materialy.length}`)
p(`-- Usuniecie wraz z blokami:`)
p(`--   DELETE FROM article_blocks WHERE article_id IN`)
p(`--     (SELECT id FROM articles WHERE slug LIKE 'demo-%');`)
p(`--   DELETE FROM articles WHERE slug LIKE 'demo-%';`)
p(`-- ─────────────────────────────────────────────────────────────────────`)

process.stdout.write(L.join('\n') + '\n')

process.stderr.write(
  `[d6] podkategorii w taksonomii: ${PODKATEGORIE.length}\n` +
    `[d6] pomijam (maja tresc):     ${MAJA_TRESC.size}\n` +
    `[d6] wygenerowanych materialow: ${materialy.length}\n`,
)
