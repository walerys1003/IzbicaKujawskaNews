import type { FC } from 'hono/jsx'
import type { ArticleStatus } from './types'

const labels: Record<ArticleStatus, string> = {
  draft: 'Szkic',
  review: 'Do akceptacji',
  scheduled: 'Zaplanowany',
  published: 'Opublikowany',
  archived: 'Archiwum',
}

export const ArticleStatusBadge: FC<{ status: ArticleStatus }> = ({ status }) => (
  <span class={`admin-badge is-${status}`}>{labels[status]}</span>
)
