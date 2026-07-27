// SA6.5: RelatedArticles — D1-backed similar articles by category & tags
import type { ArticleRow } from '../../repository'

export interface RelatedArticlesProps {
  articles: Array<{
    slug: string
    title: string
    category: string
    hero_image_r2_key?: string
    heroImage?: string
    published_at?: string
    publishedAt?: string
    readingMinutes?: number
  }>
  title?: string
  maxItems?: number
}

export const RelatedArticles = ({ articles, title = 'Powiązane artykuły', maxItems = 4 }: RelatedArticlesProps) => {
  const display = articles.slice(0, maxItems)
  if (display.length === 0) return null

  return (
    <section class="article-related modv2" aria-labelledby="related-heading">
      <header class="modv2-head">
        <span class="eyebrow" style="color: #c8a951; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">CZYTAJ TEŻ</span>
        <h2 id="related-heading" class="modv2-title" style="font-size: 22px; color: #0a2540; margin: 4px 0 0;">{title}</h2>
      </header>
      <div class="related-grid" style={`
        display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px; margin-top: 20px;
      `}>
        {display.map((article, i) => {
          const imgSrc = article.heroImage || article.hero_image_r2_key
          const pubDate = article.publishedAt || article.published_at
          return (
            <a
              href={`/wiadomosci/${article.slug}`}
              class="related-card"
              key={article.slug}
              style={`
                display: block; text-decoration: none; border-radius: 8px;
                overflow: hidden; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                transition: transform 0.2s, box-shadow 0.2s;
              `}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  loading="lazy"
                  width="400" height="225"
                  style="width: 100%; height: 160px; object-fit: cover; display: block;"
                />
              ) : (
                <div class="related-card-placeholder" aria-hidden="true" style={`
                  width: 100%; height: 160px; background: linear-gradient(135deg, #0a2540, #1a3a6c);
                  display: flex; align-items: center; justify-content: center;
                  color: #c8a951; font-size: 14px; font-weight: 600;
                `}>
                  izbica24.pl
                </div>
              )}
              <div class="related-body" style="padding: 14px 16px 18px;">
                <span class="eyebrow" style={`
                  display: inline-block; font-size: 10px; font-weight: 700;
                  text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px;
                  border-radius: 3px; background: #8b1d2a; color: #fff; margin-bottom: 8px;
                `}>
                  {article.category}
                </span>
                <h3 style="margin: 0; font-size: 15px; line-height: 1.4; color: #0a2540;">
                  {article.title.length > 70 ? article.title.slice(0, 67) + '…' : article.title}
                </h3>
                <div style="margin-top: 10px; font-size: 11px; color: #888; display: flex; justify-content: space-between; align-items: center;">
                  {pubDate ? (
                    <time datetime={pubDate}>
                      {new Date(pubDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                  ) : <span />}
                  {article.readingMinutes && (
                    <span>{article.readingMinutes} min</span>
                  )}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

// D1-backed helper: find related articles by shared tags
export function findRelatedArticles(
  currentSlug: string,
  currentTags: string[],
  currentCategory: string,
  allArticles: ArticleRow[],
  maxItems: number = 4
): ArticleRow[] {
  const candidates = allArticles.filter(a => a.slug !== currentSlug && a.status === 'published')

  // Score: +3 per matching tag, +2 for same category, prefer newer
  const scored = candidates.map(a => {
    const articleTags = (typeof a.tag_names === 'string' ? a.tag_names.split(',') : []) as string[]
    let score = 0
    for (const tag of currentTags) {
      if (articleTags.some((t: string) => t.trim().toLowerCase() === tag.toLowerCase())) score += 3
    }
    if (a.category_slug === currentCategory.toLowerCase()) score += 2
    if (a.published_at) score += 0.01 * (new Date(a.published_at).getTime() / 86400000)
    return { article: a, score }
  })

  return scored
    .filter(s => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(s => s.article)
}
