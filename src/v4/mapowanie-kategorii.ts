/**
 * Uzgodnienie kategorii z bazy z taksonomia szaty v4 — JEDNO zrodlo prawdy.
 *
 * DLACZEGO TEN PLIK ISTNIEJE
 *
 * Baza uzywa 21 kategorii dla artykulow (`inwestycje`, `komunikaty`, `sport`,
 * `nekrologi`, `praca`…), a taksonomia szaty v4 zna 11 kategorii glownych i
 * rejestruje trasy tylko dla nich. Przelozenie jednego slownika na drugi
 * istnialo juz w `src/v4/content-source.ts`, ale TYLKO tam — czyli obowiazywalo
 * dla stron renderowanych na serwerze i dla mapy witryny, a nie obowiazywalo
 * dla API.
 *
 * SKUTEK ZMIERZONY PRZED POPRAWKA
 *
 * `GET /api/v1/articles?limit=30` zwracalo 30 pozycji, kazda z gotowym polem
 * `url`. Sprawdzenie kazdego z tych adresow po kolei:
 *
 *     200 = 9,  404 = 21
 *
 * Adresy 404 to te, ktorych kategoria z bazy nie istnieje w szacie:
 *     /inwestycje/remont-ulicy-koscielnej…   404   (poprawnie: /wiadomosci/inwestycje/…)
 *     /sport/kujawianka-wygrywa-z-wloclavia  404   (poprawnie: /kujawianka/…)
 *     /zycie/poradnik-jak-przygotowac-ogrod  404   (poprawnie: /zycie-codzienne/…)
 *     /nekrologi/…  /praca/…  /zdrowie/…  /edukacja/…  /rolnictwo/… — wszystkie 404
 *
 * Te same artykuly byly jednoczesnie dostepne pod adresami z mapy witryny
 * (`/wiadomosci/inwestycje/remont-…` = 200), bo sitemap buduje adresy przez
 * `loadSnapshot()`, ktore mapowanie stosuje. Czyli tresc istniala i dzialala —
 * to API podawalo do niej bledny adres.
 *
 * Kto na tym tracil: kazdy klient API. Doladowywanie listy (infinite scroll),
 * podpowiedzi wyszukiwania i aplikacja mobilna generowaly z pola `url` linki
 * prowadzace mieszkanca w blad 404 w 70% przypadkow.
 *
 * DLACZEGO OSOBNY MODUL, A NIE IMPORT Z content-source.ts
 *
 * `content-source.ts` wciaga kontekst Hono, `AsyncLocalStorage` i cala warstwe
 * zapytan do D1. Import tego z trasy API dolozylby te zaleznosci bez potrzeby,
 * a test jednostkowy mapowania wymagalby atrapy bazy. Tutaj zaleznoscia jest
 * wylacznie taksonomia, wiec regule mozna sprawdzic bezposrednio.
 */

import { findCategory, findSubcategory } from './taxonomy'

/**
 * Kategoria z bazy -> (kategoria szaty, opcjonalna podkategoria).
 *
 * Drobniejszy podzial z bazy nie ginie: zapisujemy go jako podkategorie, wiec
 * `inwestycje` z bazy daje adres `/wiadomosci/inwestycje/<slug>`, a nie samo
 * `/wiadomosci/<slug>`.
 */
export const KATEGORIE_BAZY: Record<string, { category: string; subcategory?: string }> = {
  wiadomosci: { category: 'wiadomosci' },
  komunikaty: { category: 'wiadomosci', subcategory: 'komunikaty' },
  inwestycje: { category: 'wiadomosci', subcategory: 'inwestycje' },
  edukacja: { category: 'wiadomosci', subcategory: 'edukacja' },
  zdrowie: { category: 'wiadomosci', subcategory: 'zdrowie' },
  spoleczne: { category: 'wiadomosci', subcategory: 'spoleczne' },
  srodowisko: { category: 'wiadomosci', subcategory: 'srodowisko' },
  rolnictwo: { category: 'wiadomosci', subcategory: 'rolnictwo' },
  samorzad: { category: 'samorzad' },
  rada: { category: 'samorzad', subcategory: 'rada' },
  solectwa: { category: 'samorzad', subcategory: 'solectwa' },
  'na-sygnale': { category: 'na-sygnale' },
  kultura: { category: 'kultura' },
  kalendarz: { category: 'kultura', subcategory: 'kalendarz' },
  historia: { category: 'historia' },
  ludzie: { category: 'ludzie' },
  sport: { category: 'kujawianka' },
  kujawianka: { category: 'kujawianka' },
  multimedia: { category: 'multimedia' },
  'przeglad-mediow': { category: 'przeglad-mediow' },
  zycie: { category: 'zycie-codzienne' },
  'zycie-codzienne': { category: 'zycie-codzienne' },
  ogloszenia: { category: 'ogloszenia' },
  nekrologi: { category: 'ogloszenia', subcategory: 'nekrologi' },
  praca: { category: 'ogloszenia', subcategory: 'praca' },
  nieruchomosci: { category: 'ogloszenia', subcategory: 'nieruchomosci' },
  uslugi: { category: 'ogloszenia', subcategory: 'uslugi' },
}

/**
 * Zwraca pare (kategoria, podkategoria) w slowniku szaty v4.
 *
 * Podkategoria jest sprawdzana wzgledem taksonomii, bo router rejestruje trasy
 * `/kategoria/podkategoria/slug` tylko dla par obecnych w CATEGORIES.
 * Podkategoria nieznana szacie dawalaby link w 404 — wtedy lepiej pokazac
 * artykul pod `/kategoria/slug`, ktory na pewno istnieje.
 *
 * Kategoria nieznana trafia do `wiadomosci`, bo `findCategory() === undefined`
 * w komponencie konczy sie bledem 500 przy pierwszym uzyciu `cat.tagClass`.
 */
export const rozwiazTaksonomie = (
  categorySlug: string | null,
  subcategorySlug: string | null,
): { category: string; subcategory?: string } => {
  const mapped = KATEGORIE_BAZY[categorySlug ?? ''] ?? { category: 'wiadomosci' }
  const known = findCategory(mapped.category)
  const category = known ? mapped.category : 'wiadomosci'

  const candidate = subcategorySlug ?? mapped.subcategory
  const valid =
    candidate && findSubcategory(category, candidate) ? candidate : mapped.subcategory

  return {
    category,
    subcategory: valid && findSubcategory(category, valid) ? valid : undefined,
  }
}

/**
 * Kategoria szaty -> lista kategorii bazy, ktore do niej naleza.
 *
 * Mapowanie odwrotne, potrzebne przy FILTROWANIU. Mapa `KATEGORIE_BAZY` sluzy
 * do budowy adresu (baza -> szata), ale klient API idzie w druga strone: zna
 * slug z adresu strony (`/kujawianka`) i chce artykuly tej sekcji.
 *
 * SKUTEK ZMIERZONY PRZED POPRAWKA
 *
 *     GET /api/v1/articles?category=kujawianka       -> total = 0
 *     GET /api/v1/articles?category=sport            -> total = 2
 *     GET /api/v1/articles?category=wiadomosci       -> total = 0
 *     GET /api/v1/articles?category=zycie-codzienne  -> total = 0
 *
 * Filtr porownywal parametr wprost z `categories.slug`, wiec dzialal tylko dla
 * kategorii, ktore w obu slownikach nazywaja sie tak samo. `infinite-scroll.js`
 * bierze slug z `window.location.pathname`, czyli ZAWSZE slug szaty — dla
 * `/kujawianka`, `/wiadomosci` i `/zycie-codzienne` doladowywanie dostawalo
 * pusta liste i oglaszalo „To juz wszystkie materialy”, mimo ze artykuly byly.
 *
 * Zauwaz, ze `wiadomosci` musi objac 8 kategorii bazy (`komunikaty`,
 * `inwestycje`, `edukacja`…) — dlatego wartoscia jest lista, nie jeden slug.
 */
export const KATEGORIE_SZATY: Record<string, string[]> = Object.entries(
  KATEGORIE_BAZY,
).reduce<Record<string, string[]>>((acc, [slugBazy, { category }]) => {
  ;(acc[category] ??= []).push(slugBazy)
  return acc
}, {})

/**
 * Slugi kategorii bazy odpowiadajace podanemu slugowi z zapytania.
 *
 * Przyjmuje jedno i drugie nazewnictwo, bo oba wystepuja w realnym ruchu:
 * strony linkuja slugami szaty, a starsze klienty i panel redakcyjny —
 * slugami bazy. Zwraca liste do uzycia w `IN (…)`.
 */
export const slugiBazyDlaFiltru = (slug: string): string[] => {
  const zeSzaty = KATEGORIE_SZATY[slug]
  if (zeSzaty && zeSzaty.length > 0) return zeSzaty
  // Slug nieznany szacie, ale obecny w bazie (np. `inwestycje`) — filtruj po nim.
  return [slug]
}

/**
 * Adres artykulu na portalu, zbudowany z kategorii zapisanych w bazie.
 *
 * Rownowazny `articleUrl()` z content-types.ts, ale przyjmuje surowe kolumny
 * bazy i sam stosuje mapowanie. Uzywany przez trasy API, ktore operuja na
 * wierszach z D1, a nie na gotowym typie `Article`.
 */
export const adresArtykuluZBazy = (a: {
  category_slug: string | null
  subcategory_slug: string | null
  slug: string
}): string => {
  const { category, subcategory } = rozwiazTaksonomie(a.category_slug, a.subcategory_slug)
  return subcategory ? `/${category}/${subcategory}/${a.slug}` : `/${category}/${a.slug}`
}
