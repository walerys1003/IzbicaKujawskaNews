/*
  MAPA WITRYNY, KANAŁ RSS I SITEMAPA GOOGLE NEWS — kontrakt zmierzony 2026-07-28.

  CO TU BYŁO WCZEŚNIEJ I DLACZEGO NIC NIE CHRONIŁO
  ------------------------------------------------
  Poprzedni test wywoływał `generateArticleSitemapEntries()` i sprawdzał, czy
  liczba wpisów równa się `ARTICLES.length` — czyli porównywał tablicę mocków
  z sitemapą zbudowaną z tej samej tablicy. Tautologia: przechodził na zielono
  także wtedy, gdy 20 z 29 adresów w prawdziwym /sitemap.xml zwracało 404.
  Testowana funkcja nie była nawet używana przez portal.

  CO SPRAWDZAM TERAZ
  ------------------
  Adresy w mapie witryny muszą być zbudowane tą samą funkcją `articleUrl()`,
  której używają karty na stronie — inaczej mapa opisuje stronę, która nie
  istnieje. Dane wejściowe mają kształt `Article` z v4 (autor to OBIEKT, data
  w formacie D1 „RRRR-MM-DD GG:MM:SS"), bo takie właśnie wiersze przychodzą
  z bazy. Poprzednia wersja generatorów zakładała łańcuch znaków i dawała
  „[object Object]" oraz „Invalid Date" w kanale RSS.
*/
import { describe, expect, it } from 'vitest'
import { generateSitemap, generateRss, generateNewsSitemap } from '../../../src/seo'
import { CATEGORY_SLUGS } from '../../../src/v4/taxonomy'
import type { Article } from '../../../src/v4/content-types'

/** Wiersz D1 przetłumaczony na `Article` — format daty jak w bazie, nie ISO. */
const artykul = (nadpisz: Partial<Article> = {}): Article =>
  ({
    id: '1',
    slug: 'remont-ulicy-koscielnej-zakonczony-przed-terminem',
    type: 'article',
    status: 'published',
    category: 'inwestycje',
    title: 'Remont ulicy Kościelnej zakończony przed terminem',
    lede: 'Prace drogowe zakończyły się tydzień szybciej niż planowano.',
    blocks: [],
    author: {
      slug: 'redakcja',
      name: 'Redakcja izbica24.pl',
      role: 'Zespół redakcyjny',
      email: 'redakcja@izbica24.pl',
    },
    publishedAt: '2026-07-28 07:34:49',
    publishedAtISO: '2026-07-28T07:34:49.000Z',
    readingMinutes: 3,
    views: 400,
    commentCount: 0,
    tags: [],
    ...nadpisz,
  }) as Article

describe('sitemap.xml', () => {
  it('adres artykułu pochodzi z kategorii i sluga, nie ze stałego /wiadomosci/', () => {
    const xml = generateSitemap([artykul()])

    /* Sedno defektu: generator sklejał /wiadomosci/<slug> dla KAŻDEGO
       artykułu, także takiego z kategorii „inwestycje" — stąd 404. */
    expect(xml).toContain('<loc>https://izbica24.pl/inwestycje/remont-ulicy-koscielnej-zakonczony-przed-terminem</loc>')
    expect(xml).not.toContain('/wiadomosci/remont-ulicy-koscielnej-zakonczony-przed-terminem')
  })

  it('uwzględnia podkategorię w adresie, gdy artykuł ją ma', () => {
    const xml = generateSitemap([artykul({ category: 'kultura', subcategory: 'mgck', slug: 'lato-2026' })])
    expect(xml).toContain('<loc>https://izbica24.pl/kultura/mgck/lato-2026</loc>')
  })

  it('wypisuje kategorie z taksonomii v4, bo tylko te trasy istnieją', () => {
    const xml = generateSitemap([])

    /* Kategorie były brane z CATEGORIES_MAP (sport, zdrowie, edukacja…),
       a router obsługuje inny zbiór — 8 adresów kończyło się 404. */
    for (const slug of CATEGORY_SLUGS) {
      expect(xml, `brak kategorii /${slug}`).toContain(`<loc>https://izbica24.pl/${slug}</loc>`)
    }
    expect(CATEGORY_SLUGS).toContain('na-sygnale')

    /* Te slugi NIE są kategoriami portalu — ich obecność oznaczałaby powrót
       do listy z mocków. */
    for (const nieistnieje of ['sport', 'zdrowie', 'edukacja', 'rolnictwo']) {
      expect(xml, `/${nieistnieje} nie jest kategorią portalu`).not.toContain(
        `<loc>https://izbica24.pl/${nieistnieje}</loc>`,
      )
    }
  })

  it('lastmod bierze datę artykułu, a nie dzisiejszą dla wszystkiego', () => {
    const xml = generateSitemap([artykul({ updatedAt: '2026-03-15 10:00:00' })])
    expect(xml).toContain('<lastmod>2026-03-15</lastmod>')
  })

  it('działa bez artykułów — same strony stałe, bez pustych wpisów', () => {
    const xml = generateSitemap()
    expect(xml).toContain('<loc>https://izbica24.pl/</loc>')
    expect(xml).not.toContain('<loc></loc>')
  })
})

describe('rss.xml', () => {
  it('autor to imię z obiektu, nie [object Object]', () => {
    const xml = generateRss([artykul()])
    expect(xml).toContain('redakcja@izbica24.pl (Redakcja izbica24.pl)')
    expect(xml).not.toContain('object Object')
  })

  it('pubDate parsuje format daty z D1 zamiast dawać Invalid Date', () => {
    const xml = generateRss([artykul()])
    expect(xml).not.toContain('Invalid Date')
    expect(xml).toContain('<pubDate>Tue, 28 Jul 2026 07:34:49 GMT</pubDate>')
  })

  it('odnośnik i guid wskazują ten sam, prawdziwy adres artykułu', () => {
    const xml = generateRss([artykul()])
    const adres = 'https://izbica24.pl/inwestycje/remont-ulicy-koscielnej-zakonczony-przed-terminem'
    expect(xml).toContain(`<link>${adres}</link>`)
    expect(xml).toContain(`<guid isPermaLink="true">${adres}</guid>`)
  })

  it('ogranicza kanał do 20 pozycji', () => {
    const wiele = Array.from({ length: 30 }, (_, i) => artykul({ id: String(i), slug: `tekst-${i}` }))
    const xml = generateRss(wiele)
    expect(xml.match(/<item>/g)?.length).toBe(20)
  })
})

describe('news-sitemap.xml', () => {
  it('pomija materiały starsze niż 48 godzin, jak wymaga Google News', () => {
    const swiezy = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const stary = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

    const xml = generateNewsSitemap([
      artykul({ slug: 'swiezy', publishedAtISO: swiezy.toISOString(), publishedAt: swiezy.toISOString() }),
      artykul({ slug: 'stary', publishedAtISO: stary.toISOString(), publishedAt: stary.toISOString() }),
    ])

    /* Zmienna `cutoff` była policzona, ale nigdy nie użyta — pętla wypisywała
       cały zbiór, a Google News odrzuca taką sitemapę w całości. */
    expect(xml).toContain('/swiezy')
    expect(xml).not.toContain('/stary')
  })

  it('data publikacji to data artykułu, nie chwila wygenerowania pliku', () => {
    const opublikowano = new Date(Date.now() - 5 * 60 * 60 * 1000)
    const xml = generateNewsSitemap([
      artykul({ publishedAtISO: opublikowano.toISOString(), publishedAt: opublikowano.toISOString() }),
    ])
    expect(xml).toContain(`<news:publication_date>${opublikowano.toISOString()}</news:publication_date>`)
  })
})
