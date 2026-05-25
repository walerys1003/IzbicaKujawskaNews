import type { FC } from 'hono/jsx'
import type { AdminRole } from './types'

export const AdminTopbar: FC<{ title: string; subtitle?: string; role?: AdminRole; actions?: any }> = ({ title, subtitle, role = 'admin', actions }) => (
  <header class="admin-topbar">
    <div>
      <div class="admin-kicker">Panel redakcyjny · {role}</div>
      <h1 class="admin-title">{title}</h1>
      {subtitle && <p class="admin-subtitle">{subtitle}</p>}
    </div>
    <div class="admin-topbar-actions">
      {actions}
      <a href="/" class="admin-button is-ghost">Podgląd portalu</a>
      <button type="button" class="admin-button">Nowy wpis</button>
    </div>
  </header>
)
