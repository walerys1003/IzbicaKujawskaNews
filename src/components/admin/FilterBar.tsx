import type { FC } from 'hono/jsx'

export type FilterOption = { label: string; value: string }

/**
 * Pasek filtrów. Wcześniej pola nie miały wartości początkowych, więc po
 * przefiltrowaniu listy formularz wracał do stanu pustego — użytkownik
 * widział wyniki filtra, którego nie było widać w polach, i nie wiedział,
 * dlaczego lista jest krótsza.
 */
export const FilterBar: FC<{
  searchPlaceholder?: string
  filters?: Array<{ name: string; options: FilterOption[] }>
  /** Aktualne wartości z adresu — do zaznaczenia w polach. */
  values?: Record<string, string | undefined>
  action?: string
}> = ({ searchPlaceholder = 'Szukaj…', filters = [], values = {}, action }) => (
  <form class="admin-filterbar" method="get" action={action}>
    <input type="search" name="q" value={values.q || ''} placeholder={searchPlaceholder} class="admin-input" />
    {filters.map(filter => (
      <select name={filter.name} class="admin-select">
        {filter.options.map(option => (
          <option value={option.value} selected={(values[filter.name] || '') === option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ))}
    <button class="admin-button is-ghost" type="submit">Filtruj</button>
    {Object.values(values).some(value => value) && action && (
      <a href={action} class="admin-button is-ghost">Wyczyść</a>
    )}
  </form>
)
