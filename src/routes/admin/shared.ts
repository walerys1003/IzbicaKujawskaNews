/**
 * FAZA 2 / F-panel — wspólna warstwa tras panelu redakcyjnego.
 *
 * Panel jest renderowany po stronie serwera i obsługiwany zwykłymi
 * formularzami. To znaczy, że po zapisie trzeba przekierować (wzorzec
 * POST-redirect-GET), a komunikat przenieść przez adres — inaczej odświeżenie
 * strony powtórzyłoby zapis, a redaktor mógłby przez pomyłkę opublikować
 * artykuł dwa razy.
 */

import type { Context } from 'hono'
import type { AdminRole, AdminArticle, ArticleStatus } from '../../components/admin/types'
import type { ArticleListItem } from '../../db/repositories/articles'
import type { PanelSession } from '../../lib/auth/panel-session'
import { hasPermission, type Permission } from '../../lib/auth/roles'

/** Liczba pozycji na stronę listy. */
export const PAGE_SIZE = 25

/** Role, które wolno wpuścić do panelu. */
const PANEL_ROLES: AdminRole[] = ['admin', 'editor', 'author', 'moderator']

export const canEnterPanel = (role: string): boolean => (PANEL_ROLES as string[]).includes(role)

/**
 * Komunikat po przekierowaniu.
 *
 * Treść jest zakodowana w adresie, ale NIE jest wstawiana do strony jako HTML —
 * przechodzi przez JSX jako tekst, więc `?msg=<script>` wyświetli się jako
 * tekst, a nie wykona. Bez tej pewności parametr adresu byłby otwartym
 * wektorem XSS na własną redakcję.
 */
export interface FlashMessage {
  message: string
  tone: 'success' | 'warning' | 'danger'
}

export const readFlash = (c: Context): FlashMessage | null => {
  const message = c.req.query('msg')
  if (!message) return null
  const tone = c.req.query('tone')
  return {
    message: message.slice(0, 300),
    tone: tone === 'danger' || tone === 'warning' ? tone : 'success',
  }
}

export const redirectWith = (
  c: Context,
  path: string,
  message: string,
  tone: FlashMessage['tone'] = 'success',
): Response => {
  const params = new URLSearchParams({ msg: message, tone })
  return c.redirect(`${path}${path.includes('?') ? '&' : '?'}${params.toString()}`, 303)
}

/** Strona logowania z adresem powrotu. */
export const redirectToLogin = (c: Context): Response => {
  const url = new URL(c.req.url)
  const next = `${url.pathname}${url.search}`
  // Adres powrotu bierzemy z własnej ścieżki, nie z parametru — inaczej
  // `?next=https://obca.example` zamieniłby stronę logowania w przekierowanie
  // otwarte i pozwoliłby podszyć się pod panel.
  return c.redirect(`/admin/login?next=${encodeURIComponent(next)}`, 302)
}

/** Odmowa uprawnień w formie strony, nie JSON — panel jest przeglądany. */
export const denyPermission = (c: Context, what: string): Response =>
  redirectWith(c, '/admin', `Brak uprawnień: ${what}.`, 'danger')

export const requirePerm = (session: PanelSession, permission: Permission): boolean =>
  hasPermission(session.role, permission)

/**
 * Statusy, które dana rola może ustawić w formularzu artykułu.
 *
 * Autor widzi tylko 'draft' i 'review'. Gdyby lista zawierała 'published',
 * wybór zakończyłby się odmową PO wysłaniu formularza — czyli po napisaniu
 * całego tekstu. Lepiej nie oferować niedostępnej opcji.
 */
export const statusesForRole = (role: AdminRole): ArticleStatus[] => {
  const all: ArticleStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived']
  const permissionByStatus: Record<string, Permission> = {
    draft: 'article:update:own',
    review: 'article:submit-review',
    scheduled: 'article:schedule',
    published: 'article:publish',
    archived: 'article:archive',
  }
  return all.filter((status) => hasPermission(role, permissionByStatus[status]))
}

/** Data w formacie czytelnym dla redakcji: `25.05.2026 09:10`. */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'
  // Wartości z D1 mają postać 'YYYY-MM-DD HH:MM:SS' (UTC, bez strefy).
  // `new Date()` na takim ciągu jest w przeglądarkach niejednoznaczny,
  // dlatego rozbijamy go ręcznie — panel ma pokazywać to, co w bazie.
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value)
  if (!m) return value
  return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}`
}

/** Rekord z repozytorium → model widoku listy. */
export const toAdminArticle = (row: ArticleListItem): AdminArticle => ({
  id: String(row.id),
  title: row.title,
  slug: row.slug,
  category: row.category_name ?? row.category_slug ?? '—',
  author: row.author_name ?? 'redakcja',
  updatedAt: formatDateTime(row.updated_at),
  status: row.status as ArticleStatus,
  views: row.view_count ?? 0,
  comments: row.comment_count ?? 0,
  lead: row.lead,
  solectwo: row.solectwo_slug,
  aiAssisted: !!row.ai_assisted,
  heroImage: row.hero_image_r2_key,
  heroAlt: row.hero_alt,
})

/** Numer strony z adresu — bez wartości ujemnych i bez NaN. */
export const pageFromQuery = (c: Context): number => {
  const raw = Number.parseInt(c.req.query('page') ?? '1', 10)
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 10_000) : 1
}

/** Rozmiar pliku w formie czytelnej. */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}
