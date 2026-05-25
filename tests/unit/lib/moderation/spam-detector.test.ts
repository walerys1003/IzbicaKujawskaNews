import { describe, expect, it } from 'vitest'
import { detectSpam } from '../../../../src/lib/moderation/spam-detector'

describe('detectSpam', () => {
  it('flags spammy content', () => {
    const result = detectSpam('ZARABIAJ szybko!!! https://spam.example casino')
    expect(result.isSpam).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(4)
  })

  it('does not flag normal comment', () => {
    expect(detectSpam('Dziękuję za rzetelną relację z sesji rady.').isSpam).toBe(false)
  })
})
