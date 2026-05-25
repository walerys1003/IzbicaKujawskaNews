import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../../../src/data-articles'
import { buildArticleJsonLd, buildOrganizationJsonLd } from '../../../src/seo'

describe('structured data', () => {
  it('builds article json-ld', () => {
    const jsonLd = buildArticleJsonLd(ARTICLES[0])
    expect(jsonLd['@type']).toBe('NewsArticle')
    expect(jsonLd.headline).toBe(ARTICLES[0].title)
  })

  it('builds organization json-ld', () => {
    expect(buildOrganizationJsonLd().name).toBe('izbica24.pl')
  })
})
