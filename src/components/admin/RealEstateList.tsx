import type { FC } from 'hono/jsx'
import type { RealEstateItem } from './types'

export const RealEstateList: FC<{ items: RealEstateItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Nieruchomości</h2><button type="button" class="admin-button">Dodaj nieruchomość</button></div>
    <div class="admin-card-list">
      {items.map(item => (
        <article class="admin-list-card">
          {item.photo && <img src={item.photo} alt={item.title} loading="lazy" />}
          <div><strong>{item.title}</strong><p>Cena ofertowa</p><small>{item.price}</small></div>
        </article>
      ))}
    </div>
  </section>
)
