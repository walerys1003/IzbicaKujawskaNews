import { describe, expect, it } from 'vitest'
import { formatIsoDate, formatPolishDate, isFreshWithinHours, parseFlexibleDate } from '../../../src/lib/dates'

describe('dates helpers', () => {
  it('parses Polish date strings', () => {
    expect(parseFlexibleDate('25 maja 2026, 09:30').toISOString()).toContain('2026-05-25T09:30:00.000Z')
  })

  it('formats iso and Polish date', () => {
    const value = '2026-05-25T12:00:00.000Z'
    expect(formatIsoDate(value)).toBe('2026-05-25')
    expect(formatPolishDate(value)).toBe('25 maja 2026')
  })

  it('detects freshness window', () => {
    expect(isFreshWithinHours('2026-05-25T10:00:00.000Z', 2, new Date('2026-05-25T11:00:00.000Z'))).toBe(true)
    expect(isFreshWithinHours('2026-05-25T07:00:00.000Z', 2, new Date('2026-05-25T11:00:00.000Z'))).toBe(false)
  })
})
