import { describe, expect, it } from 'vitest'
import { validateNewsletter } from '../../../../src/lib/validators/newsletter'
import { fixtureNewsletter } from '../../../fixtures/seed-data'

describe('validateNewsletter', () => {
  it('accepts valid newsletter signup', () => {
    expect(validateNewsletter(fixtureNewsletter).ok).toBe(true)
  })

  it('requires consent and email', () => {
    const result = validateNewsletter({ email: 'broken', consent: false })
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining(['invalid_email', 'consent_required']))
  })
})
