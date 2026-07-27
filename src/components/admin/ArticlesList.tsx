import type { FC } from 'hono/jsx'
import { ArticleRow } from './ArticleRow'
import type { AdminArticle, AdminRole } from './types'

export const ArticlesList: FC<{
  articles: AdminArticle[]
  role?: AdminRole
  title?: string
  showNewButton?: boolean
}> = ({ articles, role = 'author', title = 'Artykuły', showNewButton = true }) => (
  <section class="admin-panel">
    <div class="admin-panel-head">
      <h2>{title}</h2>
      {showNewButton && <a href="/admin/articles/new" class="admin-button">Nowy artykuł</a>}
    </div>
    {articles.length === 0 ? (
      // Pusta tabela z samymi nagłówkami wygląda jak błąd wczytywania.
      // Komunikat mówi wprost, że lista jest pusta, a nie zepsuta.
      <p class="admin-empty">Brak artykułów spełniających kryteria.</p>
    ) : (
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
          <tbody>{articles.map(article => <ArticleRow article={article} role={role} />)}</tbody>
        </table>
      </div>
    )}
  </section>
)
