import type { FC } from 'hono/jsx'
import { ArticleStatusBadge } from './ArticleStatusBadge'
import type { AdminArticle } from './types'

export const ArticleRow: FC<{ article: AdminArticle }> = ({ article }) => (
  <tr>
    <td>
      <div class="admin-table-title">{article.title}</div>
      <div class="admin-table-meta">/{article.slug}</div>
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
        <button class="admin-button is-small is-ghost" type="button">Podgląd</button>
      </div>
    </td>
  </tr>
)
