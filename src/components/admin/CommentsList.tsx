import type { FC } from 'hono/jsx'
import { CommentRow } from './CommentRow'
import type { AdminComment } from './types'

export const CommentsList: FC<{ comments: AdminComment[]; title?: string; readOnly?: boolean }> = ({
  comments,
  title = 'Komentarze',
  readOnly = false,
}) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>{title}</h2></div>
    {comments.length === 0 ? (
      <p class="admin-empty">Kolejka moderacji jest pusta.</p>
    ) : (
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Autor</th><th>Artykuł</th><th>Treść</th><th>Status</th><th>Data</th><th>Akcje</th></tr></thead>
          <tbody>{comments.map(comment => <CommentRow comment={comment} readOnly={readOnly} />)}</tbody>
        </table>
      </div>
    )}
  </section>
)
