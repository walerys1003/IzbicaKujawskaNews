import type { FC } from 'hono/jsx'
import { cn, iconGlyph } from './helpers'
import type { AdminNavItem } from './types'

export const AdminSidebar: FC<{ items: AdminNavItem[]; activePath?: string }> = ({ items, activePath = '/admin' }) => (
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
        <a href={item.href} class={cn('admin-nav-link', activePath.startsWith(item.href) && 'is-active')}>
          <span class="admin-nav-icon">{iconGlyph(item.icon)}</span>
          <span>{item.label}</span>
          {item.count !== undefined && <span class="admin-nav-count">{String(item.count)}</span>}
        </a>
      ))}
    </nav>
  </aside>
)
