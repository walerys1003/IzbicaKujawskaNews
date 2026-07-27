import type { FC } from 'hono/jsx'
import type { AdminComment } from './types'

const STATUS_CLASS: Record<string, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  spam: 'flagged',
}

/**
 * Wiersz kolejki moderacji. Przyciski były `type="button"` bez obsługi —
 * moderator klikał „Akceptuj” i nic się nie działo, przy czym komentarz
 * nadal wisiał w kolejce, więc wyglądało to na opóźnienie, a nie na brak
 * funkcji. Teraz każda decyzja to POST z jawnym statusem docelowym.
 */
export const CommentRow: FC<{ comment: AdminComment; readOnly?: boolean }> = ({ comment, readOnly = false }) => (
  <tr>
    <td>
      {comment.author}
      {(comment.reportCount ?? 0) > 0 && <div class="admin-table-meta">zgłoszenia: {comment.reportCount}</div>}
    </td>
    <td>
      {comment.articleSlug ? (
        <a href={`/${comment.articleSlug}`} target="_blank" rel="noreferrer">{comment.articleTitle}</a>
      ) : (
        comment.articleTitle
      )}
    </td>
    <td>
      <div class="admin-table-meta">{comment.content}</div>
      {(comment.spamScore ?? 0) > 0 && (
        <div class="admin-table-meta">ocena spamu: {comment.spamScore}{(comment.profanityHits ?? 0) > 0 ? ` · wulgaryzmy: ${comment.profanityHits}` : ''}</div>
      )}
    </td>
    <td><span class={`admin-badge is-${STATUS_CLASS[comment.status] ?? 'pending'}`}>{comment.status}</span></td>
    <td>{comment.createdAt}</td>
    <td>
      {readOnly ? (
        <span class="admin-table-meta">brak uprawnień</span>
      ) : (
        <div class="admin-row-actions">
          {comment.status !== 'approved' && (
            <form method="post" action={`/admin/comments/${comment.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="approved" />
              <button type="submit" class="admin-button is-small">Akceptuj</button>
            </form>
          )}
          {comment.status !== 'rejected' && (
            <form method="post" action={`/admin/comments/${comment.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="rejected" />
              <button type="submit" class="admin-button is-small is-ghost">Odrzuć</button>
            </form>
          )}
          {comment.status !== 'spam' && (
            <form method="post" action={`/admin/comments/${comment.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="spam" />
              <button type="submit" class="admin-button is-small is-ghost">Spam</button>
            </form>
          )}
        </div>
      )}
    </td>
  </tr>
)
