/**
 * Etap D5 — strona wyników wyszukiwania z indeksu FTS5.
 *
 * Osobny komponent, nie rozszerzenie `SearchPageV4`: wyniki z indeksu mają
 * fragment tekstu z zaznaczonym trafieniem (`<mark>`) i wynik trafności,
 * czego karta `ListCard` nie przewiduje. Wciśnięcie tego w istniejący
 * komponent wymagałoby pól opcjonalnych, które przy wywołaniu z innych
 * miejsc byłyby zawsze puste.
 */

import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import { Breadcrumbs } from '../components/Layout'
import { CATEGORIES, findCategory } from '../taxonomy'
import type { WynikSzukania } from '../../lib/search/search-service'

/** Odmiana liczebnika — „1 materiał”, „3 materiały”, „12 materiałów”. */
const odmienMaterial = (n: number): string => {
  if (n === 1) return 'materiał'
  const reszta100 = n % 100
  const reszta10 = n % 10
  // 12–14 to „materiałów”, nie „materiały” — inaczej wychodzi „13 materiały”.
  if (reszta100 >= 12 && reszta100 <= 14) return 'materiałów'
  if (reszta10 >= 2 && reszta10 <= 4) return 'materiały'
  return 'materiałów'
}

/**
 * Fragment z bazy zawiera znaczniki `<mark>` wstawione przez funkcję
 * `snippet()` SQLite. Wstawiamy go przez `raw()`, więc MUSI być
 * wyczyszczony — inaczej treść artykułu wpisana przez redaktora mogłaby
 * wykonać skrypt na stronie wyników.
 *
 * Czyszczenie polega na usunięciu wszystkiego, co wygląda jak znacznik,
 * A DOPIERO POTEM przywróceniu samego `<mark>`. Odwrotna kolejność
 * (usunięcie znaczników z wyjątkiem `mark`) wymagałaby wyrażenia
 * rozpoznającego nazwę znacznika, a takie wyrażenia dają się obejść
 * zapisem wielkimi literami z atrybutem zdarzenia albo wstawką komentarza
 * między nazwę znacznika a atrybut.
 */
const bezpiecznyFragment = (fragment: string): string => {
  const ZNACZNIK = '\u0001'
  return fragment
    .replace(/<mark>/g, `${ZNACZNIK}o${ZNACZNIK}`)
    .replace(/<\/mark>/g, `${ZNACZNIK}z${ZNACZNIK}`)
    // wszystko pozostałe traktujemy jako tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(new RegExp(`${ZNACZNIK}o${ZNACZNIK}`, 'g'), '<mark>')
    .replace(new RegExp(`${ZNACZNIK}z${ZNACZNIK}`, 'g'), '</mark>')
}

/** Adres artykułu — te same trzy poziomy taksonomii, co w reszcie szaty. */
const adresArtykulu = (w: WynikSzukania): string => {
  const cz = [w.categorySlug, w.subcategorySlug, w.slug].filter(Boolean)
  return `/${cz.join('/')}`
}

const dataPl = (iso: string | null): string => {
  if (!iso) return ''
  // Bez `new Date()` — Worker działa w UTC i przesunąłby godzinę publikacji.
  // Wystarczy przestawić części zapisu ISO.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  const MIESIACE = [
    'stycznia',
    'lutego',
    'marca',
    'kwietnia',
    'maja',
    'czerwca',
    'lipca',
    'sierpnia',
    'września',
    'października',
    'listopada',
    'grudnia',
  ]
  const nrMiesiaca = Number.parseInt(m[2], 10)
  return `${Number.parseInt(m[3], 10)} ${MIESIACE[nrMiesiaca - 1] ?? ''} ${m[1]}`
}

const Pasek: FC<{ query: string }> = ({ query }) => (
  <form
    action="/szukaj"
    method="get"
    role="search"
    style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"
  >
    <label class="sr-only" for="szukaj-pole">
      Szukana fraza
    </label>
    <input
      type="search"
      id="szukaj-pole"
      name="q"
      value={query}
      autocomplete="off"
      placeholder="Szukaj — sołectwo, Kujawianka, OSP, Wietrzychowice..."
      style="flex:1;min-width:260px;padding:13px 16px;border:1px solid var(--rule);font:500 14.5px var(--body)"
    />
    <button type="submit" class="btn-primary">
      Szukaj
    </button>
  </form>
)

export const SearchResultsV4: FC<{
  query: string
  wyniki: WynikSzukania[]
  total: number
  page: number
  stron: number
  terminy: string[]
}> = ({ query, wyniki, total, page, stron, terminy }) => (
  <div class="page">
    <Breadcrumbs items={[{ label: 'Wyszukiwanie' }]} />

    <header class="cat-hero reveal" style="--c:var(--red)">
      <h1>Wyniki dla: „{query}”</h1>
      <p class="cat-lead">
        {total > 0
          ? `Znaleziono ${total} ${odmienMaterial(total)}.`
          : 'Nie znaleziono materiałów dla tej frazy.'}
      </p>
      <Pasek query={query} />
    </header>

    {wyniki.length === 0 ? (
      <section class="section reveal">
        <div class="empty-state">
          <h3>Brak wyników</h3>
          <p>
            Nie znaleziono materiałów dla frazy „{query}”. Wyszukiwarka pomija polskie znaki
            diakrytyczne i końcówki odmiany, więc „sadlno” znajdzie też „Sadłno”, a „izbica” —
            „w Izbicy”. Jeśli mimo to nic nie ma, tego tematu prawdopodobnie jeszcze nie
            opisaliśmy.
          </p>
          <p style="margin-top:12px">
            Spróbuj krótszej frazy albo przejrzyj kategorie:
          </p>
          <div class="subcat-tiles" style="margin-top:14px">
            {CATEGORIES.slice(0, 6).map((c) => (
              <a class="subcat-tile" href={c.path} style={`--c:${c.colorVar}`}>
                <div class="st-body" style="padding:14px">
                  <h3>{c.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    ) : (
      <section class="section reveal">
        <ol class="szukaj-lista" style="list-style:none;padding:0;margin:0">
          {wyniki.map((w) => {
            const kat = w.categorySlug ? findCategory(w.categorySlug) : undefined
            return (
              <li
                class="szukaj-wynik"
                style="padding:18px 0;border-bottom:1px solid var(--rule);display:flex;gap:16px"
              >
                {w.heroImage ? (
                  <a href={adresArtykulu(w)} style="flex:0 0 132px" tabindex={-1} aria-hidden="true">
                    <img
                      src={w.heroImage}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={132}
                      height={88}
                      style="width:132px;height:88px;object-fit:cover;display:block"
                    />
                  </a>
                ) : null}
                <div style="flex:1;min-width:0">
                  {kat ? (
                    <a
                      href={kat.path}
                      class="szukaj-kat"
                      style={`color:${kat.colorVar};font:700 11px/1 var(--display);letter-spacing:.06em;text-transform:uppercase;text-decoration:none`}
                    >
                      {kat.title}
                    </a>
                  ) : null}
                  <h2 style="margin:6px 0 4px;font:700 19px/1.25 var(--display)">
                    <a href={adresArtykulu(w)} style="color:var(--ink);text-decoration:none">
                      {w.title}
                    </a>
                  </h2>
                  {w.fragment ? (
                    <p class="szukaj-fragment" style="margin:0;font:400 14px/1.55 var(--body);color:#444">
                      {raw(bezpiecznyFragment(w.fragment))}
                    </p>
                  ) : (
                    <p style="margin:0;font:400 14px/1.55 var(--body);color:#444">{w.lead}</p>
                  )}
                  <p
                    class="szukaj-meta"
                    style="margin:8px 0 0;font:500 12px var(--body);color:#777;display:flex;gap:12px;flex-wrap:wrap"
                  >
                    {w.publishedAt ? <span>{dataPl(w.publishedAt)}</span> : null}
                    <span>{w.readingMinutes} min czytania</span>
                    {w.commentCount > 0 ? <span>{w.commentCount} komentarzy</span> : null}
                    {w.solectwoSlug ? (
                      <a href={`/solectwa/${w.solectwoSlug}`} style="color:var(--red)">
                        sołectwo
                      </a>
                    ) : null}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        {stron > 1 ? (
          <nav class="pager" aria-label="Strony wyników" style="margin-top:22px;display:flex;gap:8px">
            {page > 1 ? (
              <a
                class="pager-prev"
                rel="prev"
                href={`/szukaj?q=${encodeURIComponent(query)}&page=${page - 1}`}
              >
                ← Poprzednia
              </a>
            ) : null}
            <span style="font:500 13px var(--body);color:#666">
              Strona {page} z {stron}
            </span>
            {page < stron ? (
              <a
                class="pager-next"
                rel="next"
                href={`/szukaj?q=${encodeURIComponent(query)}&page=${page + 1}`}
              >
                Następna →
              </a>
            ) : null}
          </nav>
        ) : null}
      </section>
    )}
  </div>
)
