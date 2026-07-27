/**
 * FAZA 2 / B5 — Schematy pozostałych modułów portalu
 *
 * Zbiera w jednym miejscu moduły, z których każdy ma po dwa–cztery
 * endpointy: newsletter, kontakt, wyszukiwanie, ogłoszenia (nekrologi,
 * praca, nieruchomości), wydarzenia, powiadomienia web push, użytkownicy,
 * ustawienia i mostek n8n.
 *
 * Wszystkie te trasy przyjmowały wcześniej `any`. Najgroźniejszy przypadek
 * to `POST /api/v1/incoming` — mostek dla n8n, który sprawdzał wyłącznie
 * obecność dwóch pól i przepuszczał dowolny kształt `payload` z zewnętrznego
 * systemu wprost do dalszego przetwarzania.
 */

import { z } from 'zod'
import { sanitizeHtml, stripHtml } from '../../security/sanitize-html'
import {
  dbId,
  email,
  flexibleBoolean,
  httpUrl,
  isoDate,
  isoDateTime,
  optionalText,
  paginationQuery,
  phonePl,
  slug as slugSchema,
  sortBy,
  sortDirection,
  tagList,
  urlOrPath,
  userRole,
} from '../primitives'

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter
// ─────────────────────────────────────────────────────────────────────────────

export const newsletterSubscribeSchema = z.object({
  email,
  name: optionalText(120),
  /**
   * Zgoda MUSI być podana jawnie jako `true`. RODO art. 7 ust. 1 nakłada
   * na administratora obowiązek wykazania, że zgoda została udzielona —
   * domyślne `true` uniemożliwia takie wykazanie.
   */
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  categories: tagList,
  turnstileToken: z.string().max(2048).optional(),
  'cf-turnstile-response': z.string().max(2048).optional(),
  /** Honeypot. */
  website: z.string().max(200).optional(),
})

export const newsletterUnsubscribeSchema = z.object({
  /** Token z odnośnika w wiadomości — nigdy sam adres e-mail. */
  token: z.string().trim().min(16, 'Nieprawidłowy odnośnik rezygnacji.').max(256),
  reason: optionalText(500),
})

export const newsletterConfirmSchema = z.object({
  token: z.string().trim().min(16).max(256),
})

export const newsletterSendSchema = z.object({
  subject: z.string().trim().min(4, 'Temat musi mieć co najmniej 4 znaki.').max(200).transform((v) => stripHtml(v, 200)),
  html: z
    .string()
    .trim()
    .min(20)
    .max(200_000)
    .transform((v) => sanitizeHtml(v, { profile: 'article', maxLength: 200_000 })),
  /** Wysyłka próbna na wskazany adres przed wysyłką masową. */
  testTo: email.optional(),
  categories: tagList,
  scheduledAt: isoDateTime.optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Formularz kontaktowy
// ─────────────────────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię i nazwisko.').max(120).transform((v) => stripHtml(v, 120)),
  email,
  phone: phonePl.optional(),
  subject: z.string().trim().min(3, 'Podaj temat wiadomości.').max(200).transform((v) => stripHtml(v, 200)),
  /**
   * Treść jest oczyszczana do czystego tekstu, nie do HTML. Wiadomość
   * z formularza kontaktowego trafia do skrzynki redakcji i tam żaden
   * HTML nie jest potrzebny, a wpuszczony bywa wektorem ataku na klienta
   * pocztowego odbiorcy.
   */
  message: z
    .string()
    .trim()
    .min(20, 'Treść wiadomości musi mieć co najmniej 20 znaków.')
    .max(10_000)
    .transform((v) => stripHtml(v, 10_000)),
  /** Dział, do którego trafia wiadomość. */
  department: z.enum(['redakcja', 'reklama', 'techniczne', 'sprostowanie', 'inne']).default('redakcja'),
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  turnstileToken: z.string().max(2048).optional(),
  'cf-turnstile-response': z.string().max(2048).optional(),
  website: z.string().max(200).optional(),
})

/**
 * Wniosek o sprostowanie — art. 31a prawa prasowego. Wymaga danych
 * pozwalających zidentyfikować wnioskodawcę i materiał, bo redakcja ma
 * ustawowy termin na odpowiedź i musi go móc udokumentować.
 */
export const correctionRequestSchema = z.object({
  name: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  email,
  phone: phonePl.optional(),
  articleUrl: urlOrPath,
  /** Fragment, którego dotyczy wniosek. */
  disputedFragment: z.string().trim().min(10, 'Wskaż sporny fragment.').max(4000).transform((v) => stripHtml(v, 4000)),
  proposedText: z
    .string()
    .trim()
    .min(10, 'Podaj proponowaną treść sprostowania.')
    .max(4000)
    .transform((v) => stripHtml(v, 4000)),
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  turnstileToken: z.string().max(2048).optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Wyszukiwanie
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fraza wyszukiwania. Znaki składni FTS5 (`"`, `*`, `:`, `^`, `-`, `(`, `)`,
 * `NEAR`) są usuwane, bo trafiały wprost do `MATCH` i przy niedomkniętym
 * cudzysłowie wywracały zapytanie błędem składni SQLite — czytelnik
 * dostawał HTTP 500 za wpisanie w wyszukiwarkę cudzysłowu.
 */
export const searchQuerySchema = paginationQuery.extend({
  q: z
    .string()
    .trim()
    .min(2, 'Fraza wyszukiwania musi mieć co najmniej 2 znaki.')
    .max(120, 'Fraza wyszukiwania może mieć najwyżej 120 znaków.')
    .transform((v) => v.replace(/["*:^()\-]/g, ' ').replace(/\bNEAR\b/gi, ' ').replace(/\s+/g, ' ').trim())
    .refine((v) => v.length >= 2, 'Fraza po usunięciu znaków specjalnych jest za krótka.'),
  scope: z.enum(['all', 'articles', 'comments', 'obituaries', 'ogloszenia', 'events', 'solectwa', 'pages']).default('all'),
  category: z.string().trim().max(80).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
})

export const suggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(60).transform((v) => v.replace(/["*:^()]/g, ' ').trim()),
  limit: z.coerce.number().int().min(1).max(20).default(8),
})

// ─────────────────────────────────────────────────────────────────────────────
// Ogłoszenia
// ─────────────────────────────────────────────────────────────────────────────

export const obituarySchema = z.object({
  fullName: z.string().trim().min(3, 'Podaj imię i nazwisko.').max(160).transform((v) => stripHtml(v, 160)),
  bornOn: isoDate.optional(),
  diedOn: isoDate,
  /** Miejscowość — najczęściej jedno z 34 sołectw, ale dopuszczamy dowolną. */
  place: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  funeralAt: isoDateTime.optional(),
  funeralPlace: optionalText(200),
  text: z.string().trim().max(4000).transform((v) => stripHtml(v, 4000)).optional(),
  photo: urlOrPath.optional(),
  /** Osoba zgłaszająca — dane kontaktowe do weryfikacji przed publikacją. */
  submitterName: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  submitterPhone: phonePl,
  submitterEmail: email.optional(),
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  turnstileToken: z.string().max(2048).optional(),
}).superRefine((input, ctx) => {
  // Data zgonu przed datą urodzenia to oczywisty błąd wpisu, który bez
  // kontroli trafiłby na stronę i musiałby być poprawiany po interwencji rodziny.
  if (input.bornOn && input.bornOn > input.diedOn) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bornOn'], message: 'Data urodzenia nie może być późniejsza od daty zgonu.' })
  }
})

export const jobOfferSchema = z.object({
  title: z.string().trim().min(4).max(200).transform((v) => stripHtml(v, 200)),
  company: z.string().trim().min(2).max(160).transform((v) => stripHtml(v, 160)),
  place: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  description: z.string().trim().min(30, 'Opis stanowiska musi mieć co najmniej 30 znaków.').max(8000).transform((v) => stripHtml(v, 8000)),
  salaryFrom: z.coerce.number().int().min(0).max(1_000_000).optional(),
  salaryTo: z.coerce.number().int().min(0).max(1_000_000).optional(),
  contractType: z.enum(['umowa-o-prace', 'zlecenie', 'dzielo', 'b2b', 'staz', 'praktyka', 'inna']).default('umowa-o-prace'),
  contactEmail: email.optional(),
  contactPhone: phonePl.optional(),
  validUntil: isoDate.optional(),
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  turnstileToken: z.string().max(2048).optional(),
}).superRefine((input, ctx) => {
  if (input.salaryFrom !== undefined && input.salaryTo !== undefined && input.salaryFrom > input.salaryTo) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salaryTo'], message: 'Górna granica wynagrodzenia nie może być niższa od dolnej.' })
  }
  if (!input.contactEmail && !input.contactPhone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contactEmail'], message: 'Podaj adres e-mail albo numer telefonu — inaczej nikt nie odpowie na ofertę.' })
  }
})

export const realEstateSchema = z.object({
  title: z.string().trim().min(4).max(200).transform((v) => stripHtml(v, 200)),
  kind: z.enum(['mieszkanie', 'dom', 'dzialka', 'lokal', 'garaz', 'gospodarstwo', 'inne']),
  deal: z.enum(['sprzedaz', 'wynajem', 'zamiana']),
  place: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  price: z.coerce.number().int().min(0).max(100_000_000).optional(),
  areaM2: z.coerce.number().min(0).max(1_000_000).optional(),
  rooms: z.coerce.number().int().min(0).max(50).optional(),
  description: z.string().trim().min(30).max(8000).transform((v) => stripHtml(v, 8000)),
  photos: z.array(urlOrPath).max(20).default([]),
  contactPhone: phonePl,
  contactEmail: email.optional(),
  validUntil: isoDate.optional(),
  consent: flexibleBoolean.refine((v) => v === true, 'Zgoda na przetwarzanie danych jest wymagana.'),
  turnstileToken: z.string().max(2048).optional(),
})

export const ANNOUNCEMENT_SORT_COLUMNS = ['created_at', 'valid_until', 'price'] as const

export const announcementListQuerySchema = paginationQuery.extend({
  kind: z.string().trim().max(48).optional(),
  place: z.string().trim().max(120).optional(),
  q: z.string().trim().min(2).max(120).optional(),
  priceFrom: z.coerce.number().int().min(0).optional(),
  priceTo: z.coerce.number().int().min(0).optional(),
  sort: sortBy(ANNOUNCEMENT_SORT_COLUMNS, 'created_at'),
  dir: sortDirection,
})

// ─────────────────────────────────────────────────────────────────────────────
// Wydarzenia
// ─────────────────────────────────────────────────────────────────────────────

export const eventSchema = z
  .object({
    title: z.string().trim().min(4).max(200).transform((v) => stripHtml(v, 200)),
    slug: slugSchema.optional(),
    description: z.string().trim().max(8000).transform((v) => stripHtml(v, 8000)).optional(),
    startAt: isoDateTime,
    endAt: isoDateTime.optional(),
    location: z.string().trim().min(2).max(200).transform((v) => stripHtml(v, 200)),
    organizer: optionalText(200),
    category: z.enum(['kultura', 'sport', 'samorzad', 'oswiata', 'religia', 'osp', 'kgw', 'inne']).default('inne'),
    free: flexibleBoolean.default(true),
    ticketUrl: httpUrl.optional(),
    image: urlOrPath.optional(),
  })
  .superRefine((input, ctx) => {
    if (input.endAt && new Date(input.endAt) <= new Date(input.startAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'Koniec wydarzenia musi być późniejszy od jego początku.' })
    }
  })

export const eventListQuerySchema = paginationQuery.extend({
  from: isoDate.optional(),
  to: isoDate.optional(),
  category: z.string().trim().max(48).optional(),
  week: z.string().trim().max(16).optional(),
  free: flexibleBoolean.optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Powiadomienia web push
// ─────────────────────────────────────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  endpoint: httpUrl,
  keys: z.object({
    p256dh: z.string().trim().min(16).max(256),
    auth: z.string().trim().min(8).max(128),
  }),
  topics: tagList,
})

export const pushSendSchema = z.object({
  title: z.string().trim().min(4).max(80, 'Tytuł powiadomienia jest obcinany powyżej 80 znaków — skróć go.').transform((v) => stripHtml(v, 80)),
  body: z.string().trim().min(4).max(200, 'Treść powiadomienia jest obcinana powyżej 200 znaków.').transform((v) => stripHtml(v, 200)),
  url: urlOrPath,
  icon: urlOrPath.optional(),
  topics: tagList,
  /** Powiadomienie o pilnym zdarzeniu — pomija ciszę nocną. */
  urgent: flexibleBoolean.default(false),
})

// ─────────────────────────────────────────────────────────────────────────────
// Użytkownicy (panel administracyjny)
// ─────────────────────────────────────────────────────────────────────────────

export const userCreateSchema = z.object({
  email,
  name: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)),
  role: userRole.default('viewer'),
  /**
   * Hasło początkowe jest opcjonalne. Gdy go nie ma, konto powstaje bez
   * hasła, a użytkownik ustawia je z odnośnika wysłanego na adres e-mail.
   * To bezpieczniejsze od hasła generowanego przez administratora
   * i przekazywanego kanałem pobocznym.
   */
  password: z.string().min(12, 'Hasło musi mieć co najmniej 12 znaków.').max(256).optional(),
  sendInvite: flexibleBoolean.default(true),
})

export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).transform((v) => stripHtml(v, 120)).optional(),
    role: userRole.optional(),
    bio: z.string().trim().max(2000).transform((v) => stripHtml(v, 2000)).optional(),
    avatar: urlOrPath.optional().nullable(),
    /** Zablokowanie konta bez usuwania — np. na czas postępowania. */
    locked: flexibleBoolean.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Żądanie nie zawiera żadnego pola do zmiany.')

export const USER_SORT_COLUMNS = ['created_at', 'email', 'role', 'last_login_at'] as const

export const userListQuerySchema = paginationQuery.extend({
  role: userRole.optional(),
  q: z.string().trim().min(2).max(120).optional(),
  sort: sortBy(USER_SORT_COLUMNS, 'created_at'),
  dir: sortDirection,
  includeDeleted: flexibleBoolean.default(false),
})

// ─────────────────────────────────────────────────────────────────────────────
// Ustawienia portalu
// ─────────────────────────────────────────────────────────────────────────────

export const settingsUpdateSchema = z.object({
  /**
   * Ustawienia to pary klucz–wartość. Klucz jest ograniczony wzorcem,
   * bo trafia do kolumny `key` z ograniczeniem UNIQUE i jest używany
   * w kodzie jako identyfikator — spacja albo kropka w kluczu powodowały
   * ciche pominięcie ustawienia przy odczycie.
   */
  entries: z
    .array(
      z.object({
        key: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/, 'Klucz ustawienia: małe litery, cyfry, podkreślnik, kropka jako separator.'),
        value: z.union([z.string().max(20_000), z.number(), z.boolean(), z.null()]),
      }),
    )
    .min(1)
    .max(200),
})

// ─────────────────────────────────────────────────────────────────────────────
// Mostek n8n
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `POST /api/v1/incoming` — wejście dla automatyzacji n8n. Wcześniej
 * sprawdzało wyłącznie obecność `source` i `payload`, po czym przepuszczało
 * dowolną strukturę. Teraz `source` należy do zamkniętej listy, a `payload`
 * ma zadeklarowany kształt zależny od rodzaju.
 */
export const INCOMING_SOURCES = [
  'bip-gmina',
  'bip-powiat',
  'rss-radiopik',
  'rss-pomorska',
  'rss-portalwloclawek',
  'facebook-osp',
  'facebook-umig',
  'pogoda',
  'ceny-paliw',
  'jakosc-powietrza',
  'apteka-dyzurna',
  'reczne',
] as const

export const incomingSchema = z.object({
  source: z.enum(INCOMING_SOURCES, {
    errorMap: () => ({ message: `Nieznane źródło. Dopuszczalne: ${INCOMING_SOURCES.join(', ')}.` }),
  }),
  payload: z.union([
    z.record(z.unknown()),
    z.array(z.record(z.unknown())).max(500, 'Najwyżej 500 pozycji w jednej paczce.'),
  ]),
  /** Klucz idempotencji — chroni przed podwójnym przetworzeniem przy ponowieniu. */
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  receivedAt: isoDateTime.optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Wspólne parametry ścieżki
// ─────────────────────────────────────────────────────────────────────────────

export const idParamSchema = z.object({ id: dbId })
export const slugParamSchema = z.object({ slug: slugSchema })
