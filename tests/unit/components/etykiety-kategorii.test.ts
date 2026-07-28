/*
  Ochrona przed regresem defektu wykrytego 2026-07-28.

  CO BYŁO ZEPSUTE
  ---------------
  Osiem miejsc w home-v3.tsx / home-v3-modules.tsx czytało
  `CATEGORIES_MAP[x]?.label`. Pole `label` NIE ISTNIEJE w tej mapie —
  poprawna nazwa to `title`. Optional chaining zamieniał to w ciche
  `undefined`, więc nic nie wybuchało:

    · 5 miejsc miało fallback `|| x` → mieszkaniec widział surowy slug
      ("inwestycje" zamiast "Inwestycje") — zmierzone w HTML /v3;
    · 3 miejsca fallbacku NIE miały → renderowały pusty element.

  Testy tego nie łapały, bo żaden nie sprawdzał treści etykiety.
  Kompilator to widział (7×TS2339 + 1), ale błędy tonęły w progu ratchetu.

  DLACZEGO TEN TEST JEST NA DANYCH, NIE NA HTML
  ---------------------------------------------
  Źródłem defektu był kontrakt danych, nie znaczniki. Test pilnuje
  kontraktu: każda kategoria ma niepuste `title`, a `label` nie istnieje.
  Gdyby ktoś ponownie sięgnął po `.label`, dostanie undefined — więc
  drugi przypadek zabrania wprowadzenia tego pola po cichu jako aliasu,
  co przywróciłoby dwuznaczność, od której zaczął się problem.
*/
import { describe, expect, it } from 'vitest'
import { CATEGORIES_MAP } from '../../../src/data-articles'

describe('CATEGORIES_MAP — kontrakt etykiety kategorii', () => {
  it('każda kategoria ma niepuste title (to jest etykieta pokazywana czytelnikowi)', () => {
    const klucze = Object.keys(CATEGORIES_MAP)
    /* Zabezpieczenie przed testem tautologicznym: pusta mapa przeszłaby
       pętlę forEach bez jednej asercji. */
    expect(klucze.length).toBeGreaterThanOrEqual(13)

    for (const klucz of klucze) {
      const kategoria = CATEGORIES_MAP[klucz]
      expect(typeof kategoria.title, `kategoria ${klucz}`).toBe('string')
      expect(kategoria.title.trim().length, `kategoria ${klucz}`).toBeGreaterThan(0)
    }
  })

  it('title jest etykietą czytelną dla człowieka, a nie powtórzeniem sluga', () => {
    /* Sedno defektu: slug "inwestycje" wyświetlał się zamiast "Inwestycje".
       Sprawdzam konkretne pary zmierzone w HTML strony /v3. */
    expect(CATEGORIES_MAP['inwestycje'].title).toBe('Inwestycje')
    expect(CATEGORIES_MAP['wiadomosci'].title).toBe('Wiadomości')
    expect(CATEGORIES_MAP['samorzad'].title).toBe('Samorząd')

    /* Żadna etykieta nie może być identyczna ze swoim kluczem — taki stan
       oznacza, że do widoku trafia nazwa techniczna. */
    for (const klucz of Object.keys(CATEGORIES_MAP)) {
      expect(CATEGORIES_MAP[klucz].title, `etykieta ${klucz} to surowy slug`).not.toBe(klucz)
    }
  })

  it('nie istnieje pole label — kod ma używać title', () => {
    for (const klucz of Object.keys(CATEGORIES_MAP)) {
      expect(
        'label' in CATEGORIES_MAP[klucz],
        `kategoria ${klucz} dostała pole label — dwa pola na jedną etykietę to źródło defektu z 2026-07-28`,
      ).toBe(false)
    }
  })
})
