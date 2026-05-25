import type { FC } from 'hono/jsx'
import type { EventItem } from './types'

export const EventsList: FC<{ items: EventItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Wydarzenia</h2><button type="button" class="admin-button">Dodaj wydarzenie</button></div>
    <div class="admin-card-list compact">
      {items.map(item => (
        <article class="admin-list-card is-compact">
          <div><strong>{item.title}</strong><p>{item.date} · {item.location}</p><small>{item.category}</small></div>
        </article>
      ))}
    </div>
  </section>
)
