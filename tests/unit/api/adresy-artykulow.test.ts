/**
 * Test uzgodnienia kategorii bazy z taksonomia szaty.
 *
 * DLACZEGO ISTNIEJE. `GET /api/v1/articles` zwraca dla kazdego artykulu gotowe
 * pole `url`. Pomiar wszystkich 30 adresow na dzialajacym serwisie dal
 * 9 x 200 i 21 x 404 — API wysylalo klientow pod adresy, ktorych router nie
 * obsluguje, bo skladalo je wprost z kolumny `categories.slug` (21 kategorii
 * bazy), a trasy istnieja tylko dla 11 kategorii szaty.
 *
 * Defekt byl niewidoczny w testach, bo sprawdzaly kod odpowiedzi listy (200) i
 * kształt pozycji, a nie to, CZY ogloszony adres gdzies prowadzi.
 */

import { describe, it, expect } from 'vitest'
import {
  adresArtykuluZBazy,
  rozwiazTaksonomie,
  slugiBazyDlaFiltru,
  KATEGORIE_BAZY,
} from '../../../src/v4/mapowanie-kategorii'
import { CATEGORY_SLUGS, findCategory, findSubcategory } from '../../../src/v4/taxonomy'

const wiersz = (category_slug: string | null, slug = 'jakis-artykul', subcategory_slug: string | null = null) => ({
  category_slug,
  subcategory_slug,
  slug,
})

describe('adres artykulu budowany z kategorii bazy', () => {
  it('KAZDA kategoria bazy daje adres w kategorii znanej szacie', () => {
    // To jest wlasciwy warunek: router rejestruje trasy tylko dla
    // CATEGORY_SLUGS, wiec kategoria poza ta lista = gwarantowane 404.
    const klucze = Object.keys(KATEGORIE_BAZY)
    expect(klucze.length).toBeGreaterThanOrEqual(20) // gdyby mapa byla pusta, test przechodzilby na pusto

    for (const slugBazy of klucze) {
      const { category, subcategory } = rozwiazTaksonomie(slugBazy, null)
      expect(CATEGORY_SLUGS, `kategoria '${category}' (z bazy '${slugBazy}') poza taksonomia`).toContain(category)
      if (subcategory) {
        expect(findSubcategory(category, subcategory), `podkategoria '${category}/${subcategory}' nie istnieje`).toBeTruthy()
      }
    }
  })

  it('inwestycje z bazy daja /wiadomosci/inwestycje/..., a nie /inwestycje/...', () => {
    // Dokladnie ten adres zwracal 404 w pomiarze.
    expect(adresArtykuluZBazy(wiersz('inwestycje', 'remont-ulicy-koscielnej-zakonczony-przed-terminem')))
      .toBe('/wiadomosci/inwestycje/remont-ulicy-koscielnej-zakonczony-przed-terminem')
  })

  it('sport z bazy daje /kujawianka/..., bo szata nie ma kategorii sport', () => {
    expect(findCategory('sport')).toBeUndefined()
    expect(adresArtykuluZBazy(wiersz('sport', 'kujawianka-wygrywa-z-wloclavia')))
      .toBe('/kujawianka/kujawianka-wygrywa-z-wloclavia')
  })

  it('zycie z bazy daje /zycie-codzienne/...', () => {
    expect(adresArtykuluZBazy(wiersz('zycie', 'poradnik-ogrod'))).toBe('/zycie-codzienne/poradnik-ogrod')
  })

  it('nekrologi i praca trafiaja pod ogloszenia jako podkategorie', () => {
    expect(adresArtykuluZBazy(wiersz('nekrologi', 'nekrolog-x'))).toBe('/ogloszenia/nekrologi/nekrolog-x')
    expect(adresArtykuluZBazy(wiersz('praca', 'praca-kierowca'))).toBe('/ogloszenia/praca/praca-kierowca')
  })

  it('kategoria nieznana nie wyklada sie, lecz wpada do wiadomosci', () => {
    // findCategory() === undefined w komponencie konczy sie bledem 500
    // przy pierwszym uzyciu cat.tagClass, dlatego potrzebny jest domysl.
    expect(adresArtykuluZBazy(wiersz('kategoria-ktorej-nie-ma', 'x'))).toBe('/wiadomosci/x')
    expect(adresArtykuluZBazy(wiersz(null, 'x'))).toBe('/wiadomosci/x')
  })

  it('podkategoria nieznana szacie jest odrzucana, zeby nie budowac adresu w 404', () => {
    const adres = adresArtykuluZBazy(wiersz('samorzad', 'x', 'podkategoria-widmo'))
    expect(adres).toBe('/samorzad/x')
  })
})

describe('filtrowanie listy po kategorii', () => {
  it('slug szaty obejmuje wszystkie odpowiadajace mu kategorie bazy', () => {
    // Pomiar przed poprawka: ?category=wiadomosci -> total = 0,
    // mimo ze 12 artykulow nalezy do tej sekcji portalu.
    const slugi = slugiBazyDlaFiltru('wiadomosci')
    expect(slugi).toContain('wiadomosci')
    expect(slugi).toContain('inwestycje')
    expect(slugi).toContain('edukacja')
    expect(slugi.length).toBeGreaterThan(1)
  })

  it('kujawianka obejmuje takze sport (baza uzywa obu nazw)', () => {
    expect(slugiBazyDlaFiltru('kujawianka').sort()).toEqual(['kujawianka', 'sport'])
  })

  it('slug znany tylko bazie nadal filtruje po sobie samym', () => {
    // Starsze klienty i panel redakcyjny wysylaja slugi bazy — musza dzialac.
    expect(slugiBazyDlaFiltru('inwestycje')).toEqual(['inwestycje'])
  })

  it('slug nieznany nikomu nie rozszerza sie na cala baze', () => {
    // Zwrot pustej listy dalby SQL 'IN ()' i blad; zwrot wszystkiego
    // pokazalby artykuly z kategorii, o ktora nikt nie pytal.
    expect(slugiBazyDlaFiltru('zmyslona-kategoria')).toEqual(['zmyslona-kategoria'])
  })
})
