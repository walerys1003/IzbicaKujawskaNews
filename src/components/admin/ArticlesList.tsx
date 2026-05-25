import type { FC } from 'hono/jsx'
import { ArticleRow } from './ArticleRow'
import type { AdminArticle } from './types'

export const ArticlesList: FC<{ articles: AdminArticle[] }> = ({ articles }) => (
  <section class="admin-panel">
    <div class="admin-panel-head">
      <h2>Artykuły</h2>
      <a href="/admin/articles/new" class="admin-button">Nowy artykuł</a>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tytuł</th>
            <th>Kategoria</th>
            <th>Autor</th>
            <th>Status</th>
            <th>Odsłony</th>
            <th>Komentarze</th>
            <th>Aktualizacja</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>{articles.map(article => <ArticleRow article={article} />)}</tbody>
      </table>
    </div>
  </section>
)
