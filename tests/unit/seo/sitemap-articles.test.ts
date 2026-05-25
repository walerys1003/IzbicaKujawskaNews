import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../../../src/data-articles'
import { generateArticleSitemapEntries, generateSitemap } from '../../../src/seo'

describe('sitemap article entries', () => {
  it('generates entries for each article', () => {
    const entries = generateArticleSitemapEntries()
    expect(entries).toHaveLength(ARTICLES.length)
    expect(entries[0]).toContain('/wiadomosci/')
  })

  it('includes article entries in sitemap xml', () => {
    const sitemap = generateSitemap()
    expect(sitemap).toContain(ARTICLES[0].slug)
  })
})
