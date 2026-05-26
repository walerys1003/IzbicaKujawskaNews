// SA8: /przeglad — full article browser with pagination, filters, and sort
import type { ArticleRow } from '../../repository'
import type { ArticleData } from '../article'

export interface PrzegladPageProps {
  articles: Array<{
    slug: string
    title: string
    category: string
    categoryColor?: string
    lead?: string
    lede?: string
    author: string
    publishedAt?: string
    published_at?: string
    heroImage?: string
    hero_image_r2_key?: string
    readingMinutes?: number
    tags?: string[]
  }>
  total: number
  page: number
  perPage: number
  query?: string
  sort?: 'newest' | 'oldest' | 'popular'
}

export const PrzegladPage = ({ articles, total, page, perPage, query, sort = 'newest' }: PrzegladPageProps) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const baseUrl = query ? `/szukaj?q=${encodeURIComponent(query)}` : '/przeglad'

  return (
    <main id="page-main" class="main-wrap przeglad-page">
      <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 20px;">

        {/* Header */}
        <header class="przeglad-header" style="padding: 32px 0 20px; border-bottom: 3px solid #e94560; margin-bottom: 28px;">
          <h1 style="margin: 0 0 8px; font-size: 32px; font-weight: 800; color: #0a2540;">
            {query ? `Wyniki dla: „${query}”` : 'Przegląd artykułów'}
          </h1>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Znaleziono <strong style="color: #0a2540;">{total}</strong> {total === 1 ? 'artykuł' : total >= 2 && total <= 4 ? 'artykuły' : 'artykułów'}
              {query ? ` dla zapytania „${query}”` : ''}
            </p>
            {/* Sort controls */}
            <div class="przeglad-sort" style="display: flex; gap: 4px;">
              {(['newest', 'oldest', 'popular'] as const).map(s => (
                <a
                  href={`${baseUrl}?sort=${s}${page > 1 ? `&page=${page}` : ''}`}
                  class={`sort-btn ${sort === s ? 'active' : ''}`}
                  style={`
                    padding: 6px 14px; font-size: 12px; border-radius: 6px; text-decoration: none;
                    font-weight: 600; transition: all 0.15s;
                    ${sort === s
                      ? 'background: #0a2540; color: #fff;'
                      : 'background: #f1f3f5; color: #495057;'
                    }
                  `}
                >
                  {s === 'newest' ? 'Najnowsze' : s === 'oldest' ? 'Najstarsze' : 'Popularne'}
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Article grid */}
        <div class="przeglad-grid" style={`
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px; margin-bottom: 40px;
        `}>
          {articles.map(article => {
            const imgSrc = article.heroImage || article.hero_image_r2_key
            const pubDate = article.publishedAt || article.published_at
            const leadText = article.lead || article.lede || ''
            const catColor = article.categoryColor || '#8b1d2a'

            return (
              <article
                key={article.slug}
                class="przeglad-card"
                style={`
                  background: #fff; border-radius: 10px; overflow: hidden;
                  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                  transition: transform 0.2s, box-shadow 0.2s;
                  display: flex; flex-direction: column;
                `}
              >
                {/* Image */}
                {imgSrc ? (
                  <a href={`/wiadomosci/${article.slug}`} style="display: block; overflow: hidden;">
                    <img
                      src={imgSrc}
                      alt=""
                      loading="lazy"
                      width="400" height="225"
                      style="width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.3s;"
                    />
                  </a>
                ) : (
                  <a href={`/wiadomosci/${article.slug}`} style="display: block; height: 200px; background: linear-gradient(135deg, #0a2540, #1a3a6c); display: flex; align-items: center; justify-content: center; text-decoration: none;">
                    <span style="color: #c8a951; font-size: 18px; font-weight: 700;">izbica24.pl</span>
                  </a>
                )}

                {/* Content */}
                <div style="padding: 16px 18px 20px; flex: 1; display: flex; flex-direction: column;">
                  {/* Category badge */}
                  <span style={`
                    display: inline-block; align-self: flex-start;
                    padding: 3px 10px; border-radius: 4px; font-size: 10px;
                    font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
                    background: ${catColor}; color: #fff; margin-bottom: 10px;
                  `}>
                    {article.category}
                  </span>

                  {/* Title */}
                  <h3 style="margin: 0 0 8px; font-size: 17px; line-height: 1.4; color: #0a2540;">
                    <a href={`/wiadomosci/${article.slug}`} style="text-decoration: none; color: inherit;">
                      {article.title.length > 80 ? article.title.slice(0, 77) + '…' : article.title}
                    </a>
                  </h3>

                  {/* Lead */}
                  {leadText && (
                    <p style="margin: 0 0 14px; font-size: 13px; color: #6c757d; line-height: 1.5; flex: 1;">
                      {leadText.length > 120 ? leadText.slice(0, 117) + '…' : leadText}
                    </p>
                  )}

                  {/* Meta footer */}
                  <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #888;">
                    <span>{article.author}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                      {pubDate && (
                        <time datetime={pubDate}>
                          {new Date(pubDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                        </time>
                      )}
                      {article.readingMinutes && <span>{article.readingMinutes} min</span>}
                    </div>
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div style="margin-top: 10px; display: flex; gap: 4px; flex-wrap: wrap;">
                      {article.tags.slice(0, 3).map(tag => (
                        <a
                          href={`/tag/${tag.toLowerCase()}`}
                          style="font-size: 10px; padding: 2px 7px; border-radius: 3px; background: #f1f3f5; color: #6c757d; text-decoration: none;"
                        >
                          #{tag}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}

          {/* Empty state */}
          {articles.length === 0 && (
            <div class="przeglad-empty" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #6c757d;">
              <p style="font-size: 48px; margin: 0 0 12px;">🔍</p>
              <h2 style="margin: 0 0 8px; font-size: 20px; color: #0a2540;">Nic nie znaleziono</h2>
              <p style="margin: 0; font-size: 14px;">
                {query ? `Brak wyników dla "${query}". Spróbuj innych słów kluczowych.` : 'Brak artykułów do wyświetlenia.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav class="pagination" aria-label="Stronicowanie" style={`
            display: flex; justify-content: center; align-items: center; gap: 6px;
            padding: 24px 0 40px;
          `}>
            {page > 1 && (
              <a
                href={`${baseUrl}&page=${page - 1}${sort !== 'newest' ? `&sort=${sort}` : ''}`.replace('&page=1', '')}
                class="pagination-prev"
                aria-label="Poprzednia strona"
                style="padding: 8px 16px; border: 1px solid #dee2e6; border-radius: 6px; text-decoration: none; color: #0a2540; font-weight: 600; font-size: 13px;"
              >
                ← Poprzednia
              </a>
            )}

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7
                ? i + 1
                : page <= 4
                  ? i + 1
                  : page >= totalPages - 3
                    ? totalPages - 6 + i
                    : page - 3 + i

              const url = pageNum === 1
                ? `${baseUrl}${sort !== 'newest' ? `?sort=${sort}` : ''}`
                : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${pageNum}${sort !== 'newest' ? `&sort=${sort}` : ''}`

              return (
                <a
                  key={pageNum}
                  href={url}
                  aria-label={`Strona ${pageNum}`}
                  aria-current={pageNum === page ? 'page' : undefined}
                  style={`
                    padding: 8px 14px; border-radius: 6px; text-decoration: none;
                    font-weight: 600; font-size: 13px; min-width: 40px; text-align: center;
                    ${pageNum === page
                      ? 'background: #0a2540; color: #fff; border: 1px solid #0a2540;'
                      : 'border: 1px solid #dee2e6; color: #0a2540;'
                    }
                  `}
                >
                  {pageNum}
                </a>
              )
            })}

            {page < totalPages && (
              <a
                href={`${baseUrl}&page=${page + 1}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
                class="pagination-next"
                aria-label="Następna strona"
                style="padding: 8px 16px; border: 1px solid #dee2e6; border-radius: 6px; text-decoration: none; color: #0a2540; font-weight: 600; font-size: 13px;"
              >
                Następna →
              </a>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}
