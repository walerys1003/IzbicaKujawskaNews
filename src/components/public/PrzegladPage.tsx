// SA8: /przeglad — full article browser with pagination, category filters, sort options
import type { ArticleRow } from '../../repository'

interface PrzegladPageProps {
  articles: Pick<ArticleRow, 'slug' | 'title' | 'lead' | 'category' | 'hero_image_r2_key' | 'published_at' | 'author'>[]
  total: number
  page: number
  perPage: number
  activeCategory?: string
  sort?: 'newest' | 'popular' | 'oldest'
  categories: { slug: string; title: string; count: number }[]
}

export const PrzegladPage = ({
  articles, total, page, perPage, activeCategory, sort = 'newest', categories,
}: PrzegladPageProps) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <main id="page-main" class="main-wrap przeglad-page">
      <header style={{ padding: '32px 0 20px', borderBottom: '1px solid #dee2e6', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
          Przegląd artykułów
        </h1>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: '8px 0 0' }}>
          {total} {total === 1 ? 'artykuł' : total >= 2 && total <= 4 ? 'artykuły' : 'artykułów'}
          {activeCategory && <> w kategorii <strong>{activeCategory}</strong></>}
        </p>
      </header>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Sidebar filters */}
        <aside style={{ flex: '0 0 220px', minWidth: '200px' }}>
          <nav aria-label="Filtry kategorii" style={{ position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
              Kategorie
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '4px' }}>
                <a href="/przeglad" style={{
                  display: 'block',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: !activeCategory ? 700 : 400,
                  color: !activeCategory ? '#e94560' : '#495057',
                  background: !activeCategory ? 'rgba(233,69,96,0.08)' : 'transparent',
                  textDecoration: 'none',
                }}>
                  Wszystkie ({total})
                </a>
              </li>
              {categories.map(cat => (
                <li key={cat.slug} style={{ marginBottom: '4px' }}>
                  <a href={`/przeglad?category=${cat.slug}`} style={{
                    display: 'block',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: activeCategory === cat.slug ? 700 : 400,
                    color: activeCategory === cat.slug ? '#e94560' : '#495057',
                    background: activeCategory === cat.slug ? 'rgba(233,69,96,0.08)' : 'transparent',
                    textDecoration: 'none',
                  }}>
                    {cat.title} ({cat.count})
                  </a>
                </li>
              ))}
            </ul>

            {/* Sort */}
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e', margin: '20px 0 12px' }}>
              Sortowanie
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { value: 'newest', label: 'Najnowsze' },
                { value: 'popular', label: 'Najpopularniejsze' },
                { value: 'oldest', label: 'Najstarsze' },
              ].map(opt => {
                const params = new URLSearchParams()
                if (activeCategory) params.set('category', activeCategory)
                if (opt.value !== 'newest') params.set('sort', opt.value)
                const qs = params.toString()
                return (
                  <li key={opt.value} style={{ marginBottom: '4px' }}>
                    <a href={`/przeglad${qs ? '?' + qs : ''}`} style={{
                      display: 'block',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: sort === opt.value ? 700 : 400,
                      color: sort === opt.value ? '#e94560' : '#495057',
                      background: sort === opt.value ? 'rgba(233,69,96,0.08)' : 'transparent',
                      textDecoration: 'none',
                    }}>
                      {opt.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Article grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {articles.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '60px 0', color: '#6c757d' }}>
              Brak artykułów do wyświetlenia.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {articles.map(article => (
                <article
                  key={article.slug}
                  class="przeglad-card"
                  style={{
                    background: '#fff',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {article.hero_image_r2_key && (
                    <a href={`/wiadomosci/${article.slug}`} aria-hidden="true" tabIndex={-1}>
                      <img
                        src={article.hero_image_r2_key}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                    </a>
                  )}
                  <div style={{ padding: '16px 18px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: '#e94560',
                      color: '#fff',
                      marginBottom: '8px',
                    }}>
                      {article.category}
                    </span>
                    <h3 style={{ margin: '6px 0 8px', fontSize: '17px', lineHeight: 1.4 }}>
                      <a href={`/wiadomosci/${article.slug}`} style={{ color: '#1a1a2e', textDecoration: 'none' }}>
                        {article.title}
                      </a>
                    </h3>
                    {article.lead && (
                      <p style={{ fontSize: '13px', color: '#6c757d', lineHeight: 1.5, margin: 0 }}>
                        {article.lead.length > 140 ? article.lead.slice(0, 137) + '…' : article.lead}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#adb5bd' }}>
                      <span>{article.author}</span>
                      {article.published_at && (
                        <time dateTime={typeof article.published_at === 'string' ? article.published_at : ''}>
                          {new Date(article.published_at as string).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </time>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Stronicowanie" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {page > 1 && (
                <a
                  href={buildPageUrl(page - 1, activeCategory, sort)}
                  style={{ padding: '8px 16px', border: '1px solid #dee2e6', borderRadius: '6px', textDecoration: 'none', color: '#1a1a2e', fontSize: '14px', fontWeight: 600 }}
                >
                  ← Poprzednia
                </a>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '8px 12px', color: '#adb5bd' }}>…</span>
                  ) : (
                    <a
                      key={p}
                      href={buildPageUrl(p, activeCategory, sort)}
                      style={{
                        padding: '8px 14px',
                        border: p === page ? '2px solid #e94560' : '1px solid #dee2e6',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: p === page ? '#e94560' : '#1a1a2e',
                        fontWeight: p === page ? 700 : 400,
                        fontSize: '14px',
                        background: p === page ? 'rgba(233,69,96,0.06)' : 'transparent',
                      }}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </a>
                  )
                )}
              {page < totalPages && (
                <a
                  href={buildPageUrl(page + 1, activeCategory, sort)}
                  style={{ padding: '8px 16px', border: '1px solid #dee2e6', borderRadius: '6px', textDecoration: 'none', color: '#1a1a2e', fontSize: '14px', fontWeight: 600 }}
                >
                  Następna →
                </a>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  )
}

function buildPageUrl(p: number, category?: string, sort?: string): string {
  const params = new URLSearchParams()
  if (p > 1) params.set('page', String(p))
  if (category) params.set('category', category)
  if (sort && sort !== 'newest') params.set('sort', sort)
  const qs = params.toString()
  return `/przeglad${qs ? '?' + qs : ''}`
}
