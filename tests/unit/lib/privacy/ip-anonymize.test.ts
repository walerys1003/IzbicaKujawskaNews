import { describe, expect, it } from 'vitest'
import { anonymizeIp } from '../../../../src/lib/privacy/ip-anonymize'

describe('anonymizeIp', () => {
  it('anonymizes ipv4', () => {
    expect(anonymizeIp('192.168.0.123')).toBe('192.168.0.0')
  })

  it('anonymizes ipv6', () => {
    expect(anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000::')
  })
})
