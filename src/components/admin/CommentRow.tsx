import type { FC } from 'hono/jsx'
import type { AdminComment } from './types'

export const CommentRow: FC<{ comment: AdminComment }> = ({ comment }) => (
  <tr>
    <td>{comment.author}</td>
    <td>{comment.articleTitle}</td>
    <td><div class="admin-table-meta">{comment.content}</div></td>
    <td><span class={`admin-badge is-${comment.status}`}>{comment.status}</span></td>
    <td>{comment.createdAt}</td>
    <td>
      <div class="admin-row-actions">
        <button type="button" class="admin-button is-small">Akceptuj</button>
        <button type="button" class="admin-button is-small is-ghost">Odrzuć</button>
      </div>
    </td>
  </tr>
)
