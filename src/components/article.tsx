// SANDBOX A — task A1-A8: Article detail page (single news view)
// Reuters-tier layout: dateline + hero + body + sticky share + related + comments stub
import { Icon } from './icons'

export interface ArticleData {
  slug: string
  category: string
  categoryColor: string
  title: string
  lede: string
  body: string[]  // paragraphs (HTML allowed)
  author: string
  authorRole?: string
  authorAvatar?: string
  publishedAt: string
  updatedAt?: string
  readingMinutes: number
  heroImage: string
  heroCaption?: string
  tags: string[]
  related?: { slug: string; title: string; category: string; thumb: string }[]
}

export const ArticlePage = (props: { article: ArticleData }) => {
  const a = props.article
  return (
    <article class="article-page reveal">
      <div class="container article-container">

        {/* === DATELINE BAR (eyebrow + breadcrumb + meta) === */}
        <header class="article-head">
          <nav class="article-breadcrumb" aria-label="Ścieżka">
            <a href="/">izbica24.pl</a>
            <span class="sep">›</span>
            <a href={`/${a.category.toLowerCase()}`}>{a.category}</a>
            <span class="sep">›</span>
            <span aria-current="page">{a.title.length > 50 ? a.title.slice(0, 47) + '…' : a.title}</span>
          </nav>

          <div class="article-eyebrow" style={`--cat: ${a.categoryColor}`}>
            <span class="art-cat-tag">{a.category.toUpperCase()}</span>
            <span class="art-reading">
              <Icon.Clock size={12} /> {a.readingMinutes} min czytania
            </span>
          </div>

          <h1 class="article-title">
            <span class="dateline">IZBICA —</span> {a.title}
          </h1>
          <p class="article-lede">{a.lede}</p>

          <div class="article-byline">
            {a.authorAvatar && (
              <img class="byline-avatar" src={a.authorAvatar} alt={a.author} loading="lazy" />
            )}
            <div class="byline-meta">
              <div class="byline-author">
                <strong>{a.author}</strong>
                {a.authorRole && <span class="byline-role"> · {a.authorRole}</span>}
              </div>
              <div class="byline-dates">
                <time dateTime={a.publishedAt}>Opublikowano: {a.publishedAt}</time>
                {a.updatedAt && <span> · Zaktualizowano: {a.updatedAt}</span>}
              </div>
            </div>
            <div class="byline-actions">
              <button class="byline-btn" aria-label="Udostępnij"><Icon.Mail size={14} /> Udostępnij</button>
              <button class="byline-btn" aria-label="Zapisz"><Icon.Star size={14} /> Zapisz</button>
              <button class="byline-btn" aria-label="Drukuj"><Icon.Clipboard size={14} /> Drukuj</button>
            </div>
          </div>
        </header>

        {/* === HERO IMAGE === */}
        <figure class="article-hero">
          <img src={a.heroImage} alt={a.heroCaption || a.title} loading="eager" />
          {a.heroCaption && <figcaption>{a.heroCaption}</figcaption>}
        </figure>

        {/* === BODY + STICKY SHARE === */}
        <div class="article-layout">
          <aside class="article-share" aria-label="Udostępnij artykuł">
            <button class="share-btn" data-platform="fb" aria-label="Udostępnij na Facebooku">f</button>
            <button class="share-btn" data-platform="x" aria-label="Udostępnij na X">𝕏</button>
            <button class="share-btn" data-platform="mail" aria-label="Wyślij e-mailem"><Icon.Mail size={14} /></button>
            <button class="share-btn" data-platform="copy" aria-label="Kopiuj link">🔗</button>
            <div class="share-count" aria-live="polite">128</div>
          </aside>

          <div class="article-body">
            {a.body.map((para, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: para }} />
            ))}

            <div class="article-tags">
              {a.tags.map(t => <a href={`/tag/${t.toLowerCase()}`} class="art-tag">#{t}</a>)}
            </div>

            {/* Author bio card */}
            <aside class="article-author-card">
              {a.authorAvatar && <img src={a.authorAvatar} alt={a.author} />}
              <div>
                <h4>{a.author}</h4>
                <p class="role">{a.authorRole || 'Redaktor izbica24.pl'}</p>
                <p class="bio">Dziennikarz lokalny, autor materiałów o samorządzie i inwestycjach gminnych. Kontakt: redakcja@izbica24.pl</p>
              </div>
            </aside>
          </div>
        </div>

        {/* === RELATED === */}
        {a.related && a.related.length > 0 && (
          <section class="article-related modv2">
            <header class="modv2-head">
              <span class="eyebrow">CZYTAJ TEŻ</span>
              <h2 class="modv2-title">Powiązane artykuły</h2>
            </header>
            <div class="related-grid">
              {a.related.map(r => (
                <a href={`/wiadomosci/${r.slug}`} class="related-card">
                  <img src={r.thumb} alt="" loading="lazy" />
                  <div class="related-body">
                    <span class="eyebrow">{r.category.toUpperCase()}</span>
                    <h3>{r.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* === COMMENTS STUB === */}
        <section class="article-comments modv2">
          <header class="modv2-head">
            <span class="eyebrow">DYSKUSJA</span>
            <h2 class="modv2-title">Komentarze (12)</h2>
            <a href="#" class="modv2-more">Regulamin →</a>
          </header>
          <div class="comments-info">
            <p>Komentarze są moderowane wg <a href="/regulamin">regulaminu</a>. Po zalogowaniu możesz dodać własny.</p>
            <button class="cta-button">Zaloguj się przez e-mail</button>
          </div>
        </section>

      </div>
    </article>
  )
}
