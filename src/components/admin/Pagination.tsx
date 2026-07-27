import type { FC } from 'hono/jsx'

/**
 * Paginacja. Poprzednia wersja miała dwa `<button type="button">` bez
 * obsługi — strzałki wyglądały jak nawigacja, ale nie prowadziły nigdzie.
 * Teraz są odnośnikami z zachowaniem pozostałych parametrów zapytania,
 * żeby przejście na drugą stronę nie gubiło ustawionych filtrów.
 */
export const Pagination: FC<{
  current: number
  total: number
  /** Ścieżka bazowa, np. '/admin/articles'. */
  basePath?: string
  /** Parametry zapytania do zachowania (bez `page`). */
  query?: Record<string, string | undefined>
}> = ({ current, total, basePath, query = {} }) => {
  const href = (page: number): string => {
    if (!basePath) return '#'
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, value)
    }
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
  }

  const hasPrev = current > 1
  const hasNext = current < total

  return (
    <nav class="admin-pagination" aria-label="Paginacja">
      {hasPrev ? (
        <a href={href(current - 1)} class="admin-button is-ghost">← Poprzednia</a>
      ) : (
        <span class="admin-button is-ghost is-disabled" aria-disabled="true">← Poprzednia</span>
      )}
      <span>Strona {current} z {Math.max(total, 1)}</span>
      {hasNext ? (
        <a href={href(current + 1)} class="admin-button is-ghost">Następna →</a>
      ) : (
        <span class="admin-button is-ghost is-disabled" aria-disabled="true">Następna →</span>
      )}
    </nav>
  )
}
