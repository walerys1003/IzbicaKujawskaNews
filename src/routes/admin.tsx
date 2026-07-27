/**
 * FAZA 2 / F-panel — panel redakcyjny podłączony do bazy.
 *
 * CO BYŁO NIE TAK
 * ───────────────
 * 1. Panel nie miał drzwi. `requireAdmin` czytał ciasteczko `admin_token`,
 *    ale żadna trasa go nie ustawiała i nie istniała strona logowania.
 *    Redaktor nie mógł wejść do panelu z przeglądarki — kryterium wyjścia
 *    FAZY 2 nie było spełnione nie z braku funkcji, ale z braku wejścia.
 *
 * 2. Wszystkie dane były wpisane na stałe: cztery artykuły, trzy komentarze,
 *    trzech użytkowników. Panel wyglądał jak działający system, ale pokazywał
 *    makietę — a baza w tym samym czasie miała 30 artykułów. To gorsze niż
 *    pusta strona, bo sugeruje, że redakcja widzi swoją pracę.
 *
 * 3. Nie istniała ani jedna trasa zapisu. Dziewięć tras GET, zero POST.
 *    Każdy przycisk „Zapisz”, „Publikuj”, „Akceptuj” był atrapą.
 *
 * 4. `page()` przekazywało do widoku `role={'admin'}` na sztywno, więc autor
 *    widział pasek nawigacji administratora z odnośnikami, które kończą się
 *    odmową dostępu.
 *
 * WZORZEC ZAPISU
 * ──────────────
 * Każdy POST kończy się przekierowaniem (303) z komunikatem w adresie —
 * wzorzec POST-redirect-GET. Bez niego odświeżenie strony po publikacji
 * wysyłałoby żądanie ponownie; przeglądarka pokazuje wtedy pytanie
 * o powtórzenie, na które redaktorzy odpowiadają odruchowo „tak”.
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import {
  AdminLayout,
  DashboardCards,
  ArticlesList,
  ArticleForm,
  CommentsList,
  UsersList,
  MediaGallery,
  MediaUploader,
  ObituariesList,
  JobOffersList,
  RealEstateList,
  EventsList,
  NewslettersList,
  SettingsForm,
  LoginPage,
  Pagination,
  FilterBar,
} from '../components/admin'
import type {
  AdminArticle,
  AdminComment,
  AdminUser,
  AdminRole,
  MediaItem,
  ObituaryItem,
  JobOfferItem,
  RealEstateItem,
  EventItem,
  NewsletterItem,
} from '../components/admin'
import { ArticlesRepo, RepositoryError, type ArticleFull } from '../db/repositories/articles'
import { blocksToHtml, extractPreservedBlocks, parseEditorHtml } from '../lib/content/html-to-blocks'
import { readingMinutes } from '../lib/validation/blocks'
import {
  clearPanelCookies,
  ensurePanelSession,
  setPanelCookies,
  type PanelSession,
} from '../lib/auth/panel-session'
import {
  getUserByEmail,
  isAccountLocked,
  issueSession,
  noteFailedLogin,
  noteSuccessfulLogin,
  revokeSession,
  verifyPassword,
} from '../lib/auth/store'
import { verifyTotp } from '../lib/auth/totp'
import { canTransitionArticle, hasPermission } from '../lib/auth/roles'
import { audit } from '../lib/audit'
import { SOLECTWA } from '../data-modules'
import {
  PAGE_SIZE,
  canEnterPanel,
  denyPermission,
  formatBytes,
  formatDateTime,
  pageFromQuery,
  readFlash,
  redirectToLogin,
  redirectWith,
  statusesForRole,
  toAdminArticle,
} from './admin/shared'

type Env = {
  Bindings: {
    JWT_SECRET?: string
    DB?: D1Database
    ENVIRONMENT?: string
    IP_HASH_SALT?: string
  }
  Variables: {
    panel?: PanelSession
  }
}

const admin = new Hono<Env>()

// ─────────────────────────────────────────────────────────────────────────────
// Logowanie
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adres powrotu po zalogowaniu.
 *
 * Przyjmujemy WYŁĄCZNIE ścieżki wewnątrz `/admin`. Bez tego ograniczenia
 * `?next=https://obca.example` zamieniłby stronę logowania w przekierowanie
 * otwarte: odnośnik z domeny portalu prowadziłby na obcą stronę, a przeglądarka
 * pokazywałaby w historii, że użytkownik przyszedł z izbica24.pl.
 */
const safeNext = (value: string | undefined): string => {
  if (!value) return '/admin'
  if (!value.startsWith('/admin')) return '/admin'
  if (value.startsWith('//')) return '/admin'
  return value
}

admin.get('/login', async (c) => {
  // Zalogowanego nie trzymamy na stronie logowania — od razu do panelu.
  const existing = await ensurePanelSession(c)
  if (existing && canEnterPanel(existing.role)) {
    return c.redirect(safeNext(c.req.query('next')), 302)
  }
  return c.html(
    <LoginPage
      next={c.req.query('next')}
      error={c.req.query('error') || null}
      email={c.req.query('email')}
      needsTwoFactor={c.req.query('twofa') === '1'}
    />,
  )
})

admin.post('/login', async (c) => {
  if (!c.env?.JWT_SECRET) {
    return c.html(
      <LoginPage error="Panel jest niedostępny: brak konfiguracji uwierzytelniania (JWT_SECRET)." />,
      503,
    )
  }
  if (!c.env?.DB) {
    return c.html(<LoginPage error="Panel jest niedostępny: brak połączenia z bazą." />, 503)
  }

  const form = await c.req.parseBody()
  const email = String(form.email ?? '').trim().toLowerCase()
  const password = String(form.password ?? '')
  const code = form.code ? String(form.code).trim() : ''
  const next = safeNext(form.next ? String(form.next) : undefined)

  const back = (error: string, twofa = false) =>
    c.html(<LoginPage error={error} email={email} next={next} needsTwoFactor={twofa} />, 401)

  if (!email || !password) return back('Podaj adres e-mail i hasło.')

  const user = await getUserByEmail(c.env as never, email)
  // Ten sam komunikat dla nieistniejącego konta i złego hasła — różnica
  // pozwalałaby sprawdzić, które adresy są zarejestrowane w redakcji.
  if (!user) return back('Nieprawidłowy adres e-mail lub hasło.')

  if (isAccountLocked(user)) {
    return back('Konto jest tymczasowo zablokowane po nieudanych próbach logowania. Spróbuj ponownie za kilkanaście minut.')
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    await noteFailedLogin(c.env as never, user.id)
    return back('Nieprawidłowy adres e-mail lub hasło.')
  }

  if (user.twoFactorEnabled) {
    if (!code) return back('Konto wymaga kodu z aplikacji uwierzytelniającej.', true)
    if (!user.twoFactorSecret || !(await verifyTotp(user.twoFactorSecret, code))) {
      await noteFailedLogin(c.env as never, user.id)
      return back('Nieprawidłowy kod uwierzytelniania dwuskładnikowego.', true)
    }
  }

  // Kontrola roli PO sprawdzeniu hasła. Odwrotna kolejność ujawniałaby,
  // że konto istnieje, tylko nie ma uprawnień.
  if (!canEnterPanel(user.role)) {
    return back('To konto nie ma dostępu do panelu redakcyjnego.')
  }

  const session = await issueSession(c.env as never, user, {
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? undefined,
  })
  await noteSuccessfulLogin(c.env as never, user.id)
  setPanelCookies(c, session)

  return c.redirect(next, 303)
})

admin.post('/logout', async (c) => {
  const session = await ensurePanelSession(c, false)
  if (session) {
    // Unieważnienie po stronie serwera, nie tylko usunięcie ciasteczka.
    // Samo usunięcie zostawiałoby ważny token — skopiowany wcześniej
    // działałby dalej przez 30 dni.
    await revokeSession(c.env as never, session.sessionId).catch(() => undefined)
  }
  clearPanelCookies(c)
  return c.redirect('/admin/login?error=' + encodeURIComponent('Wylogowano.'), 303)
})

// ─────────────────────────────────────────────────────────────────────────────
// Kontrola dostępu do pozostałych tras
// ─────────────────────────────────────────────────────────────────────────────

admin.use('*', async (c, next) => {
  if (!c.env?.JWT_SECRET) {
    // Brak konfiguracji traktujemy jako awarię zabezpieczeń (fail-closed).
    // Poprzednia wersja przy braku JWT_SECRET nadawała rolę 'admin' każdemu
    // żądaniu, więc `curl /admin` zwracał 200 z całym panelem.
    console.error('[admin] Odmowa dostępu: brak JWT_SECRET w środowisku.')
    return c.html(
      <LoginPage error="Panel jest niedostępny: brak konfiguracji uwierzytelniania." />,
      503,
    )
  }

  const isNavigation = c.req.method === 'GET' || c.req.method === 'POST'
  const session = await ensurePanelSession(c, isNavigation)
  if (!session) return redirectToLogin(c)
  if (!canEnterPanel(session.role)) {
    clearPanelCookies(c)
    return c.redirect(
      '/admin/login?error=' + encodeURIComponent('To konto nie ma dostępu do panelu redakcyjnego.'),
      303,
    )
  }

  c.set('panel', session)
  await next()
})

const sessionOf = (c: Context<Env>): PanelSession => c.get('panel') as PanelSession

// ─────────────────────────────────────────────────────────────────────────────
// Renderowanie strony
// ─────────────────────────────────────────────────────────────────────────────

/** Liczniki do paska nawigacji — jedno zapytanie, nie pięć. */
const navCounts = async (c: Context<Env>): Promise<Record<string, number>> => {
  if (!c.env?.DB) return {}
  try {
    const row = await c.env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL) AS articles,
         (SELECT COUNT(*) FROM comments WHERE status = 'pending' AND deleted_at IS NULL) AS comments,
         (SELECT COUNT(*) FROM media WHERE deleted_at IS NULL) AS media,
         (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users`,
    ).first<{ articles: number; comments: number; media: number; users: number }>()
    return row ? { ...row } : {}
  } catch (error) {
    // Licznik jest ozdobą — jego awaria nie może zabrać dostępu do panelu.
    console.error('[admin] Nie udało się policzyć pozycji nawigacji:', error)
    return {}
  }
}

const page = async (
  c: Context<Env>,
  title: string,
  activePath: string,
  content: unknown,
  opts: { subtitle?: string; editor?: boolean; actions?: unknown } = {},
) => {
  const session = sessionOf(c)
  const counts = await navCounts(c)
  const flash = readFlash(c)

  return c.html(
    <AdminLayout
      title={title}
      subtitle={opts.subtitle}
      activePath={activePath}
      role={session.role as AdminRole}
      showEditorAssets={!!opts.editor}
      counts={counts}
      user={{ email: session.email, role: session.role as AdminRole }}
      pageActions={opts.actions as never}
      toast={flash}
    >
      {content as never}
    </AdminLayout>,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

admin.get('/', async (c) => {
  const session = sessionOf(c)
  if (!c.env?.DB) return page(c, 'Dashboard', '/admin', <p class="admin-empty">Brak połączenia z bazą.</p>)

  const counts = await ArticlesRepo.statusCounts(c as never)

  const todayRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM articles
      WHERE status = 'published' AND deleted_at IS NULL
        AND date(published_at) = date('now')`,
  ).first<{ n: number }>()

  const pendingRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM comments WHERE status = 'pending' AND deleted_at IS NULL`,
  ).first<{ n: number }>()

  const aiRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM articles WHERE ai_assisted = 1 AND human_reviewed_by IS NULL AND deleted_at IS NULL`,
  ).first<{ n: number }>()

  const activeRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL AND role IN ('admin','editor','author')`,
  ).first<{ n: number }>()

  // Autor widzi na pulpicie własne materiały. Lista cudzych szkiców nie jest
  // mu do niczego potrzebna, a przy okazji ujawniałaby nieopublikowane tematy.
  const mine = hasPermission(session.role, 'article:update:any') ? undefined : session.userId

  const recent = await ArticlesRepo.list(c as never, {
    limit: 8,
    offset: 0,
    sort: 'updated_at',
    dir: 'desc',
    author: mine,
  })

  const comments = hasPermission(session.role, 'comment:moderate')
    ? await loadComments(c, { status: 'pending', limit: 6, offset: 0 })
    : { items: [] as AdminComment[], total: 0 }

  return page(
    c,
    'Dashboard',
    '/admin',
    <>
      <DashboardCards
        stats={[
          { label: 'Opublikowane dziś', value: todayRow?.n ?? 0, delta: `${counts.published ?? 0} łącznie`, tone: 'success' },
          { label: 'Komentarze do moderacji', value: pendingRow?.n ?? 0, delta: pendingRow?.n ? 'wymaga decyzji' : 'kolejka pusta', tone: pendingRow?.n ? 'warning' : 'neutral' },
          { label: 'Szkice i recenzje', value: (counts.draft ?? 0) + (counts.review ?? 0), delta: `${counts.review ?? 0} czeka na akceptację`, tone: 'neutral' },
          { label: 'Materiały AI bez recenzji', value: aiRow?.n ?? 0, delta: aiRow?.n ? 'wymaga sprawdzenia' : 'wszystkie sprawdzone', tone: aiRow?.n ? 'danger' : 'success' },
        ]}
      />
      <div class="admin-grid-two">
        <ArticlesList
          articles={recent.items.map(toAdminArticle)}
          role={session.role as AdminRole}
          title={mine ? 'Moje ostatnie materiały' : 'Ostatnio zmieniane'}
        />
        {hasPermission(session.role, 'comment:moderate') ? (
          <CommentsList comments={comments.items} title="Komentarze do moderacji" />
        ) : (
          <section class="admin-panel">
            <div class="admin-panel-head"><h2>Redakcja</h2></div>
            <p class="admin-empty">
              Aktywnych kont redakcyjnych: {activeRow?.n ?? 0}. Twoja rola: {session.role}.
            </p>
          </section>
        )}
      </div>
    </>,
    { subtitle: 'Przegląd newsroomu, moderacji i publikacji.' },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Artykuły — lista
// ─────────────────────────────────────────────────────────────────────────────

const categoryOptions = async (c: Context<Env>): Promise<Array<{ slug: string; name: string }>> => {
  if (!c.env?.DB) return []
  const rows = await c.env.DB.prepare(
    'SELECT slug, name FROM categories WHERE parent_id IS NULL ORDER BY order_index, name',
  ).all<{ slug: string; name: string }>()
  return rows.results ?? []
}

admin.get('/articles', async (c) => {
  const session = sessionOf(c)
  const currentPage = pageFromQuery(c)
  const status = c.req.query('status') || ''
  const category = c.req.query('category') || ''
  const q = c.req.query('q') || ''

  const mine = hasPermission(session.role, 'article:update:any') ? undefined : session.userId

  const result = await ArticlesRepo.list(c as never, {
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
    status: status || undefined,
    category: category || undefined,
    q: q || undefined,
    author: mine,
    sort: 'updated_at',
    dir: 'desc',
  })

  const categories = await categoryOptions(c)
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))

  return page(
    c,
    'Artykuły',
    '/admin/articles',
    <>
      <FilterBar
        action="/admin/articles"
        searchPlaceholder="Szukaj po tytule lub lidzie"
        values={{ q, status, category }}
        filters={[
          {
            name: 'status',
            options: [
              { label: 'Wszystkie statusy', value: '' },
              { label: 'Szkice', value: 'draft' },
              { label: 'Do akceptacji', value: 'review' },
              { label: 'Zaplanowane', value: 'scheduled' },
              { label: 'Opublikowane', value: 'published' },
              { label: 'Zarchiwizowane', value: 'archived' },
            ],
          },
          {
            name: 'category',
            options: [
              { label: 'Wszystkie kategorie', value: '' },
              ...categories.map((item) => ({ label: item.name, value: item.slug })),
            ],
          },
        ]}
      />
      <ArticlesList articles={result.items.map(toAdminArticle)} role={session.role as AdminRole} />
      <Pagination
        current={currentPage}
        total={totalPages}
        basePath="/admin/articles"
        query={{ q, status, category }}
      />
    </>,
    {
      subtitle: `Znaleziono ${result.total} ${result.total === 1 ? 'materiał' : 'materiałów'}${mine ? ' (Twoje)' : ''}.`,
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Artykuły — formularz
// ─────────────────────────────────────────────────────────────────────────────

const solectwaNames = SOLECTWA.map((item) => item.name)

admin.get('/articles/new', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'article:create')) return denyPermission(c, 'tworzenie artykułów')

  return page(
    c,
    'Nowy artykuł',
    '/admin/articles',
    <ArticleForm
      mode="create"
      categories={await categoryOptions(c)}
      allowedStatuses={statusesForRole(session.role as AdminRole)}
      solectwa={solectwaNames}
      errors={c.req.query('errors') ? JSON.parse(c.req.query('errors') as string) : []}
    />,
    { subtitle: 'Tworzenie wpisu z pełnym przebiegiem redakcyjnym.', editor: true },
  )
})

admin.get('/articles/:id/edit', async (c) => {
  const session = sessionOf(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id)) return redirectWith(c, '/admin/articles', 'Nieprawidłowy identyfikator.', 'danger')

  const article = await ArticlesRepo.getById(c as never, id)
  if (!article) return redirectWith(c, '/admin/articles', 'Nie znaleziono artykułu.', 'danger')

  // Autor może edytować wyłącznie swoje materiały. Bez tego sprawdzenia
  // wpisanie cudzego identyfikatora w adres dawało pełny dostęp do edycji.
  const own = article.author_id === session.userId
  if (!own && !hasPermission(session.role, 'article:update:any')) {
    return denyPermission(c, 'edycja cudzego artykułu')
  }

  const lock = await ArticlesRepo.lockState(c as never, id, session.userId)
  if (!lock.locked) await ArticlesRepo.acquireLock(c as never, id, session.userId)

  return page(
    c,
    'Edycja artykułu',
    '/admin/articles',
    <ArticleForm
      mode="edit"
      article={toFormArticle(article)}
      categories={await categoryOptions(c)}
      allowedStatuses={statusesForRole(session.role as AdminRole)}
      solectwa={solectwaNames}
      lockedBy={lock.locked ? lock.byName ?? 'inny użytkownik' : null}
      errors={c.req.query('errors') ? JSON.parse(c.req.query('errors') as string) : []}
    />,
    {
      subtitle: `Status: ${article.status} · ostatnia zmiana ${formatDateTime(article.updated_at)}`,
      editor: true,
      actions: (
        <a href={`/admin/articles/${id}/versions`} class="admin-button is-ghost">Historia zmian</a>
      ),
    },
  )
})

/** Artykuł z bazy → dane formularza (z treścią zamienioną na HTML edytora). */
const toFormArticle = (article: ArticleFull): Partial<AdminArticle> => ({
  id: String(article.id),
  title: article.title,
  slug: article.slug,
  lead: article.lead,
  category: article.category_slug ?? '',
  status: article.status,
  solectwo: article.solectwo_slug,
  heroImage: article.hero_image_r2_key,
  heroAlt: article.hero_alt,
  aiAssisted: !!article.ai_assisted,
  tags: article.tags,
  // Prawdziwa treść, nie zaślepka. Poprzednia wersja formularza wstawiała
  // `<h2>{title}</h2><p>Treść robocza…</p>`, więc pierwszy zapis kasował
  // cały artykuł.
  contentHtml: blocksToHtml(article.blocks),
  expectedUpdatedAt: article.updated_at,
  updatedAt: formatDateTime(article.updated_at),
  author: article.author_name ?? 'redakcja',
  views: article.view_count,
  comments: article.comment_count,
})

// ─────────────────────────────────────────────────────────────────────────────
// Artykuły — zapis
// ─────────────────────────────────────────────────────────────────────────────

interface ArticleFormPayload {
  title: string
  slug?: string
  lead: string
  category: string
  status: string
  solectwo?: string
  heroImage?: string
  heroAlt?: string
  tags: string[]
  aiAssisted: boolean
  contentHtml: string
  expectedUpdatedAt?: string
}

const readArticleForm = async (c: Context<Env>): Promise<ArticleFormPayload> => {
  const form = await c.req.parseBody()
  const text = (key: string): string => String(form[key] ?? '').trim()

  return {
    title: text('title'),
    slug: text('slug') || undefined,
    lead: text('lead'),
    category: text('category'),
    status: text('status') || 'draft',
    solectwo: text('solectwo') || undefined,
    heroImage: text('heroImage') || undefined,
    heroAlt: text('heroAlt') || undefined,
    tags: text('tags')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 20),
    aiAssisted: form.aiAssisted === '1' || form.aiAssisted === 'on',
    contentHtml: String(form.content ?? ''),
    expectedUpdatedAt: text('expectedUpdatedAt') || undefined,
  }
}

/** Sołectwo jako slug — w bazie trzymamy slug, w formularzu nazwę. */
const solectwoSlug = (name: string | undefined): string | null => {
  if (!name) return null
  const match = SOLECTWA.find((item) => item.name === name || item.slug === name)
  return match ? match.slug : null
}

const backToForm = (
  c: Context<Env>,
  path: string,
  errors: string[],
): Response => c.redirect(`${path}?errors=${encodeURIComponent(JSON.stringify(errors.slice(0, 12)))}`, 303)

admin.post('/articles', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'article:create')) return denyPermission(c, 'tworzenie artykułów')

  const payload = await readArticleForm(c)
  const errors: string[] = []
  if (!payload.title) errors.push('Tytuł jest wymagany.')
  if (!payload.lead) errors.push('Lid jest wymagany — bez niego artykuł nie ma zapowiedzi na listach.')
  if (!payload.category) errors.push('Kategoria jest wymagana.')

  const { html, preserved } = extractPreservedBlocks(payload.contentHtml)
  const parsed = parseEditorHtml(html, preserved)
  if (!parsed.ok) errors.push(...parsed.errors)

  // Nowy materiał wolno zapisać tylko jako szkic albo do recenzji.
  // Publikacja od razu pomijałaby recenzję, czyli obchodziłaby przebieg B4.
  const initialStatus = payload.status === 'review' ? 'review' : 'draft'
  if (initialStatus === 'review' && !hasPermission(session.role, 'article:submit-review')) {
    errors.push('Twoja rola nie może wysyłać materiałów do recenzji.')
  }

  if (errors.length) return backToForm(c, '/admin/articles/new', errors)

  try {
    const created = await ArticlesRepo.create(c as never, {
      title: payload.title,
      slug: payload.slug,
      lede: payload.lead,
      category: payload.category,
      blocks: parsed.blocks,
      tags: payload.tags,
      status: initialStatus,
      authorId: session.userId,
      solectwo: solectwoSlug(payload.solectwo),
      heroImage: payload.heroImage ?? null,
      heroAlt: payload.heroAlt ?? null,
      aiAssisted: payload.aiAssisted,
      readingMinutes: readingMinutes(parsed.blocks),
    })

    await audit(c as never, {
      action: 'article.create',
      entity: 'articles',
      entityId: created.id,
      after: { title: payload.title, status: initialStatus, slug: created.slug },
      note: 'panel redakcyjny',
    })

    return redirectWith(
      c,
      `/admin/articles/${created.id}/edit`,
      initialStatus === 'review' ? 'Materiał zapisany i wysłany do recenzji.' : 'Szkic zapisany.',
    )
  } catch (error) {
    const message = error instanceof RepositoryError ? error.message : 'Nie udało się zapisać artykułu.'
    console.error('[admin] Zapis artykułu nieudany:', error)
    return backToForm(c, '/admin/articles/new', [message])
  }
})

admin.post('/articles/:id', async (c) => {
  const session = sessionOf(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  if (!Number.isFinite(id)) return redirectWith(c, '/admin/articles', 'Nieprawidłowy identyfikator.', 'danger')

  const existing = await ArticlesRepo.getById(c as never, id)
  if (!existing) return redirectWith(c, '/admin/articles', 'Nie znaleziono artykułu.', 'danger')

  const own = existing.author_id === session.userId
  if (!own && !hasPermission(session.role, 'article:update:any')) {
    return denyPermission(c, 'edycja cudzego artykułu')
  }

  const payload = await readArticleForm(c)
  const editPath = `/admin/articles/${id}/edit`
  const errors: string[] = []

  /*
    Kontrola równoczesnej edycji (B4). Bez niej dwie osoby otwierające ten
    sam artykuł zapisują po kolei, a zapis drugiej cicho usuwa zmiany
    pierwszej. Porównujemy znacznik z chwili otwarcia formularza z bieżącym
    stanem w bazie.
  */
  if (payload.expectedUpdatedAt && payload.expectedUpdatedAt !== existing.updated_at) {
    return backToForm(c, editPath, [
      `Ktoś zapisał ten artykuł w międzyczasie (${formatDateTime(existing.updated_at)}). Odśwież stronę i nanieś zmiany ponownie — zapis został wstrzymany, żeby nie nadpisać cudzej pracy.`,
    ])
  }

  if (!payload.title) errors.push('Tytuł jest wymagany.')
  if (!payload.lead) errors.push('Lid jest wymagany.')
  if (!payload.category) errors.push('Kategoria jest wymagana.')

  const { html, preserved } = extractPreservedBlocks(payload.contentHtml)
  const parsed = parseEditorHtml(html, preserved)
  if (!parsed.ok) errors.push(...parsed.errors)

  // Zmiana statusu przez formularz przechodzi tę samą kontrolę przejść,
  // co osobna trasa statusu.
  let statusChange: string | null = null
  if (payload.status && payload.status !== existing.status) {
    const check = canTransitionArticle(session.role, existing.status, payload.status)
    if (!check.allowed) errors.push(check.reason ?? 'Niedozwolona zmiana statusu.')
    else statusChange = payload.status
  }

  if (errors.length) return backToForm(c, editPath, errors)

  try {
    // Wersja zapisywana PRZED zmianą — inaczej „powrót do poprzedniej wersji”
    // wracałby do stanu już zmienionego.
    await ArticlesRepo.saveVersion(c as never, existing, session.userId, 'zapis z panelu', parsed.blocks)

    await ArticlesRepo.update(c as never, id, {
      title: payload.title,
      slug: payload.slug || existing.slug,
      lede: payload.lead,
      category: payload.category,
      blocks: parsed.blocks,
      tags: payload.tags,
      solectwo: solectwoSlug(payload.solectwo),
      heroImage: payload.heroImage ?? null,
      heroAlt: payload.heroAlt ?? null,
      aiAssisted: payload.aiAssisted,
      readingMinutes: readingMinutes(parsed.blocks),
    })

    if (statusChange) {
      await ArticlesRepo.setStatus(c as never, id, statusChange, {
        reviewerId: statusChange === 'published' ? session.userId : undefined,
      })
    }

    await ArticlesRepo.releaseLock(c as never, id, session.userId)

    await audit(c as never, {
      action: statusChange ? 'article.update+status' : 'article.update',
      entity: 'articles',
      entityId: id,
      before: { title: existing.title, status: existing.status },
      after: { title: payload.title, status: statusChange ?? existing.status },
      note: 'panel redakcyjny',
    })

    return redirectWith(
      c,
      editPath,
      statusChange === 'published'
        ? 'Zapisano i opublikowano — artykuł jest widoczny na portalu.'
        : statusChange
          ? `Zapisano. Nowy status: ${statusChange}.`
          : 'Zapisano zmiany.',
    )
  } catch (error) {
    const message = error instanceof RepositoryError ? error.message : 'Nie udało się zapisać zmian.'
    console.error('[admin] Aktualizacja artykułu nieudana:', error)
    return backToForm(c, editPath, [message])
  }
})

/** Zmiana samego statusu — przyciski na liście artykułów. */
admin.post('/articles/:id/status', async (c) => {
  const session = sessionOf(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  const form = await c.req.parseBody()
  const target = String(form.status ?? '')

  const existing = await ArticlesRepo.getRow(c as never, id)
  if (!existing) return redirectWith(c, '/admin/articles', 'Nie znaleziono artykułu.', 'danger')

  const own = existing.author_id === session.userId
  if (!own && !hasPermission(session.role, 'article:update:any')) {
    return denyPermission(c, 'zmiana statusu cudzego artykułu')
  }

  const check = canTransitionArticle(session.role, existing.status, target)
  if (!check.allowed) {
    await audit(c as never, {
      action: 'article.status',
      entity: 'articles',
      entityId: id,
      outcome: 'denied',
      note: check.reason,
    })
    return redirectWith(c, '/admin/articles', check.reason ?? 'Niedozwolona zmiana statusu.', 'danger')
  }

  /*
    Publikacja materiału oznaczonego jako AI wymaga recenzji człowieka —
    wpisujemy, KTO ją wykonał. Bez tego zapisu nie da się później ustalić,
    czy tekst wygenerowany modelem ktokolwiek przeczytał przed publikacją.
  */
  await ArticlesRepo.setStatus(c as never, id, target, {
    reviewerId: target === 'published' ? session.userId : undefined,
  })

  await audit(c as never, {
    action: 'article.status',
    entity: 'articles',
    entityId: id,
    before: { status: existing.status },
    after: { status: target },
    note: 'panel redakcyjny',
  })

  const messages: Record<string, string> = {
    published: 'Opublikowano — artykuł jest widoczny na portalu.',
    review: 'Wysłano do recenzji.',
    draft: 'Wycofano do szkicu.',
    archived: 'Zarchiwizowano.',
    scheduled: 'Zaplanowano publikację.',
  }
  return redirectWith(c, '/admin/articles', messages[target] ?? `Nowy status: ${target}.`)
})

/** Historia zmian — wymagana przez kryterium wyjścia FAZY 2. */
admin.get('/articles/:id/versions', async (c) => {
  const session = sessionOf(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  const article = await ArticlesRepo.getRow(c as never, id)
  if (!article) return redirectWith(c, '/admin/articles', 'Nie znaleziono artykułu.', 'danger')

  const own = article.author_id === session.userId
  if (!own && !hasPermission(session.role, 'article:read:unpublished')) {
    return denyPermission(c, 'podgląd historii')
  }

  const versions = await ArticlesRepo.listVersions(c as never, id)
  const canRestore = hasPermission(session.role, 'article:restore-version')

  return page(
    c,
    'Historia zmian',
    '/admin/articles',
    <section class="admin-panel">
      <div class="admin-panel-head">
        <h2>{article.title}</h2>
        <a href={`/admin/articles/${id}/edit`} class="admin-button is-ghost">Wróć do edycji</a>
      </div>
      {versions.length === 0 ? (
        <p class="admin-empty">Brak zapisanych wersji. Pierwsza powstanie przy najbliższym zapisie.</p>
      ) : (
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr><th>Wersja</th><th>Tytuł</th><th>Status</th><th>Autor zmiany</th><th>Data</th><th>Zmiana</th><th>Akcje</th></tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr>
                  <td>#{version.version_number}</td>
                  <td>{version.title}</td>
                  <td>{version.status}</td>
                  <td>{version.editor_name ?? '—'}</td>
                  <td>{formatDateTime(version.edited_at)}</td>
                  <td class="admin-table-meta">
                    +{version.chars_added ?? 0} / −{version.chars_removed ?? 0} znaków
                  </td>
                  <td>
                    {canRestore ? (
                      /* Uwaga: getVersion() szuka po kolumnie id, nie po version_number —
                         w adresie musi wiec byc wiersz, a nie numer widoczny dla redaktora. */
                      <form method="post" action={`/admin/articles/${id}/versions/${version.id}/restore`} class="admin-inline-form">
                        <input type="hidden" name="label" value={String(version.version_number ?? version.id)} />
                        <button type="submit" class="admin-button is-small is-ghost">Przywróć</button>
                      </form>
                    ) : (
                      <span class="admin-table-meta">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>,
    { subtitle: `Zapisanych wersji: ${versions.length}.` },
  )
})

admin.post('/articles/:id/versions/:versionId/restore', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'article:restore-version')) {
    return denyPermission(c, 'przywracanie wersji')
  }
  const id = Number.parseInt(c.req.param('id'), 10)
  const versionId = Number.parseInt(c.req.param('versionId'), 10)
  const form = await c.req.parseBody()
  const label = typeof form.label === 'string' && form.label ? form.label : String(versionId)

  try {
    const restored = await ArticlesRepo.restoreVersion(c as never, id, versionId, session.userId)
    if (!restored) {
      return redirectWith(c, `/admin/articles/${id}/versions`, 'Nie znaleziono takiej wersji.', 'danger')
    }
    await audit(c as never, {
      action: 'article.restore-version',
      entity: 'articles',
      entityId: id,
      after: { versionId, versionNumber: label },
      note: 'panel redakcyjny',
    })
    return redirectWith(c, `/admin/articles/${id}/edit`, `Przywrócono wersję #${label}.`)
  } catch (error) {
    console.error('[admin] Przywracanie wersji nieudane:', error)
    const message = error instanceof RepositoryError ? error.message : 'Nie udało się przywrócić wersji.'
    return redirectWith(c, `/admin/articles/${id}/versions`, message, 'danger')
  }
})

admin.post('/articles/:id/delete', async (c) => {
  const session = sessionOf(c)
  const id = Number.parseInt(c.req.param('id'), 10)
  const article = await ArticlesRepo.getRow(c as never, id)
  if (!article) return redirectWith(c, '/admin/articles', 'Nie znaleziono artykułu.', 'danger')

  const own = article.author_id === session.userId
  const permitted = own
    ? hasPermission(session.role, 'article:delete:own')
    : hasPermission(session.role, 'article:delete:any')
  if (!permitted) return denyPermission(c, 'usuwanie artykułu')

  await ArticlesRepo.softDelete(c as never, id)
  await audit(c as never, {
    action: 'article.delete',
    entity: 'articles',
    entityId: id,
    before: { title: article.title, status: article.status },
    note: 'usunięcie miękkie z panelu',
  })
  return redirectWith(c, '/admin/articles', 'Artykuł usunięty (można go przywrócić z kosza).')
})

// ─────────────────────────────────────────────────────────────────────────────
// Komentarze
// ─────────────────────────────────────────────────────────────────────────────

const loadComments = async (
  c: Context<Env>,
  opts: { status?: string; q?: string; limit: number; offset: number },
): Promise<{ items: AdminComment[]; total: number }> => {
  if (!c.env?.DB) return { items: [], total: 0 }

  const where = ['cm.deleted_at IS NULL']
  const binds: unknown[] = []
  if (opts.status) {
    where.push('cm.status = ?')
    binds.push(opts.status)
  }
  if (opts.q) {
    where.push('(cm.content LIKE ? OR cm.author_name LIKE ?)')
    const needle = `%${opts.q.replace(/[%_]/g, '')}%`
    binds.push(needle, needle)
  }
  const clause = `WHERE ${where.join(' AND ')}`

  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM comments cm ${clause}`)
    .bind(...binds)
    .first<{ n: number }>()

  const rows = await c.env.DB.prepare(
    `SELECT cm.id, cm.article_id, cm.content, cm.status, cm.created_at,
            cm.spam_score, cm.report_count, cm.profanity_hits,
            COALESCE(cm.author_name, u.name, 'gość') AS author,
            a.title AS article_title, a.slug AS article_slug
       FROM comments cm
       LEFT JOIN users u ON u.id = cm.user_id
       LEFT JOIN articles a ON a.id = cm.article_id
       ${clause}
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
  )
    .bind(...binds, opts.limit, opts.offset)
    .all<Record<string, unknown>>()

  const items: AdminComment[] = (rows.results ?? []).map((row) => ({
    id: String(row.id),
    author: String(row.author ?? 'gość'),
    articleTitle: String(row.article_title ?? '(artykuł usunięty)'),
    articleId: String(row.article_id ?? ''),
    articleSlug: (row.article_slug as string | null) ?? null,
    content: String(row.content ?? ''),
    createdAt: formatDateTime(row.created_at as string),
    status: String(row.status ?? 'pending') as AdminComment['status'],
    spamScore: Number(row.spam_score ?? 0),
    reportCount: Number(row.report_count ?? 0),
    profanityHits: Number(row.profanity_hits ?? 0),
  }))

  return { items, total: countRow?.n ?? 0 }
}

admin.get('/comments', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'comment:moderate')) return denyPermission(c, 'moderacja komentarzy')

  const currentPage = pageFromQuery(c)
  const status = c.req.query('status') || ''
  const q = c.req.query('q') || ''

  const result = await loadComments(c, {
    status: status || undefined,
    q: q || undefined,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  })
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))

  return page(
    c,
    'Komentarze',
    '/admin/comments',
    <>
      <FilterBar
        action="/admin/comments"
        searchPlaceholder="Szukaj po autorze lub treści"
        values={{ q, status }}
        filters={[
          {
            name: 'status',
            options: [
              { label: 'Wszystkie', value: '' },
              { label: 'Oczekujące', value: 'pending' },
              { label: 'Zatwierdzone', value: 'approved' },
              { label: 'Odrzucone', value: 'rejected' },
              { label: 'Spam', value: 'spam' },
            ],
          },
        ]}
      />
      <CommentsList comments={result.items} />
      <Pagination current={currentPage} total={totalPages} basePath="/admin/comments" query={{ q, status }} />
    </>,
    { subtitle: `Komentarzy w wybranym filtrze: ${result.total}.` },
  )
})

admin.post('/comments/:id/status', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'comment:moderate')) return denyPermission(c, 'moderacja komentarzy')
  if (!c.env?.DB) return redirectWith(c, '/admin/comments', 'Brak połączenia z bazą.', 'danger')

  const id = Number.parseInt(c.req.param('id'), 10)
  const form = await c.req.parseBody()
  const target = String(form.status ?? '')

  // Lista dozwolonych wartości musi zgadzać się z ograniczeniem CHECK
  // w tabeli. Bez tego sprawdzenia zły status kończy się błędem SQL,
  // a moderator dostaje pustą stronę bez wyjaśnienia.
  if (!['pending', 'approved', 'rejected', 'spam'].includes(target)) {
    return redirectWith(c, '/admin/comments', `Nieznany status komentarza: ${target}.`, 'danger')
  }

  const before = await c.env.DB.prepare('SELECT status, article_id FROM comments WHERE id = ?')
    .bind(id)
    .first<{ status: string; article_id: number }>()
  if (!before) return redirectWith(c, '/admin/comments', 'Nie znaleziono komentarza.', 'danger')

  await c.env.DB.prepare(
    `UPDATE comments
        SET status = ?, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
  )
    .bind(target, session.userId, id)
    .run()

  await audit(c as never, {
    action: 'comment.moderate',
    entity: 'comments',
    entityId: id,
    before: { status: before.status },
    after: { status: target },
    note: 'panel redakcyjny',
  })

  const labels: Record<string, string> = {
    approved: 'Komentarz zatwierdzony — jest widoczny pod artykułem.',
    rejected: 'Komentarz odrzucony.',
    spam: 'Komentarz oznaczony jako spam.',
    pending: 'Komentarz wrócił do kolejki.',
  }
  return redirectWith(c, '/admin/comments', labels[target] ?? 'Zapisano.')
})

// ─────────────────────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────────────────────

admin.get('/media', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'media:upload')) return denyPermission(c, 'biblioteka mediów')
  if (!c.env?.DB) return page(c, 'Media', '/admin/media', <p class="admin-empty">Brak połączenia z bazą.</p>)

  const currentPage = pageFromQuery(c)
  const countRow = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM media WHERE deleted_at IS NULL').first<{ n: number }>()
  const rows = await c.env.DB.prepare(
    `SELECT id, r2_key, mime, size_bytes, title, alt, credit, kind
       FROM media WHERE deleted_at IS NULL
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(PAGE_SIZE, (currentPage - 1) * PAGE_SIZE)
    .all<Record<string, unknown>>()

  const items: MediaItem[] = (rows.results ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? row.r2_key ?? 'bez nazwy'),
    url: `/media/${String(row.r2_key ?? '')}`,
    type: (String(row.kind ?? 'image') as MediaItem['type']),
    size: formatBytes(Number(row.size_bytes ?? 0)),
    alt: (row.alt as string | null) ?? null,
    credit: (row.credit as string | null) ?? null,
  }))

  const total = countRow?.n ?? 0

  return page(
    c,
    'Media',
    '/admin/media',
    <>
      <MediaUploader />
      {items.length === 0 ? (
        <section class="admin-panel">
          <div class="admin-panel-head"><h2>Biblioteka mediów</h2></div>
          <p class="admin-empty">
            Biblioteka jest pusta. Wysyłanie plików jest częścią etapu A5 — do tego czasu
            zdjęcia wskazuje się adresem w formularzu artykułu.
          </p>
        </section>
      ) : (
        <MediaGallery items={items} />
      )}
      <Pagination current={currentPage} total={Math.max(1, Math.ceil(total / PAGE_SIZE))} basePath="/admin/media" />
    </>,
    { subtitle: `Plików w bibliotece: ${total}.` },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Użytkownicy
// ─────────────────────────────────────────────────────────────────────────────

admin.get('/users', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'user:read')) return denyPermission(c, 'lista użytkowników')
  if (!c.env?.DB) return page(c, 'Użytkownicy', '/admin/users', <p class="admin-empty">Brak połączenia z bazą.</p>)

  const rows = await c.env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.last_login, u.locked_until, u.email_verified,
            (SELECT COUNT(*) FROM articles a WHERE a.author_id = u.id AND a.deleted_at IS NULL) AS article_count
       FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.role, u.name`,
  ).all<Record<string, unknown>>()

  const users: AdminUser[] = (rows.results ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? '—'),
    email: String(row.email ?? ''),
    role: String(row.role ?? 'viewer') as AdminRole,
    // Tabela `users` nie ma kolumny `status`. Stan wyprowadzamy z danych,
    // które istnieją: blokada po nieudanych próbach i potwierdzenie adresu.
    status: row.locked_until ? 'blocked' : row.email_verified ? 'active' : 'invited',
    lastLogin: formatDateTime(row.last_login as string),
    articleCount: Number(row.article_count ?? 0),
  }))

  return page(
    c,
    'Użytkownicy',
    '/admin/users',
    <>
      <UsersList users={users} />
      <section class="admin-panel">
        <h2>Zmiana roli</h2>
        {hasPermission(session.role, 'user:change-role') ? (
          <form method="post" action="/admin/users/role" class="admin-form-stack">
            <label>
              <span>Konto</span>
              <select class="admin-select" name="userId" required>
                {users.map((user) => (
                  <option value={user.id}>{user.email} ({user.role})</option>
                ))}
              </select>
            </label>
            <label>
              <span>Nowa rola</span>
              <select class="admin-select" name="role" required>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="author">author</option>
                <option value="moderator">moderator</option>
                <option value="contributor">contributor</option>
                <option value="viewer">viewer</option>
              </select>
            </label>
            <p class="admin-hint">
              Zmiana roli działa od następnego zalogowania tej osoby — token dostępu
              nosi rolę z chwili wydania i żyje 15 minut.
            </p>
            <div><button type="submit" class="admin-button">Zapisz rolę</button></div>
          </form>
        ) : (
          <p class="admin-empty">Twoja rola pozwala tylko na podgląd listy.</p>
        )}
      </section>
    </>,
    { subtitle: `Kont w redakcji: ${users.length}.` },
  )
})

admin.post('/users/role', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'user:change-role')) return denyPermission(c, 'zmiana roli')
  if (!c.env?.DB) return redirectWith(c, '/admin/users', 'Brak połączenia z bazą.', 'danger')

  const form = await c.req.parseBody()
  const userId = Number.parseInt(String(form.userId ?? ''), 10)
  const role = String(form.role ?? '')

  if (!['admin', 'editor', 'author', 'moderator', 'contributor', 'viewer'].includes(role)) {
    return redirectWith(c, '/admin/users', `Nieznana rola: ${role}.`, 'danger')
  }

  /*
    Zabezpieczenie przed odebraniem sobie uprawnień. Administrator, który
    zmieni własną rolę na 'viewer', traci dostęp do panelu i nie ma jak jej
    przywrócić — jedynym wyjściem byłby zapis wprost w bazie.
  */
  if (userId === session.userId && role !== session.role) {
    return redirectWith(
      c,
      '/admin/users',
      'Nie można zmienić własnej roli — poproś innego administratora.',
      'danger',
    )
  }

  const before = await c.env.DB.prepare('SELECT role, email FROM users WHERE id = ?')
    .bind(userId)
    .first<{ role: string; email: string }>()
  if (!before) return redirectWith(c, '/admin/users', 'Nie znaleziono konta.', 'danger')

  /*
    Ostatni administrator nie może przestać być administratorem — system bez
    żadnego konta administracyjnego jest nie do odzyskania z panelu.
  */
  if (before.role === 'admin' && role !== 'admin') {
    const adminCount = await c.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND deleted_at IS NULL",
    ).first<{ n: number }>()
    if ((adminCount?.n ?? 0) <= 1) {
      return redirectWith(c, '/admin/users', 'To ostatnie konto administratora — rola nie została zmieniona.', 'danger')
    }
  }

  await c.env.DB.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(role, userId)
    .run()

  await audit(c as never, {
    action: 'user.change-role',
    entity: 'users',
    entityId: userId,
    before: { role: before.role },
    after: { role },
    note: 'panel redakcyjny',
  })

  return redirectWith(c, '/admin/users', `Rola konta ${before.email} zmieniona na ${role}.`)
})

// ─────────────────────────────────────────────────────────────────────────────
// Ogłoszenia mieszkańców
// ─────────────────────────────────────────────────────────────────────────────

admin.get('/ogloszenia', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'listing:moderate')) return denyPermission(c, 'moderacja ogłoszeń')

  /*
    Ogłoszenia mieszkańców są przechowywane jako artykuły typu `content_type`
    ('nekrolog', 'praca', 'nieruchomosc', 'wydarzenie') — schemat nie ma dla
    nich osobnych tabel. Panel czyta więc te same artykuły z filtrem po typie,
    zamiast pokazywać listę wpisaną na stałe.
  */
  const byType = async (type: string) =>
    (await ArticlesRepo.list(c as never, { type, limit: 12, offset: 0, sort: 'created_at', dir: 'desc' })).items

  const [nekrologi, praca, nieruchomosci, wydarzenia] = await Promise.all([
    byType('nekrolog'),
    byType('praca'),
    byType('nieruchomosc'),
    byType('wydarzenie'),
  ])

  const obituaries: ObituaryItem[] = nekrologi.map((row) => ({
    id: String(row.id),
    name: row.title,
    dates: formatDateTime(row.published_at),
    photo: row.hero_image_r2_key ?? undefined,
    notice: row.lead,
  }))
  const jobs: JobOfferItem[] = praca.map((row) => ({
    id: String(row.id),
    title: row.title,
    company: row.solectwo_slug ?? 'gmina Izbica Kujawska',
    salary: '—',
    photo: row.hero_image_r2_key ?? undefined,
  }))
  const estates: RealEstateItem[] = nieruchomosci.map((row) => ({
    id: String(row.id),
    title: row.title,
    price: '—',
    photo: row.hero_image_r2_key ?? undefined,
  }))
  const events: EventItem[] = wydarzenia.map((row) => ({
    id: String(row.id),
    title: row.title,
    date: formatDateTime(row.published_at ?? row.created_at),
    location: row.solectwo_slug ?? 'Izbica Kujawska',
    category: row.category_name ?? 'wydarzenie',
  }))

  const empty = !obituaries.length && !jobs.length && !estates.length && !events.length

  return page(
    c,
    'Ogłoszenia',
    '/admin/ogloszenia',
    empty ? (
      <section class="admin-panel">
        <div class="admin-panel-head"><h2>Ogłoszenia mieszkańców</h2></div>
        <p class="admin-empty">
          Brak ogłoszeń w bazie. Nekrologi, oferty pracy, nieruchomości i wydarzenia
          są przechowywane jako materiały o typie treści — dodaje się je przez formularz artykułu.
        </p>
      </section>
    ) : (
      <>
        <div class="admin-grid-two">
          <ObituariesList items={obituaries} />
          <JobOffersList items={jobs} />
        </div>
        <div class="admin-grid-two">
          <RealEstateList items={estates} />
          <EventsList items={events} />
        </div>
      </>
    ),
    { subtitle: 'Nekrologi, oferty pracy, nieruchomości i wydarzenia.' },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Ustawienia
// ─────────────────────────────────────────────────────────────────────────────

const SETTING_KEYS = [
  'site.name',
  'site.email',
  'comments.mode',
  'newsletter.footer',
  'users.default_role',
] as const

admin.get('/settings', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'settings:read')) return denyPermission(c, 'ustawienia')

  const values: Record<string, string> = {}
  if (c.env?.DB) {
    const rows = await c.env.DB.prepare(
      `SELECT key, value FROM settings WHERE key IN (${SETTING_KEYS.map(() => '?').join(', ')})`,
    )
      .bind(...SETTING_KEYS)
      .all<{ key: string; value: string | null }>()
    for (const row of rows.results ?? []) values[row.key] = row.value ?? ''
  }

  const newsletters: NewsletterItem[] = []

  return page(
    c,
    'Ustawienia',
    '/admin/settings',
    <div class="admin-grid-two">
      <SettingsForm values={values} readOnly={!hasPermission(session.role, 'settings:update')} />
      <NewslettersList items={newsletters} />
    </div>,
    { subtitle: 'Konfiguracja portalu i preferencje newsroomu.' },
  )
})

admin.post('/settings', async (c) => {
  const session = sessionOf(c)
  if (!hasPermission(session.role, 'settings:update')) return denyPermission(c, 'zapis ustawień')
  if (!c.env?.DB) return redirectWith(c, '/admin/settings', 'Brak połączenia z bazą.', 'danger')

  const form = await c.req.parseBody()
  const statements = []
  for (const key of SETTING_KEYS) {
    const value = String(form[key] ?? '').slice(0, 2000)
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      ).bind(key, value),
    )
  }
  await c.env.DB.batch(statements)

  await audit(c as never, {
    action: 'settings.update',
    entity: 'settings',
    note: `zaktualizowano ${SETTING_KEYS.length} kluczy`,
  })

  return redirectWith(c, '/admin/settings', 'Ustawienia zapisane.')
})

export default admin
