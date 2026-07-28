// SANDBOX C — task C14-C24: SEO module — sitemap, RSS, robots, OG meta, JSON-LD
import { ARTICLES, CATEGORIES_MAP } from './data-articles'
import { parseFlexibleDate } from './lib/dates'
import { CATEGORY_SLUGS } from './v4/taxonomy'
import type { Article } from './v4/content-types'
import { articleUrl } from './v4/content-types'

const SITE_URL = 'https://izbica24.pl'
const SITE_NAME = 'izbica24.pl'

/*
  ŹRÓDŁO DANYCH MAP WITRYNY — POMIAR Z 2026-07-28
  ===============================================
  Sitemapa, news-sitemapa i RSS budowały adresy z tablicy ARTICLES
  (`src/data-articles.ts`) oraz z kluczy CATEGORIES_MAP, a portal od etapu D4
  serwuje treść z D1 przez `src/v4/content-source.ts`. Dwa rozłączne zbiory
  dawały mapę witryny opisującą stronę, która nie istnieje.

  Zmierzone przez odpytanie każdego adresu z /sitemap.xml (29 wpisów):
    20 × HTTP 404, 9 × HTTP 200  → 69% mapy witryny to martwe odnośniki.

  Dwie niezależne przyczyny, obie widoczne dopiero w pomiarze:

  1. INNE SLUGI. Mock miał `remont-koscielnej-zakonczony`, a w bazie leży
     `remont-ulicy-koscielnej-zakonczony-przed-terminem`. Wszystkie 12
     adresów artykułów było zmyślone.

  2. INNY KSZTAŁT ADRESU I INNA TAKSONOMIA. Generator sklejał
     `/wiadomosci/<slug>` dla KAŻDEGO artykułu, gdy `articleUrl()` buduje
     `/<kategoria>/<podkategoria?>/<slug>`. Kategorie brał z CATEGORIES_MAP
     (13 kluczy: sport, zdrowie, edukacja…), a portal ma 11 innych
     (na-sygnale, ludzie, zycie-codzienne…) w `v4/taxonomy.ts`. Stąd 404 na
     /sport i /zdrowie oraz brak /na-sygnale i /ludzie w mapie.

  Dlaczego to poważne: mapa witryny i kanał RSS to jedyne dokumenty, które
  portal sam wysyła robotom Google i czytnikom. 69% martwych odnośników
  obniża ocenę indeksowania i sprawia, że nowe artykuły z bazy nigdy nie
  zostają zgłoszone — publikacja nie docierała do wyszukiwarki.

  DLACZEGO PARAMETR, A NIE ODCZYT BAZY TUTAJ
  Ten moduł jest czystymi funkcjami bez dostępu do `Context`, a trasy w
  `index.tsx` i tak mają `c`. Migawkę wczytuje `loadSnapshot(c)` — ta sama
  droga, którą renderuje się portal. Dzięki temu mapa witryny NIE MOŻE się
  rozjechać ze stroną: oba widoki czytają jedno źródło.
*/

/**
 * Data ostatniej modyfikacji wpisu. `updatedAt` bywa pusty (artykuł nigdy nie
 * redagowany), wtedy liczy się data publikacji. Dopiero gdy brak obu, wchodzi
 * dzisiejsza data — bo `<lastmod>` z pustą wartością unieważnia cały wpis
 * w oczach walidatora sitemap.
 */
const lastmodOf = (a: Article, dzisiaj: string): string => {
  const zrodlo = a.updatedAt || a.publishedAtISO || a.publishedAt
  if (!zrodlo) return dzisiaj
  const data = parseFlexibleDate(zrodlo)
  return Number.isNaN(data.getTime()) ? dzisiaj : data.toISOString().slice(0, 10)
}

// ============ C14: sitemap.xml ============
export const generateSitemap = (articles: readonly Article[] = []): string => {
  const today = new Date().toISOString().slice(0, 10)
  const urls: string[] = []

  // Homepage
  urls.push(`<url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/plan</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/wiedza</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/szukaj</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`)

  /* Kategorie z taksonomii v4 — to ona wyznacza trasy, które router obsługuje.
     Wcześniej brane z CATEGORIES_MAP, co dawało 8 adresów kończących się 404. */
  for (const slug of CATEGORY_SLUGS) {
    urls.push(`<url><loc>${SITE_URL}/${slug}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
  }

  /* Artykuły z D1. `articleUrl` to ta sama funkcja, której używają karty na
     stronie — adres w mapie jest więc dokładnie tym, w który klika czytelnik. */
  for (const a of articles) {
    urls.push(`<url><loc>${SITE_URL}${articleUrl(a)}</loc><lastmod>${lastmodOf(a, today)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>`
}

// ============ C15: Google News sitemap ============
export const generateNewsSitemap = (articles: readonly Article[] = []): string => {
  const items: string[] = []
  const now = new Date()
  const cutoff = now.getTime() - 48 * 60 * 60 * 1000  // last 48h only (Google News spec)

  for (const a of articles) {
    /* `cutoff` był policzony, ale NIGDY nie użyty — pętla wypisywała cały
       zbiór. Google News przyjmuje wyłącznie materiały z ostatnich 48 godzin
       i odrzuca sitemapy zawierające starsze, więc martwa zmienna oznaczała
       kanał odrzucany w całości. */
    const opublikowano = parseFlexibleDate(a.publishedAtISO || a.publishedAt)
    if (Number.isNaN(opublikowano.getTime()) || opublikowano.getTime() < cutoff) continue

    items.push(`<url>
  <loc>${SITE_URL}${articleUrl(a)}</loc>
  <news:news>
    <news:publication><news:name>${SITE_NAME}</news:name><news:language>pl</news:language></news:publication>
    <news:publication_date>${opublikowano.toISOString()}</news:publication_date>
    <news:title>${escapeXml(a.title)}</news:title>
  </news:news>
</url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.join('\n')}
</urlset>`
}

// ============ C16: RSS feed (Atom-compatible) ============
export const generateRss = (articles: readonly Article[] = []): string => {
  const items = articles.slice(0, 20).map(a => {
    const link = `${SITE_URL}${articleUrl(a)}`
    /* `new Date(a.publishedAt)` na formacie D1 „2026-07-28 07:34:49" daje
       Invalid Date, a `.toUTCString()` z niego to napis „Invalid Date"
       wstawiany w <pubDate> — czytniki RSS odrzucają taki wpis. Dlatego
       parseFlexibleDate, ta sama funkcja co w JSON-LD. */
    const opublikowano = parseFlexibleDate(a.publishedAtISO || a.publishedAt)
    const pubDate = Number.isNaN(opublikowano.getTime()) ? '' : opublikowano.toUTCString()
    /* Autor w v4 to obiekt, nie łańcuch znaków — `escapeXml(a.author)` dałoby
       „[object Object]" w każdym wpisie kanału. */
    const autor = a.author?.name || 'Redakcja izbica24.pl'
    const email = a.author?.email || 'redakcja@izbica24.pl'
    return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(a.lede)}</description>
      <author>${escapeXml(email)} (${escapeXml(autor)})</author>
      <category>${escapeXml(a.category)}</category>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      ${a.heroImage ? `<enclosure url="${escapeXml(a.heroImage)}" type="image/jpeg" length="0"/>` : ''}
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Niezależny portal informacyjny Gminy Izbica Kujawska</description>
    <language>pl-PL</language>
    <copyright>© 2026 izbica24.pl</copyright>
    <managingEditor>redakcja@izbica24.pl (Redakcja)</managingEditor>
    <webMaster>webmaster@izbica24.pl</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>izbica24.pl portal engine v1.0</generator>
    <ttl>15</ttl>
${items}
  </channel>
</rss>`
}

// ============ C17: robots.txt ============
export const generateRobots = (): string => `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /szukaj?

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot-News
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/news-sitemap.xml
Host: ${SITE_URL}
`

// ============ C18: manifest.json (PWA) ============
export const generateManifest = () => ({
  name: 'izbica24.pl — Portal Gminy Izbica Kujawska',
  short_name: 'izbica24',
  description: 'Niezależny portal informacyjny Gminy Izbica Kujawska',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#1a1a1a',
  orientation: 'portrait',
  scope: '/',
  lang: 'pl-PL',
  icons: [
    { src: '/static/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/static/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/static/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Wiadomości', url: '/wiadomosci', icons: [{ src: '/static/icon-192.png', sizes: '192x192' }] },
    { name: 'Na sygnale', url: '/na-sygnale', icons: [{ src: '/static/icon-192.png', sizes: '192x192' }] },
    { name: 'Kujawianka', url: '/kujawianka', icons: [{ src: '/static/icon-192.png', sizes: '192x192' }] },
  ],
})

// ============ C19: humans.txt ============
export const generateHumansTxt = (): string => `/* TEAM */
Wydawca: Stowarzyszenie na rzecz Rozwoju Izbicy Kujawskiej
Redakcja: redakcja@izbica24.pl
Engineering: Cloudflare Pages + Hono framework
Design: Reuters-tier monochromatic + #fa6400 orange accent

/* SITE */
Last update: 2026-05-25
Language: Polski (pl-PL)
Doctype: HTML5
Standards: WCAG 2.2 AA · GDPR · ePrivacy
Components: Hono · TypeScript · Cloudflare Workers · D1 · KV · R2
`

// ============ C20: security.txt ============
export const generateSecurityTxt = (): string => `Contact: mailto:security@izbica24.pl
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: pl, en
Canonical: ${SITE_URL}/.well-known/security.txt
Policy: ${SITE_URL}/regulamin
`

// ============ C21: Open Graph metadata generator ============
export interface OgMeta {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  category?: string
}

export const buildOgTags = (m: OgMeta) => ({
  'og:title':        m.title,
  'og:description':  m.description,
  'og:url':          m.url,
  'og:image':        m.image || `${SITE_URL}/static/og-default.jpg`,
  'og:type':         m.type || 'website',
  'og:site_name':    SITE_NAME,
  'og:locale':       'pl_PL',
  'twitter:card':    'summary_large_image',
  'twitter:site':    '@izbica24',
  ...(m.type === 'article' && m.publishedTime ? { 'article:published_time': m.publishedTime } : {}),
  ...(m.author    ? { 'article:author':   m.author } : {}),
  ...(m.category  ? { 'article:section':  m.category } : {}),
})

// ============ C22: JSON-LD structured data ============
export const buildArticleJsonLd = (a: typeof ARTICLES[number]) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: a.title,
  description: a.lede,
  image: a.heroImage,
  datePublished: parseFlexibleDate(a.publishedAt).toISOString(),
  dateModified: a.updatedAt ? parseFlexibleDate(a.updatedAt).toISOString() : undefined,
  author: { '@type': 'Person', name: a.author },
  publisher: {
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/static/logo.png` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/wiadomosci/${a.slug}` },
  articleSection: a.category,
  keywords: a.tags.join(', '),
  inLanguage: 'pl-PL',
})

export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/static/logo.png`,
  email: 'redakcja@izbica24.pl',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Izbica Kujawska',
    postalCode: '87-865',
    addressCountry: 'PL',
  },
  sameAs: [
    'https://facebook.com/izbica24',
    'https://twitter.com/izbica24',
  ],
})

// === Helper ===
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const buildCanonicalUrl = (path: string): string => {
  const url = new URL(path, SITE_URL)
  const normalizedPath = url.pathname === '' ? '/' : url.pathname.replace(/\/+/g, '/')
  return normalizedPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${normalizedPath.replace(/\/$/, '')}`
}

/*
  USUNIĘTE: generateArticleSitemapEntries()
  ----------------------------------------
  Funkcja budowała wpisy sitemapy z tablicy ARTICLES pod adresem
  `/wiadomosci/<slug>`. Nie wywoływał jej żaden kod produkcyjny — jedynym
  odbiorcą był `tests/unit/seo/sitemap-articles.test.ts`. Test sprawdzał, czy
  liczba wpisów równa się `ARTICLES.length`, czyli porównywał mock z samym
  sobą; przechodził na zielono również wtedy, gdy wszystkie 12 adresów
  artykułów w prawdziwej sitemapie zwracało 404. Utrzymywanie drugiego,
  martwego generatora obok `generateSitemap` gwarantowało rozjazd między
  tym, co testowane, a tym, co portal wysyła robotom.
*/

// ════════════════════════════════════════════════════════════════════════
// F5 — DANE STRUKTURALNE DLA PORTALU v4
// ════════════════════════════════════════════════════════════════════════
//
// Dlaczego osobne funkcje, a nie rozszerzenie buildArticleJsonLd:
// istniejący `buildArticleJsonLd` przyjmuje `typeof ARTICLES[number]`
// z src/data-articles.ts, gdzie `author` jest łańcuchem znaków. Żywy portal
// (src/v4) używa własnego typu `Article` z src/v4/content-types.ts, gdzie
// `author` jest obiektem { slug, name, role }, a adres artykułu zależy od
// kategorii i podkategorii, nie od stałego prefiksu /wiadomosci/.
// Podstawienie jednego typu pod drugi dałoby "author": { "name": undefined }
// — czyli dane strukturalne, które przechodzą build i są nieprawidłowe
// dopiero w narzędziu Google. Dwie funkcje o jawnych typach są uczciwsze
// niż jedna z rzutowaniem.

/** Minimalny kształt artykułu v4 wymagany do zbudowania NewsArticle. */
export interface ArticleDlaJsonLd {
  slug: string
  title: string
  lede: string
  heroImage?: string
  publishedAtISO: string
  updatedAt?: string
  author: { name: string; slug?: string }
  category: string
  tags: string[]
  readingMinutes?: number
}

/**
 * NewsArticle dla artykułu portalu.
 *
 * `url` i `mainEntityOfPage.@id` muszą wskazywać na TEN SAM adres co
 * `<link rel="canonical">`, inaczej Google zgłasza niespójność i może
 * zindeksować inny wariant adresu. Dlatego funkcja przyjmuje gotową
 * ścieżkę z trasy (która zna pełną hierarchię kategoria/podkategoria),
 * a nie składa jej sama z pola `category`.
 */
export const buildNewsArticleJsonLd = (
  a: ArticleDlaJsonLd,
  sciezkaArtykulu: string,
): Record<string, unknown> => {
  const adres = buildCanonicalUrl(sciezkaArtykulu)
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title.slice(0, 110), // Google ucina powyżej 110 znaków
    description: a.lede,
    // Obraz podajemy jako adres bezwzględny — ścieżka względna jest przez
    // walidator Google odrzucana, a w kodzie widoków figuruje jako /static/…
    image: a.heroImage ? [new URL(a.heroImage, SITE_URL).toString()] : undefined,
    datePublished: a.publishedAtISO,
    dateModified: a.updatedAt || a.publishedAtISO,
    author: {
      '@type': 'Person',
      name: a.author.name,
      url: a.author.slug ? `${SITE_URL}/autor/${a.author.slug}` : undefined,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/static/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': adres },
    url: adres,
    isAccessibleForFree: true,
    articleSection: a.category,
    keywords: a.tags.length ? a.tags.join(', ') : undefined,
    wordCount: a.readingMinutes ? a.readingMinutes * 200 : undefined,
    inLanguage: 'pl-PL',
  }
}

/**
 * BreadcrumbList — okruszki. Google wyświetla je w wyniku wyszukiwania
 * zamiast surowego adresu URL, co ma bezpośredni wpływ na klikalność.
 *
 * `position` liczony od 1 (zero jest przez walidator odrzucane).
 * Ostatni element ścieżki celowo NIE dostaje `item`: zalecenie Google mówi,
 * że bieżąca strona nie powinna linkować do siebie samej.
 */
export const buildBreadcrumbJsonLd = (
  okruszki: readonly { nazwa: string; sciezka?: string }[],
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: okruszki.map((o, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: o.nazwa,
    item: o.sciezka ? buildCanonicalUrl(o.sciezka) : undefined,
  })),
})

/**
 * WebSite z SearchAction — pozwala Google pokazać pole wyszukiwania
 * wewnątrz portalu bezpośrednio w wyniku. Wymaga, by adres podany
 * w `urlTemplate` faktycznie obsługiwał parametr — tu /szukaj?q=,
 * zgodnie z trasą w src/v4/router.tsx.
 */
export const buildWebSiteJsonLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'pl-PL',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/szukaj?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})
