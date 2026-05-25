import type { FC } from 'hono/jsx'
import type { JobOfferItem } from './types'

export const JobOffersList: FC<{ items: JobOfferItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Oferty pracy</h2><button type="button" class="admin-button">Dodaj ofertę</button></div>
    <div class="admin-card-list">
      {items.map(item => (
        <article class="admin-list-card">
          {item.photo && <img src={item.photo} alt={item.title} loading="lazy" />}
          <div><strong>{item.title}</strong><p>{item.company}</p><small>{item.salary}</small></div>
        </article>
      ))}
    </div>
  </section>
)
