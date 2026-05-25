import { describe, expect, it } from 'vitest'
import { validateArticle } from '../../../../src/lib/validators/article'
import { fixtureArticle } from '../../../fixtures/seed-data'

describe('validateArticle', () => {
  it('accepts valid article payload', () => {
    const result = validateArticle(fixtureArticle)
    expect(result.ok).toBe(true)
    expect(result.data?.slug).toBe('nowy-most-w-izbicy-kujawskiej-otwarty-dla-ruchu')
  })

  it('returns validation errors', () => {
    const result = validateArticle({ title: 'Krótki', lede: 'Za krótki', body: ['mało'], category: '' })
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('title_too_short')
    expect(result.errors).toContain('category_required')
  })
})
