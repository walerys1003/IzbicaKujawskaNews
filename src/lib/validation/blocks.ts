/**
 * FAZA 2 / B5 — Schemat bloków treści artykułu
 *
 * Typ `ContentBlock` z `src/v4/content-types.ts` jest unią dwunastu wariantów
 * rozróżnianych polem `type`. Do tej pory istniał wyłącznie jako typ
 * TypeScript, czyli wyłącznie w czasie kompilacji. W czasie działania
 * program przyjmował dowolny obiekt i wstawiał jego `html` do strony —
 * nikt nie sprawdzał ani wariantu, ani zawartości.
 *
 * Ten plik daje dwie rzeczy, których zabrakło:
 *
 *   1. Weryfikację wariantu w czasie działania — `{ type: 'paragrap' }`
 *      (literówka) był wcześniej cicho renderowany jako pusty blok;
 *      teraz jest odrzucany z komunikatem wskazującym numer bloku.
 *
 *   2. Sanityzację HTML wewnątrz bloku. To jest tu kluczowe: bloki są
 *      jedynym miejscem w portalu, gdzie treść użytkownika trafia do strony
 *      jako HTML, a nie jako tekst. Sanityzacja wykonywana JEST W SCHEMACIE,
 *      nie w widoku — gdyby siedziała w widoku, każdy nowy widok musiałby
 *      o niej pamiętać, a wystarczy jedno przeoczenie. W schemacie nie da
 *      się jej pominąć, bo do bazy nie dojdzie nic, co przez niego nie
 *      przeszło.
 *
 * Wynik `parse` jest zgodny z `ContentBlock`, więc widoki v4 renderują go
 * bez żadnej zmiany.
 */

import { z } from 'zod'
import { sanitizeHtml, stripHtml } from '../security/sanitize-html'
import { httpUrl, urlOrPath, textId } from './primitives'

/** HTML akapitu — przechodzi przez profil artykułowy sanityzatora. */
const articleHtml = (max = 20_000) =>
  z
    .string()
    .trim()
    .min(1, 'Blok tekstowy nie może być pusty.')
    .max(max, `Blok tekstowy jest za długi — najwyżej ${max} znaków.`)
    .transform((value) => sanitizeHtml(value, { profile: 'article', maxLength: max }))
    .refine((value) => value.trim().length > 0, 'Po usunięciu niedozwolonych znaczników blok jest pusty.')

/** Tekst bez żadnego HTML — nagłówki, podpisy, elementy list. */
const plain = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} nie może być puste.` : `${label}: wymagane co najmniej ${min} znaków.`)
    .max(max, `${label}: najwyżej ${max} znaków.`)
    .transform((value) => stripHtml(value, max))
    .refine((value) => value.trim().length > 0, `${label} nie może być puste.`)

const optionalPlain = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => stripHtml(value, max))
    .transform((value) => (value.length ? value : undefined))
    .optional()

// ─────────────────────────────────────────────────────────────────────────────
// Dwanaście wariantów bloku
// ─────────────────────────────────────────────────────────────────────────────

export const paragraphBlock = z.object({
  type: z.literal('paragraph'),
  html: articleHtml(20_000),
})

export const headingBlock = z.object({
  type: z.literal('heading'),
  /**
   * Dopuszczamy wyłącznie poziomy 2 i 3. Poziom 1 jest zarezerwowany dla
   * tytułu artykułu — gdyby redaktor mógł wstawić drugi `<h1>`, strona
   * miałaby dwa nagłówki najwyższego poziomu, co psuje zarówno dostępność
   * (czytnik ekranu traci strukturę), jak i pozycjonowanie.
   */
  level: z.union([z.literal(2), z.literal(3), z.literal('2'), z.literal('3')]).transform((v) => Number(v) as 2 | 3),
  text: plain(2, 200, 'Nagłówek'),
})

export const listBlock = z.object({
  type: z.literal('list'),
  ordered: z.boolean().optional(),
  items: z
    .array(plain(1, 500, 'Element listy'))
    .min(1, 'Lista musi mieć co najmniej jedną pozycję.')
    .max(50, 'Lista może mieć najwyżej 50 pozycji.'),
})

export const quoteBlock = z.object({
  type: z.literal('quote'),
  text: plain(3, 2000, 'Treść cytatu'),
  author: optionalPlain(120),
  role: optionalPlain(160),
})

export const imageBlock = z.object({
  type: z.literal('image'),
  src: urlOrPath,
  /**
   * `alt` jest WYMAGANY. Ustawa o dostępności cyfrowej (WCAG 2.1 AA, poziom
   * obowiązkowy dla podmiotów realizujących zadania publiczne) wymaga opisu
   * alternatywnego. Pole opcjonalne oznaczałoby, że redaktor je pominie,
   * bo pominięcie jest szybsze. Dla zdjęcia wyłącznie dekoracyjnego
   * należy podać pusty łańcuch jawnie — dlatego minimum to 0 znaków,
   * ale klucz musi wystąpić.
   */
  alt: z
    .string()
    .max(300, 'Opis alternatywny: najwyżej 300 znaków.')
    .transform((value) => stripHtml(value, 300)),
  caption: optionalPlain(500),
  credit: optionalPlain(200),
})

export const galleryBlock = z.object({
  type: z.literal('gallery'),
  galleryId: textId,
})

export const videoBlock = z.object({
  type: z.literal('video'),
  src: urlOrPath,
  poster: urlOrPath.optional(),
  caption: optionalPlain(500),
  duration: optionalPlain(16),
})

export const audioBlock = z.object({
  type: z.literal('audio'),
  src: urlOrPath,
  title: optionalPlain(200),
  duration: optionalPlain(16),
})

/**
 * Osadzenie materiału zewnętrznego. Lista dostawców jest ZAMKNIĘTA, a adres
 * musi należeć do domeny tego dostawcy. Bez tej drugiej kontroli
 * `{ provider: 'youtube', url: 'https://zlosliwa.example/x' }` dawał
 * `<iframe src>` na dowolną stronę — to jest przejęcie ramki w obrębie
 * naszego dokumentu, nie tylko zły odnośnik.
 */
const EMBED_HOSTS: Record<string, string[]> = {
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'],
  spotify: ['open.spotify.com', 'spotify.com', 'podcasters.spotify.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'fb.watch', 'web.facebook.com'],
  x: ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com', 'platform.twitter.com'],
}

export const embedBlock = z
  .object({
    type: z.literal('embed'),
    provider: z.enum(['youtube', 'spotify', 'facebook', 'x']),
    url: httpUrl,
  })
  .superRefine((block, ctx) => {
    let host: string
    try {
      host = new URL(block.url).hostname.toLowerCase()
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'Nieprawidłowy adres.' })
      return
    }
    const allowed = EMBED_HOSTS[block.provider] ?? []
    if (!allowed.includes(host)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: `Dla dostawcy „${block.provider}” dopuszczalne domeny to: ${allowed.join(', ')}. Otrzymano „${host}”.`,
      })
    }
  })

export const fileBlock = z.object({
  type: z.literal('file'),
  url: urlOrPath,
  label: plain(1, 200, 'Nazwa pliku'),
  sizeLabel: optionalPlain(32),
  mime: optionalPlain(128),
})

export const tableBlock = z
  .object({
    type: z.literal('table'),
    head: z.array(plain(0, 200, 'Nagłówek kolumny')).min(1, 'Tabela musi mieć co najmniej jedną kolumnę.').max(12, 'Tabela może mieć najwyżej 12 kolumn.'),
    rows: z
      .array(z.array(z.string().max(1000).transform((v) => stripHtml(v, 1000))))
      .max(200, 'Tabela może mieć najwyżej 200 wierszy.'),
  })
  .superRefine((block, ctx) => {
    // Wiersz krótszy od nagłówka rozjeżdżał tabelę w widoku bez żadnego
    // ostrzeżenia — kolumny przesuwały się w lewo, dane trafiały pod złe
    // nagłówki. Lepiej odrzucić przy zapisie niż wyświetlić mylące liczby.
    block.rows.forEach((row, index) => {
      if (row.length !== block.head.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rows', index],
          message: `Wiersz ma ${row.length} komórek, a tabela ${block.head.length} kolumn.`,
        })
      }
    })
  })

export const infoBlock = z.object({
  type: z.literal('info'),
  variant: z.enum(['info', 'warning', 'success']),
  title: optionalPlain(200),
  html: articleHtml(6000),
})

// ─────────────────────────────────────────────────────────────────────────────
// Unia rozróżniana
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wybór strategii rozpoznawania wariantu.
 *
 * Naturalnym odruchem byłoby `z.discriminatedUnion('type', [...])`. Nie da
 * się go tu użyć, bo dwa warianty (`embed`, `table`) mają `superRefine`,
 * a to zamienia `ZodObject` w `ZodEffects` — typ, którego unia rozróżniana
 * nie przyjmuje (biblioteka musi zajrzeć do `shape.type`, a `ZodEffects`
 * nie ma `shape`). Próba obejścia rzutowaniem kończy się błędem w czasie
 * działania, nie w czasie kompilacji.
 *
 * Zwykła `z.union` też nie jest dobra: przy porażce zwraca zestaw błędów
 * z wszystkich dwunastu wariantów, z którego redaktor nie wyczyta niczego.
 *
 * Dlatego rozpoznajemy wariant sami — po polu `type` — i uruchamiamy
 * dokładnie jeden schemat. Komunikat dotyczy wtedy tego jednego wariantu:
 * „blok 3, pole text: pole jest wymagane”.
 */
export const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'list',
  'quote',
  'image',
  'gallery',
  'video',
  'audio',
  'embed',
  'file',
  'table',
  'info',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

/** Pojedynczy blok — z obsługą wariantów uściślanych (`embed`, `table`). */
const singleBlock = z
  .object({ type: z.string() })
  .passthrough()
  .superRefine(() => undefined)
  .transform((raw, ctx) => {
    const type = String((raw as { type?: unknown }).type ?? '')
    if (!BLOCK_TYPES.includes(type as BlockType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['type'],
        message: `Nieznany typ bloku „${type}”. Dopuszczalne: ${BLOCK_TYPES.join(', ')}.`,
      })
      return z.NEVER
    }
    const schemas: Record<BlockType, z.ZodTypeAny> = {
      paragraph: paragraphBlock,
      heading: headingBlock,
      list: listBlock,
      quote: quoteBlock,
      image: imageBlock,
      gallery: galleryBlock,
      video: videoBlock,
      audio: audioBlock,
      embed: embedBlock,
      file: fileBlock,
      table: tableBlock,
      info: infoBlock,
    }
    const result = schemas[type as BlockType].safeParse(raw)
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: issue.path })
      }
      return z.NEVER
    }
    return result.data
  })

/**
 * Lista bloków artykułu. Limit 300 bloków chroni budżet procesora na
 * krawędzi — renderowanie i sanityzacja są liniowe względem liczby bloków,
 * a 10 ms na żądanie kończy się szybciej, niż się wydaje.
 */
export const contentBlocks = z
  .array(singleBlock)
  .min(1, 'Artykuł musi mieć co najmniej jeden blok treści.')
  .max(300, 'Artykuł może mieć najwyżej 300 bloków treści.')

/** Wariant dopuszczający pustą listę — szkic bez treści wolno zapisać. */
export const contentBlocksDraft = z.array(singleBlock).max(300).default([])

export type ValidatedBlock = z.infer<typeof singleBlock>

// ─────────────────────────────────────────────────────────────────────────────
// Narzędzia pomocnicze
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liczba słów w blokach — podstawa do wyliczenia czasu czytania i do
 * kontroli długości w generatorze AI (AI4). Liczymy tylko treść widoczną
 * dla czytelnika; podpisy zdjęć i nagłówki tabel pomijamy, bo nie są
 * czytane w toku narracji.
 */
export const countWords = (blocks: ValidatedBlock[]): number => {
  let words = 0
  const add = (text: string) => {
    const t = stripHtml(text, 100_000).trim()
    if (t) words += t.split(/\s+/).length
  }
  for (const block of blocks as Array<Record<string, unknown>>) {
    switch (block.type) {
      case 'paragraph':
      case 'info':
        add(String(block.html ?? ''))
        break
      case 'heading':
        add(String(block.text ?? ''))
        break
      case 'quote':
        add(String(block.text ?? ''))
        break
      case 'list':
        for (const item of (block.items as string[]) ?? []) add(item)
        break
      default:
        break
    }
  }
  return words
}

/**
 * Czas czytania w minutach. 200 słów na minutę to tempo przyjęte dla
 * tekstu prasowego w języku polskim (wolniejsze niż angielskie 250 —
 * polskie słowa są dłuższe). Minimum jedna minuta, bo „0 min czytania”
 * wygląda na błąd.
 */
export const readingMinutes = (blocks: ValidatedBlock[]): number =>
  Math.max(1, Math.round(countWords(blocks) / 200))

/** Wyciąg tekstowy bez HTML — do indeksu FTS5 i do wykrywania plagiatu (AI9). */
export const blocksToPlainText = (blocks: ValidatedBlock[]): string => {
  const parts: string[] = []
  for (const block of blocks as Array<Record<string, unknown>>) {
    switch (block.type) {
      case 'paragraph':
      case 'info':
        parts.push(stripHtml(String(block.html ?? ''), 50_000))
        break
      case 'heading':
      case 'quote':
        parts.push(String(block.text ?? ''))
        break
      case 'list':
        parts.push(((block.items as string[]) ?? []).join(' '))
        break
      case 'image':
        if (block.caption) parts.push(String(block.caption))
        break
      case 'table':
        parts.push(((block.head as string[]) ?? []).join(' '))
        for (const row of ((block.rows as string[][]) ?? [])) parts.push(row.join(' '))
        break
      default:
        break
    }
  }
  return parts.filter(Boolean).join('\n\n')
}
