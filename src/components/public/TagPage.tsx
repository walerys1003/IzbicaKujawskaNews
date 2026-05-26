// SA8: Tag page component
import type { ArticleRow } from '../../repository'

interface TagPageProps {
  tag: string
  articles: ArticleRow[]
  total: number
  page?: number
  perPage?: number
}

export const TagPage = ({ tag, articles, total, page = 1, perPage = 12 }: TagPageProps) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  return (
    <main id="page-main" class="main-wrap tag-page">
      <header class="tag-header" style="padding: 32px 0; border-bottom: 3px solid #e94560; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 28px;">
          <span style="color: #e94560;">#</span>{tag}
        </h1>
        <p style="margin: 8px 0 0; color: #666;">
          {total} {total === 1 ? 'artykuł' : total >= 2 && total <= 4 ? 'artykuły' : 'artykułów'} z tagiem "{tag}"
        </p>
      </header>

      <div class="tag-articles-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
        {articles.map(article => (
          <article class="tag-article-card" style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s;">
            {article.hero_image_r2_key && (
              <a href={`/wiadomosci/${article.slug}`}>
                <img src={article.hero_image_r2_key} alt={article.title} loading="lazy" style="width: 100%; height: 200px; object-fit: cover;" />
              </a>
            )}
            <div style="padding: 16px;">
              <span class="tag-category-badge" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: #e94560; color: white; margin-bottom: 8px;">
                {article.category}
              </span>
              <h3 style="margin: 4px 0;">
                <a href={`/wiadomosci/${article.slug}`} style="text-decoration: none; color: #1a1a2e;">{article.title}</a>
              </h3>
              <p style="font-size: 13px; color: #555; line-height: 1.5;">{article.lead}</p>
              <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; color: #888;">
                <span>{article.author}</span>
                <time datetime={article.published_at ?? ''}>{article.published_at ? new Date(article.published_at).toLocaleDateString('pl-PL') : ''}</time>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <nav class="pagination" style="margin-top: 32px; display: flex; justify-content: center; gap: 8px;">
          {page > 1 && <a href={`/tag/${encodeURIComponent(tag)}?page=${page - 1}`} class="pagination-link" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #333;">← Poprzednia</a>}
          <span style="padding: 8px 16px; color: #666;">Strona {page} z {totalPages}</span>
          {page < totalPages && <a href={`/tag/${encodeURIComponent(tag)}?page=${page + 1}`} class="pagination-link" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; color: #333;">Następna →</a>}
        </nav>
      )}
    </main>
  )
}
