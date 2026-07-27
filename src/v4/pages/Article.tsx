// ============================================================================
// IZBICA24.PL v4 — WIDOK ARTYKUŁU
// Renderuje wszystkie typy bloków treści: akapit, nagłówek, lista, cytat,
// zdjęcie, galeria, wideo, audio, embed, plik, tabela, ramka informacyjna.
// ============================================================================

import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { findCategory, type Category } from '../taxonomy'
import { articleUrl, type Article, type ContentBlock, type Gallery } from '../content-types'
import { Breadcrumbs, SectionHeader } from '../components/Layout'
import { ListCard } from './Category'

// ────────────────────────────────────────────────── IKONY NARZĘDZI
const Ico: FC<{ d: string }> = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d={d} />
  </svg>
)

// ────────────────────────────────────────────────── RENDER BLOKÓW
const Block: FC<{ block: ContentBlock; galleries: Record<string, Gallery> }> = ({
  block: b,
  galleries,
}) => {
  switch (b.type) {
    case 'paragraph':
      return <p>{raw(b.html)}</p>

    case 'heading':
      return b.level === 2 ? <h2>{b.text}</h2> : <h3>{b.text}</h3>

    case 'list':
      return b.ordered ? (
        <ol>
          {b.items.map((i) => (
            <li>{raw(i)}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {b.items.map((i) => (
            <li>{raw(i)}</li>
          ))}
        </ul>
      )

    case 'quote':
      return (
        <blockquote>
          <p>{b.text}</p>
          {b.author ? (
            <cite>
              {b.author}
              {b.role ? ` · ${b.role}` : ''}
            </cite>
          ) : null}
        </blockquote>
      )

    case 'image':
      return (
        <figure>
          <img src={b.src} alt={b.alt} loading="lazy" />
          {b.caption || b.credit ? (
            <figcaption>
              {b.caption}
              {b.credit ? ` · ${b.credit}` : ''}
            </figcaption>
          ) : null}
        </figure>
      )

    case 'gallery': {
      const g = galleries[b.galleryId]
      if (!g) return null
      return (
        <figure>
          <div class="gal-grid">
            {g.photos.map((p) => (
              <figure class="gal-item">
                <img src={p.src} alt={p.alt} loading="lazy" />
                {p.caption ? <figcaption>{p.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
          <figcaption>
            Galeria: {g.title} · {g.photos.length} zdjęć
          </figcaption>
        </figure>
      )
    }

    case 'video':
      return (
        <figure>
          <div class="art-video">
            {b.src.includes('youtube.com') || b.src.includes('youtu.be') ? (
              <iframe
                src={b.src}
                title={b.caption || 'Materiał wideo'}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowfullscreen
              ></iframe>
            ) : (
              <video controls preload="metadata" poster={b.poster}>
                <source src={b.src} />
              </video>
            )}
          </div>
          {b.caption ? (
            <figcaption>
              {b.caption}
              {b.duration ? ` · ${b.duration}` : ''}
            </figcaption>
          ) : null}
        </figure>
      )

    case 'audio':
      return (
        <div class="art-audio">
          <button class="aa-play" aria-label="Odtwórz nagranie">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </button>
          <div class="aa-body">
            <div class="aa-title">{b.title || 'Nagranie audio'}</div>
            <div class="aa-bar">
              <div class="aa-fill"></div>
            </div>
            <div class="aa-times">
              <span>0:00</span>
              <span>{b.duration || '0:00'}</span>
            </div>
          </div>
          <audio preload="metadata">
            <source src={b.src} />
          </audio>
        </div>
      )

    case 'embed': {
      const url = b.url
      let src = url
      if (b.provider === 'youtube') {
        const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()
        src = `https://www.youtube.com/embed/${id}`
      }
      return (
        <div class="art-embed">
          <iframe src={src} title="Materiał osadzony" loading="lazy" allowfullscreen></iframe>
        </div>
      )
    }

    case 'file':
      return (
        <div class="art-file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div class="af-body">
            <div class="af-label">{b.label}</div>
            {b.sizeLabel ? <div class="af-size">{b.sizeLabel}</div> : null}
          </div>
          <a class="af-dl" href={b.url} download>
            Pobierz
          </a>
        </div>
      )

    case 'table':
      return (
        <table>
          <thead>
            <tr>
              {b.head.map((h) => (
                <th>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r) => (
              <tr>
                {r.map((cell) => (
                  <td>{raw(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )

    case 'info':
      return (
        <div class={`art-info ${b.variant}`}>
          {b.title ? <h4>{b.title}</h4> : null}
          <p>{raw(b.html)}</p>
        </div>
      )

    default:
      return null
  }
}

// ────────────────────────────────────────────────────── SIDEBAR
const ArticleSidebar: FC<{
  cat: Category
  mostRead: Article[]
  sameCategory: Article[]
}> = ({ cat, mostRead, sameCategory }) => (
  <aside class="art-side">
    <div class="side-box">
      <div class="side-box-head">
        <svg class="sec-ico" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 1s.5 3-1.5 5.5S8 10 8 13a4 4 0 008 0c0-1.5-.5-2.5-1-3.5 2 1 4 3 4 6a7 7 0 11-14 0C5 9 10 7 13.5 1z"/></svg>
        Najczęściej czytane
      </div>
      <div class="side-box-body">
        {mostRead.map((a, i) => (
          <a class="side-num" href={articleUrl(a)}>
            <span class="n">{i + 1}</span>
            <h4>{a.title}</h4>
          </a>
        ))}
      </div>
    </div>

    <div class="side-box">
      <div class="side-box-head">Więcej z „{cat.title}”</div>
      <div class="side-box-body">
        {sameCategory.map((a) => (
          <a class="side-item" href={articleUrl(a)}>
            {a.heroImage ? <img src={a.heroImage} alt={a.title} loading="lazy" /> : <div />}
            <div>
              <h4>{a.title}</h4>
              <time datetime={a.publishedAtISO}>{a.publishedAt}</time>
            </div>
          </a>
        ))}
      </div>
    </div>

    <div class="side-box">
      <div class="side-box-head">
        <svg class="sec-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Newsletter
      </div>
      <div class="side-box-body">
        <p style="font:400 13.5px/1.6 var(--serif);color:var(--ink-3);margin-bottom:12px">
          „Tydzień w Izbicy” — podsumowanie najważniejszych wydarzeń, co piątek wieczorem.
        </p>
        <form action="/api/v1/newsletter/subscribe" method="post">
          <input
            type="email"
            name="email"
            placeholder="twoj@email.pl"
            required
            style="width:100%;padding:11px 13px;border:1px solid var(--rule);font:500 13.5px var(--body);margin-bottom:9px"
          />
          <button
            type="submit"
            style="width:100%;background:var(--red);color:#fff;padding:11px;font:800 12px var(--display);letter-spacing:.07em;text-transform:uppercase"
          >
            Zapisz się
          </button>
        </form>
      </div>
    </div>
  </aside>
)

// ══════════════════════════════════════════════════ STRONA ARTYKUŁU
export const ArticlePageV4: FC<{
  article: Article
  related: Article[]
  mostRead: Article[]
  sameCategory: Article[]
  galleries: Record<string, Gallery>
}> = ({ article: a, related, mostRead, sameCategory, galleries }) => {
  const cat = findCategory(a.category)!
  const sub = cat.subcategories.find((s) => s.slug === a.subcategory)
  const initials = a.author.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <div class="page">
      <Breadcrumbs
        items={[
          { label: cat.title, href: cat.path },
          ...(sub ? [{ label: sub.title, href: sub.path }] : []),
          { label: a.shortTitle || a.title.slice(0, 60) },
        ]}
      />

      <div class="article-wrap">
        <article class="article-main reveal" style={`--c:${cat.colorVar}`}>
          <header class="art-head">
            <span class={`tag ${cat.tagClass}`}>
              {cat.title}
              {sub ? ` · ${sub.title}` : ''}
            </span>
            <h1>{a.title}</h1>
            <p class="art-lede">{a.lede}</p>
            <div class="meta">
              <strong>{a.author.name}</strong>
              <span class="meta-dot"></span>
              <time datetime={a.publishedAtISO}>{a.publishedAt}</time>
              {a.updatedAt ? <span class="meta-dot"></span> : null}
              {a.updatedAt ? <span>akt. {a.updatedAt}</span> : null}
              <span class="meta-dot"></span>
              <span>{a.readingMinutes} min czytania</span>
              {a.views ? <span class="meta-dot"></span> : null}
              {a.views ? <span>{a.views.toLocaleString('pl-PL')} odsłon</span> : null}
              {a.commentCount ? <span class="meta-dot"></span> : null}
              {a.commentCount ? <span>{a.commentCount} komentarzy</span> : null}
            </div>
            {a.aiAssisted ? (
              <span class="art-ai-badge">
                <Ico d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21 8 13.6 2 9.2h7.6z" />
                Materiał przygotowany z użyciem AI · zweryfikowany przez redakcję
              </span>
            ) : null}
          </header>

          {a.heroImage ? (
            <figure class="art-hero">
              <img src={a.heroImage} alt={a.heroAlt || a.title} />
              {a.heroCaption ? <figcaption>{a.heroCaption}</figcaption> : null}
            </figure>
          ) : null}

          {/* Pasek narzędzi */}
          <div class="art-tools">
            <button class="art-tool" data-share>
              <Ico d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /> Udostępnij
            </button>
            <button class="art-tool" data-print>
              <Ico d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />{' '}
              Drukuj
            </button>
            <button class="art-tool" data-font-size="2" aria-label="Zwiększ tekst">
              A+
            </button>
            <button class="art-tool" data-font-size="-2" aria-label="Zmniejsz tekst">
              A−
            </button>
            <span class="spacer"></span>
            <a class="art-tool" href="#komentarze">
              <Ico d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> Komentarze (
              {a.commentCount})
            </a>
          </div>

          {/* Odtwarzacz dla materiałów audio/wideo */}
          {a.type === 'audio' && a.audio ? (
            <div style="padding:20px 40px 0">
              <div class="art-audio">
                <button class="aa-play" aria-label="Odtwórz odcinek">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </button>
                <div class="aa-body">
                  <div class="aa-title">
                    {a.audio.series} #{a.audio.episode}
                  </div>
                  <div class="aa-bar">
                    <div class="aa-fill"></div>
                  </div>
                  <div class="aa-times">
                    <span>0:00</span>
                    <span>{a.audio.durationLabel}</span>
                  </div>
                </div>
                <audio preload="metadata">
                  <source src={a.audio.src} />
                </audio>
              </div>
            </div>
          ) : null}

          {/* Źródło zewnętrzne dla Przeglądu Mediów */}
          {a.type === 'media-review' && a.externalSource ? (
            <div style="padding:20px 40px 0">
              <div class="art-info">
                <h4>Materiał źródłowy</h4>
                <p>
                  Publikacja ukazała się w serwisie <strong>{a.externalSource.name}</strong>.{' '}
                  <a href={a.externalSource.url} rel="nofollow noopener" target="_blank" style="color:var(--c-przeglad);text-decoration:underline">
                    Przejdź do oryginału →
                  </a>
                </p>
              </div>
            </div>
          ) : null}

          {/* Karta zdarzenia — Na sygnale */}
          {a.type === 'live' && a.incident ? (
            <div style="padding:20px 40px 0">
              <div class="art-info warning">
                <h4>
                  {a.incident.icon} {a.incident.kind}
                </h4>
                <p>
                  <strong>Godzina:</strong> {a.incident.time} ({a.incident.dayLabel}) ·{' '}
                  <strong>Miejsce:</strong> {a.incident.place} · <strong>Źródło:</strong>{' '}
                  {a.incident.source}
                  {a.incident.resolved ? ' · Status: zakończone' : ''}
                </p>
              </div>
            </div>
          ) : null}

          {/* Dane wydarzenia */}
          {a.type === 'event' && a.event ? (
            <div style="padding:20px 40px 0">
              <div class="art-info success">
                <h4>Szczegóły wydarzenia</h4>
                <p>
                  <strong>Termin:</strong>{' '}
                  {new Date(a.event.startsAt).toLocaleString('pl-PL', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}{' '}
                  · <strong>Miejsce:</strong> {a.event.place}
                  {a.event.organizer ? ` · Organizator: ${a.event.organizer}` : ''}
                  {a.event.free ? ' · Wstęp wolny' : ''}
                </p>
              </div>
            </div>
          ) : null}

          {/* Dane ogłoszenia */}
          {a.type === 'announcement' && a.announcement ? (
            <div style="padding:20px 40px 0">
              <div class="art-info">
                <h4>Dane ogłoszenia</h4>
                <p>
                  {a.announcement.price ? (
                    <>
                      <strong>Cena:</strong> {a.announcement.price} ·{' '}
                    </>
                  ) : null}
                  {a.announcement.contact ? (
                    <>
                      <strong>Kontakt:</strong> {a.announcement.contact}
                    </>
                  ) : null}
                  {a.announcement.validUntil ? ` · Ważne do: ${a.announcement.validUntil}` : ''}
                </p>
              </div>
            </div>
          ) : null}

          {/* TREŚĆ */}
          <div class="art-body">
            {a.blocks.map((b) => (
              <Block block={b} galleries={galleries} />
            ))}
          </div>

          {/* TAGI */}
          {a.tags.length ? (
            <div class="art-tags">
              {a.tags.map((t) => (
                <a href={`/tag/${encodeURIComponent(t.toLowerCase())}`}>#{t}</a>
              ))}
              {a.solectwo ? <a href={`/solectwa/${a.solectwo}`}>📍 sołectwo</a> : null}
            </div>
          ) : null}

          {/* AUTOR */}
          <div class="art-author-box">
            <div class="aab-av">{initials}</div>
            <div>
              <h4>{a.author.name}</h4>
              <div class="aab-role">{a.author.role}</div>
              {a.author.bio ? <p>{a.author.bio}</p> : null}
              {a.author.email ? (
                <p style="margin-top:6px">
                  <a href={`mailto:${a.author.email}`} style="color:var(--red)">
                    {a.author.email}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </article>

        <ArticleSidebar cat={cat} mostRead={mostRead} sameCategory={sameCategory} />
      </div>

      {/* POWIĄZANE */}
      {related.length ? (
        <section class="section art-related reveal">
          <SectionHeader title="Czytaj także" colorVar={cat.colorVar} />
          <div class="list-grid">
            {related.map((r) => {
              const rc = findCategory(r.category)!
              return <ListCard article={r} cat={rc} />
            })}
          </div>
        </section>
      ) : null}

      {/* KOMENTARZE */}
      <section class="comments reveal" id="komentarze">
        <h3>Komentarze ({a.commentCount})</h3>
        {a.commentCount > 0 ? (
          <>
            <div class="comment">
              <div class="c-av">JK</div>
              <div>
                <span class="c-name">Jan Kowalski</span>
                <span class="c-time">2 godziny temu</span>
                <p>
                  Świetna informacja. Czekamy na kolejne inwestycje w naszej gminie — szczególnie
                  drogi w sołectwach wymagają uwagi.
                </p>
              </div>
            </div>
            <div class="comment">
              <div class="c-av">AM</div>
              <div>
                <span class="c-name">Anna Malinowska</span>
                <span class="c-time">5 godzin temu</span>
                <p>Dobrze, że portal o tym pisze. Wcześniej takich informacji trzeba było szukać w BIP.</p>
              </div>
            </div>
          </>
        ) : (
          <p style="font:400 14.5px/1.6 var(--serif);color:var(--ink-4)">
            Brak komentarzy. Bądź pierwszą osobą, która skomentuje ten materiał.
          </p>
        )}

        <form class="comment-form" action="/api/v1/comments" method="post">
          <input type="hidden" name="slug" value={a.slug} />
          <textarea name="body" placeholder="Napisz komentarz…" required></textarea>
          <div class="cf-row">
            <input type="text" name="author" placeholder="Imię i nazwisko" required />
            <input type="email" name="email" placeholder="E-mail (nie będzie publikowany)" required />
            <button type="submit">Dodaj komentarz</button>
          </div>
          <p style="font:400 11.5px var(--body);color:var(--ink-6);margin-top:8px">
            Komentarze są moderowane. Publikujemy wypowiedzi merytoryczne, bez obraźliwych treści.
          </p>
        </form>
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════ STRONA GALERII
export const GalleryPageV4: FC<{ gallery: Gallery; related: Article[] }> = ({
  gallery: g,
  related,
}) => (
  <div class="page">
    <Breadcrumbs
      items={[
        { label: 'Multimedia', href: '/multimedia' },
        { label: 'Galerie zdjęć', href: '/multimedia/galerie' },
        { label: g.title },
      ]}
    />
    <header class="cat-hero reveal" style="--c:var(--ink)">
      <span class="tag dark">Galeria zdjęć</span>
      <h1 style="margin-top:12px">{g.title}</h1>
      {g.description ? <p class="cat-lead">{g.description}</p> : null}
      <div class="cat-stats">
        <span>
          <strong>{g.photos.length}</strong> zdjęć
        </span>
        <span>
          Publikacja: <strong>{g.publishedAt}</strong>
        </span>
      </div>
    </header>
    <section class="section reveal">
      <div class="gal-grid">
        {g.photos.map((p) => (
          <figure class="gal-item">
            <img src={p.src} alt={p.alt} loading="lazy" />
            {p.caption ? (
              <figcaption>
                {p.caption}
                {p.credit ? ` · ${p.credit}` : ''}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
    {related.length ? (
      <section class="section reveal">
        <SectionHeader title="Powiązane materiały" colorVar="var(--ink)" />
        <div class="list-grid">
          {related.map((r) => {
            const rc = findCategory(r.category)!
            return <ListCard article={r} cat={rc} />
          })}
        </div>
      </section>
    ) : null}
  </div>
)
