import { describe, expect, it } from 'vitest'
import { hasProfanity, sanitizeProfanity } from '../../../../src/lib/moderation/profanity-filter'

describe('profanity filter', () => {
  it('detects profanity', () => {
    expect(hasProfanity('To zachowanie to idiota level')).toBe(true)
  })

  it('sanitizes profane words', () => {
    expect(sanitizeProfanity('Co za idiota')).toContain('i****a')
  })
})
