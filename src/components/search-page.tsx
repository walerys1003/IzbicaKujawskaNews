import type { SearchFilters, SearchResultItem } from '../routes/search'

interface SearchPageProps {
  query: string
  results: SearchResultItem[]
  total: number
  filters: SearchFilters
  trending: Array<{ query: string; hits?: number }>
  suggestions: string[]
  spellSuggestion?: string | null
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'Wszystko' },
  { value: 'inwestycje', label: 'Inwestycje' },
  { value: 'samorzad', label: 'Samorząd' },
  { value: 'sport', label: 'Sport' },
  { value: 'kultura', label: 'Kultura' },
  { value: 'historia', label: 'Historia' },
  { value: 'zdrowie', label: 'Zdrowie' },
  { value: 'rolnictwo', label: 'Rolnictwo' },
]

export const SearchPage = ({ query, results, total, filters, trending, suggestions, spellSuggestion }: SearchPageProps) => {
  return (
    <section class="search-page">
      <div class="container">
        <header class="search-header">
          <div>
            <p class="article-badge">Szukaj</p>
            <h1 class="search-title">Wyszukiwarka i centrum tematów</h1>
            <p class="search-meta">
              Autocomplete, filtry po kategorii i zapisane zapytania działają na API `/api/search`.
            </p>
          </div>

          <form class="search-form search-form-advanced" method="GET" action="/szukaj" data-search-form>
            <div class="search-autocomplete-shell">
              <input
                type="search"
                name="q"
                value={query}
                placeholder="Szukaj w izbica24.pl..."
                class="search-input"
                autocomplete="off"
                data-search-autocomplete-input
                autofocus
              />
              <div class="search-autocomplete-dropdown" data-search-autocomplete-dropdown hidden></div>
            </div>

            <div class="search-filters-grid">
              <label>
                <span>Zakres</span>
                <select name="filter" class="search-select">
                  {FILTER_OPTIONS.map((option) => (
                    <option value={option.value} selected={(filters.filter || 'all') === option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Autor</span>
                <input type="text" name="author" value={filters.author || ''} placeholder="np. Anna Kowalska" class="search-input" />
              </label>
              <label>
                <span>Tag</span>
                <input type="text" name="tag" value={filters.tag || ''} placeholder="np. OSP" class="search-input" />
              </label>
              <label>
                <span>Sortowanie</span>
                <select name="sort" class="search-select">
                  <option value="relevance" selected={(filters.sort || 'relevance') === 'relevance'}>Najtrafniejsze</option>
                  <option value="latest" selected={filters.sort === 'latest'}>Najnowsze</option>
                  <option value="oldest" selected={filters.sort === 'oldest'}>Najstarsze</option>
                </select>
              </label>
            </div>

            <div class="search-actions-row">
              <button type="submit" class="search-submit">Szukaj</button>
              <button type="button" class="search-submit search-submit-secondary" data-save-search>Zapisz wyszukiwanie</button>
            </div>
          </form>
        </header>

        <section class="search-suggest">
          <h2>Trendujące zapytania</h2>
          <div class="search-pills">
            {trending.map((item) => (
              <a href={`/szukaj?q=${encodeURIComponent(item.query)}`} class="search-pill">
                {item.query}{typeof item.hits === 'number' ? ` · ${item.hits}` : ''}
              </a>
            ))}
          </div>
        </section>

        {!query && (
          <section class="search-suggest">
            <h2>Popularne podpowiedzi</h2>
            <div class="search-pills">
              {suggestions.map((item) => (
                <a href={`/szukaj?q=${encodeURIComponent(item)}`} class="search-pill">{item}</a>
              ))}
            </div>
          </section>
        )}

        {query && (
          <section class="search-results-panel">
            <div class="search-results-heading">
              <h2>Wyniki dla „{query}”</h2>
              <p>Znaleziono <strong>{total}</strong> wyników.</p>
            </div>

            {spellSuggestion && spellSuggestion.toLowerCase() !== query.toLowerCase() && (
              <p class="search-meta">
                Czy chodziło Ci o <a href={`/szukaj?q=${encodeURIComponent(spellSuggestion)}`}>{spellSuggestion}</a>?
              </p>
            )}

            {results.length === 0 && (
              <div class="search-empty">
                <p>Brak wyników. Zmień filtry lub użyj krótszej frazy.</p>
              </div>
            )}

            {results.length > 0 && (
              <ul class="search-results">
                {results.map((result) => (
                  <li class="search-result">
                    <a href={result.url}>
                      <span class="search-result-cat">{result.category || result.source}</span>
                      <h3>{result.title}</h3>
                      <p dangerouslySetInnerHTML={{ __html: result.snippet }} />
                      <small>
                        {result.author ? `${result.author} · ` : ''}
                        {result.publishedAt || 'Wynik na żywo'}
                      </small>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </section>
  )
}
