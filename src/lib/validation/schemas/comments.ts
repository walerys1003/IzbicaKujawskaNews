/**
 * FAZA 2 / B5 + A6 — Schematy komentarzy i moderacji
 *
 * Poprzedni walidator (`src/lib/validators/comment.ts`) sprawdzał trzy pola
 * i nie znał ani odpowiedzi na komentarz, ani zgłoszeń, ani żadnej operacji
 * moderacyjnej — bo takich operacji jeszcze nie było.
 */

import { z } from 'zod'
import { sanitizeHtml, stripHtml } from '../../security/sanitize-html'
import { dbId, email, flexibleBoolean, commentStatus, paginationQuery, sortBy, sortDirection, optionalText } from '../primitives'

/**
 * Treść komentarza. Profil `comment` sanityzatora dopuszcza wyłącznie
 * pogrubienie, kursywę i odnośnik — nie ma tu obrazów, tabel ani ramek.
 * Limit 3000 znaków to około strony maszynopisu; dłuższe wypowiedzi
 * w praktyce są kopiowanym spamem.
 */
const body = z
  .string()
  .trim()
  .min(3, 'Komentarz musi mieć co najmniej 3 znaki.')
  .max(3000, 'Komentarz może mieć najwyżej 3000 znaków.')
  .transform((value) => sanitizeHtml(value, { profile: 'comment', maxLength: 3000 }))
  .refine((value) => value.trim().length >= 3, 'Po usunięciu niedozwolonych znaczników komentarz jest za krótki.')

const authorName = z
  .string()
  .trim()
  .min(2, 'Podaj imię lub podpis — co najmniej 2 znaki.')
  .max(80, 'Podpis może mieć najwyżej 80 znaków.')
  .transform((value) => stripHtml(value, 80))

export const commentCreateSchema = z
  .object({
    /** Treść — akceptujemy oba nazewnictwa, bo frontend używał obu. */
    body: body.optional(),
    content: body.optional(),
    author: authorName.optional(),
    authorName: authorName.optional(),
    authorEmail: email.optional(),
    /** Identyfikator komentarza nadrzędnego — wątki jednopoziomowe. */
    parentId: dbId.optional().nullable(),
    /**
     * Honeypot. Pole niewidoczne dla człowieka; wypełnia je wyłącznie bot
     * automatycznie uzupełniający formularz. Wartość niepusta oznacza
     * odrzucenie — po cichu, bez informowania bota, że został wykryty.
     */
    website: z.string().max(200).optional(),
    /** Token Turnstile (I9). */
    turnstileToken: z.string().max(2048).optional(),
    'cf-turnstile-response': z.string().max(2048).optional(),
    /** Zgoda na regulamin — wymagana przy komentarzu gościa. */
    acceptTerms: flexibleBoolean.optional(),
  })
  .transform((input) => ({
    body: input.body ?? input.content ?? '',
    author: input.author ?? input.authorName,
    authorEmail: input.authorEmail,
    parentId: input.parentId ?? null,
    honeypot: input.website ?? '',
    turnstileToken: input.turnstileToken ?? input['cf-turnstile-response'],
    acceptTerms: input.acceptTerms ?? false,
  }))
  .refine((input) => input.body.length >= 3, {
    message: 'Treść komentarza jest wymagana.',
    path: ['body'],
  })

export type CommentCreateInput = z.infer<typeof commentCreateSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Moderacja (A6)
// ─────────────────────────────────────────────────────────────────────────────

export const commentModerateSchema = z.object({
  status: commentStatus,
  /**
   * Powód wymagany przy odrzuceniu. Moderator, który dziś odrzuca, a za
   * miesiąc odpowiada na skargę czytelnika, musi wiedzieć dlaczego —
   * bez zapisanego powodu decyzja jest nieodtwarzalna.
   */
  reason: optionalText(500),
  /** Zablokować autora (po odcisku adresu IP) na wskazaną liczbę dni. */
  banDays: z.coerce.number().int().min(0).max(3650).optional(),
})

export const commentBulkModerateSchema = z.object({
  ids: z.array(dbId).min(1, 'Wskaż co najmniej jeden komentarz.').max(200, 'Najwyżej 200 komentarzy w jednej operacji.'),
  status: commentStatus,
  reason: optionalText(500),
})

export const commentEditSchema = z.object({
  body,
  /** Powód redakcyjnej ingerencji w treść — obowiązek rzetelności. */
  editReason: z
    .string()
    .trim()
    .min(3, 'Podaj powód zmiany treści komentarza.')
    .max(300)
    .transform((v) => stripHtml(v, 300)),
})

export const commentReportSchema = z.object({
  reason: z.enum(['spam', 'obrazliwy', 'nieprawdziwy', 'dane-osobowe', 'inny'], {
    errorMap: () => ({ message: 'Dopuszczalne powody: spam, obrazliwy, nieprawdziwy, dane-osobowe, inny.' }),
  }),
  details: optionalText(1000),
})

export const COMMENT_SORT_COLUMNS = ['created_at', 'updated_at', 'status'] as const

export const commentListQuerySchema = paginationQuery.extend({
  status: commentStatus.optional(),
  articleId: dbId.optional(),
  articleSlug: z.string().trim().max(160).optional(),
  q: z.string().trim().min(2).max(120).optional(),
  sort: sortBy(COMMENT_SORT_COLUMNS, 'created_at'),
  dir: sortDirection,
  /** Tylko komentarze zgłoszone przez czytelników. */
  reportedOnly: flexibleBoolean.default(false),
})

export const commentIdParamSchema = z.object({ id: dbId })
