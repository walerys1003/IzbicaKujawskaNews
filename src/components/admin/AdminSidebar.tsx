import type { FC } from 'hono/jsx'
import { cn, iconGlyph } from './helpers'
import type { AdminNavItem, AdminRole } from './types'

/**
 * Podświetlenie sekcji. `activePath.startsWith(item.href)` dawało błędny
 * wynik dla '/admin', bo KAŻDA ścieżka panelu zaczyna się od '/admin' —
 * Dashboard był podświetlony zawsze, równolegle z właściwą sekcją.
 */
const isActive = (activePath: string, href: string): boolean =>
  href === '/admin' ? activePath === '/admin' : activePath.startsWith(href)

export const AdminSidebar: FC<{
  items: AdminNavItem[]
  activePath?: string
  user?: { email: string; role: AdminRole } | null
}> = ({ items, activePath = '/admin', user }) => (
  <aside class="admin-sidebar">
    <a href="/admin" class="admin-brand">
      <span class="admin-brand-mark">I24</span>
      <span>
        <strong>Izbica24 CMS</strong>
        <small>Newsroom / Admin</small>
      </span>
    </a>
    <nav class="admin-nav" aria-label="Panel administracyjny">
      {items.map(item => (
        <a href={item.href} class={cn('admin-nav-link', isActive(activePath, item.href) && 'is-active')}>
          <span class="admin-nav-icon">{iconGlyph(item.icon)}</span>
          <span>{item.label}</span>
          {item.count !== undefined && <span class="admin-nav-count">{String(item.count)}</span>}
        </a>
      ))}
    </nav>

    {user && (
      <div class="admin-sidebar-foot">
        <p class="admin-sidebar-user">
          <strong>{user.email}</strong>
          <span>{user.role}</span>
        </p>
        {/*
          Wylogowanie jest formularzem POST, nie odnośnikiem. Gdyby było
          odnośnikiem, wystarczyłby obcy `<img src="/admin/logout">`, aby
          wylogować redaktora bez jego wiedzy — a przy okazji przeglądarka
          mogłaby je odwiedzić przy wstępnym pobieraniu odnośników.
        */}
        <form method="post" action="/admin/logout">
          <button type="submit" class="admin-button is-ghost is-small">Wyloguj</button>
        </form>
      </div>
    )}
  </aside>
)
