/**
 * FAZA 2 / B5 — Prymitywy walidacyjne wspólne dla całego API
 *
 * Powód istnienia tego pliku: reguła „slug to małe litery, cyfry i myślniki”
 * była wpisana niezależnie w siedmiu miejscach, w trzech różnych wariantach
 * (jeden dopuszczał podkreślnik, drugi wielkie litery, trzeci polskie znaki
 * diakrytyczne). Adresy artykułów zaczynały się przez to różnić w zależności
 * od tego, czy powstały w panelu, przez API, czy przez import.
 *
 * Każdy prymityw jest tu zdefiniowany raz i importowany wszędzie.
 */

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Tekst
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tekst po `trim`. Zod domyślnie NIE obcina spacji, więc tytuł „   ” miał
 * długość 3 i przechodził warunek `min(1)`. Kolejność ma znaczenie:
 * `trim()` musi być przed `min()`.
 */
export const trimmed = (min = 0, max = 10_000) => z.string().trim().min(min).max(max)

/** Tekst opcjonalny — puste łańcuchy zamieniane na `undefined`. */
export const optionalText = (max = 10_000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length ? v : undefined))
    .optional()

/**
 * Slug w postaci kanonicznej dla portalu: małe litery ASCII, cyfry, myślnik.
 * Bez polskich znaków — te zamienia `slugify` PRZED walidacją, żeby
 * „Sesja Rady Gminy” dało `sesja-rady-gminy`, a nie zostało odrzucone.
 */
export const slug = z
  .string()
  .trim()
  .min(1, 'Adres (slug) nie może być pusty.')
  .max(160, 'Adres (slug) jest za długi — najwyżej 160 znaków.')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Adres (slug) może zawierać wyłącznie małe litery bez ogonków, cyfry i pojedyncze myślniki.',
  )

/** Adres e-mail w postaci znormalizowanej (małe litery). */
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254, 'Adres e-mail jest za długi.')
  .email()

/**
 * Adres URL ograniczony do http/https. Bez tego ograniczenia przechodziły
 * `javascript:alert(1)` i `data:text/html,...`, a portal wstawiał je do
 * atrybutu `href` — gotowy wektor XSS w polach „źródło” i „link zewnętrzny”.
 */
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Adres musi być poprawnym odnośnikiem http(s).')

/** Ścieżka wewnętrzna portalu (`/wiadomosci/...`) albo adres http(s). */
export const urlOrPath = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (value.startsWith('/') && !value.startsWith('//')) return true
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Oczekiwano ścieżki zaczynającej się od „/” albo adresu http(s).')

/** Polski numer telefonu w dowolnym zapisie, normalizowany do cyfr z prefiksem. */
export const phonePl = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(?:\+48)?\d{9}$/.test(v), 'Oczekiwano polskiego numeru telefonu (9 cyfr).')

// ─────────────────────────────────────────────────────────────────────────────
// Liczby i identyfikatory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dodatnia liczba całkowita przyjmowana także jako łańcuch znaków —
 * parametry zapytania i pola formularzy zawsze przychodzą jako tekst.
 * `z.coerce.number()` samo nie odrzuca „12abc” (daje NaN), dlatego
 * dokładamy `int()`, które NaN odrzuca.
 */
export const positiveInt = z.coerce
  .number({ invalid_type_error: 'Oczekiwano liczby.' })
  .int('Oczekiwano liczby całkowitej.')
  .positive('Oczekiwano liczby większej od zera.')

export const nonNegativeInt = z.coerce.number().int().min(0)

/** Identyfikator wiersza w D1 (INTEGER PRIMARY KEY). */
export const dbId = positiveInt.max(9_007_199_254_740_991)

/** Identyfikator tekstowy używany w danych v4 (`a-001`, `gal-2026-01`). */
export const textId = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Identyfikator może zawierać litery, cyfry, kropkę, myślnik i podkreślnik.')

// ─────────────────────────────────────────────────────────────────────────────
// Czas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Znacznik czasu ISO 8601. Przyjmujemy zarówno `2026-07-27T10:00:00Z`,
 * jak i `2026-07-27 10:00:00` (format, w którym SQLite zapisuje
 * `CURRENT_TIMESTAMP`), i normalizujemy do ISO z „Z”.
 */
export const isoDateTime = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .transform((value, ctx) => {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z')
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Oczekiwano daty w formacie ISO 8601.' })
      return z.NEVER
    }
    return parsed.toISOString()
  })

/** Data bez godziny (`2026-07-27`). */
export const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Oczekiwano daty w formacie RRRR-MM-DD.')
  .refine((v) => !Number.isNaN(new Date(v + 'T00:00:00Z').getTime()), 'Taka data nie istnieje.')

/**
 * Znacznik czasu, który musi leżeć w przyszłości — do planowania publikacji.
 * Dopuszczamy 60 s wstecz, bo między kliknięciem redaktora a dotarciem
 * żądania mija chwila, a zaokrąglanie w formularzu potrafi cofnąć minutę.
 */
export const futureDateTime = isoDateTime.refine(
  (value) => new Date(value).getTime() > Date.now() - 60_000,
  'Termin publikacji musi być w przyszłości.',
)

// ─────────────────────────────────────────────────────────────────────────────
// Wartości logiczne
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wartość logiczna z formularza/zapytania. HTML wysyła `"on"`, JSON `true`,
 * a parametr zapytania `"1"` albo `"true"`. Wszystkie trzy trafiały wcześniej
 * do `Boolean(value)`, gdzie łańcuch `"false"` dawał... `true`.
 */
export const flexibleBoolean = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    const v = value.trim().toLowerCase()
    return v === '1' || v === 'true' || v === 'on' || v === 'yes' || v === 'tak'
  })

// ─────────────────────────────────────────────────────────────────────────────
// Listy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista tagów. Przyjmuje tablicę albo łańcuch rozdzielony przecinkami
 * (tak wysyła formularz w panelu), usuwa duplikaty z pominięciem wielkości
 * liter i przycina do 20 pozycji.
 */
export const tagList = z
  .union([z.array(z.string()), z.string()])
  .transform((value) => {
    const raw = Array.isArray(value) ? value : value.split(',')
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of raw) {
      const tag = String(item).trim()
      if (!tag || tag.length > 48) continue
      const key = tag.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(tag)
    }
    return out.slice(0, 20)
  })
  .default([])

// ─────────────────────────────────────────────────────────────────────────────
// Stronicowanie i sortowanie
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wspólny schemat stronicowania. Górny limit 100 jest twardy — bez niego
 * `?limit=1000000` powodował zapytanie skanujące całą tabelę na krawędzi,
 * gdzie budżet procesora to 10 ms.
 *
 * Klient może podać ALBO `page`, ALBO `offset`. Oba pola istnieją, bo
 * panel redakcyjny myśli stronami, a nieskończone przewijanie na stronie
 * głównej — przesunięciem. Schemat NIE przelicza jednego na drugie
 * (`.transform()` zwróciłby `ZodEffects`, na którym `.extend()` już nie
 * działa, a rozszerza go siedem schematów listujących). Przeliczeniem
 * zajmuje się `pageWindow()` niżej — i każda trasa MUSI z niego korzystać.
 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1_000_000).optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuery>

/**
 * Okno wyników do zapytania SQL.
 *
 * Powstało po realnym błędzie: trasy przekazywały `q.offset` wprost do
 * `LIMIT ? OFFSET ?`, a `offset` jest opcjonalny. Przy `?page=3` D1
 * odrzucało zapytanie („D1_TYPE_ERROR: Type 'undefined' not supported”),
 * czyli HTTP 500 — a gdyby zamiast tego wstawić `?? 0`, byłoby jeszcze
 * gorzej: `?page=3` cicho zwracałby pierwszą stronę i nikt by nie zauważył,
 * że stronicowanie w ogóle nie działa.
 *
 * `offset` ma pierwszeństwo nad `page`, bo jest bardziej szczegółowy —
 * klient, który go podał, wie dokładnie, czego chce.
 */
export const pageWindow = (q: {
  page?: number
  limit?: number
  offset?: number
}): { limit: number; offset: number; page: number } => {
  const limit = q.limit ?? 20
  const page = q.page ?? 1
  const offset = q.offset ?? (page - 1) * limit
  return { limit, offset, page: q.offset !== undefined ? Math.floor(q.offset / limit) + 1 : page }
}

/** Kierunek sortowania — zamknięta lista, nigdy nie wkładana wprost do SQL. */
export const sortDirection = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['asc', 'desc']))
  .default('desc')

/**
 * Fabryka schematu sortowania po dozwolonej kolumnie.
 * Nazwa kolumny NIGDY nie pochodzi od klienta bezpośrednio — klient podaje
 * klucz z listy, a kod odwzorowuje go na kolumnę. To jedyne zabezpieczenie
 * przed wstrzyknięciem SQL w klauzuli ORDER BY, której nie da się
 * sparametryzować placeholderem.
 */
export const sortBy = <T extends readonly [string, ...string[]]>(allowed: T, fallback: T[number]) =>
  z
    .string()
    .trim()
    .pipe(z.enum(allowed))
    .default(fallback as never)

// ─────────────────────────────────────────────────────────────────────────────
// Domeny portalu
// ─────────────────────────────────────────────────────────────────────────────

export const PUBLISH_STATUSES = ['draft', 'review', 'scheduled', 'published', 'archived'] as const
export const publishStatus = z.enum(PUBLISH_STATUSES)
export type PublishStatusValue = z.infer<typeof publishStatus>

export const CONTENT_TYPES = [
  'article',
  'gallery',
  'video',
  'audio',
  'live',
  'media-review',
  'announcement',
  'event',
  'infographic',
] as const
export const contentType = z.enum(CONTENT_TYPES)

export const COMMENT_STATUSES = ['pending', 'approved', 'rejected', 'spam'] as const
export const commentStatus = z.enum(COMMENT_STATUSES)

export const USER_ROLES = ['admin', 'editor', 'author', 'moderator', 'contributor', 'viewer'] as const
export const userRole = z.enum(USER_ROLES)

export const MEDIA_KINDS = ['image', 'video', 'audio', 'document'] as const
export const mediaKind = z.enum(MEDIA_KINDS)

/**
 * Slugi miejscowości gminy Izbica Kujawska — 37 pozycji
 * (36 sołectw + siedziba gminy).
 *
 * ══════════════════════════════════════════════════════════════════════
 * LISTA GENEROWANA — nie edytuj ręcznie.
 *   node scripts/i10-generuj-walidacje.mjs
 * Źródło: data/solectwa-osm.json (Wikipedia + OpenStreetMap, relacja
 * 2643810, TERYT 0418083).
 *
 * Poprzednia zawartość tej stałej zawierała nazwy nieistniejące
 * w gminie: 'bugaj', 'dzwierzchno', 'gagowy', 'kotowo', 'naklo',
 * 'narty', 'rzeczyca', 'slaskie', 'smolniki', 'swiatniki',
 * 'wieszczyce', 'zdziary', a także 'josefowo' (literówka od Józefowo).
 *
 * To był błąd o podwójnym skutku, bo ta lista pełni dwie funkcje:
 *   1. waliduje tag `solectwo` — więc odrzucała nazwy prawdziwe
 *      (Chociszewo, Ślazewo, Śmieły…) jako niepoprawne,
 *   2. służy w AI9 do wykrywania nazw WYMYŚLONYCH przez model
 *      językowy — a sama zawierała nazwy wymyślone, czyli
 *      przepuszczała halucynację i blokowała fakt jednocześnie.
 * ══════════════════════════════════════════════════════════════════════
 */
export const SOLECTWA = [
  'augustynowo',
  'blenna',
  'blenna-a',
  'blenna-b',
  'chociszewo',
  'cieplinki',
  'ciepliny',
  'dlugie',
  'gasiorowo',
  'grochowiska',
  'helenowo',
  'hulanka',
  'izbica-kujawska',
  'joasin',
  'jozefowo',
  'kazanki',
  'kazimierowo',
  'komorowo',
  'mchowek',
  'mieczyslawowo',
  'modzerowo',
  'naczachowo',
  'nowa-wies',
  'obalki',
  'pasieka',
  'skarbanowo',
  'slazewo',
  'smiely',
  'sokolowo',
  'swietoslawice',
  'swiszewy',
  'szczkowek',
  'tymien',
  'wietrzychowice',
  'wiszczelice',
  'wolka-komorowska',
  'zdzislawin',
] as const

export const solectwoSlug = z.enum(SOLECTWA)

/** Miękki wariant — dopuszcza brak sołectwa (większość artykułów gminnych). */
export const optionalSolectwo = solectwoSlug.optional()
