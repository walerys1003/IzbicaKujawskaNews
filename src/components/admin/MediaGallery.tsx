import type { FC } from 'hono/jsx'
import type { MediaItem } from './types'

export const MediaGallery: FC<{ items: MediaItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Biblioteka mediów</h2></div>
    <div class="admin-media-grid">
      {items.map(item => (
        <article class="admin-media-card">
          <div class="admin-media-thumb"><img src={item.url} alt={item.title} loading="lazy" /></div>
          <strong>{item.title}</strong>
          <span>{item.type} · {item.size}</span>
        </article>
      ))}
    </div>
  </section>
)
