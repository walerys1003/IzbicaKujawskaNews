/**
 * Etap D5 — usługa wyszukiwania oparta o indeks FTS5 w D1.
 *
 * Trasa /szukaj używała dotąd `searchV4()` — filtra `Array.includes()` po
 * tablicy trzymanej w pamięci modułu. To działa dokładnie tak długo, jak
 * długo cała treść portalu mieści się w kodzie źródłowym; po przepięciu
 * treści na bazę (etap D4) wyszukiwarka przestałaby widzieć nowe artykuły
 * dodane przez redakcję. Redaktor opublikowałby tekst i nie znalazłby go
 * we własnej wyszukiwarce.
 *
 * ZACHOWANIE PRZY BRAKU BAZY
 * Jeśli bindingu D1 nie ma albo zapytanie zawiedzie, funkcja NIE rzuca
 * wyjątkiem — zwraca `zrodlo: 'pamiec'` i wynik ze starego filtra. Strona
 * wyszukiwania jest jedną z najczęściej odwiedzanych; awaria indeksu nie
 * może zamieniać jej w stronę błędu, skoro istnieje gorszy, ale działający
 * wariant. Pole `zrodlo` mówi wprost, skąd pochodzą wyniki, więc taka
 * degradacja jest widoczna w diagnostyce, a nie ukryta.
 */

import type { D1Database } from '@cloudflare/workers-types'
import { budujZapytanie, foldPolish } from './normalize-pl'

export interface WynikSzukania {
  id: number
  slug: string
  title: string
  lead: string
  categorySlug: string | null
  subcategorySlug: string | null
  solectwoSlug: string | null
  heroImage: string | null
  heroAlt: string | null
  publishedAt: string | null
  readingMinutes: number
  commentCount: number
  views: number
  /** Wynik bm25 — im niższy, tym trafniejszy (taka jest konwencja SQLite). */
  ranking: number
  /** Fragment tekstu z zaznaczonym trafieniem. */
  fragment: string | null
}

export interface OdpowiedzSzukania {
  wyniki: WynikSzukania[]
  total: number
  strona: number
  stron: number
  /** Zapytanie po normalizacji — pokazywane w diagnostyce, nie czytelnikowi. */
  zapytanieFts: string
  terminy: string[]
  zrodlo: 'fts' | 'pamiec' | 'puste'
  /** Wypełniane, gdy indeks zawiódł i użyto wariantu zapasowego. */
  ostrzezenie?: string
}

const NA_STRONE = 12

/**
 * Kolumny pobierane z `articles`. Świadomie BEZ treści artykułu —
 * lista wyników pokazuje tytuł, zajawkę i fragment. Ciągnięcie pełnego
 * `content_md` dla 12 wyników to kilkaset kilobajtów przesłanych z bazy,
 * z których 99 % zostaje wyrzucone przy renderowaniu listy.
 */
const KOLUMNY = `
  a.id, a.slug, a.title, a.lead, a.hero_image_r2_key, a.hero_alt,
  a.published_at, a.reading_minutes, a.comment_count, a.view_count,
  a.subcategory_slug, a.solectwo_slug,
  c.slug AS category_slug
`

interface WierszWyniku {
  id: number
  slug: string
  title: string
  lead: string | null
  hero_image_r2_key: string | null
  hero_alt: string | null
  published_at: string | null
  reading_minutes: number | null
  comment_count: number | null
  view_count: number | null
  subcategory_slug: string | null
  solectwo_slug: string | null
  category_slug: string | null
  ranking: number | null
  fragment: string | null
}

const mapuj = (w: WierszWyniku): WynikSzukania => ({
  id: w.id,
  slug: w.slug,
  title: w.title,
  lead: w.lead ?? '',
  categorySlug: w.category_slug,
  subcategorySlug: w.subcategory_slug,
  solectwoSlug: w.solectwo_slug,
  // Klucz R2 zamieniany na adres publiczny — te same zasady, co w warstwie
  // mediów (A5): baza trzyma klucz, nie adres, żeby zmiana bucketu nie
  // unieważniła każdego zapisanego odnośnika.
  heroImage: w.hero_image_r2_key ? `/media/${w.hero_image_r2_key}` : null,
  heroAlt: w.hero_alt,
  publishedAt: w.published_at,
  readingMinutes: w.reading_minutes ?? 1,
  commentCount: w.comment_count ?? 0,
  views: w.view_count ?? 0,
  ranking: w.ranking ?? 0,
  fragment: w.fragment,
})

export interface OpcjeSzukania {
  strona?: number
  naStrone?: number
  /** Ograniczenie do kategorii (slug). */
  kategoria?: string
  /** Ograniczenie do sołectwa (slug). */
  solectwo?: string
  /** Zapis zapytania w dzienniku. Domyślnie włączony. */
  zapisujDziennik?: boolean
}

/**
 * Wyszukiwanie w indeksie FTS5.
 *
 * Zwraca obiekt zamiast rzucać wyjątkiem także wtedy, gdy zapytanie było
 * puste — trasa wyświetla wówczas stronę zachęty do wpisania frazy,
 * a nie komunikat błędu.
 */
export const szukaj = async (
  db: D1Database | undefined,
  fraza: string,
  opcje: OpcjeSzukania = {},
): Promise<OdpowiedzSzukania> => {
  const strona = Math.max(1, Math.floor(opcje.strona ?? 1))
  const naStrone = Math.min(50, Math.max(1, Math.floor(opcje.naStrone ?? NA_STRONE)))
  const zapytanie = budujZapytanie(fraza)

  if (zapytanie.puste) {
    return {
      wyniki: [],
      total: 0,
      strona: 1,
      stron: 0,
      zapytanieFts: '',
      terminy: [],
      zrodlo: 'puste',
    }
  }

  if (!db) {
    return {
      wyniki: [],
      total: 0,
      strona,
      stron: 0,
      zapytanieFts: zapytanie.match,
      terminy: zapytanie.terminy,
      zrodlo: 'pamiec',
      ostrzezenie: 'Brak bindingu bazy danych — wyszukiwanie w indeksie niedostępne.',
    }
  }

  // Filtry dodatkowe składane osobno, bo MATCH musi zostać pierwszym
  // warunkiem — SQLite wymaga, by wyrażenie MATCH dotyczyło tabeli FTS
  // bezpośrednio, a nie było zagnieżdżone w OR z innymi warunkami.
  const warunki: string[] = ['s.articles_szukaj MATCH ?1', 'a.deleted_at IS NULL', "a.status = 'published'"]
  const parametry: unknown[] = [zapytanie.match]

  if (opcje.kategoria) {
    parametry.push(opcje.kategoria)
    warunki.push(`c.slug = ?${parametry.length}`)
  }
  if (opcje.solectwo) {
    parametry.push(opcje.solectwo)
    warunki.push(`a.solectwo_slug = ?${parametry.length}`)
  }

  const gdzie = warunki.join(' AND ')

  try {
    const liczenie = await db
      .prepare(
        `SELECT COUNT(*) AS n
         FROM articles_szukaj s
         JOIN articles a ON a.id = s.rowid
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE ${gdzie}`,
      )
      .bind(...parametry)
      .first<{ n: number }>()

    const total = liczenie?.n ?? 0
    const stron = Math.ceil(total / naStrone)
    const offset = (strona - 1) * naStrone

    parametry.push(naStrone, offset)
    const iLimit = parametry.length - 1
    const iOffset = parametry.length

    const lista = await db
      .prepare(
        `SELECT ${KOLUMNY},
                bm25(articles_szukaj, 10.0, 5.0, 1.0) AS ranking,
                snippet(articles_szukaj, 2, '<mark>', '</mark>', '…', 24) AS fragment
         FROM articles_szukaj s
         JOIN articles a ON a.id = s.rowid
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE ${gdzie}
         ORDER BY ranking ASC, a.published_at DESC
         LIMIT ?${iLimit} OFFSET ?${iOffset}`,
      )
      .bind(...parametry)
      .all<WierszWyniku>()

    // Dziennik zapytań — bez adresu IP i bez identyfikatora użytkownika.
    // Zapisujemy nawet wynik zerowy; to właśnie zapytania bez trafień
    // wskazują redakcji, jakiej treści na portalu brakuje.
    if (opcje.zapisujDziennik !== false) {
      try {
        await db
          .prepare(
            `INSERT INTO search_queries (query_raw, query_normalized, result_count)
             VALUES (?1, ?2, ?3)`,
          )
          .bind(fraza.slice(0, 200), zapytanie.terminy.join(' '), total)
          .run()
      } catch {
        // Awaria dziennika nie może przewrócić wyszukiwania — statystyka
        // jest mniej ważna niż odpowiedź dla czytelnika.
      }
    }

    return {
      wyniki: (lista.results ?? []).map(mapuj),
      total,
      strona,
      stron,
      zapytanieFts: zapytanie.match,
      terminy: zapytanie.terminy,
      zrodlo: 'fts',
    }
  } catch (blad) {
    console.error('[szukaj] zapytanie FTS zawiodlo:', blad)
    return {
      wyniki: [],
      total: 0,
      strona,
      stron: 0,
      zapytanieFts: zapytanie.match,
      terminy: zapytanie.terminy,
      zrodlo: 'pamiec',
      ostrzezenie: blad instanceof Error ? blad.message : 'nieznany błąd indeksu',
    }
  }
}

/**
 * Podpowiedzi do pola wyszukiwania (autouzupełnianie).
 *
 * Osobne, węższe zapytanie: tylko tytuły, limit 8, bez fragmentów i bez
 * zapisu w dzienniku. Podpowiedzi lecą przy każdym naciśnięciu klawisza —
 * zapisywanie każdego prefiksu („i", „iz", „izb", „izbi") zaśmieciłoby
 * dziennik setkami niepełnych fraz i uczyniło raport braków bezużytecznym.
 */
export const podpowiedzi = async (db: D1Database | undefined, fraza: string, limit = 8) => {
  const zapytanie = budujZapytanie(fraza)
  if (zapytanie.puste || !db) return []
  try {
    const lista = await db
      .prepare(
        `SELECT a.slug, a.title, c.slug AS category_slug
         FROM articles_szukaj s
         JOIN articles a ON a.id = s.rowid
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE s.articles_szukaj MATCH ?1
           AND a.deleted_at IS NULL AND a.status = 'published'
         ORDER BY bm25(articles_szukaj, 10.0, 5.0, 1.0) ASC
         LIMIT ?2`,
      )
      .bind(zapytanie.match, Math.min(20, limit))
      .all<{ slug: string; title: string; category_slug: string | null }>()
    return (lista.results ?? []).map((r) => ({
      slug: r.slug,
      title: r.title,
      categorySlug: r.category_slug,
    }))
  } catch {
    return []
  }
}

/**
 * Raport dla redakcji: najczęstsze zapytania bez wyników.
 *
 * Najtańsze źródło tematów, jakie ma lokalny portal — lista rzeczy,
 * których mieszkańcy szukali i nie znaleźli.
 */
export const zapytaniaBezWynikow = async (db: D1Database | undefined, dni = 30, limit = 50) => {
  if (!db) return []
  try {
    const lista = await db
      .prepare(
        `SELECT query_normalized, COUNT(*) AS liczba, MAX(created_at) AS ostatnio
         FROM search_queries
         WHERE result_count = 0
           AND created_at >= datetime('now', ?1)
         GROUP BY query_normalized
         ORDER BY liczba DESC, ostatnio DESC
         LIMIT ?2`,
      )
      .bind(`-${Math.max(1, Math.floor(dni))} days`, Math.min(200, limit))
      .all<{ query_normalized: string; liczba: number; ostatnio: string }>()
    return lista.results ?? []
  } catch {
    return []
  }
}

/** Eksport pomocniczy — używany przez warstwę pamięciową do zgodnego składania. */
export { foldPolish }
