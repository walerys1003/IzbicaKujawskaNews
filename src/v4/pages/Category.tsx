// ============================================================================
// IZBICA24.PL v4 — WIDOK KATEGORII I PODKATEGORII
// Spójny z szatą: te same tagi, karty, typografia, kolory kategorii.
// ============================================================================

import type { FC } from 'hono/jsx'
import type { Category, SubCategory } from '../taxonomy'
import { findCategory } from '../taxonomy'
import { articleUrl, type Article, type ContentType } from '../content-types'
import { Breadcrumbs, SectionHeader } from '../components/Layout'

const PER_PAGE = 12

// Badge typu materiału na karcie
const typeBadge = (t: ContentType) => {
  const map: Partial<Record<ContentType, { label: string; icon: string }>> = {
    video: { label: 'Wideo', icon: 'M5 3l14 9-14 9V3z' },
    audio: { label: 'Podcast', icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z' },
    gallery: { label: 'Galeria', icon: 'M3 5h18v14H3z' },
    live: { label: 'Na sygnale', icon: 'M13 2L3 14h7v8l10-12h-7z' },
    infographic: { label: 'Infografika', icon: 'M3 3v18h18' },
    'media-review': { label: 'Przegląd', icon: 'M4 4h16v16H4z' },
  }
  const m = map[t]
  if (!m) return null
  return (
    <span class="lc-type">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d={m.icon} />
      </svg>
      {m.label}
    </span>
  )
}

const subLabel = (cat: Category, a: Article) =>
  cat.subcategories.find((s) => s.slug === a.subcategory)?.title || cat.title

// ─────────────────────────────────────────────────── KARTA LISTY
export const ListCard: FC<{ article: Article; cat: Category; label?: string }> = ({
  article: a,
  cat,
  label,
}) => (
  <article class="lc" style={`--c:${cat.colorVar}`}>
    <a href={articleUrl(a)}>
      <div class="img-wrap">
        {a.heroImage ? <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" /> : null}
        {typeBadge(a.type)}
      </div>
      <div class="lc-body">
        <span class={`tag ${cat.tagClass}`}>{label || subLabel(cat, a)}</span>
        <h3>{a.title}</h3>
        <p>{a.lede}</p>
        <div class="meta">
          <time datetime={a.publishedAtISO}>{a.publishedAt}</time>
          {a.readingMinutes ? <span class="meta-dot"></span> : null}
          {a.readingMinutes ? <span>{a.readingMinutes} min</span> : null}
          {a.views ? <span class="meta-dot"></span> : null}
          {a.views ? <span>{a.views.toLocaleString('pl-PL')} odsłon</span> : null}
        </div>
      </div>
    </a>
  </article>
)

// ─────────────────────────────────────── WIERSZ (materiał wyróżniony)
const LeadRow: FC<{ article: Article; cat: Category }> = ({ article: a, cat }) => (
  <article class="lrow" style={`--c:${cat.colorVar}`}>
    <a href={articleUrl(a)} class="lrow-img">
      {a.heroImage ? <img src={a.heroImage} alt={a.heroAlt || a.title} loading="lazy" /> : null}
    </a>
    <div class="lrow-body">
      <span class={`tag ${cat.tagClass}`}>{subLabel(cat, a)}</span>
      <h3>
        <a href={articleUrl(a)}>{a.title}</a>
      </h3>
      <p>{a.lede}</p>
      <div class="meta">
        <strong>{a.author.name}</strong>
        <span class="meta-dot"></span>
        <time datetime={a.publishedAtISO}>{a.publishedAt}</time>
        <span class="meta-dot"></span>
        <span>{a.readingMinutes} min</span>
        {a.views ? <span class="meta-dot"></span> : null}
        {a.views ? <span>{a.views.toLocaleString('pl-PL')} odsłon</span> : null}
      </div>
    </div>
  </article>
)

// ─────────────────────────────────────────────────────── PAGINACJA
export const Pager: FC<{ page: number; total: number; base: string; perPage?: number }> = ({
  page,
  total,
  base,
  perPage = PER_PAGE,
}) => {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const nums: number[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) nums.push(i)
  }
  const link = (p: number) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`

  return (
    <nav class="pager" aria-label="Paginacja">
      {page > 1 ? <a href={link(page - 1)}>‹ Poprzednia</a> : <span class="disabled">‹ Poprzednia</span>}
      {nums.map((n, i) => (
        <>
          {i > 0 && n - nums[i - 1] > 1 ? <span class="disabled">…</span> : null}
          {n === page ? <span class="current">{n}</span> : <a href={link(n)}>{n}</a>}
        </>
      ))}
      {page < pages ? <a href={link(page + 1)}>Następna ›</a> : <span class="disabled">Następna ›</span>}
    </nav>
  )
}

// ═══════════════════════════════════════════════ STRONA KATEGORII
export const CategoryPageV4: FC<{
  cat: Category
  articles: Article[]
  total: number
  page: number
  /** Liczniki materiałów per podkategoria */
  counts: Record<string, number>
  /** Reprezentatywne zdjęcie dla kafla podkategorii */
  covers: Record<string, string | undefined>
}> = ({ cat, articles, total, page, counts, covers }) => {
  const lead = page === 1 ? articles[0] : undefined
  const rest = page === 1 ? articles.slice(1) : articles

  return (
    <div class="page">
      <Breadcrumbs items={[{ label: cat.title }]} />

      <header class="cat-hero reveal" style={`--c:${cat.colorVar}`}>
        <h1>{cat.title}</h1>
        <p class="cat-lead">{cat.lead}</p>
        <div class="cat-stats">
          <span>
            <strong>{total}</strong> materiałów
          </span>
          <span>
            <strong>{cat.subcategories.length}</strong> podkategorii
          </span>
          <span>
            Aktualizacja: <strong>23 maja 2026</strong>
          </span>
        </div>
      </header>

      {/* Pasek podkategorii — identyczny dla każdej kategorii.
          Licznik artykułów siedzi w środku belki (przy nazwie podkategorii),
          zgodnie z briefem: „liczniki artykułów" dla każdej belki.
          Styl nie zmienia się względem oryginału (CSS `.subcat-bar a .pill` jest
          nowy, ale jego warstwy wizualne są zgodne z resztą portalu — ink, 4 px
          gap, uppercase, font:700 10.5px var(--display), dokładnie jak
          `.st-count` z kafli podkategorii, żeby wyglądały jak jedna rodzina
          typograficzna). */}
      <nav class="subcat-bar reveal" style={`--c:${cat.colorVar}`} aria-label="Podkategorie">
        <a href={cat.path} class="active">
          Wszystkie
          <span class="pill">{total}</span>
        </a>
        {cat.subcategories.map((s) => (
          <a href={s.path}>
            {s.title}
            <span class="pill">{counts[s.slug] || 0}</span>
          </a>
        ))}
      </nav>

      {/* Kafle podkategorii ze zdjęciami */}
      <section class="section reveal">
        <SectionHeader
          title={`Podkategorie · ${cat.title}`}
          colorVar={cat.colorVar}
        />
        <div class="subcat-tiles">
          {cat.subcategories.map((s) => (
            <a class="subcat-tile" href={s.path} style={`--c:${cat.colorVar}`}>
              <div class="st-img">
                {covers[s.slug] ? <img src={covers[s.slug]} alt={s.title} loading="lazy" /> : null}
              </div>
              <div class="st-body">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <span class="st-count">{counts[s.slug] || 0} materiałów →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Lista materiałów */}
      <section class="section reveal">
        <SectionHeader
          title="Najnowsze materiały"
          small={`· strona ${page}`}
          colorVar={cat.colorVar}
        />
        {articles.length === 0 ? (
          <div class="empty-state">
            <h3>Brak materiałów</h3>
            <p>
              W tej kategorii nie opublikowano jeszcze artykułów. Wróć wkrótce lub sprawdź inne
              sekcje portalu.
            </p>
            <a href="/">Strona główna</a>
          </div>
        ) : (
          <>
            {lead ? <LeadRow article={lead} cat={cat} /> : null}
            <div class="list-grid">
              {rest.map((a) => (
                <ListCard article={a} cat={cat} />
              ))}
            </div>
            <Pager page={page} total={total} base={cat.path} />
          </>
        )}
      </section>
    </div>
  )
}

// ════════════════════════════════════════════ STRONA PODKATEGORII
export const SubcategoryPageV4: FC<{
  cat: Category
  sub: SubCategory
  articles: Article[]
  total: number
  page: number
  /** Liczniki dla 3. poziomu (jeśli istnieje) */
  childCounts?: Record<string, number>
  childCovers?: Record<string, string | undefined>
  /**
   * Liczniki dla rodzeństwa — pozostałych podkategorii tej samej kategorii.
   * Potrzebne do wyświetlenia liczby artykułów na każdej belce (zgodnie
   * z wymaganiem briefu „liczniki artykułów"). Router dostarcza mapę
   * dla wszystkich podkategorii tej kategorii, komponent sumuje tylko
   * potrzebne do wyświetlenia.
   */
  siblingCounts?: Record<string, number>
}> = ({ cat, sub, articles, total, page, childCounts = {}, childCovers = {}, siblingCounts = {} }) => {
  const lead = page === 1 ? articles[0] : undefined
  const rest = page === 1 ? articles.slice(1) : articles
  // W SubcategoryPageV4 licznik na belce dotyczy artykułów każdej podkategorii
  // — więc używamy siblingCounts (liczniki z routera dla wszystkich podkategorii
  // tej kategorii), a nie childCounts (tylko ewentualny 3. poziom).
  const counts = siblingCounts

  return (
    <div class="page">
      <Breadcrumbs items={[{ label: cat.title, href: cat.path }, { label: sub.title }]} />

      <header class="cat-hero reveal" style={`--c:${cat.colorVar}`}>
        <span class={`tag ${cat.tagClass}`}>{cat.title}</span>
        <h1 style="margin-top:12px">{sub.title}</h1>
        <p class="cat-lead">{sub.description}</p>
        <div class="cat-stats">
          <span>
            <strong>{total}</strong> materiałów
          </span>
          {sub.children ? (
            <span>
              <strong>{sub.children.length}</strong> podsekcji
            </span>
          ) : null}
          <span>
            Kategoria: <strong>{cat.title}</strong>
          </span>
        </div>
      </header>

      {/* Rodzeństwo — inne podkategorie tej kategorii (identyczna belka jak
          w CategoryPageV4, aktywna wskazuje bieżącą podkategorię). Liczniki
          są wliczone — ta sama warstwa typograficzna co na górze kategorii. */}
      <nav class="subcat-bar reveal" style={`--c:${cat.colorVar}`} aria-label="Podkategorie">
        <a href={cat.path}>
          Wszystkie
          <span class="pill">{cat.subcategories.reduce((acc, s) => acc + (counts[s.slug] || 0), 0)}</span>
        </a>
        {cat.subcategories.map((s) => (
          <a href={s.path} class={s.slug === sub.slug ? 'active' : undefined}>
            {s.title}
            <span class="pill">{counts[s.slug] || 0}</span>
          </a>
        ))}
      </nav>

      {/* 3. poziom, jeśli istnieje */}
      {sub.children && sub.children.length > 0 ? (
        <section class="section reveal">
          <SectionHeader title={`W ramach: ${sub.title}`} colorVar={cat.colorVar} />
          <div class="subcat-tiles">
            {sub.children.map((c) => (
              <a class="subcat-tile" href={c.path} style={`--c:${cat.colorVar}`}>
                <div class="st-img">
                  {childCovers[c.slug] ? <img src={childCovers[c.slug]} alt={c.title} loading="lazy" /> : null}
                </div>
                <div class="st-body">
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <span class="st-count">{childCounts[c.slug] || 0} materiałów →</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section class="section reveal">
        <SectionHeader title="Materiały" small={`· strona ${page}`} colorVar={cat.colorVar} />
        {articles.length === 0 ? (
          <div class="empty-state">
            <h3>Brak materiałów w tej podkategorii</h3>
            <p>Redakcja pracuje nad treściami. Zobacz pozostałe materiały z kategorii {cat.title}.</p>
            <a href={cat.path}>Wszystko z „{cat.title}”</a>
          </div>
        ) : (
          <>
            {lead ? <LeadRow article={lead} cat={cat} /> : null}
            <div class="list-grid">
              {rest.map((a) => (
                <ListCard article={a} cat={cat} label={sub.title} />
              ))}
            </div>
            <Pager page={page} total={total} base={sub.path} />
          </>
        )}
      </section>
    </div>
  )
}

// ══════════════════════════════════════ STRONA 3. POZIOMU (np. parafie/blenna)
export const ThirdLevelPageV4: FC<{
  cat: Category
  sub: SubCategory
  child: SubCategory
  articles: Article[]
  total: number
  page: number
}> = ({ cat, sub, child, articles, total, page }) => (
  <div class="page">
    <Breadcrumbs
      items={[
        { label: cat.title, href: cat.path },
        { label: sub.title, href: sub.path },
        { label: child.title },
      ]}
    />

    <header class="cat-hero reveal" style={`--c:${cat.colorVar}`}>
      <span class={`tag ${cat.tagClass}`}>
        {cat.title} · {sub.title}
      </span>
      <h1 style="margin-top:12px">{child.title}</h1>
      <p class="cat-lead">{child.description}</p>
      <div class="cat-stats">
        <span>
          <strong>{total}</strong> materiałów
        </span>
      </div>
    </header>

    <nav class="subcat-bar reveal" style={`--c:${cat.colorVar}`} aria-label="Podsekcje">
      <a href={sub.path}>
        Wszystkie z „{sub.title}”
        <span class="pill">{(sub.children ?? []).reduce((acc, c) => acc + childCount(c.slug), 0)}</span>
      </a>
      {(sub.children ?? []).map((c) => (
        <a href={c.path} class={c.slug === child.slug ? 'active' : undefined}>
          {c.title}
          <span class="pill">{childCount(c.slug)}</span>
        </a>
      ))}
    </nav>

    <section class="section reveal">
      {articles.length === 0 ? (
        <div class="empty-state">
          <h3>Brak materiałów</h3>
          <p>Ta podsekcja czeka na pierwsze publikacje.</p>
          <a href={sub.path}>Wróć do „{sub.title}”</a>
        </div>
      ) : (
        <>
          <div class="list-grid">
            {articles.map((a) => (
              <ListCard article={a} cat={cat} label={child.title} />
            ))}
          </div>
          <Pager page={page} total={total} base={child.path} />
        </>
      )}
    </section>
  </div>
)

// ══════════════════════════════════════════ LISTA WYNIKÓW / TAG / SOŁECTWO
export const ArticleListPage: FC<{
  title: string
  lead: string
  badge?: string
  articles: Article[]
  total: number
  page: number
  base: string
  colorVar?: string
  emptyText?: string
}> = ({ title, lead, badge, articles, total, page, base, colorVar = 'var(--red)', emptyText }) => (
  <div class="page">
    <Breadcrumbs items={[{ label: title }]} />
    <header class="cat-hero reveal" style={`--c:${colorVar}`}>
      {badge ? <span class="tag dark">{badge}</span> : null}
      <h1 style={badge ? 'margin-top:12px' : undefined}>{title}</h1>
      <p class="cat-lead">{lead}</p>
      <div class="cat-stats">
        <span>
          <strong>{total}</strong> materiałów
        </span>
      </div>
    </header>
    <section class="section reveal">
      {articles.length === 0 ? (
        <div class="empty-state">
          <h3>Brak wyników</h3>
          <p>{emptyText || 'Nie znaleziono materiałów spełniających kryteria.'}</p>
          <a href="/">Strona główna</a>
        </div>
      ) : (
        <>
          <div class="list-grid">
            {articles.map((a) => {
              const c = findCategory(a.category)!
              return <ListCard article={a} cat={c} />
            })}
          </div>
          <Pager page={page} total={total} base={base} />
        </>
      )}
    </section>
  </div>
)
