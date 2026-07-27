import { describe, expect, it } from 'vitest'
import { anonymizeIp } from '../../../../src/lib/privacy/ip-anonymize'

describe('anonymizeIp', () => {
  it('zeruje ostatni oktet IPv4', () => {
    expect(anonymizeIp('192.168.0.123')).toBe('192.168.0.0')
    expect(anonymizeIp('10.0.0.1')).toBe('10.0.0.0')
  })

  /**
   * Test celowo zmieniony wraz z etapem I12.
   *
   * Wcześniej oczekiwał `2001:0db8:85a3:0000::` — czyli zachowania 4 grup
   * (64 bitów). To zbyt dużo: dostawcy internetu przydzielają pojedynczym
   * gospodarstwom domowym prefiks /56 lub /64, więc zachowanie 64 bitów
   * potrafi wskazać konkretne mieszkanie i anonimizacja byłaby pozorna.
   * Zostawiamy 3 grupy (/48) — poziom sieci operatora.
   */
  it('skraca IPv6 do 48 bitow (poziom sieci operatora, nie gospodarstwa)', () => {
    expect(anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3::')
    expect(anonymizeIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3::')
  })

  it('rozpoznaje IPv4 zmapowane na IPv6', () => {
    // Cloudflare potrafi podac taka postac dla klientow IPv4 za posrednikiem.
    // Bez tej obslugi adres trafialby do galezi IPv6 i wynik bylby
    // '::ffff:192.0.2.0' zamiast czytelnego '192.0.2.0'.
    expect(anonymizeIp('::ffff:192.0.2.77')).toBe('192.0.2.0')
  })

  it('nie przepuszcza wartosci, ktore nie sa adresem', () => {
    // Regres, ktory to wykrywa: poprzednia implementacja w cookie-consent.ts
    // sklejala 'unknown' + '.0' i zapisywala do KV jako 'unknown.0'.
    expect(anonymizeIp('unknown')).toBe('0.0.0.0')
    expect(anonymizeIp('')).toBe('0.0.0.0')
    expect(anonymizeIp(undefined)).toBe('0.0.0.0')
    expect(anonymizeIp(null)).toBe('0.0.0.0')
    // Oktet powyzej 255 nie moze przejsc jako pozornie poprawny adres.
    expect(anonymizeIp('999.1.2.3')).toBe('0.0.0.0')
  })
})
