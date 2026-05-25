import type { FC } from 'hono/jsx'

export type FilterOption = { label: string; value: string }

export const FilterBar: FC<{ searchPlaceholder?: string; filters?: Array<{ name: string; options: FilterOption[] }> }> = ({
  searchPlaceholder = 'Szukaj…',
  filters = [],
}) => (
  <form class="admin-filterbar" method="get">
    <input type="search" name="q" placeholder={searchPlaceholder} class="admin-input" />
    {filters.map(filter => (
      <select name={filter.name} class="admin-select">
        {filter.options.map(option => <option value={option.value}>{option.label}</option>)}
      </select>
    ))}
    <button class="admin-button is-ghost" type="submit">Filtruj</button>
  </form>
)
