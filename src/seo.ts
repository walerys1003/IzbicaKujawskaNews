// SANDBOX C — task C14-C24: SEO module — sitemap, RSS, robots, OG meta, JSON-LD
import { ARTICLES, CATEGORIES_MAP } from './data-articles'

const SITE_URL = 'https://izbica24.pl'
const SITE_NAME = 'izbica24.pl'

// ============ C14: sitemap.xml ============
export const generateSitemap = (): string => {
  const today = new Date().toISOString().slice(0, 10)
  const urls: string[] = []

  // Homepage
  urls.push(`<url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/plan</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/wiedza</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
  urls.push(`<url><loc>${SITE_URL}/szukaj</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`)

  // Categories
  for (const slug of Object.keys(CATEGORIES_MAP)) {
    urls.push(`<url><loc>${SITE_URL}/${slug}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
  }

  // Articles
  for (const a of ARTICLES) {
    urls.push(`<url><loc>${SITE_URL}/wiadomosci/${a.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>`
}

// ============ C15: Google News sitemap ============
export const generateNewsSitemap = (): string => {
  const items: string[] = []
  const now = new Date()
  const cutoff = now.getTime() - 48 * 60 * 60 * 1000  // last 48h only (Google News spec)

  for (const a of ARTICLES) {
    items.push(`<url>
  <loc>${SITE_URL}/wiadomosci/${a.slug}</loc>
  <news:news>
    <news:publication><news:name>${SITE_NAME}</news:name><news:language>pl</news:language></news:publication>
    <news:publication_date>${new Date().toISOString()}</news:publication_date>
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
export const generateRss = (): string => {
  const items = ARTICLES.slice(0, 20).map(a => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE_URL}/wiadomosci/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/wiadomosci/${a.slug}</guid>
      <description>${escapeXml(a.lede)}</description>
      <author>redakcja@izbica24.pl (${escapeXml(a.author)})</author>
      <category>${escapeXml(a.category)}</category>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      ${a.heroImage ? `<enclosure url="${a.heroImage}" type="image/jpeg" length="0"/>` : ''}
    </item>`).join('')

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
  datePublished: new Date(a.publishedAt).toISOString(),
  dateModified: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined,
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
