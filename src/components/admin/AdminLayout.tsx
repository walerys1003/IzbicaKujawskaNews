import type { FC, PropsWithChildren } from 'hono/jsx'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import type { AdminNavItem, AdminRole } from './types'

export type AdminLayoutProps = PropsWithChildren<{
  title: string
  subtitle?: string
  activePath?: string
  role?: AdminRole
  showEditorAssets?: boolean
  pageActions?: any
  toast?: { tone?: string; message: string } | null
  /**
   * Liczniki nawigacji z bazy. Wcześniej były wpisane na stałe
   * (`Artykuły 128`, `Komentarze 14`) — po podłączeniu D1 panel z 30
   * artykułami nadal pokazywał 128, więc licznik informował o stanie
   * makiety, nie o stanie redakcji.
   */
  counts?: { articles?: number; comments?: number; media?: number; users?: number }
  /** Zalogowany użytkownik — do pokazania w pasku i do wylogowania. */
  user?: { email: string; role: AdminRole } | null
}>

/**
 * Widoczność sekcji zależy od roli. Autor nie ma po co wchodzić do
 * użytkowników ani ustawień: kliknięcie kończyłoby się odmową 403, czyli
 * odnośnikiem, który nigdy nie działa. Lepiej go nie pokazywać.
 */
const buildNav = (role: AdminRole, counts: AdminLayoutProps['counts']): AdminNavItem[] => {
  const items: AdminNavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/articles', label: 'Artykuły', icon: 'article', count: counts?.articles },
  ]

  if (role === 'admin' || role === 'editor' || role === 'moderator') {
    items.push({ href: '/admin/comments', label: 'Komentarze', icon: 'comment', count: counts?.comments })
  }
  if (role === 'admin' || role === 'editor') {
    items.push({ href: '/admin/media', label: 'Media', icon: 'media', count: counts?.media })
  }
  if (role === 'admin') {
    items.push({ href: '/admin/users', label: 'Użytkownicy', icon: 'user', count: counts?.users })
  }
  items.push({ href: '/admin/ogloszenia', label: 'Ogłoszenia', icon: 'ad' })
  if (role === 'admin' || role === 'editor') {
    items.push({ href: '/admin/ai/usage', label: 'Koszty AI', icon: 'settings' })
  }
  if (role === 'admin') {
    items.push({ href: '/admin/settings', label: 'Ustawienia', icon: 'settings' })
  }
  return items
}

export const AdminLayout: FC<AdminLayoutProps> = ({
  title,
  subtitle,
  activePath = '/admin',
  role = 'admin',
  showEditorAssets = false,
  pageActions,
  toast,
  counts,
  user,
  children,
}) => (
  <html lang="pl">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title} · Admin · Izbica24</title>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href="/static/design-tokens.css" />
      <link rel="stylesheet" href="/static/admin.css" />
      {showEditorAssets && <link rel="stylesheet" href="/static/editor.css" />}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/core@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-link@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-image@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-table@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-table-row@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-table-cell@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-table-header@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="https://cdn.jsdelivr.net/npm/@tiptap/extension-youtube@2.11.5/dist/index.umd.min.js"></script>}
      {showEditorAssets && <script src="/static/editor.js" defer></script>}
    </head>
    <body class="admin-shell">
      <div class="admin-app">
        <AdminSidebar items={buildNav(role, counts)} activePath={activePath} user={user} />
        <div class="admin-main">
          <AdminTopbar title={title} subtitle={subtitle} role={role} actions={pageActions} />
          <main class="admin-content">{children}</main>
        </div>
      </div>
      {toast && <div class={`admin-toast is-${toast.tone || 'success'}`}>{toast.message}</div>}
    </body>
  </html>
)
