import { describe, expect, it } from 'vitest'
import { validateComment } from '../../../../src/lib/validators/comment'
import { fixtureComment } from '../../../fixtures/seed-data'

describe('validateComment', () => {
  it('accepts valid comment', () => {
    expect(validateComment(fixtureComment).ok).toBe(true)
  })

  it('rejects invalid comment', () => {
    const result = validateComment({ name: 'A', email: 'x', text: 'krótki', consent: false })
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining(['invalid_name', 'invalid_email', 'invalid_text_length', 'consent_required']))
  })
})
