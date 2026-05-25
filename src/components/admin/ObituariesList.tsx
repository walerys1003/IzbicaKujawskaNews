import type { FC } from 'hono/jsx'
import type { ObituaryItem } from './types'

export const ObituariesList: FC<{ items: ObituaryItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Nekrologi</h2><button type="button" class="admin-button">Nowy nekrolog</button></div>
    <div class="admin-card-list">
      {items.map(item => (
        <article class="admin-list-card">
          {item.photo && <img src={item.photo} alt={item.name} loading="lazy" />}
          <div><strong>{item.name}</strong><p>{item.dates}</p><small>{item.notice}</small></div>
        </article>
      ))}
    </div>
  </section>
)
