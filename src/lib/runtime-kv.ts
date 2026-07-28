import type { Bindings, KVListResult, KVNamespaceLike } from '../types/env'

export type RuntimeKvBinding =
  | 'APP_KV'
  | 'USER_PREFS_KV'
  | 'NOTIFICATIONS_KV'
  | 'ANALYTICS_BUFFER_KV'
  | 'SEARCH_SUGGESTIONS_KV'

const memoryNamespaces = new Map<string, Map<string, string>>()

const getMemoryNamespace = (name: RuntimeKvBinding): KVNamespaceLike => {
  if (!memoryNamespaces.has(name)) memoryNamespaces.set(name, new Map<string, string>())
  const memory = memoryNamespaces.get(name)!

  return {
    get: async (key: string, type?: 'text' | 'json' | 'arrayBuffer') => {
      const raw = memory.get(key) ?? null
      if (raw === null) return null
      if (type === 'json') return JSON.parse(raw) as unknown
      if (type === 'arrayBuffer') return new TextEncoder().encode(raw).buffer
      return raw
    },
    put: async (key: string, value: string | ArrayBuffer | ArrayBufferView) => {
      if (typeof value === 'string') {
        memory.set(key, value)
        return
      }
      const bytes = value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      memory.set(key, new TextDecoder().decode(bytes))
    },
    delete: async (key: string) => {
      memory.delete(key)
    },
    /*
      Stronicowanie w namespace pamięciowym.

      Poprzednia wersja ignorowała `options.cursor` i zawsze zwracała
      `list_complete: true`. Skutek: każdy test stronicowania przechodziłby
      niezależnie od tego, czy kod produkcyjny w ogóle podąża za kursorem —
      atrapa udawałaby, że dane się skończyły. Zamiast dowodu dostawalibyśmy
      potwierdzenie własnego założenia.

      Kursor odwzorowuje semantykę Cloudflare KV: jest nieprzejrzysty dla
      wywołującego (tu: zakodowany base64 klucz, od którego zaczyna się
      następna strona) i pojawia się WYŁĄCZNIE gdy `list_complete` jest false.
    */
    list: async <Metadata = unknown>(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult<Metadata>> => {
      const prefix = options?.prefix ?? ''
      const limit = options?.limit ?? 100

      const wszystkie = Array.from(memory.keys())
        .filter((key) => key.startsWith(prefix))
        .sort()

      /* Kursor wskazuje pierwszy klucz NIEZWRÓCONY w poprzedniej stronie. */
      let poczatek = 0
      if (options?.cursor) {
        const odKlucza = Buffer.from(options.cursor, 'base64').toString('utf8')
        const indeks = wszystkie.indexOf(odKlucza)
        /*
          Klucz z kursora mógł zostać w międzyczasie usunięty. KV nie gubi
          wtedy reszty listy — wznawia od najbliższego następnego klucza.
          Bez tego przypadku usunięcie subskrypcji w trakcie wysyłki
          przerwałoby iterację i część odbiorców zostałaby pominięta.
        */
        poczatek = indeks >= 0 ? indeks : wszystkie.findIndex((key) => key > odKlucza)
        if (poczatek < 0) poczatek = wszystkie.length
      }

      const strona = wszystkie.slice(poczatek, poczatek + limit)
      const koniec = poczatek + limit >= wszystkie.length
      const nastepny = koniec ? '' : Buffer.from(wszystkie[poczatek + limit], 'utf8').toString('base64')

      return {
        keys: strona.map((name) => ({ name, metadata: null, expiration: null })),
        list_complete: koniec,
        cursor: nastepny,
      }
    },
  }
}

export const getRuntimeKv = (env: Bindings, binding: RuntimeKvBinding): KVNamespaceLike => {
  const namespace = env[binding]
  return namespace ?? getMemoryNamespace(binding)
}

export const putJson = async (env: Bindings, binding: RuntimeKvBinding, key: string, value: unknown) => {
  await getRuntimeKv(env, binding).put(key, JSON.stringify(value))
}

export const getJson = async <T>(env: Bindings, binding: RuntimeKvBinding, key: string): Promise<T | null> => {
  const raw = await getRuntimeKv(env, binding).get(key)
  if (!raw) return null
  return JSON.parse(String(raw)) as T
}

export const deleteJson = async (env: Bindings, binding: RuntimeKvBinding, key: string) => {
  await getRuntimeKv(env, binding).delete(key)
}

/*
  ==========================================================================
  STRONICOWANIE listByPrefix
  ==========================================================================

  Stan poprzedni: pojedyncze wywołanie `list({ prefix, limit: 500 })` bez
  obsługi kursora. Nadwyżka ponad 500 kluczy była po cichu odrzucana —
  funkcja zwracała 500 pozycji i nie miała żadnego sposobu zasygnalizowania,
  że to nie wszystko. Wywołujący nie mógł tego wykryć.

  Skutek zmierzony w warstwie push: wysyłka do 2 847 subskrybentów objęłaby
  500 osób, a panel pokazałby „dostarczono 500/500" — pełny sukces przy
  2 347 osobach, które nie dostały nic. Ten sam mechanizm dotyczył sesji
  analitycznych i logów wyszukiwania.

  Cloudflare KV ogranicza jedną odpowiedź `list()` do 1000 kluczy i zwraca
  `cursor`, gdy `list_complete` jest false. Pętla poniżej podąża za kursorem
  do wyczerpania listy.

  ODCZYTY RÓWNOLEGŁE — ograniczone celowo
  ---------------------------------------
  Poprzednia wersja robiła `Promise.all` po wszystkich kluczach naraz.
  Przy tysiącu kluczy to tysiąc jednoczesnych odczytów KV w jednym żądaniu
  Workers, co przekracza limit współbieżnych operacji i kończy się
  odrzuceniem części z nich — raportowanym potem jako brak danych, czyli
  znowu cicha utrata. Dlatego odczyty idą partiami.

  BEZPIECZNIK
  -----------
  `maksymalnieKluczy` chroni przed nieskończoną pętlą, gdyby dostawca zwracał
  kursor bez postępu. Domyślnie brak limitu (Infinity) — świadomie, bo cichy
  limit jest właśnie tym defektem, który tu naprawiam. Wywołujący, który
  potrzebuje sufitu, ustawia go jawnie i dostaje `ucieta: true`.
  ========================================================================== */

/** Rozmiar strony przy odpytywaniu KV. 1000 = maksimum dopuszczane przez KV. */
const ROZMIAR_STRONY_KV = 1000

/** Ile odczytów naraz. Workers limituje współbieżne operacje na żądanie. */
const ROZMIAR_PARTII_ODCZYTU = 50

export interface OpcjeListy {
  /**
   * Górny limit liczby kluczy. Domyślnie bez limitu — pobieramy wszystko.
   * Gdy limit zostanie osiągnięty, `listByPrefixZeStanem` zwróci `ucieta: true`.
   */
  maksymalnieKluczy?: number
}

export interface WynikListy<T> {
  items: Array<{ key: string; value: T }>
  /** true, gdy przerwano z powodu `maksymalnieKluczy`, a w KV zostały dane. */
  ucieta: boolean
  /** Liczba stron pobranych z KV — do diagnostyki wydajności. */
  stron: number
}

/**
 * Wariant zwracający informację o kompletności listy. Używaj tam, gdzie
 * niekompletność ma konsekwencje (wysyłka powiadomień, rozliczenia).
 */
export const listByPrefixZeStanem = async <T>(
  env: Bindings,
  binding: RuntimeKvBinding,
  prefix: string,
  opcje: OpcjeListy = {},
): Promise<WynikListy<T>> => {
  const maks = opcje.maksymalnieKluczy ?? Number.POSITIVE_INFINITY
  const kv = getRuntimeKv(env, binding)

  const klucze: string[] = []
  let kursor: string | undefined
  let stron = 0
  let ucieta = false

  do {
    const limit = Math.min(ROZMIAR_STRONY_KV, maks - klucze.length)
    if (limit <= 0) {
      ucieta = true
      break
    }

    const strona = await kv.list?.({ prefix, limit, cursor: kursor })
    stron += 1
    if (!strona) break

    klucze.push(...strona.keys.map((item) => item.name))

    /*
      Warunek zakończenia opiera się na `list_complete`, nie na liczbie
      zwróconych kluczy. KV może zwrócić mniej pozycji niż limit i mimo to
      mieć dalsze dane (klucze wygasłe w trakcie skanowania) — porównywanie
      długości z limitem gubiłoby wtedy resztę listy.
    */
    if (strona.list_complete) {
      kursor = undefined
    } else {
      kursor = strona.cursor
      /* Kursor bez postępu = pętla nieskończona. Przerywam jawnie. */
      if (!kursor) {
        console.error(`[runtime-kv] ${binding}/${prefix}: list_complete=false, ale brak kursora. Lista może być niekompletna.`)
        ucieta = true
        break
      }
    }

    if (klucze.length >= maks) {
      ucieta = Boolean(kursor)
      break
    }
  } while (kursor)

  const items: Array<{ key: string; value: T }> = []
  for (let i = 0; i < klucze.length; i += ROZMIAR_PARTII_ODCZYTU) {
    const partia = klucze.slice(i, i + ROZMIAR_PARTII_ODCZYTU)
    const wartosci = await Promise.all(
      partia.map(async (key) => ({ key, value: await getJson<T>(env, binding, key) })),
    )
    for (const wpis of wartosci) {
      /*
        null oznacza klucz usunięty między listowaniem a odczytem albo wpis
        z niepoprawnym JSON-em. Pomijam, bo alternatywą byłoby przekazanie
        wywołującemu wartości null pod typem T.
      */
      if (wpis.value !== null) items.push(wpis as { key: string; value: T })
    }
  }

  return { items, ucieta, stron }
}

/**
 * Zgodna z poprzednią sygnaturą lista wszystkich wpisów o danym prefiksie.
 * Teraz pobiera KOMPLETNĄ listę (stronicowanie), a nie pierwsze 500 kluczy.
 */
export const listByPrefix = async <T>(env: Bindings, binding: RuntimeKvBinding, prefix: string): Promise<Array<{ key: string; value: T }>> => {
  const { items } = await listByPrefixZeStanem<T>(env, binding, prefix)
  return items
}

export const upsertCollectionItem = async <T extends { id: string }>(
  env: Bindings,
  binding: RuntimeKvBinding,
  prefix: string,
  item: T,
) => {
  await putJson(env, binding, `${prefix}${item.id}`, item)
  return item
}
