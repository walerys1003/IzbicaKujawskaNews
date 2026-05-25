// SANDBOX A — task A15-A18: Search results page + 404 page
import { Icon } from './icons'

export const SearchPage = (props: { query: string; results: any[]; total: number }) => {
  return (
    <section class="search-page">
      <div class="container">
        <header class="search-header">
          <h1 class="search-title">
            <Icon.Search size={28} /> Wyszukiwarka
          </h1>
          <form class="search-form" method="GET" action="/szukaj">
            <input
              type="search"
              name="q"
              value={props.query}
              placeholder="Szukaj w izbica24.pl..."
              class="search-input"
              autofocus
            />
            <button type="submit" class="search-submit">Szukaj</button>
          </form>
          {props.query && (
            <p class="search-meta">
              Znaleziono <strong>{props.total}</strong> wyników dla zapytania: <em>„{props.query}"</em>
            </p>
          )}
        </header>

        {!props.query && (
          <div class="search-suggest">
            <h2>Popularne tematy:</h2>
            <div class="search-pills">
              <a href="/szukaj?q=Kujawianka" class="search-pill">Kujawianka</a>
              <a href="/szukaj?q=Sesja+Rady" class="search-pill">Sesja Rady</a>
              <a href="/szukaj?q=MGCK" class="search-pill">MGCK</a>
              <a href="/szukaj?q=Wietrzychowice" class="search-pill">Wietrzychowice</a>
              <a href="/szukaj?q=inwestycje" class="search-pill">Inwestycje</a>
              <a href="/szukaj?q=OSP" class="search-pill">OSP</a>
              <a href="/szukaj?q=dożynki" class="search-pill">Dożynki</a>
            </div>
          </div>
        )}

        {props.query && props.results.length === 0 && (
          <div class="search-empty">
            <p>Brak wyników. Spróbuj innych słów kluczowych lub przeglądnij kategorie.</p>
          </div>
        )}

        {props.results.length > 0 && (
          <ul class="search-results">
            {props.results.map(r => (
              <li class="search-result">
                <a href={r.url}>
                  <span class="search-result-cat">{r.category}</span>
                  <h3>{r.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: r.snippet }} />
                  <small>{r.publishedAt}</small>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export const NotFoundPage = (props: { path: string }) => {
  return (
    <section class="notfound-page">
      <div class="container notfound-container">
        <div class="notfound-code">404</div>
        <h1>Strona nie została znaleziona</h1>
        <p>Niestety nie udało nam się znaleźć: <code>{props.path}</code></p>
        <p>Może chciałeś jedną z poniższych:</p>
        <ul class="notfound-links">
          <li><a href="/">Strona główna</a></li>
          <li><a href="/wiadomosci">Wiadomości</a></li>
          <li><a href="/kujawianka">Kujawianka</a></li>
          <li><a href="/samorzad">Samorząd</a></li>
          <li><a href="/szukaj">Wyszukiwarka</a></li>
        </ul>
      </div>
    </section>
  )
}
