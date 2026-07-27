import type { FC } from 'hono/jsx'
import { ArticleStatusBadge } from './ArticleStatusBadge'
import type { AdminArticle, AdminRole } from './types'

/**
 * Wiersz listy artykułów.
 *
 * Przycisk „Podgląd” był wcześniej `<button type="button">` bez żadnej
 * obsługi — klikalny element, który nic nie robił. Teraz jest odnośnikiem
 * do artykułu na portalu.
 *
 * Przejścia statusu to formularze POST, nie odnośniki: publikacja zmienia
 * stan systemu, a żądanie GET może zostać powtórzone przez przeglądarkę
 * albo mechanizm wstępnego pobierania.
 */
export const ArticleRow: FC<{ article: AdminArticle; role?: AdminRole }> = ({ article, role = 'author' }) => {
  const canPublish = role === 'admin' || role === 'editor'
  const canSubmit = article.status === 'draft'

  return (
    <tr>
      <td>
        <div class="admin-table-title">{article.title}</div>
        <div class="admin-table-meta">/{article.slug}{article.aiAssisted ? ' · AI' : ''}</div>
      </td>
      <td>{article.category}</td>
      <td>{article.author}</td>
      <td><ArticleStatusBadge status={article.status} /></td>
      <td>{article.views}</td>
      <td>{article.comments}</td>
      <td>{article.updatedAt}</td>
      <td>
        <div class="admin-row-actions">
          <a href={`/admin/articles/${article.id}/edit`} class="admin-button is-small">Edytuj</a>
          <a href={`/${article.slug}`} class="admin-button is-small is-ghost" target="_blank" rel="noreferrer">Podgląd</a>

          {canSubmit && (
            <form method="post" action={`/admin/articles/${article.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="review" />
              <button type="submit" class="admin-button is-small is-ghost">Do recenzji</button>
            </form>
          )}

          {canPublish && article.status === 'review' && (
            <form method="post" action={`/admin/articles/${article.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="published" />
              <button type="submit" class="admin-button is-small">Publikuj</button>
            </form>
          )}

          {canPublish && article.status === 'published' && (
            <form method="post" action={`/admin/articles/${article.id}/status`} class="admin-inline-form">
              <input type="hidden" name="status" value="draft" />
              <button type="submit" class="admin-button is-small is-ghost">Wycofaj</button>
            </form>
          )}
        </div>
      </td>
    </tr>
  )
}
