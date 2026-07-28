import { describe, expect, it } from 'vitest'
import { listByPrefix, listByPrefixZeStanem, putJson } from '../../../src/lib/runtime-kv'
import type { Bindings } from '../../../src/types/env'

/*
  Test stronicowania listByPrefix.

  Kontekst defektu: poprzednia implementacja wykonywała jedno wywołanie
  `list({ prefix, limit: 500 })` i po cichu odrzucała nadwyżkę. W warstwie push
  oznaczało to, że wysyłka do 2 847 subskrybentów objęłaby 500 osób, a panel
  pokazałby „dostarczono 500/500" jako pełny sukces.

  Liczby w tym pliku są dobrane celowo:
  - 1200 wpisów > 1000 (ROZMIAR_STRONY_KV) — wymusza CO NAJMNIEJ dwie strony,
  - 1200 > 500 (stary limit) — stara implementacja zwróciłaby 500 i test padłby.

  Atrapa KV: pomiar 2026-07-28 wykazał, że pamięciowy namespace w runtime-kv
  ignorował `cursor` i zawsze zwracał `list_complete: true`. Test stronicowania
  przechodziłby wtedy niezależnie od tego, czy kod produkcyjny podąża za
  kursorem. Atrapa została naprawiona i poniższy blok to weryfikuje wprost.
*/

/*
  Puste `env` wymusza użycie namespace'u pamięciowego (getRuntimeKv wraca do
  pamięci, gdy binding nie istnieje) — czyli tej samej ścieżki, którą używają
  testy integracyjne bez podłączonego KV.
*/
const srodowisko = () => ({} as Bindings)

describe('atrapa KV — warunek wstępny testu', () => {
  it('namespace pamięciowy naprawdę stronicuje (inaczej test niżej jest bezwartościowy)', async () => {
    const { getRuntimeKv } = await import('../../../src/lib/runtime-kv')
    const env = srodowisko()
    const kv = getRuntimeKv(env, 'APP_KV')

    for (let i = 0; i < 7; i += 1) {
      await kv.put(`stronicowanie:${String(i).padStart(3, '0')}`, '"x"')
    }

    const pierwsza = await kv.list?.({ prefix: 'stronicowanie:', limit: 3 })
    expect(pierwsza?.keys).toHaveLength(3)
    expect(pierwsza?.list_complete, 'przy 7 kluczach i limicie 3 lista NIE jest kompletna').toBe(false)
    expect(pierwsza?.cursor, 'niekompletna lista musi zwrócić kursor').toBeTruthy()

    const druga = await kv.list?.({ prefix: 'stronicowanie:', limit: 3, cursor: pierwsza?.cursor })
    expect(druga?.keys).toHaveLength(3)
    /* Druga strona nie może powtarzać kluczy z pierwszej. */
    const nazwyPierwszej = pierwsza?.keys.map((k) => k.name) ?? []
    const nazwyDrugiej = druga?.keys.map((k) => k.name) ?? []
    expect(nazwyDrugiej.filter((n) => nazwyPierwszej.includes(n))).toEqual([])

    const trzecia = await kv.list?.({ prefix: 'stronicowanie:', limit: 3, cursor: druga?.cursor })
    expect(trzecia?.keys).toHaveLength(1)
    expect(trzecia?.list_complete, 'ostatnia strona kończy listę').toBe(true)
    expect(trzecia?.cursor, 'kompletna lista nie zwraca kursora').toBe('')
  })

  it('wznawia od najbliższego klucza, gdy klucz z kursora zniknął', async () => {
    /*
      Realny scenariusz: odpowiedź 410 od dostawcy usuwa subskrypcję w trakcie
      wysyłki. Gdyby atrapa (i KV) gubiła wtedy resztę listy, część odbiorców
      zostałaby pominięta bez śladu w logach.
    */
    const { getRuntimeKv } = await import('../../../src/lib/runtime-kv')
    const env = srodowisko()
    const kv = getRuntimeKv(env, 'USER_PREFS_KV')

    for (const nazwa of ['luka:a', 'luka:b', 'luka:c', 'luka:d']) {
      await kv.put(nazwa, '"x"')
    }

    const pierwsza = await kv.list?.({ prefix: 'luka:', limit: 2 })
    expect(pierwsza?.keys.map((k) => k.name)).toEqual(['luka:a', 'luka:b'])

    /* Usuwam klucz, na który wskazuje kursor. */
    await kv.delete('luka:c')

    const druga = await kv.list?.({ prefix: 'luka:', limit: 2, cursor: pierwsza?.cursor })
    expect(druga?.keys.map((k) => k.name), 'po usunięciu luka:c iteracja musi wznowić od luka:d').toEqual(['luka:d'])
  })
})

describe('listByPrefix — kompletność listy', () => {
  const LICZBA = 1200

  const zapiszWpisy = async (env: Bindings, prefiks: string, ile: number) => {
    for (let i = 0; i < ile; i += 1) {
      /* padStart, żeby porządek leksykalny odpowiadał numerycznemu — inaczej
         'wpis:10' stanąłby przed 'wpis:9' i asercje o zakresach byłyby mylące. */
      await putJson(env, 'NOTIFICATIONS_KV', `${prefiks}${String(i).padStart(5, '0')}`, { numer: i })
    }
  }

  it(`zwraca wszystkie ${LICZBA} wpisów, a nie pierwsze 500`, async () => {
    const env = srodowisko()
    await zapiszWpisy(env, 'komplet:', LICZBA)

    const items = await listByPrefix<{ numer: number }>(env, 'NOTIFICATIONS_KV', 'komplet:')

    expect(items).toHaveLength(LICZBA)
    /* Nie tylko liczba — sprawdzam, że nie zgubiono konkretnych pozycji
       z końca listy, bo właśnie one wypadały przy limicie 500. */
    const numery = items.map((item) => item.value.numer).sort((a, b) => a - b)
    expect(numery[0]).toBe(0)
    expect(numery[numery.length - 1]).toBe(LICZBA - 1)
    expect(new Set(numery).size, 'brak duplikatów między stronami').toBe(LICZBA)
  })

  it('pobiera więcej niż jedną stronę (dowód, że pętla kursora działa)', async () => {
    const env = srodowisko()
    await zapiszWpisy(env, 'strony:', LICZBA)

    const wynik = await listByPrefixZeStanem<{ numer: number }>(env, 'NOTIFICATIONS_KV', 'strony:')

    expect(wynik.items).toHaveLength(LICZBA)
    expect(wynik.stron, 'przy 1200 wpisach i stronie 1000 muszą być co najmniej 2 strony').toBeGreaterThanOrEqual(2)
    expect(wynik.ucieta, 'bez limitu lista nie może być ucięta').toBe(false)
  })

  it('sygnalizuje ucięcie, gdy wywołujący sam narzuci limit', async () => {
    const env = srodowisko()
    await zapiszWpisy(env, 'limit:', LICZBA)

    const wynik = await listByPrefixZeStanem<{ numer: number }>(env, 'NOTIFICATIONS_KV', 'limit:', {
      maksymalnieKluczy: 300,
    })

    expect(wynik.items).toHaveLength(300)
    /* Kluczowa różnica wobec starego zachowania: ucięcie jest JAWNE.
       Wcześniej wywołujący nie miał jak odróżnić „to wszystko" od
       „tyle zmieściło się w limicie". */
    expect(wynik.ucieta).toBe(true)
  })

  it('nie myli prefiksów (klucz o innym prefiksie nie wpada do wyniku)', async () => {
    const env = srodowisko()
    await putJson(env, 'APP_KV', 'alfa:1', { x: 1 })
    await putJson(env, 'APP_KV', 'alfabet:1', { x: 2 })
    await putJson(env, 'APP_KV', 'beta:1', { x: 3 })

    const items = await listByPrefix<{ x: number }>(env, 'APP_KV', 'alfa:')

    /* 'alfabet:1' NIE zaczyna się od 'alfa:' — dwukropek jest częścią prefiksu. */
    expect(items.map((item) => item.key)).toEqual(['alfa:1'])
  })

  it('zwraca pustą listę dla nieznanego prefiksu, nie rzuca', async () => {
    const env = srodowisko()
    const items = await listByPrefix(env, 'SEARCH_SUGGESTIONS_KV', 'nie-ma-takiego:')
    expect(items).toEqual([])
  })
})
