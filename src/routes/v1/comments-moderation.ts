/**
 * FAZA 2 / A6 — MODERACJA KOMENTARZY
 *
 * Zgloszenia komentarzy dzialaly (routes/v1/comments.ts), ale nie istniala
 * zadna droga, ktora pozwalalaby cokolwiek z nimi zrobic przez API: kolejka
 * rosla, a jedyna operacja moderacyjna byla recznym UPDATE w bazie.
 *
 * Sesc tras tego modulu:
 *   GET    /comments                     — kolejka z filtrami i stronicowaniem
 *   GET    /comments/:id                 — jeden komentarz z kontekstem watku
 *   POST   /comments/:id/moderate        — zatwierdz / odrzuc / oznacz spam
 *   POST   /comments/bulk-moderate       — operacja na wielu naraz
 *   POST   /comments/:id/report          — zgloszenie od czytelnika (publiczne)
 *   DELETE /comments/:id                 — usuniecie miekkie
 *
 * DECYZJE, KTORE WYMAGAJA WYJASNIENIA
 *
 * 1. STATUS 'flagged' NIE ISTNIEJE. Ograniczenie CHECK dopuszcza wylacznie
 *    pending|approved|rejected|spam. Zgloszony komentarz to `pending` z
 *    podniesionym `report_count` — nie osobny status. Kazda proba zapisania
 *    'flagged' konczylaby sie SQLITE_CONSTRAINT.
 *
 * 2. ZGLOSZENIE JEST PUBLICZNE, ALE NIE ANONIMOWO NIEOGRANICZONE. Trasa
 *    /report nie wymaga zalogowania (czytelnik nie ma konta), lecz liczy
 *    zgloszenia po skrocie IP, zeby jedna osoba nie zdjela komentarza
 *    wielokrotnym klikaniem.
 *
 * 3. ZATWIERDZENIE PRZELICZA comment_count ARTYKULU zapytaniem COUNT, a nie
 *    inkrementacja licznika. Inkrementacja rozjezdza sie z rzeczywistoscia
 *    przy kazdym cofnieciu decyzji (approved -> rejected) i po kilku
 *    tygodniach artykul pokazuje liczbe komentarzy, ktorej nikt nie widzi.
 *
 * 4. IP JEST SKROTEM, NIGDY WARTOSCIA JAWNA (RODO, minimalizacja danych).
 *    Skrot pozwala rozpoznac powtarzajace sie zrodlo naduzyc bez
 *    przechowywania danych osobowych.
 */

import { Hono } from 'hono'
import type { AppEnv, D1DatabaseLike } from '../../types/env'
import { ok, fail, requireDb } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth } from '../../middleware/require-permission'
import { sanitizeHtml, stripHtml } from '../../lib/security/sanitize-html'
import { detectSpam } from '../../lib/moderation/spam-detector'
import { hasProfanity } from '../../lib/moderation/profanity-filter'
import { audit } from '../../lib/audit'

const route = new Hono<AppEnv>()

type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'spam'
const STATUSES: ModerationStatus[] = ['pending', 'approved', 'rejected', 'spam']

const isStatus = (value: unknown): value is ModerationStatus =>
  typeof value === 'string' && STATUSES.includes(value as ModerationStatus)

/** Skrot IP — ta sama postac co w trasie zgloszenia, zeby dalo sie liczyc powtorzenia. */
const hashIp = async (ip: string): Promise<string> => {
  const data = new TextEncoder().encode(`izbica24:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

const clientIp = (c: { req: { header: (name: string) => string | undefined } }): string =>
  c.req.header('CF-Connecting-IP') ||
  (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||
  'unknown'

/**
 * Identyfikator moderatora do kolumn `moderated_by` / `edited_by`.
 *
 * Ten plik odczytywał `auth?.userId` w czterech miejscach. Pole `userId` NIE
 * ISTNIEJE w `AuthContext` — tożsamość ma pola `sub`, `email`, `role`,
 * `sessionId` (patrz `src/middleware/require-permission.ts`). `auth?.userId`
 * było więc zawsze `undefined`, a `?? null` zamieniało to w ciche `NULL`.
 *
 * Skutek w produkcji: KAŻDA decyzja moderacyjna (zatwierdzenie, odrzucenie,
 * oznaczenie spamu, usunięcie, edycja treści, operacja zbiorcza) zapisywała
 * `moderated_by = NULL`. Widok z migracji 0049 (`LEFT JOIN users u ON
 * u.id = c.moderated_by`) zwracał puste dane moderatora, więc nie było jak
 * ustalić, kto usunął komentarz — dokładnie w tabeli, której jedynym celem
 * jest rozliczalność. Defekt był niewidoczny, bo `requireDb(c)` zwracało
 * wcześniej `any`, co wyłączało kontrolę typów na całym `auth`.
 *
 * Kolumny są `INTEGER REFERENCES users(id)`, a `sub` to `String(user.id)`,
 * więc wymagana jest konwersja. Wartość niebędąca liczbą daje `null` —
 * lepiej brak wpisu niż złamany klucz obcy.
 */
export const moderatorId = (auth: { sub?: string } | undefined): number | null => {
  if (!auth?.sub) return null
  const id = Number.parseInt(auth.sub, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

/**
 * Przelicza liczbe zatwierdzonych komentarzy artykulu. Wolane po kazdej
 * zmianie statusu — zobacz punkt 3 w naglowku.
 */
const recountArticleComments = async (db: D1DatabaseLike, articleId: number): Promise<number> => {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM comments
        WHERE article_id = ?1 AND status = 'approved' AND deleted_at IS NULL`,
    )
    .bind(articleId)
    .first<{ n: number }>()
  const count = row?.n ?? 0
  await db.prepare('UPDATE articles SET comment_count = ?1 WHERE id = ?2').bind(count, articleId).run()
  return count
}

// ═══════════════════════════════════════════════════ 1. KOLEJKA MODERACJI

route.get('/', requireAuth, requirePermission('comment:moderate'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const status = c.req.query('status')
  const articleId = Number.parseInt(c.req.query('articleId') ?? '', 10)
  const q = (c.req.query('q') ?? '').trim()
  const reportedOnly = c.req.query('reported') === '1'
  const limit = Math.min(Math.max(Number.parseInt(c.req.query('limit') ?? '25', 10) || 25, 1), 100)
  const page = Math.max(Number.parseInt(c.req.query('page') ?? '1', 10) || 1, 1)

  if (status && !isStatus(status)) {
    return fail(c, 'validation_error', `Nieznany status „${status}”. Dozwolone: ${STATUSES.join(', ')}.`)
  }

  const where: string[] = ['cm.deleted_at IS NULL']
  const binds: unknown[] = []
  if (status) {
    where.push(`cm.status = ?${binds.length + 1}`)
    binds.push(status)
  }
  if (Number.isFinite(articleId) && articleId > 0) {
    where.push(`cm.article_id = ?${binds.length + 1}`)
    binds.push(articleId)
  }
  if (q) {
    where.push(`(cm.content LIKE ?${binds.length + 1} OR cm.author_name LIKE ?${binds.length + 1})`)
    binds.push(`%${q}%`)
  }
  if (reportedOnly) where.push('cm.report_count > 0')

  const clause = `WHERE ${where.join(' AND ')}`

  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM comments cm ${clause}`)
    .bind(...binds)
    .first<{ n: number }>()

  const rows = await db
    .prepare(
      `SELECT cm.id, cm.article_id, cm.author_name, cm.author_email, cm.content, cm.status,
              cm.created_at, cm.moderated_at, cm.moderation_reason,
              cm.spam_score, cm.spam_reasons_json, cm.profanity_hits, cm.report_count,
              cm.parent_id, a.title AS article_title, a.slug AS article_slug,
              u.name AS moderator_name
         FROM comments cm
         LEFT JOIN articles a ON a.id = cm.article_id
         LEFT JOIN users u ON u.id = cm.moderated_by
         ${clause}
        ORDER BY cm.report_count DESC, cm.created_at DESC
        LIMIT ?${binds.length + 1} OFFSET ?${binds.length + 2}`,
    )
    .bind(...binds, limit, (page - 1) * limit)
    .all()

  // Licznik per status — panel pokazuje, ile czeka, bez dodatkowego zapytania.
  const counts = await db
    .prepare(
      `SELECT status, COUNT(*) AS n FROM comments WHERE deleted_at IS NULL GROUP BY status`,
    )
    .all<{ status: string; n: number }>()

  const total = totalRow?.n ?? 0
  return ok(
    c,
    {
      comments: (rows.results ?? []).map((row) => {
        const r = row as Record<string, unknown>
        return {
          ...r,
          spamReasons: r.spam_reasons_json ? safeJson(r.spam_reasons_json as string) : [],
        }
      }),
      counts: Object.fromEntries((counts.results ?? []).map((r) => [r.status, r.n])),
    },
    { page, perPage: limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  )
})

const safeJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

// ═══════════════════════════════════════════ 2. JEDEN KOMENTARZ + KONTEKST

route.get('/:id', requireAuth, requirePermission('comment:moderate'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id) || id < 1) return fail(c, 'validation_error', 'Nieprawidłowy identyfikator komentarza.')

  const comment = await db
    .prepare(
      `SELECT cm.*, a.title AS article_title, a.slug AS article_slug
         FROM comments cm LEFT JOIN articles a ON a.id = cm.article_id
        WHERE cm.id = ?1 AND cm.deleted_at IS NULL`,
    )
    .bind(id)
    .first()
  if (!comment) return fail(c, 'not_found', 'Nie znaleziono komentarza.')

  const row = comment as Record<string, unknown>

  // Kontekst watku: rodzic i odpowiedzi. Moderator ocenia wypowiedz w
  // rozmowie, a nie w oderwaniu — bez tego zdanie „to nieprawda” jest
  // nieocenialne.
  const parent = row.parent_id
    ? await db
        .prepare('SELECT id, author_name, content, status, created_at FROM comments WHERE id = ?1')
        .bind(row.parent_id)
        .first()
    : null

  const replies = await db
    .prepare(
      `SELECT id, author_name, content, status, created_at
         FROM comments WHERE parent_id = ?1 AND deleted_at IS NULL ORDER BY created_at`,
    )
    .bind(id)
    .all()

  // Inne komentarze z tego samego skrotu IP — rozpoznanie kampanii spamowej.
  const sameSource = row.ip_hash
    ? await db
        .prepare(
          `SELECT COUNT(*) AS n FROM comments
            WHERE ip_hash = ?1 AND id != ?2 AND deleted_at IS NULL`,
        )
        .bind(row.ip_hash, id)
        .first<{ n: number }>()
    : null

  return ok(c, {
    comment: { ...row, spamReasons: row.spam_reasons_json ? safeJson(row.spam_reasons_json as string) : [] },
    parent,
    replies: replies.results ?? [],
    sameSourceCount: sameSource?.n ?? 0,
  })
})

// ══════════════════════════════════════════════════ 3. DECYZJA MODERACYJNA

route.post('/:id/moderate', requireAuth, requirePermission('comment:moderate'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const auth = getAuth(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id) || id < 1) return fail(c, 'validation_error', 'Nieprawidłowy identyfikator komentarza.')

  let body: { status?: unknown; reason?: unknown; editedContent?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return fail(c, 'validation_error', 'Treść żądania nie jest poprawnym dokumentem JSON.')
  }

  if (!isStatus(body.status)) {
    return fail(c, 'validation_error', `Pole „status” musi być jednym z: ${STATUSES.join(', ')}.`)
  }

  const existing = await db
    .prepare('SELECT id, article_id, status, content FROM comments WHERE id = ?1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ id: number; article_id: number; status: string; content: string }>()
  if (!existing) return fail(c, 'not_found', 'Nie znaleziono komentarza.')

  const reason = typeof body.reason === 'string' ? stripHtml(body.reason, 500) : null

  // Moderator moze poprawic literowke albo zamaskowac wulgaryzm, ale treść
  // przechodzi przez ten sam sanityzator co zgloszenie czytelnika — panel
  // nie jest droga na skroty do wstrzykniecia znacznikow.
  let editedContent: string | null = null
  if (typeof body.editedContent === 'string' && body.editedContent.trim()) {
    editedContent = sanitizeHtml(body.editedContent, { profile: 'comment', maxLength: 4000 })
    if (stripHtml(editedContent, 4000).trim().length < 3) {
      return fail(c, 'validation_error', 'Poprawiona treść po odfiltrowaniu znaczników jest za krótka.')
    }
  }

  const statements = [
    db
      .prepare(
        `UPDATE comments
            SET status = ?1,
                moderated_by = ?2,
                moderated_at = CURRENT_TIMESTAMP,
                moderation_reason = ?3,
                content = COALESCE(?4, content),
                edited_by = CASE WHEN ?4 IS NULL THEN edited_by ELSE ?2 END,
                edited_at = CASE WHEN ?4 IS NULL THEN edited_at ELSE CURRENT_TIMESTAMP END,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?5`,
      )
      .bind(body.status, moderatorId(auth), reason, editedContent, id),
  ]
  await db.batch(statements)

  const commentCount = await recountArticleComments(db, existing.article_id)

  await audit(c as never, {
    action: `comment.${body.status}`,
    entity: 'comments',
    entityId: id,
    before: { status: existing.status },
    after: { status: body.status, edited: editedContent !== null },
    note: reason ?? undefined,
  })

  return ok(c, {
    id,
    status: body.status,
    articleId: existing.article_id,
    articleCommentCount: commentCount,
  })
})

// ══════════════════════════════════════════════ 4. OPERACJA GRUPOWA

route.post('/bulk-moderate', requireAuth, requirePermission('comment:moderate'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const auth = getAuth(c)

  let body: { ids?: unknown; status?: unknown; reason?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return fail(c, 'validation_error', 'Treść żądania nie jest poprawnym dokumentem JSON.')
  }

  if (!isStatus(body.status)) {
    return fail(c, 'validation_error', `Pole „status” musi być jednym z: ${STATUSES.join(', ')}.`)
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return fail(c, 'validation_error', 'Podaj niepustą listę „ids”.')
  }
  // Limit chroni przed zapytaniem z tysiacem parametrow, ktore przekroczyloby
  // budzet CPU Workera i zostawiloby czesc zmian wykonanych, czesc nie.
  if (body.ids.length > 100) {
    return fail(c, 'validation_error', 'Jednorazowo można zmoderować najwyżej 100 komentarzy.')
  }

  const ids = body.ids
    .map((value) => (typeof value === 'number' ? value : Number.parseInt(String(value), 10)))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (ids.length === 0) return fail(c, 'validation_error', 'Żaden z podanych identyfikatorów nie jest poprawny.')

  const reason = typeof body.reason === 'string' ? stripHtml(body.reason, 500) : null
  const placeholders = ids.map((_, i) => `?${i + 4}`).join(', ')

  const affected = await db
    .prepare(
      `SELECT DISTINCT article_id FROM comments WHERE id IN (${ids.map((_, i) => `?${i + 1}`).join(', ')})`,
    )
    .bind(...ids)
    .all<{ article_id: number }>()

  await db
    .prepare(
      `UPDATE comments
          SET status = ?1, moderated_by = ?2, moderated_at = CURRENT_TIMESTAMP,
              moderation_reason = ?3, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    )
    .bind(body.status, moderatorId(auth), reason, ...ids)
    .run()

  // Kazdy dotkniety artykul dostaje przeliczony licznik — inaczej operacja
  // grupowa rozjechalaby liczby na wielu stronach naraz.
  for (const row of affected.results ?? []) {
    await recountArticleComments(db, row.article_id)
  }

  await audit(c as never, {
    action: `comment.bulk-${body.status}`,
    entity: 'comments',
    after: { ids, status: body.status },
    note: reason ?? `moderacja grupowa (${ids.length})`,
  })

  return ok(c, { moderated: ids.length, status: body.status, articles: (affected.results ?? []).length })
})

// ═══════════════════════════════════════════ 5. ZGLOSZENIE OD CZYTELNIKA

route.post('/:id/report', async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id) || id < 1) return fail(c, 'validation_error', 'Nieprawidłowy identyfikator komentarza.')

  let body: { reason?: unknown } = {}
  try {
    body = await c.req.json()
  } catch {
    // Zgloszenie bez uzasadnienia jest dopuszczalne — przycisk „zglos” nie
    // musi wymuszac pisania.
  }

  const comment = await db
    .prepare('SELECT id, status, report_count FROM comments WHERE id = ?1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ id: number; status: string; report_count: number }>()
  if (!comment) return fail(c, 'not_found', 'Nie znaleziono komentarza.')

  const ipHash = await hashIp(clientIp(c))

  /**
   * Jedno zgloszenie na komentarz z jednego zrodla. Bez tego jedna osoba
   * odswiezajaca zadanie podnioslaby licznik dowolnie wysoko i zdjela
   * niewygodna dla siebie wypowiedz z portalu.
   *
   * Tabela zgloszen nie istnieje, wiec znacznik trzymamy w moderation_reason
   * jako doklejana liste skrotow — rozwiazanie skromne, ale nie wymaga
   * migracji i jest sprawdzalne.
   */
  const marker = `#r:${ipHash.slice(0, 12)}`
  const previous = await db
    .prepare('SELECT moderation_reason FROM comments WHERE id = ?1')
    .bind(id)
    .first<{ moderation_reason: string | null }>()

  if (previous?.moderation_reason?.includes(marker)) {
    // Odpowiadamy sukcesem — zglaszajacy nie musi wiedziec, ze jego glos
    // zostal juz policzony, a licznik sie nie zmienia.
    return ok(c, { id, reported: true, counted: false })
  }

  const reason = typeof body.reason === 'string' ? stripHtml(body.reason, 200) : ''
  const note = `${previous?.moderation_reason ?? ''} ${reason} ${marker}`.trim().slice(0, 1000)

  await db
    .prepare(
      `UPDATE comments
          SET report_count = report_count + 1,
              moderation_reason = ?1,
              status = CASE WHEN status = 'approved' AND report_count + 1 >= 3 THEN 'pending' ELSE status END,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2`,
    )
    .bind(note, id)
    .run()

  return ok(c, { id, reported: true, counted: true })
})

// ═════════════════════════════════════════════════ 6. USUNIECIE MIEKKIE

route.delete('/:id', requireAuth, requirePermission('comment:delete'), async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const auth = getAuth(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id) || id < 1) return fail(c, 'validation_error', 'Nieprawidłowy identyfikator komentarza.')

  const existing = await db
    .prepare('SELECT id, article_id, status FROM comments WHERE id = ?1 AND deleted_at IS NULL')
    .bind(id)
    .first<{ id: number; article_id: number; status: string }>()
  if (!existing) return fail(c, 'not_found', 'Nie znaleziono komentarza.')

  // Usuniecie miekkie, nie DELETE: wpis moze byc dowodem w sprawie o znieslawienie
  // albo elementem watku, ktorego odpowiedzi maja sens tylko z kontekstem.
  await db
    .prepare(
      `UPDATE comments SET deleted_at = CURRENT_TIMESTAMP, moderated_by = ?1,
              moderated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2`,
    )
    .bind(moderatorId(auth), id)
    .run()

  const commentCount = await recountArticleComments(db, existing.article_id)

  await audit(c as never, {
    action: 'comment.delete',
    entity: 'comments',
    entityId: id,
    before: { status: existing.status },
    note: 'usunięcie miękkie',
  })

  return ok(c, { id, deleted: true, articleCommentCount: commentCount })
})

// ═════════════════════════════ 7. PUBLICZNA LISTA ZATWIERDZONYCH KOMENTARZY

/**
 * Bez tej trasy zatwierdzony komentarz nadal nie jest nikomu widoczny.
 * Zwraca wylacznie status 'approved' i nie ujawnia adresu e-mail ani skrotu IP.
 */
route.get('/article/:slug', async (c) => {
  const db = requireDb(c)
  if (db instanceof Response) return db
  const slug = c.req.param('slug')

  const article = await db
    .prepare("SELECT id FROM articles WHERE slug = ?1 AND deleted_at IS NULL AND status = 'published'")
    .bind(slug)
    .first<{ id: number }>()
  if (!article) return fail(c, 'not_found', 'Nie znaleziono artykułu.')

  const rows = await db
    .prepare(
      `SELECT id, author_name, content, created_at, parent_id
         FROM comments
        WHERE article_id = ?1 AND status = 'approved' AND deleted_at IS NULL
        ORDER BY created_at`,
    )
    .bind(article.id)
    .all()

  return ok(c, { comments: rows.results ?? [], total: (rows.results ?? []).length })
})

export default route
