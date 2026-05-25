import type { FC } from 'hono/jsx'

export const Toast: FC<{ message: string; tone?: 'success' | 'warning' | 'danger' }> = ({ message, tone = 'success' }) => (
  <div class={`admin-toast is-${tone}`}>{message}</div>
)
