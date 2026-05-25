import { describe, expect, it } from 'vitest'
import { slugify, stripDiacritics } from '../../../src/lib/slugify'

describe('slugify', () => {
  it('removes Polish diacritics', () => {
    expect(stripDiacritics('Żółć ĄĆĘ')).toBe('Zolc ACE')
  })

  it('creates clean slugs', () => {
    expect(slugify('  Sesja Rady Miejskiej & Budżet 2026!  ')).toBe('sesja-rady-miejskiej-i-budzet-2026')
  })
})
