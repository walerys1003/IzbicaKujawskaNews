/**
 * FAZA 2 / B5 — Schematy artykułów
 *
 * Zastępuje `src/lib/validators/article.ts`, który sprawdzał sześć warunków
 * (`title.length < 8`, `lede.length < 20`, …) i zwracał kody w rodzaju
 * `title_too_short`. Nowe schematy różnią się w trzech istotnych punktach:
 *
 *   • rozdzielają zapis SZKICU od zapisu do PUBLIKACJI. Wcześniej istniał
 *     jeden zestaw reguł, więc redaktor nie mógł zapisać częściowo napisanego
 *     tekstu — musiał od razu mieć tytuł, lid i treść. W praktyce oznaczało
 *     to pisanie w innym programie i wklejanie na końcu;
 *   • sanityzują treść w chwili walidacji (patrz `blocks.ts`);
 *   • wyliczają pola pochodne (`slug`, `readingMinutes`), zamiast wymagać
 *     ich od klienta — dwa źródła prawdy dla sluga to gwarancja rozjazdu.
 */

import { z } from 'zod'
import { slugify } from '../../slugify'
import { stripHtml } from '../../security/sanitize-html'
import { contentBlocks, contentBlocksDraft, readingMinutes as computeReadingMinutes } from '../blocks'
import {
  contentType,
  dbId,
  futureDateTime,
  optionalText,
  publishStatus,
  slug as slugSchema,
  solectwoSlug,
  tagList,
  urlOrPath,
  paginationQuery,
  sortBy,
  sortDirection,
  flexibleBoolean,
  isoDateTime,
} from '../primitives'

// ─────────────────────────────────────────────────────────────────────────────
// Pola wspólne
// ─────────────────────────────────────────────────────────────────────────────

const title = z
  .string()
  .trim()
  .min(8, 'Tytuł musi mieć co najmniej 8 znaków.')
  .max(200, 'Tytuł może mieć najwyżej 200 znaków.')
  .transform((v) => stripHtml(v, 200))

const draftTitle = z
  .string()
  .trim()
  .min(1, 'Tytuł nie może być pusty — nawet szkic musi dać się odnaleźć na liście.')
  .max(200)
  .transform((v) => stripHtml(v, 200))

/**
 * Lid (zajawka). Minimum 20 znaków przy publikacji, bo lid krótszy nie
 * wypełnia karty na stronie głównej i układ się rozsypuje. Maksimum 500 —
 * dłuższy lid jest w kartach obcinany, więc redaktor pisałby w próżnię.
 */
const lede = z
  .string()
  .trim()
  .min(20, 'Zajawka musi mieć co najmniej 20 znaków.')
  .max(500, 'Zajawka może mieć najwyżej 500 znaków.')
  .transform((v) => stripHtml(v, 500))

const categorySlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Kategoria jest wymagana.')
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'Slug kategorii może zawierać wyłącznie małe litery, cyfry i myślniki.')

const baseFields = {
  type: contentType.default('article'),
  category: categorySlug,
  subcategory: categorySlug.optional(),
  subsubcategory: categorySlug.optional(),
  shortTitle: optionalText(120),
  heroImage: urlOrPath.optional(),
  heroAlt: optionalText(300),
  heroCaption: optionalText(500),
  heroCredit: optionalText(200),
  tags: tagList,
  solectwo: solectwoSlug.optional(),
  featured: flexibleBoolean.optional(),
  breaking: flexibleBoolean.optional(),
  /** AI11 — oznaczenie wsparcia sztucznej inteligencji. */
  aiAssisted: flexibleBoolean.optional(),
  aiDisclosure: optionalText(500),
}

// ─────────────────────────────────────────────────────────────────────────────
// Tworzenie
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tworzenie artykułu. `status` jest tu ograniczony do `draft` i `review` —
 * nie da się utworzyć artykułu od razu jako opublikowanego. Publikacja jest
 * odrębną operacją (`POST /:id/publish`), bo tylko wtedy da się sprawdzić
 * uprawnienie przejścia (B4) i zapisać wpis w dzienniku (D9). Gdyby wolno
 * było podać `status: 'published'` przy tworzeniu, cała kontrola przepływu
 * redakcyjnego dałaby się obejść jednym polem w JSON.
 */
export const articleCreateSchema = z
  .object({
    ...baseFields,
    title,
    slug: slugSchema.optional(),
    lede,
    blocks: contentBlocksDraft,
    status: z.enum(['draft', 'review']).default('draft'),
    scheduledAt: futureDateTime.optional(),
  })
  .transform((input) => ({
    ...input,
    slug: input.slug ?? slugify(input.title),
    readingMinutes: computeReadingMinutes(input.blocks as never),
  }))

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Nadpisanie całości (PUT)
// ─────────────────────────────────────────────────────────────────────────────

export const articleUpdateSchema = z
  .object({
    ...baseFields,
    title,
    slug: slugSchema.optional(),
    lede,
    blocks: contentBlocksDraft,
    scheduledAt: futureDateTime.optional().nullable(),
    /**
     * Znacznik wersji, na której pracował edytor. Serwer porównuje go
     * z bieżącym `updated_at`; niezgodność oznacza, że w międzyczasie
     * zapisał ktoś inny (B4 — kontrola równoczesnej edycji). Bez tego pola
     * drugi zapis cicho nadpisywał pracę pierwszego.
     */
    expectedUpdatedAt: isoDateTime.optional(),
  })
  .transform((input) => ({
    ...input,
    slug: input.slug ?? slugify(input.title),
    readingMinutes: computeReadingMinutes(input.blocks as never),
  }))

export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Zapis częściowy (PATCH — autozapis edytora)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Autozapis wywołuje się co kilkanaście sekund w trakcie pisania, więc
 * WSZYSTKIE pola są opcjonalne, a wymagania jakościowe (długość tytułu,
 * lidu) są zawieszone. Redaktor w połowie zdania nie może dostać błędu
 * walidacji, bo autozapis stałby się przeszkodą, nie pomocą.
 *
 * `.strict()` jest tu użyte świadomie: literówka w nazwie pola (`titel`)
 * przy `PATCH` byłaby cicho zignorowana, a redaktor zobaczyłby „zapisano”
 * i stracił tekst. Lepiej odrzucić żądanie z jasnym komunikatem.
 */
export const articlePatchSchema = z
  .object({
    title: draftTitle.optional(),
    slug: slugSchema.optional(),
    lede: z.string().trim().max(500).transform((v) => stripHtml(v, 500)).optional(),
    blocks: contentBlocksDraft.optional(),
    type: contentType.optional(),
    category: categorySlug.optional(),
    subcategory: categorySlug.optional().nullable(),
    subsubcategory: categorySlug.optional().nullable(),
    shortTitle: optionalText(120),
    heroImage: urlOrPath.optional().nullable(),
    heroAlt: optionalText(300),
    heroCaption: optionalText(500),
    heroCredit: optionalText(200),
    tags: tagList.optional(),
    solectwo: solectwoSlug.optional().nullable(),
    featured: flexibleBoolean.optional(),
    breaking: flexibleBoolean.optional(),
    aiAssisted: flexibleBoolean.optional(),
    aiDisclosure: optionalText(500),
    scheduledAt: futureDateTime.optional().nullable(),
    expectedUpdatedAt: isoDateTime.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Żądanie nie zawiera żadnego pola do zapisania.')

export type ArticlePatchInput = z.infer<typeof articlePatchSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Brama publikacji
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zestaw reguł sprawdzany PRZED publikacją — ostrzejszy od reguł zapisu.
 * Rozdzielenie jest celowe: szkic wolno mieć byle jaki, opublikowany
 * artykuł nie. Reguły odpowiadają wymogom, które w audycie zapisano jako
 * warunek pierwszego kamienia milowego.
 */
export const articlePublishGateSchema = z.object({
  title,
  lede,
  category: categorySlug,
  blocks: contentBlocks,
  /**
   * Zdjęcie główne jest wymagane do publikacji. Karta na stronie głównej
   * bez zdjęcia zostawia dziurę w siatce — układ TVN24-podobny opiera się
   * na obrazie w każdej karcie.
   */
  heroImage: urlOrPath,
  /** Opis alternatywny zdjęcia głównego — wymóg dostępności (WCAG 2.1 AA). */
  heroAlt: z
    .string()
    .trim()
    .min(3, 'Zdjęcie główne musi mieć opis alternatywny — to wymóg dostępności cyfrowej.')
    .max(300),
})

/** Dane wejściowe operacji publikacji. */
export const articlePublishSchema = z.object({
  /** Data publikacji wstecz — dopuszczalna przy przenoszeniu archiwum. */
  publishedAt: isoDateTime.optional(),
  /** Wymuszenie publikacji mimo ostrzeżeń weryfikacji AI (AI9). */
  ignoreWarnings: flexibleBoolean.default(false),
  note: optionalText(500),
})

export const articleScheduleSchema = z.object({
  scheduledAt: futureDateTime,
  note: optionalText(500),
})

export const articleUnpublishSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Podaj powód wycofania — trafi do dziennika zmian i będzie widoczny dla redakcji.')
    .max(500)
    .transform((v) => stripHtml(v, 500)),
})

export const articleStatusSchema = z.object({
  status: publishStatus,
  note: optionalText(500),
  expectedUpdatedAt: isoDateTime.optional(),
})

export const articleDuplicateSchema = z.object({
  title: title.optional(),
  /** Kopiować bloki treści czy tylko szkielet metadanych. */
  withBlocks: flexibleBoolean.default(true),
})

export const articleRestoreSchema = z.object({
  versionId: dbId,
  note: optionalText(500),
})

/**
 * Zapis samych bloków — endpoint używany przez edytor blokowy, który
 * wysyła wyłącznie treść, bez metadanych. Osobny schemat pozwala nałożyć
 * limit rozmiaru ciała żądania właściwy dla treści (2 MB), a nie dla
 * zwykłego JSON (256 kB).
 */
export const articleBlocksSchema = z.object({
  blocks: contentBlocksDraft,
  expectedUpdatedAt: isoDateTime.optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Zapytania listujące
// ─────────────────────────────────────────────────────────────────────────────

export const ARTICLE_SORT_COLUMNS = ['published_at', 'created_at', 'updated_at', 'title', 'view_count'] as const

export const articleListQuerySchema = paginationQuery.extend({
  status: publishStatus.optional(),
  category: categorySlug.optional(),
  subcategory: categorySlug.optional(),
  author: z.coerce.number().int().positive().optional(),
  tag: z.string().trim().max(48).optional(),
  solectwo: solectwoSlug.optional(),
  type: contentType.optional(),
  q: z.string().trim().min(2, 'Fraza wyszukiwania musi mieć co najmniej 2 znaki.').max(120).optional(),
  featured: flexibleBoolean.optional(),
  sort: sortBy(ARTICLE_SORT_COLUMNS, 'published_at'),
  dir: sortDirection,
  /** Uwzględnić usunięte miękko (`deleted_at IS NOT NULL`) — tylko dla panelu. */
  includeDeleted: flexibleBoolean.default(false),
})

export type ArticleListQuery = z.infer<typeof articleListQuerySchema>

export const articleIdParamSchema = z.object({ id: dbId })
export const articleSlugParamSchema = z.object({ slug: slugSchema })
