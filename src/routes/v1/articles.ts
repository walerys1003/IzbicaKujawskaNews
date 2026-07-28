/**
 * FAZA 2 / A4 + B4 + D9 — trasy zapisu artykulow.
 *
 * Co bylo wczesniej: `GET /api/v1/articles` czytalo statyczna tablice
 * z `src/data-articles.ts`, a tras zapisu nie bylo w ogóle. Redaktor nie mial
 * fizycznej mozliwosci utworzenia tekstu — formularz w panelu mial
 * `action="#"`. Portal byl makieta z wgranymi na sztywno 30 tekstami.
 *
 * Co robi ten plik: pelny cykl zycia artykulu na bazie D1 —
 * utworzenie, odczyt, nadpisanie, autozapis, publikacja, wycofanie,
 * planowanie, duplikat, historia, powrot do wersji, usuniecie.
 *
 * Trzy zasady, ktore rzadza kazda z tych tras:
 *
 * 1. UPRAWNIENIE, nie rola. Trasa deklaruje `article:publish`, a nie liste
 *    rol — powiazanie zyje w src/lib/auth/roles.ts (B3).
 *
 * 2. PRZEJSCIE STATUSU jest sprawdzane osobno od uprawnienia do zapisu.
 *    Autor moze edytowac swoj tekst, ale nie moze go opublikowac; redaktor
 *    naczelny moze opublikowac, ale nie ma prawa cofnac cudzej publikacji
 *    bez uprawnienia `article:unpublish`. Bez tego rozdzielenia „edycja”
 *    i „publikacja” bylyby tym samym prawem.
 *
 * 3. KAZDA zmiana zapisuje wersje (D9) i wpis w dzienniku. Wersja przed
 *    zmiana, wpis po. Odwrotna kolejnosc dawalaby historie bez punktu
 *    wyjscia i dziennik z operacjami, ktore sie nie udaly.
 */

import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { ok, created, fail, requireDb } from '../../lib/http/envelope'
import { requireAuth } from '../../middleware/require-auth'
import { requirePermission, getAuth, getRole } from '../../middleware/require-permission'
import { articleBodyLimit, jsonBodyLimit } from '../../middleware/body-limit'
import { hasPermission, canTransitionArticle } from '../../lib/auth/roles'
import { audit, diffFields } from '../../lib/audit'
import { parseJson, parseQuery, parseParams } from '../../lib/validation/core'
import { pageWindow } from '../../lib/validation/primitives'
import {
  articleCreateSchema,
  articleUpdateSchema,
  articlePatchSchema,
  articlePublishGateSchema,
  articlePublishSchema,
  articleScheduleSchema,
  articleUnpublishSchema,
  articleStatusSchema,
  articleDuplicateSchema,
  articleRestoreSchema,
  articleBlocksSchema,
  articleListQuerySchema,
  articleIdParamSchema,
} from '../../lib/validation/schemas/articles'
import { ArticlesRepo, RepositoryError, type ArticleFull } from '../../db/repositories/articles'
import type { ValidatedBlock } from '../../lib/validation/blocks'

const route = new Hono<AppEnv>()

// ─────────────────────────────────────────────────────────────────────────────
// Pomocnicze
// ─────────────────────────────────────────────────────────────────────────────

const userId = (c: never): number => {
  const auth = getAuth(c)
  return auth?.sub ? Number(auth.sub) || 0 : 0
}

/**
 * Czy uzytkownik moze modyfikowac ten konkretny artykul.
 *
 * `article:update:any` pozwala na wszystko. Autor z `article:update:own`
 * moze ruszac tylko wlasne teksty — i tylko takie, ktore nie sa
 * opublikowane. Ten drugi warunek nie wynika z listy uprawnien, ale
 * z odpowiedzialnosci: tekst opublikowany jest juz materialem prasowym,
 * za ktorego tresc odpowiada redakcja, wiec cicha zmiana przez autora
 * po publikacji obchodzilaby kontrole redakcyjna.
 */
const canModify = (
  c: never,
  article: { author_id: number | null; status: string },
): { allowed: boolean; reason?: string } => {
  const role = getRole(c as never)
  if (hasPermission(role, 'article:update:any')) return { allowed: true }
  if (!hasPermission(role, 'article:update:own')) {
    return { allowed: false, reason: 'Twoja rola nie pozwala na edycje artykulow.' }
  }
  if (article.author_id !== userId(c)) {
    return { allowed: false, reason: 'Mozesz edytowac wylacznie wlasne artykuly.' }
  }
  if (article.status === 'published') {
    return {
      allowed: false,
      reason: 'Artykul jest opublikowany — zmiane moze wprowadzic wylacznie redaktor naczelny.',
    }
  }
  return { allowed: true }
}

const canDelete = (c: never, article: { author_id: number | null }): boolean => {
  const role = getRole(c as never)
  if (hasPermission(role, 'article:delete:any')) return true
  return hasPermission(role, 'article:delete:own') && article.author_id === userId(c)
}

/**
 * Kontrola rownoczesnej edycji (B4).
 *
 * Klient przysyla `expectedUpdatedAt` — znacznik wersji, ktora widzial.
 * Jesli w bazie jest inny, ktos zapisal w miedzyczasie. Zwracamy 409
 * z aktualnym znacznikiem, zeby panel mógl pokazac „ktos zmienil ten tekst”
 * i dac wybor: nadpisz albo przeladuj. Ciche nadpisanie bylo dotychczasowym
 * zachowaniem i oznaczalo bezglosna utrate pracy.
 *
 * Porownujemy z tolerancja 1 sekundy: SQLite zapisuje CURRENT_TIMESTAMP
 * z dokladnoscia do sekundy, a klient odsyla ISO z milisekundami.
 */
const staleWrite = (expected: string | undefined, actual: string): boolean => {
  if (!expected) return false
  const e = Date.parse(expected.includes('T') ? expected : expected.replace(' ', 'T') + 'Z')
  const a = Date.parse(actual.includes('T') ? actual : actual.replace(' ', 'T') + 'Z')
  if (Number.isNaN(e) || Number.isNaN(a)) return false
  return Math.abs(a - e) > 1000
}

/** Kształt artykulu zwracany klientowi — bez pol wewnetrznych. */
const present = (a: ArticleFull) => ({
  id: a.id,
  slug: a.slug,
  title: a.title,
  shortTitle: a.short_title,
  lede: a.lead,
  type: a.content_type,
  status: a.status,
  category: a.category_slug,
  categoryName: a.category_name,
  subcategory: a.subcategory_slug,
  subsubcategory: a.subsubcategory_slug,
  heroImage: a.hero_image_r2_key,
  heroAlt: a.hero_alt,
  heroCaption: a.hero_caption,
  heroCredit: a.hero_credit,
  solectwo: a.solectwo_slug,
  featured: a.featured === 1,
  breaking: a.breaking === 1,
  tags: a.tags,
  blocks: a.blocks,
  readingMinutes: a.reading_minutes,
  viewCount: a.view_count,
  commentCount: a.comment_count,
  aiAssisted: a.ai_assisted === 1,
  aiDisclosure: a.ai_disclosure,
  humanReviewedBy: a.human_reviewed_by,
  humanReviewedAt: a.human_reviewed_at,
  author: a.author_id ? { id: a.author_id, name: a.author_name, email: a.author_email } : null,
  lockedBy: a.locked_by,
  lockedAt: a.locked_at,
  publishedAt: a.published_at,
  scheduledAt: a.scheduled_at,
  createdAt: a.created_at,
  updatedAt: a.updated_at,
  deletedAt: a.deleted_at,
})

const scalars = (a: ArticleFull) => ({
  title: a.title,
  lead: a.lead,
  slug: a.slug,
  status: a.status,
  category_id: a.category_id,
  hero_image_r2_key: a.hero_image_r2_key,
  featured: a.featured,
  breaking: a.breaking,
  blockCount: a.blocks.length,
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lista (panel redakcyjny)
// ─────────────────────────────────────────────────────────────────────────────

route.get('/', requireAuth, requirePermission('article:read:unpublished'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const q = parseQuery(c, articleListQuerySchema)
  if (q instanceof Response) return q

  // Autor bez prawa do cudzych tekstow widzi wylacznie swoje. Filtr jest
  // nakladany po stronie serwera, nie w panelu — inaczej wystarczyloby
  // wywolac API bezposrednio, zeby przeczytac cudze szkice.
  const role = getRole(c as never)
  const restrictToOwn = !hasPermission(role, 'article:update:any')

  const win = pageWindow(q)
  const result = await ArticlesRepo.list(c, {
    status: q.status,
    category: q.category,
    subcategory: q.subcategory,
    author: restrictToOwn ? userId(c as never) : q.author,
    tag: q.tag,
    solectwo: q.solectwo,
    type: q.type,
    q: q.q,
    featured: q.featured,
    sort: q.sort,
    dir: q.dir,
    limit: win.limit,
    offset: win.offset,
    includeDeleted: q.includeDeleted,
  })

  return ok(c, result.items, {
    total: result.total,
    limit: win.limit,
    offset: win.offset,
    page: win.page,
    pages: Math.max(1, Math.ceil(result.total / win.limit)),
    liczniki: await ArticlesRepo.statusCounts(c),
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Utworzenie
// ─────────────────────────────────────────────────────────────────────────────

route.post('/', requireAuth, requirePermission('article:create'), articleBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const input = await parseJson(c, articleCreateSchema)
  if (input instanceof Response) return input

  // Wyslanie od razu do recenzji wymaga osobnego uprawnienia — wspolpracownik
  // moze tworzyc szkice, ale nie kierowac ich do redakcji.
  if (input.status === 'review') {
    const gate = canTransitionArticle(getRole(c as never), 'draft', 'review')
    if (!gate.allowed) return fail(c, 'forbidden', gate.reason)
  }

  try {
    const { id, slug } = await ArticlesRepo.create(c, {
      ...input,
      blocks: input.blocks as ValidatedBlock[],
      authorId: userId(c as never) || null,
    })

    const article = await ArticlesRepo.getById(c, id)
    await audit(c, {
      action: 'article.create',
      entity: 'articles',
      entityId: id,
      after: article ? scalars(article) : { slug },
      note: `status=${input.status}`,
    })

    return created(c, article ? present(article) : { id, slug })
  } catch (error) {
    if (error instanceof RepositoryError) {
      return fail(c, 'validation_error', error.message, { pola: [{ pole: 'category', problem: error.message }] })
    }
    throw error
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Odczyt jednego (panel — takze szkice)
// ─────────────────────────────────────────────────────────────────────────────

route.get('/:id', requireAuth, requirePermission('article:read:unpublished'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  const article = await ArticlesRepo.getById(c, p.id, true)
  if (!article) return fail(c, 'not_found', 'Nie znaleziono artykulu o podanym identyfikatorze.')

  const role = getRole(c as never)
  if (!hasPermission(role, 'article:update:any') && article.author_id !== userId(c as never)) {
    return fail(c, 'forbidden', 'Mozesz przegladac wylacznie wlasne nieopublikowane artykuly.')
  }

  const lock = await ArticlesRepo.lockState(c, p.id, userId(c as never))
  return ok(c, { ...present(article), blokada: lock }, { wersje: (await ArticlesRepo.listVersions(c, p.id)).length })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Nadpisanie calosci (PUT)
// ─────────────────────────────────────────────────────────────────────────────

route.put('/:id', requireAuth, articleBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleUpdateSchema)
  if (input instanceof Response) return input

  const before = await ArticlesRepo.getById(c, p.id)
  if (!before) return fail(c, 'not_found')

  const gate = canModify(c as never, before)
  if (!gate.allowed) {
    await audit(c, { action: 'article.update', entity: 'articles', entityId: p.id, outcome: 'denied', note: gate.reason })
    return fail(c, 'forbidden', gate.reason)
  }

  if (staleWrite(input.expectedUpdatedAt, before.updated_at)) {
    return fail(c, 'conflict', 'Ten artykul zmienil sie od chwili otwarcia w edytorze.', {
      aktualnyZnacznik: before.updated_at,
      przyslanyZnacznik: input.expectedUpdatedAt,
      zablokowanyPrzez: before.locked_by,
    })
  }

  const lock = await ArticlesRepo.lockState(c, p.id, userId(c as never))
  if (lock.locked && !lock.mine) {
    return fail(c, 'conflict', `Artykul jest w tej chwili edytowany przez ${lock.byName ?? 'innego uzytkownika'}.`, {
      zablokowanyPrzez: lock.by,
      od: lock.at,
    })
  }

  // Wersja PRZED zapisem — patrz zasada 3 w komentarzu naglownym.
  await ArticlesRepo.saveVersion(c, before, userId(c as never) || null, 'Zapis edycji', input.blocks as ValidatedBlock[])

  try {
    await ArticlesRepo.update(c, p.id, { ...input, blocks: input.blocks as ValidatedBlock[] })
  } catch (error) {
    if (error instanceof RepositoryError) return fail(c, 'validation_error', error.message)
    throw error
  }

  const after = await ArticlesRepo.getById(c, p.id)
  const d = diffFields(scalars(before), after ? scalars(after) : {})
  await audit(c, {
    action: 'article.update',
    entity: 'articles',
    entityId: p.id,
    before: d.before,
    after: d.after,
    note: `zmienione pola: ${d.changed.join(', ') || 'brak'}`,
  })

  return ok(c, after ? present(after) : null)
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Autozapis (PATCH)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Autozapis nie tworzy wersji przy kazdym wywolaniu. Edytor wysyla PATCH
 * co kilkanascie sekund; wersja co 15 s dalaby 240 wpisow na godzine pisania
 * i historia stalaby sie nieczytelna. Wersja powstaje, gdy od poprzedniej
 * minelo co najmniej 5 minut — kompromis miedzy „mozna wrocic” a „da sie
 * przejrzec”.
 */
route.patch('/:id', requireAuth, articleBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articlePatchSchema)
  if (input instanceof Response) return input

  const before = await ArticlesRepo.getById(c, p.id)
  if (!before) return fail(c, 'not_found')

  const gate = canModify(c as never, before)
  if (!gate.allowed) return fail(c, 'forbidden', gate.reason)

  if (staleWrite(input.expectedUpdatedAt, before.updated_at)) {
    return fail(c, 'conflict', 'Ten artykul zmienil sie od chwili otwarcia w edytorze.', {
      aktualnyZnacznik: before.updated_at,
    })
  }

  const uid = userId(c as never)
  const lock = await ArticlesRepo.lockState(c, p.id, uid)
  if (lock.locked && !lock.mine) {
    return fail(c, 'conflict', `Artykul jest edytowany przez ${lock.byName ?? 'inna osobe'}.`, { zablokowanyPrzez: lock.by })
  }
  // Autozapis odswieza blokade — dopoki redaktor pisze, tekst pozostaje jego.
  await ArticlesRepo.acquireLock(c, p.id, uid)

  const versions = await ArticlesRepo.listVersions(c, p.id)
  const lastVersionAt = versions[0]?.edited_at
  const minutesSince = lastVersionAt
    ? (Date.now() - Date.parse(lastVersionAt.replace(' ', 'T') + 'Z')) / 60000
    : Infinity
  if (minutesSince >= 5) {
    await ArticlesRepo.saveVersion(c, before, uid || null, 'Autozapis', input.blocks as ValidatedBlock[] | undefined)
  }

  const { expectedUpdatedAt: _ignored, ...fields } = input
  try {
    await ArticlesRepo.update(c, p.id, fields as never)
  } catch (error) {
    if (error instanceof RepositoryError) return fail(c, 'validation_error', error.message)
    throw error
  }

  const after = await ArticlesRepo.getById(c, p.id)
  return ok(c, {
    id: p.id,
    updatedAt: after?.updated_at,
    slug: after?.slug,
    readingMinutes: after?.reading_minutes,
    zapisanePola: Object.keys(fields),
    utworzonoWersje: minutesSince >= 5,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Zapis samych blokow
// ─────────────────────────────────────────────────────────────────────────────

route.put('/:id/blocks', requireAuth, articleBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleBlocksSchema)
  if (input instanceof Response) return input

  const before = await ArticlesRepo.getById(c, p.id)
  if (!before) return fail(c, 'not_found')
  const gate = canModify(c as never, before)
  if (!gate.allowed) return fail(c, 'forbidden', gate.reason)
  if (staleWrite(input.expectedUpdatedAt, before.updated_at)) {
    return fail(c, 'conflict', 'Tresc zmienila sie od chwili otwarcia edytora.', { aktualnyZnacznik: before.updated_at })
  }

  const uid = userId(c as never)
  await ArticlesRepo.saveVersion(c, before, uid || null, 'Zmiana ukladu blokow', input.blocks as ValidatedBlock[])
  await ArticlesRepo.replaceBlocks(c, p.id, input.blocks as ValidatedBlock[])

  const after = await ArticlesRepo.getById(c, p.id)
  await audit(c, {
    action: 'article.blocks',
    entity: 'articles',
    entityId: p.id,
    before: { blockCount: before.blocks.length },
    after: { blockCount: after?.blocks.length ?? 0 },
  })

  return ok(c, { id: p.id, blocks: after?.blocks ?? [], updatedAt: after?.updated_at })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Publikacja (B4 — brama jakosci + przejscie statusu)
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/publish', requireAuth, jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articlePublishSchema)
  if (input instanceof Response) return input

  const article = await ArticlesRepo.getById(c, p.id)
  if (!article) return fail(c, 'not_found')

  const role = getRole(c as never)
  const gate = canTransitionArticle(role, article.status, 'published')
  if (!gate.allowed) {
    await audit(c, { action: 'article.publish', entity: 'articles', entityId: p.id, outcome: 'denied', note: gate.reason })
    return fail(c, 'forbidden', gate.reason)
  }

  // Brama jakosci — ostrzejszy zestaw regul niz przy zapisie szkicu.
  const gateCheck = articlePublishGateSchema.safeParse({
    title: article.title,
    lede: article.lead,
    category: article.category_slug ?? '',
    blocks: article.blocks,
    heroImage: article.hero_image_r2_key ?? '',
    heroAlt: article.hero_alt ?? '',
  })
  if (!gateCheck.success) {
    const pola = gateCheck.error.issues.map((i) => ({
      pole: i.path.join('.') || '(caly artykul)',
      problem: i.message,
    }))
    return fail(c, 'validation_error', 'Artykul nie spelnia warunkow publikacji.', { pola })
  }

  /**
   * AI11 — material tworzony z udzialem AI wymaga zatwierdzenia przez
   * czlowieka. Wyzwalacz w bazie (migracja 0049) i tak by to zablokowal,
   * ale surowy blad SQLITE_CONSTRAINT_TRIGGER jest dla redaktora
   * nieczytelny. Ustawiamy `human_reviewed_by` na osobe publikujaca —
   * publikacja JEST aktem zatwierdzenia i to ona zostaje w bazie
   * jako podpis pod materialem.
   */
  const reviewerId = article.ai_assisted === 1 ? userId(c as never) || undefined : undefined
  if (article.ai_assisted === 1 && !reviewerId) {
    return fail(c, 'forbidden', 'Material tworzony z udzialem AI wymaga zatwierdzenia przez zalogowanego redaktora.')
  }

  await ArticlesRepo.saveVersion(c, article, userId(c as never) || null, input.note ?? 'Publikacja')
  await ArticlesRepo.setStatus(c, p.id, 'published', { publishedAt: input.publishedAt ?? null, reviewerId })
  await ArticlesRepo.releaseLock(c, p.id, userId(c as never), true)

  const after = await ArticlesRepo.getById(c, p.id)
  await audit(c, {
    action: 'article.publish',
    entity: 'articles',
    entityId: p.id,
    before: { status: article.status, published_at: article.published_at },
    after: { status: after?.status, published_at: after?.published_at },
    note: input.note,
  })

  return ok(c, {
    id: p.id,
    slug: after?.slug,
    status: after?.status,
    publishedAt: after?.published_at,
    adres: after?.category_slug
      ? after.subcategory_slug
        ? `/${after.category_slug}/${after.subcategory_slug}/${after.slug}`
        : `/${after.category_slug}/${after.slug}`
      : `/artykul/${after?.slug}`,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. Wycofanie z publikacji
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/unpublish', requireAuth, requirePermission('article:unpublish'), jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleUnpublishSchema)
  if (input instanceof Response) return input

  const article = await ArticlesRepo.getById(c, p.id)
  if (!article) return fail(c, 'not_found')
  if (article.status !== 'published') {
    return fail(c, 'conflict', `Artykul nie jest opublikowany (status: ${article.status}).`)
  }

  await ArticlesRepo.saveVersion(c, article, userId(c as never) || null, `Wycofanie: ${input.reason}`)
  await ArticlesRepo.setStatus(c, p.id, 'draft')

  await audit(c, {
    action: 'article.unpublish',
    entity: 'articles',
    entityId: p.id,
    before: { status: 'published', published_at: article.published_at },
    after: { status: 'draft' },
    note: input.reason,
  })

  return ok(c, { id: p.id, status: 'draft', powod: input.reason })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. Planowanie publikacji
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/schedule', requireAuth, requirePermission('article:schedule'), jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleScheduleSchema)
  if (input instanceof Response) return input

  const article = await ArticlesRepo.getById(c, p.id)
  if (!article) return fail(c, 'not_found')

  const gate = canTransitionArticle(getRole(c as never), article.status, 'scheduled')
  if (!gate.allowed) return fail(c, 'forbidden', gate.reason)

  await ArticlesRepo.setStatus(c, p.id, 'scheduled', { scheduledAt: input.scheduledAt })
  await audit(c, {
    action: 'article.schedule',
    entity: 'articles',
    entityId: p.id,
    before: { status: article.status },
    after: { status: 'scheduled', scheduled_at: input.scheduledAt },
    note: input.note,
  })

  return ok(c, { id: p.id, status: 'scheduled', scheduledAt: input.scheduledAt })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Zmiana statusu (draft ↔ review ↔ archived)
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/status', requireAuth, jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleStatusSchema)
  if (input instanceof Response) return input

  const article = await ArticlesRepo.getById(c, p.id)
  if (!article) return fail(c, 'not_found')

  if (input.status === article.status) {
    return ok(c, { id: p.id, status: article.status, zmiana: false })
  }

  // Publikacja i planowanie maja wlasne trasy — z bramami jakosci.
  // Dopuszczenie ich tutaj byloby obejsciem tych bram jednym polem JSON.
  if (input.status === 'published' || input.status === 'scheduled') {
    return fail(
      c,
      'validation_error',
      `Do statusu „${input.status}” prowadzi osobna operacja: POST /articles/${p.id}/${input.status === 'published' ? 'publish' : 'schedule'}.`,
    )
  }

  const gate = canTransitionArticle(getRole(c as never), article.status, input.status)
  if (!gate.allowed) {
    await audit(c, { action: 'article.status', entity: 'articles', entityId: p.id, outcome: 'denied', note: gate.reason })
    return fail(c, 'forbidden', gate.reason)
  }

  if (staleWrite(input.expectedUpdatedAt, article.updated_at)) {
    return fail(c, 'conflict', 'Artykul zmienil sie od chwili wyswietlenia.', { aktualnyZnacznik: article.updated_at })
  }

  await ArticlesRepo.saveVersion(c, article, userId(c as never) || null, `Zmiana statusu na ${input.status}`)
  await ArticlesRepo.setStatus(c, p.id, input.status)
  if (input.status === 'review') await ArticlesRepo.releaseLock(c, p.id, userId(c as never), true)

  await audit(c, {
    action: 'article.status',
    entity: 'articles',
    entityId: p.id,
    before: { status: article.status },
    after: { status: input.status },
    note: input.note,
  })

  return ok(c, { id: p.id, status: input.status, poprzedni: article.status, zmiana: true })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. Duplikat
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/duplicate', requireAuth, requirePermission('article:create'), jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleDuplicateSchema)
  if (input instanceof Response) return input

  const source = await ArticlesRepo.getById(c, p.id)
  if (!source) return fail(c, 'not_found')

  const title = input.title ?? `${source.title} (kopia)`
  const { id, slug } = await ArticlesRepo.create(c, {
    title,
    lede: source.lead,
    category: source.category_slug ?? 'wiadomosci',
    blocks: input.withBlocks ? source.blocks : [],
    tags: source.tags,
    status: 'draft',
    type: source.content_type,
    shortTitle: source.short_title,
    subcategory: source.subcategory_slug,
    subsubcategory: source.subsubcategory_slug,
    heroImage: source.hero_image_r2_key,
    heroAlt: source.hero_alt,
    heroCaption: source.hero_caption,
    heroCredit: source.hero_credit,
    solectwo: source.solectwo_slug,
    readingMinutes: source.reading_minutes,
    // Kopia NIE dziedziczy `featured`/`breaking` ani oznaczen AI:
    // duplikat to szkic, a nie drugi tekst na czolowce.
    authorId: userId(c as never) || null,
  })

  await audit(c, {
    action: 'article.duplicate',
    entity: 'articles',
    entityId: id,
    note: `kopia z #${p.id}, bloki: ${input.withBlocks ? 'tak' : 'nie'}`,
    after: { slug, title },
  })

  const copy = await ArticlesRepo.getById(c, id)
  return created(c, copy ? present(copy) : { id, slug })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. Historia zmian i powrot do wersji (D9)
// ─────────────────────────────────────────────────────────────────────────────

route.get('/:id/versions', requireAuth, requirePermission('article:read:unpublished'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  const article = await ArticlesRepo.getRow(c, p.id)
  if (!article) return fail(c, 'not_found')

  const role = getRole(c as never)
  if (!hasPermission(role, 'article:update:any') && article.author_id !== userId(c as never)) {
    return fail(c, 'forbidden', 'Historia zmian dostepna jest dla autora i redakcji.')
  }

  const versions = await ArticlesRepo.listVersions(c, p.id)
  return ok(
    c,
    versions.map((v) => ({
      id: v.id,
      numer: v.version_number,
      tytul: v.title,
      status: v.status,
      opis: v.change_note,
      znakowDodano: v.chars_added,
      znakowUsunieto: v.chars_removed,
      autorZmiany: v.editor_name ?? null,
      kiedy: v.edited_at,
    })),
    { total: versions.length },
  )
})

route.get('/:id/versions/:versionId', requireAuth, requirePermission('article:read:unpublished'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const versionId = Number(c.req.param('versionId'))
  if (!Number.isInteger(versionId) || versionId < 1) {
    return fail(c, 'validation_error', 'Nieprawidlowy identyfikator wersji.')
  }

  const version = await ArticlesRepo.getVersion(c, p.id, versionId)
  if (!version) return fail(c, 'not_found', 'Nie znaleziono takiej wersji tego artykulu.')

  return ok(c, {
    id: version.id,
    numer: version.version_number,
    tytul: version.title,
    lid: version.lead,
    status: version.status,
    opis: version.change_note,
    kiedy: version.edited_at,
    blocks: version.blocks_json ? JSON.parse(version.blocks_json) : [],
    migawka: version.snapshot_json ? JSON.parse(version.snapshot_json) : null,
  })
})

route.post('/:id/restore', requireAuth, requirePermission('article:restore-version'), jsonBodyLimit, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard

  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p
  const input = await parseJson(c, articleRestoreSchema)
  if (input instanceof Response) return input

  const result = await ArticlesRepo.restoreVersion(c, p.id, input.versionId, userId(c as never) || null)
  if (!result) return fail(c, 'not_found', 'Nie znaleziono artykulu lub wskazanej wersji.')

  const after = await ArticlesRepo.getById(c, p.id)
  await audit(c, {
    action: 'article.restore',
    entity: 'articles',
    entityId: p.id,
    after: { przywroconoZWersji: result.restoredFrom, blockCount: after?.blocks.length },
    note: input.note ?? `powrot do wersji ${result.restoredFrom}`,
  })

  return ok(c, {
    id: p.id,
    przywroconoZWersji: result.restoredFrom,
    artykul: after ? present(after) : null,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. Blokada edycji — jawne zajecie i zwolnienie
// ─────────────────────────────────────────────────────────────────────────────

route.post('/:id/lock', requireAuth, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard
  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  const uid = userId(c as never)
  const acquired = await ArticlesRepo.acquireLock(c, p.id, uid)
  const state = await ArticlesRepo.lockState(c, p.id, uid)

  if (!acquired) {
    return fail(c, 'conflict', `Artykul jest edytowany przez ${state.byName ?? 'inna osobe'}.`, {
      zablokowanyPrzez: state.by,
      od: state.at,
      wygasaPo: `${15} minut bezczynnosci`,
    })
  }
  return ok(c, { id: p.id, blokada: state })
})

route.delete('/:id/lock', requireAuth, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard
  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  // Redaktor naczelny moze zdjac cudza blokade — bez tego artykul
  // porzucony przez autora na urlopie bylby nieedytowalny przez 15 minut
  // po kazdym jego wejsciu na strone.
  const force = hasPermission(getRole(c as never), 'article:update:any')
  await ArticlesRepo.releaseLock(c, p.id, userId(c as never), force)
  return ok(c, { id: p.id, zwolniono: true, wymuszone: force })
})

// ─────────────────────────────────────────────────────────────────────────────
// 14. Usuniecie (miekkie) i przywrocenie
// ─────────────────────────────────────────────────────────────────────────────

route.delete('/:id', requireAuth, async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard
  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  const article = await ArticlesRepo.getById(c, p.id)
  if (!article) return fail(c, 'not_found')

  if (!canDelete(c as never, article)) {
    await audit(c, { action: 'article.delete', entity: 'articles', entityId: p.id, outcome: 'denied' })
    return fail(c, 'forbidden', 'Brak uprawnien do usuniecia tego artykulu.')
  }

  await ArticlesRepo.saveVersion(c, article, userId(c as never) || null, 'Stan przed usunieciem')
  await ArticlesRepo.softDelete(c, p.id)

  await audit(c, {
    action: 'article.delete',
    entity: 'articles',
    entityId: p.id,
    before: scalars(article),
    note: 'usuniecie miekkie — tresc i historia pozostaja w bazie',
  })

  return ok(c, {
    id: p.id,
    usuniete: true,
    uwaga: 'Artykul zostal ukryty. Tresc i historia zmian pozostaja w bazie i mozna je przywrocic.',
  })
})

route.post('/:id/undelete', requireAuth, requirePermission('article:update:any'), async (c) => {
  const dbGuard = requireDb(c)
  if (dbGuard instanceof Response) return dbGuard
  const p = parseParams(c, articleIdParamSchema)
  if (p instanceof Response) return p

  const article = await ArticlesRepo.getById(c, p.id, true)
  if (!article) return fail(c, 'not_found')
  if (!article.deleted_at) return fail(c, 'conflict', 'Ten artykul nie jest usuniety.')

  await ArticlesRepo.undelete(c, p.id)
  const after = await ArticlesRepo.getById(c, p.id)
  await audit(c, { action: 'article.undelete', entity: 'articles', entityId: p.id, after: { slug: after?.slug } })

  return ok(c, { id: p.id, przywrocone: true, slug: after?.slug, status: after?.status })
})

export default route
