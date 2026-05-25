import type { FC } from 'hono/jsx'
import { CommentRow } from './CommentRow'
import type { AdminComment } from './types'

export const CommentsList: FC<{ comments: AdminComment[] }> = ({ comments }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Komentarze</h2></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Autor</th><th>Artykuł</th><th>Treść</th><th>Status</th><th>Data</th><th>Akcje</th></tr></thead>
        <tbody>{comments.map(comment => <CommentRow comment={comment} />)}</tbody>
      </table>
    </div>
  </section>
)
