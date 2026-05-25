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
}>

const navItems: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/articles', label: 'Artykuły', icon: 'article', count: 128 },
  { href: '/admin/comments', label: 'Komentarze', icon: 'comment', count: 14 },
  { href: '/admin/users', label: 'Użytkownicy', icon: 'user' },
  { href: '/admin/media', label: 'Media', icon: 'media' },
  { href: '/admin/ogloszenia', label: 'Ogłoszenia', icon: 'ad' },
  { href: '/admin/settings', label: 'Ustawienia', icon: 'settings' },
]

export const AdminLayout: FC<AdminLayoutProps> = ({
  title,
  subtitle,
  activePath = '/admin',
  role = 'admin',
  showEditorAssets = false,
  pageActions,
  toast,
  children,
}) => (
  <html lang="pl">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title} · Admin · Izbica24</title>
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
        <AdminSidebar items={navItems} activePath={activePath} />
        <div class="admin-main">
          <AdminTopbar title={title} subtitle={subtitle} role={role} actions={pageActions} />
          <main class="admin-content">{children}</main>
        </div>
      </div>
      {toast && <div class={`admin-toast is-${toast.tone || 'success'}`}>{toast.message}</div>}
    </body>
  </html>
)
