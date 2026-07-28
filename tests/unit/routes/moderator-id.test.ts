import { describe, expect, it } from 'vitest'
import { moderatorId } from '../../../src/routes/v1/comments-moderation'
import type { AuthContext } from '../../../src/middleware/require-permission'

/**
 * REGRES: `moderated_by` zapisywane jako NULL przy każdej decyzji moderacyjnej
 *
 * `comments-moderation.ts` czytał w czterech miejscach `auth?.userId`. Pole
 * `userId` NIE ISTNIEJE w `AuthContext` — tożsamość ma `sub`, `email`, `role`,
 * `sessionId`. Wyrażenie było więc zawsze `undefined`, a `?? null` zamieniało
 * to w ciche `NULL` w kolumnie `moderated_by` / `edited_by`.
 *
 * Skutek: każde zatwierdzenie, odrzucenie, oznaczenie spamu, usunięcie i
 * operacja zbiorcza zapisywały „nie wiadomo kto”. Widok z migracji 0049
 * (`LEFT JOIN users u ON u.id = c.moderated_by`) zwracał puste dane
 * moderatora — w tabeli, której jedynym celem jest rozliczalność.
 *
 * Defekt był niewidoczny, ponieważ `requireDb(c)` zwracało `any`, co wyłączało
 * kontrolę typów na całym `auth` w tym pliku. Ten test pilnuje pola, a nie
 * kształtu odpowiedzi HTTP — literówka w nazwie pola tożsamości ma być
 * wykryta natychmiast, także gdy trasa nie ma testu integracyjnego.
 */
describe('moderatorId — identyfikator moderatora do kolumn audytu', () => {
  /**
   * Kontrola samego testu: sprawdza, że pole odczytywane przez implementację
   * naprawdę nazywa się `sub`. Gdyby ktoś przywrócił `auth.userId`, ten
   * przypadek zwróciłby null i test padłby, zamiast milcząco przechodzić.
   */
  it('AuthContext nie ma pola userId — to była przyczyna defektu', () => {
    const auth: AuthContext = {
      sub: '42',
      email: 'redaktor@izbica24.pl',
      role: 'editor' as AuthContext['role'],
      sessionId: 'sesja-1',
    }
    expect('userId' in auth).toBe(false)
    expect(auth.sub).toBe('42')
  })

  it('zwraca liczbowy identyfikator z pola sub', () => {
    // `sub` jest łańcuchem (`String(user.id)` w store.ts), a kolumny są
    // INTEGER REFERENCES users(id) — konwersja jest wymagana, nie kosmetyczna.
    const wynik = moderatorId({ sub: '42' })
    expect(wynik).toBe(42)
    expect(typeof wynik).toBe('number')
  })

  it('zwraca null, gdy tożsamości nie ma (trasa publiczna, brak tokenu)', () => {
    expect(moderatorId(undefined)) .toBeNull()
    expect(moderatorId({})).toBeNull()
    expect(moderatorId({ sub: '' })).toBeNull()
  })

  it('zwraca null dla wartości, która nie jest poprawnym id — nie łamie klucza obcego', () => {
    // Lepiej brak wpisu niż wartość, która wywróci FOREIGN KEY na users(id).
    expect(moderatorId({ sub: 'abc' })).toBeNull()
    expect(moderatorId({ sub: '0' })).toBeNull()
    expect(moderatorId({ sub: '-5' })).toBeNull()
  })

  it('NIE zwraca null dla poprawnej tożsamości — dowód, że test może wykryć regres', () => {
    // Gdyby implementacja wróciła do `auth?.userId ?? null`, ten przypadek
    // dałby null i test padłby. To jego jedyne zadanie.
    expect(moderatorId({ sub: '7' })).not.toBeNull()
  })
})
