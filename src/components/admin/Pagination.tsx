import type { FC } from 'hono/jsx'

export const Pagination: FC<{ current: number; total: number }> = ({ current, total }) => (
  <nav class="admin-pagination" aria-label="Paginacja">
    <button class="admin-button is-ghost" type="button">← Poprzednia</button>
    <span>Strona {current} z {total}</span>
    <button class="admin-button is-ghost" type="button">Następna →</button>
  </nav>
)
