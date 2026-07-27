/**
 * FAZA 2 / B5 + A5 + I11 — Schematy mediów i galerii
 *
 * Kluczowa zmiana w stosunku do stanu poprzedniego: typ MIME pliku NIE jest
 * już brany z nagłówka przesłanego przez klienta. Nagłówek `Content-Type`
 * w części `multipart` ustawia przeglądarka albo skrypt wysyłający — plik
 * z rozszerzeniem `.jpg` i nagłówkiem `image/jpeg` mógł w środku być
 * dowolnymi bajtami, także skryptem. Prawdziwy typ ustala `sniffMime`
 * na podstawie sygnatury bajtowej.
 *
 * Drugie: pola `author`, `license` i `source` są WYMAGANE przy wgrywaniu.
 * To wymóg I11 — po zdarzeniu, w którym w portalu wisiały 45 zdjęć
 * hotlinkowanych z Unsplasha i 4 z picsum bez śladu, kto jest autorem.
 */

import { z } from 'zod'
import { stripHtml } from '../../security/sanitize-html'
import { dbId, flexibleBoolean, mediaKind, optionalText, paginationQuery, slug as slugSchema, sortBy, sortDirection, tagList, textId, urlOrPath } from '../primitives'

// ─────────────────────────────────────────────────────────────────────────────
// Dozwolone typy plików
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista dopuszczalnych typów jest zamknięta i przypisana do rodzaju medium.
 * `image/svg+xml` jest ŚWIADOMIE POMINIĘTY: plik SVG jest dokumentem XML,
 * może zawierać `<script>`, a przeglądarka wykonuje go, gdy SVG jest
 * otwarty bezpośrednio pod swoim adresem. Portal serwuje pliki z domeny
 * R2 powiązanej z witryną, więc taki skrypt działałby w naszym kontekście.
 */
export const ALLOWED_MIME: Record<string, { kind: 'image' | 'video' | 'audio' | 'document'; ext: string; maxBytes: number }> = {
  'image/jpeg': { kind: 'image', ext: 'jpg', maxBytes: 15 * 1024 * 1024 },
  'image/png': { kind: 'image', ext: 'png', maxBytes: 15 * 1024 * 1024 },
  'image/webp': { kind: 'image', ext: 'webp', maxBytes: 15 * 1024 * 1024 },
  'image/avif': { kind: 'image', ext: 'avif', maxBytes: 15 * 1024 * 1024 },
  'image/gif': { kind: 'image', ext: 'gif', maxBytes: 20 * 1024 * 1024 },
  'video/mp4': { kind: 'video', ext: 'mp4', maxBytes: 500 * 1024 * 1024 },
  'video/webm': { kind: 'video', ext: 'webm', maxBytes: 500 * 1024 * 1024 },
  'video/quicktime': { kind: 'video', ext: 'mov', maxBytes: 500 * 1024 * 1024 },
  'audio/mpeg': { kind: 'audio', ext: 'mp3', maxBytes: 200 * 1024 * 1024 },
  'audio/mp4': { kind: 'audio', ext: 'm4a', maxBytes: 200 * 1024 * 1024 },
  'audio/ogg': { kind: 'audio', ext: 'ogg', maxBytes: 200 * 1024 * 1024 },
  'audio/wav': { kind: 'audio', ext: 'wav', maxBytes: 200 * 1024 * 1024 },
  'application/pdf': { kind: 'document', ext: 'pdf', maxBytes: 50 * 1024 * 1024 },
}

export const allowedMimeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.split(';')[0].trim())
  .refine((v) => v in ALLOWED_MIME, (v) => ({
    message: `Format „${v}” nie jest obsługiwany. Dopuszczalne: ${Object.keys(ALLOWED_MIME).join(', ')}.`,
  }))

/**
 * Rozpoznanie typu na podstawie sygnatury bajtowej („magic bytes”).
 * Zwraca `null`, gdy sygnatura nie odpowiada żadnemu dozwolonemu formatowi —
 * wtedy plik jest odrzucany, niezależnie od tego, co twierdził klient.
 */
export const sniffMime = (bytes: Uint8Array): string | null => {
  const b = bytes
  const has = (offset: number, ...sig: number[]) => sig.every((byte, i) => b[offset + i] === byte)
  const ascii = (offset: number, text: string) =>
    [...text].every((ch, i) => b[offset + i] === ch.charCodeAt(0))

  if (has(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (has(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp'
  if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) return 'image/gif'
  if (ascii(4, 'ftyp')) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase()
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'image/avif'
    if (brand.startsWith('qt')) return 'video/quicktime'
    if (brand.startsWith('m4a')) return 'audio/mp4'
    return 'video/mp4'
  }
  if (has(0, 0x1a, 0x45, 0xdf, 0xa3)) return 'video/webm'
  if (has(0, 0x49, 0x44, 0x33) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'audio/mpeg'
  if (ascii(0, 'OggS')) return 'audio/ogg'
  if (ascii(0, 'RIFF') && ascii(8, 'WAVE')) return 'audio/wav'
  if (ascii(0, '%PDF-')) return 'application/pdf'
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Prawa autorskie (I11)
// ─────────────────────────────────────────────────────────────────────────────

export const MEDIA_LICENSES = [
  'wlasne',            // materiał redakcji izbica24.pl
  'cc0',
  'cc-by',
  'cc-by-sa',
  'cc-by-nd',
  'cc-by-nc',
  'domena-publiczna',
  'zgoda-autora',      // pisemna zgoda w archiwum redakcji
  'licencja-komercyjna',
  'dozwolony-uzytek',  // prawo cytatu / sprawozdanie o aktualnym wydarzeniu
] as const

export const mediaLicense = z.enum(MEDIA_LICENSES, {
  errorMap: () => ({ message: `Wskaż podstawę prawną wykorzystania. Dopuszczalne: ${MEDIA_LICENSES.join(', ')}.` }),
})

const copyrightFields = {
  /** Autor zdjęcia/nagrania. Wymagany — art. 16 prawa autorskiego. */
  author: z
    .string()
    .trim()
    .min(2, 'Podaj autora materiału — prawo do oznaczenia autorstwa jest niezbywalne.')
    .max(160)
    .transform((v) => stripHtml(v, 160)),
  license: mediaLicense,
  /** Skąd materiał pochodzi — adres źródłowy albo opis („archiwum UMiG”). */
  source: z
    .string()
    .trim()
    .min(2, 'Podaj źródło materiału.')
    .max(500)
    .transform((v) => stripHtml(v, 500)),
}

// ─────────────────────────────────────────────────────────────────────────────
// Wgrywanie
// ─────────────────────────────────────────────────────────────────────────────

export const mediaUploadMetaSchema = z.object({
  ...copyrightFields,
  title: z
    .string()
    .trim()
    .min(2, 'Tytuł materiału musi mieć co najmniej 2 znaki.')
    .max(200)
    .transform((v) => stripHtml(v, 200)),
  /**
   * Opis alternatywny. Wymagany dla obrazów — bez niego materiał trafi
   * do artykułu i naruszy WCAG. Dla nagrań wideo/audio pozostaje opcjonalny.
   */
  alt: z.string().trim().max(300).transform((v) => stripHtml(v, 300)).optional(),
  caption: optionalText(500),
  tags: tagList,
  /** Docelowe przeznaczenie — decyduje o wyborze kubełka R2. */
  bucket: z
    .enum(['articles-images', 'articles-videos', 'galerie', 'podcast', 'infografiki', 'avatary', 'ogloszenia', 'pdf'])
    .default('articles-images'),
})

export const mediaUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).transform((v) => stripHtml(v, 200)).optional(),
    alt: z.string().trim().max(300).transform((v) => stripHtml(v, 300)).optional(),
    caption: optionalText(500),
    author: z.string().trim().min(2).max(160).transform((v) => stripHtml(v, 160)).optional(),
    license: mediaLicense.optional(),
    source: z.string().trim().min(2).max(500).transform((v) => stripHtml(v, 500)).optional(),
    tags: tagList.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Żądanie nie zawiera żadnego pola do zmiany.')

export const mediaTagSchema = z.object({
  ids: z.array(dbId).min(1).max(200),
  add: tagList.optional(),
  remove: tagList.optional(),
})

export const mediaBulkSchema = z.object({
  ids: z.array(dbId).min(1, 'Wskaż co najmniej jeden plik.').max(200),
  action: z.enum(['delete', 'restore', 'move', 'retag']),
  bucket: z.string().trim().max(64).optional(),
  tags: tagList.optional(),
})

export const MEDIA_SORT_COLUMNS = ['created_at', 'title', 'size_bytes', 'kind'] as const

export const mediaListQuerySchema = paginationQuery.extend({
  kind: mediaKind.optional(),
  q: z.string().trim().min(2).max(120).optional(),
  tag: z.string().trim().max(48).optional(),
  license: mediaLicense.optional(),
  bucket: z.string().trim().max(64).optional(),
  sort: sortBy(MEDIA_SORT_COLUMNS, 'created_at'),
  dir: sortDirection,
  /** Tylko pliki bez kompletnych danych o prawach — raport dla I11. */
  missingCredits: flexibleBoolean.default(false),
})

export const mediaIdParamSchema = z.object({ id: dbId })

// ─────────────────────────────────────────────────────────────────────────────
// Wgrywanie wieloczęściowe (pliki powyżej 100 MB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cloudflare Workers ma twardy limit rozmiaru ciała żądania (100 MB na
 * planie Business, mniej na niższych) oraz limit czasu procesora. Nagranie
 * sesji rady gminy trwa dwie godziny i waży kilkaset megabajtów, więc musi
 * zostać podzielone na części po stronie przeglądarki i złożone w R2.
 */
export const multipartInitSchema = z.object({
  ...copyrightFields,
  filename: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, 'Nazwa pliku nie może zawierać znaków „/” ani „\\”.'),
  contentType: allowedMimeSchema,
  totalBytes: z.coerce.number().int().positive().max(2 * 1024 * 1024 * 1024, 'Plik przekracza 2 GB.'),
  /** Liczba części — po stronie klienta zalecane 10 MB na część. */
  parts: z.coerce.number().int().min(1).max(10_000),
  title: z.string().trim().min(2).max(200).transform((v) => stripHtml(v, 200)),
  bucket: z.string().trim().max(64).default('articles-videos'),
})

export const multipartPartSchema = z.object({
  uploadId: z.string().trim().min(1).max(256),
  key: z.string().trim().min(1).max(512),
  partNumber: z.coerce.number().int().min(1).max(10_000),
})

export const multipartCompleteSchema = z.object({
  uploadId: z.string().trim().min(1).max(256),
  key: z.string().trim().min(1).max(512),
  parts: z
    .array(z.object({ partNumber: z.coerce.number().int().min(1), etag: z.string().trim().min(1).max(256) }))
    .min(1)
    .max(10_000),
})

// ─────────────────────────────────────────────────────────────────────────────
// Galerie
// ─────────────────────────────────────────────────────────────────────────────

export const galleryCreateSchema = z.object({
  title: z.string().trim().min(3, 'Tytuł galerii musi mieć co najmniej 3 znaki.').max(200).transform((v) => stripHtml(v, 200)),
  slug: slugSchema.optional(),
  description: optionalText(2000),
  section: z.string().trim().max(80).optional(),
  eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data w formacie RRRR-MM-DD.').optional(),
  cover: urlOrPath.optional(),
})

export const galleryAddImageSchema = z.object({
  galleryId: z.union([dbId, textId]),
  images: z
    .array(
      z.object({
        src: urlOrPath,
        alt: z.string().max(300).transform((v) => stripHtml(v, 300)),
        caption: optionalText(500),
        credit: optionalText(200),
        mediaId: dbId.optional(),
      }),
    )
    .min(1, 'Wskaż co najmniej jedno zdjęcie.')
    .max(200, 'Najwyżej 200 zdjęć w jednym żądaniu.'),
})

export const galleryReorderSchema = z.object({
  galleryId: z.union([dbId, textId]),
  /** Nowa kolejność — pełna lista identyfikatorów zdjęć w docelowym porządku. */
  order: z.array(z.union([dbId, textId])).min(1).max(1000),
})

export const galleryPublishSchema = z.object({
  galleryId: z.union([dbId, textId]),
  /**
   * Galeria musi mieć co najmniej dwa zdjęcia — jedno zdjęcie to nie
   * galeria, tylko obraz w artykule, a widok galerii z jednym kadrem
   * wygląda na błąd.
   */
  cover: urlOrPath.optional(),
  publishedAt: z.string().trim().max(40).optional(),
})

export const galleryIdParamSchema = z.object({ id: z.union([dbId, textId]) })

// ─────────────────────────────────────────────────────────────────────────────
// Wideo, audio, podcast
// ─────────────────────────────────────────────────────────────────────────────

export const videoMetaSchema = z.object({
  ...copyrightFields,
  title: z.string().trim().min(3).max(200).transform((v) => stripHtml(v, 200)),
  description: optionalText(4000),
  durationSec: z.coerce.number().int().min(0).max(86_400).optional(),
  poster: urlOrPath.optional(),
  tags: tagList,
})

export const audioMetaSchema = z.object({
  ...copyrightFields,
  title: z.string().trim().min(3).max(200).transform((v) => stripHtml(v, 200)),
  description: optionalText(4000),
  durationSec: z.coerce.number().int().min(0).max(86_400).optional(),
  series: optionalText(120),
  episode: z.coerce.number().int().min(0).max(10_000).optional(),
  /** Wymagane w kanale RSS podcastu — Apple Podcasts odrzuca odcinki bez. */
  explicit: flexibleBoolean.default(false),
  tags: tagList,
})
