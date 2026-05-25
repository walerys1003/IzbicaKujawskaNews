import { describe, expect, it } from 'vitest'
import { buildCanonicalUrl } from '../../../src/seo'

describe('buildCanonicalUrl', () => {
  it('normalizes homepage', () => {
    expect(buildCanonicalUrl('/')).toBe('https://izbica24.pl/')
  })

  it('strips query parameters', () => {
    expect(buildCanonicalUrl('/szukaj?q=sesja&utm_source=x')).toBe('https://izbica24.pl/szukaj')
  })
})
