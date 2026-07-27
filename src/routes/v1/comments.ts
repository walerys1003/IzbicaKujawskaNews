/**
 * FAZA 1 / A7 — komentarze: jedna implementacja, z sanityzacją i zapisem do D1.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CO BYŁO NIE TAK
 * ══════════════════════════════════════════════════════════════════════════
 * W src/api/v1.ts istniały DWA endpointy przyjmujące komentarze
 * (`POST /articles/:slug/comments` oraz `POST /comments`) z niemal
 * identycznym, skopiowanym kodem. Oba miały te same trzy usterki:
 *
 *   1. BRAK ZAPISU. Zwracały `{ ok: true, commentId: 'c_' + Date.now() }`
 *      i status `pending_moderation`, ale nie dotykały bazy. Mieszkaniec
 *      widział potwierdzenie „komentarz oczekuje na moderację”, redakcja
 *      nie miała w panelu czego moderować, a treść przepadała bezpowrotnie.
 *
 *   2. BRAK SANITYZACJI. Treść nie była filtrowana, więc po ewentualnym
 *      dodaniu zapisu i wyświetlenia komentarz w formie
 *      `<img src=x onerror="...">` wykonywałby skrypt u każdego czytelnika
 *      artykułu — i u redaktora otwierającego panel moderacji.
 *
 *   3. BRAK LIMITU. Nic nie ograniczało tempa wysyłania, więc pojedynczy
 *      skrypt mógł zapełnić kolejkę moderacji tysiącami wpisów.
 *
 * Dodatkowo istniejący walidator (src/lib/validators/comment.ts) nie był
 * przez żaden z tych endpointów używany.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ROZWIĄZANIE
 * ══════════════════════════════════════════════════════════════════════════
 * Jeden moduł obsługujący oba adresy (drugi jako alias), z walidacją,
 * sanityzacją profilem komentarzowym, limitem 3 na 10 minut, filtrem
 * wulgaryzmów, detekcją spamu i realnym zapisem do tabeli `comments`
 * ze statusem `pending`.
 *
 * Adres IP zapisujemy jako skrót SHA-256 (kolumna `ip_hash`) — pozwala
 * wykrywać powtarzające się źródło nadużyć, nie przechowując danych
 * osobowych w postaci jawnej (RODO, zasada minimalizacji).
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { fail, created } from '../../lib/http/envelope'
import { sanitizeHtml, stripHtml } from '../../lib/security/sanitize-html'
import { validateComment } from '../../lib/validators/comment'
import { commentRateLimit } from '../../middleware/rate-limit'
// Etap I9 — weryfikacja Cloudflare Turnstile przed przyjęciem treści.
import { turnstileGuard } from '../../middleware/turnstile'
import { detectSpam } from '../../lib/moderation/spam-detector'
import { hasProfanity, sanitizeProfanity } from '../../lib/moderation/profanity-filter'

const route = new Hono<AppEnv>()

/** Skrót adresu IP — do wykrywania nadużyć bez przechowywania IP jawnie. */
const hashIp = async (ip: string) => {
  const data = new TextEncoder().encode(`izbica24:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

interface CommentBody {
  articleSlug?: string
  name?: string
  email?: string
  text?: string
  consent?: boolean
  /** Pole-pułapka dla botów (I9) — człowiek go nie widzi, więc nie wypełni. */
  website?: string
}

const handleSubmit = async (c: Parameters<Parameters<typeof route.post>[1]>[0], slugFromPath?: string) => {
  const db = c.env?.DB
  if (!db) return fail(c, 'database_unavailable')

  let body: CommentBody
  try {
    body = await c.req.json<CommentBody>()
  } catch {
    return fail(c, 'validation_error', 'Treść żądania nie jest poprawnym dokumentem JSON.')
  }

  // ── Honeypot (I9): wypełnione pole niewidoczne dla człowieka = bot ─────
  // Odpowiadamy sukcesem, aby bot nie dowiedział się, że został wykryty,
  // ale nie zapisujemy niczego.
  if (body.website) {
    console.warn('[comments] Odrzucono zgłoszenie z wypełnionym honeypotem.')
    return created(c, { status: 'pending_moderation', accepted: false })
  }

  const slug = slugFromPath || String(body.articleSlug || '').trim()
  if (!slug) {
    return fail(c, 'validation_error', 'Brak wskazania artykułu.', { required: ['articleSlug'] })
  }

  // ── Walidacja (wykorzystujemy istniejący, dotąd nieużywany walidator) ──
  const validation = validateComment({
    name: body.name,
    email: body.email,
    text: body.text,
    consent: body.consent,
  })
  if (!validation.ok || !validation.data) {
    return fail(c, 'validation_error', 'Dane komentarza są nieprawidłowe.', { fields: validation.errors })
  }

  // ── Artykuł musi istnieć w BAZIE (nie w pliku TypeScript) ─────────────
  const articleRow = await db
    .prepare('SELECT id, title FROM articles WHERE slug = ?1 AND deleted_at IS NULL')
    .bind(slug)
    .first<{ id: number; title: string }>()

  if (!articleRow) {
    return fail(c, 'not_found', 'Nie znaleziono artykułu o podanym adresie.', { slug })
  }

  // ── Sanityzacja ────────────────────────────────────────────────────────
  // Nazwa autora: żadnych znaczników — czysty tekst.
  const authorName = stripHtml(validation.data.name, 100)
  // Treść: wąska biała lista znaczników (pogrubienie, cytat, odnośnik).
  const content = sanitizeHtml(validation.data.text, { profile: 'comment', maxLength: 4_000 })

  // Sanityzacja mogła usunąć całą treść, jeśli składała się wyłącznie
  // ze znaczników — wtedy nie ma czego publikować.
  if (stripHtml(content, 4_000).length < 10) {
    return fail(c, 'validation_error', 'Treść komentarza po odfiltrowaniu kodu jest za krótka (min. 10 znaków).')
  }
  if (!authorName || authorName.length < 2) {
    return fail(c, 'validation_error', 'Podaj imię lub podpis (min. 2 znaki).')
  }

  const ip =
    c.req.header('CF-Connecting-IP') ||
    (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'

  // ── Ocena tresci (A6) ─────────────────────────────────────────────────
  // Moduly filtra i detektora istnialy w src/lib/moderation, ale nie byly
  // przez nikogo wywolywane — kolumny spam_score, spam_reasons_json i
  // profanity_hits zostawaly zerowe, wiec moderator nie mial zadnej
  // przeslanki, ktory wpis obejrzec pierwszy.
  const plain = stripHtml(content, 4_000)
  const spam = detectSpam(plain)
  const profanity = hasProfanity(plain)

  // Wulgaryzmy sa maskowane, nie odrzucane. Odrzucenie zamykaloby droge
  // mieszkancowi, ktory napisal rzeczowa uwage i jedno mocne slowo; decyzje
  // podejmuje moderator, widzac oznaczenie.
  const storedContent = profanity ? sanitizeProfanity(content) : content

  // Oczywisty spam nie zasmieca kolejki — trafia wprost do kosza z zapisanym
  // uzasadnieniem, zeby decyzja byla odwracalna.
  const initialStatus = spam.isSpam && spam.score >= 8 ? 'spam' : 'pending'

  try {
    const result = await db
      .prepare(
        `INSERT INTO comments (article_id, author_name, author_email, content, status, ip_hash,
                               spam_score, spam_reasons_json, profanity_hits)
         VALUES (?1, ?2, ?3, ?4, ?6, ?5, ?7, ?8, ?9)`,
      )
      .bind(
        articleRow.id,
        authorName,
        validation.data.email,
        storedContent,
        await hashIp(ip),
        initialStatus,
        spam.score,
        spam.reasons.length ? JSON.stringify(spam.reasons) : null,
        profanity ? 1 : 0,
      )
      .run()

    const commentId = (result as { meta?: { last_row_id?: number } }).meta?.last_row_id

    // Zglaszajacy widzi zawsze „oczekuje na moderacje”, takze gdy wpis
    // zostal oznaczony jako spam. Informacja „rozpoznano cie jako spamera”
    // jest dla autora spamu wskazowka, jak obejsc filtr, a dla omylkowo
    // oznaczonego mieszkanca — obraza.
    return created(c, {
      commentId,
      status: 'pending_moderation',
      article: { slug, title: articleRow.title },
      submittedAt: new Date().toISOString(),
    })
  } catch (error) {
    // Rzucamy dalej — errorHandler nada kod, zaloguje i zapisze do error_log
    // z tym samym requestId, który klient widzi w odpowiedzi.
    throw error
  }
}

/**
 * Podstawowy adres zgłoszenia komentarza.
 *
 * Etap I9 — kolejność strażników ma znaczenie i jest celowa:
 * najpierw `commentRateLimit` (tani, liczy w pamięci/bazie), potem
 * `turnstileGuard` (wykonuje zapytanie HTTP do Cloudflare). Odwrotna
 * kolejność sprawiłaby, że ktoś zalewający portal setkami zgłoszeń
 * na sekundę wymuszałby na nas tyle samo połączeń wychodzących do
 * siteverify — sam limit chroniłby wtedy tylko bazę, nie nasz ruch.
 */
route.post('/articles/:slug/comments', commentRateLimit, turnstileGuard({ action: 'comment' }), (c) =>
  handleSubmit(c as never, c.req.param('slug')),
)

/** Alias przyjmujący slug w ciele żądania — zachowany dla starszych klientów. */
route.post('/comments', commentRateLimit, turnstileGuard({ action: 'comment' }), (c) => handleSubmit(c as never))

export default route
