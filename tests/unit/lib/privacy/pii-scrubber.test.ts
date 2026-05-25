import { describe, expect, it } from 'vitest'
import { containsPII, scrubPII } from '../../../../src/lib/privacy/pii-scrubber'

describe('scrubPII', () => {
  it('scrubs email and phone', () => {
    const result = scrubPII('Napisz na jan@example.com albo zadzwoń +48 600 700 800')
    expect(result).toContain('[email]')
    expect(result).toContain('[phone]')
  })

  it('detects pii', () => {
    expect(containsPII('PESEL 12345678901')).toBe(true)
  })
})
