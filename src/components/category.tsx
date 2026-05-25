// SANDBOX A — task A9-A14: Category listing page
// Filter bar + grid + pagination
import { Icon } from './icons'
import { ArticleData } from './article'

export interface CategoryData {
  slug: string
  title: string
  description: string
  color: string
  subcategories: { slug: string; title: string }[]
  articles: Pick<ArticleData, 'slug' | 'category' | 'categoryColor' | 'title' | 'lede' | 'author' | 'publishedAt' | 'readingMinutes' | 'heroImage' | 'tags'>[]
  total: number
  page: number
  perPage: number
}

export const CategoryPage = (props: { cat: CategoryData }) => {
  const c = props.cat
  const totalPages = Math.ceil(c.total / c.perPage)

  return (
    <section class="category-page">
      <div class="container">

        {/* === HEADER === */}
        <header class="cat-header" style={`--cat: ${c.color}`}>
          <nav class="article-breadcrumb">
            <a href="/">izbica24.pl</a>
            <span class="sep">›</span>
            <span aria-current="page">{c.title}</span>
          </nav>
          <h1 class="cat-title">{c.title}</h1>
          <p class="cat-description">{c.description}</p>
        </header>

        {/* === SUBCATEGORY FILTER === */}
        <nav class="cat-filterbar" aria-label="Podkategorie">
          <a href={`/${c.slug}`} class="cat-pill active">Wszystkie ({c.total})</a>
          {c.subcategories.map(s => (
            <a href={`/${c.slug}/${s.slug}`} class="cat-pill">{s.title}</a>
          ))}
        </nav>

        {/* === ARTICLE GRID === */}
        <div class="cat-grid">
          {c.articles.map(a => (
            <article class="cat-card">
              <a href={`/wiadomosci/${a.slug}`} class="cat-card-link">
                <div class="cat-card-image">
                  <img src={a.heroImage} alt="" loading="lazy" />
                </div>
                <div class="cat-card-body">
                  <span class="eyebrow" style={`color: ${a.categoryColor}`}>{a.category.toUpperCase()}</span>
                  <h3 class="cat-card-title">{a.title}</h3>
                  <p class="cat-card-lede">{a.lede.slice(0, 140)}…</p>
                  <div class="cat-card-meta">
                    <span>{a.author}</span>
                    <span class="dot"></span>
                    <time>{a.publishedAt}</time>
                    <span class="dot"></span>
                    <span><Icon.Clock size={11} /> {a.readingMinutes} min</span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>

        {/* === PAGINATION === */}
        {totalPages > 1 && (
          <nav class="cat-pagination" aria-label="Paginacja">
            {c.page > 1 && <a href={`?page=${c.page - 1}`} class="page-btn">← Poprzednia</a>}
            <span class="page-info">Strona {c.page} z {totalPages}</span>
            {c.page < totalPages && <a href={`?page=${c.page + 1}`} class="page-btn">Następna →</a>}
          </nav>
        )}

      </div>
    </section>
  )
}
