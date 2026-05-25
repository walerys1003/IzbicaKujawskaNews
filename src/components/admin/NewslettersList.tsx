import type { FC } from 'hono/jsx'
import type { NewsletterItem } from './types'

export const NewslettersList: FC<{ items: NewsletterItem[] }> = ({ items }) => (
  <section class="admin-panel">
    <div class="admin-panel-head"><h2>Newslettery</h2><button type="button" class="admin-button">Nowa kampania</button></div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Temat</th><th>Odbiorcy</th><th>Plan</th><th>Status</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr>
              <td>{item.subject}</td>
              <td>{item.audience}</td>
              <td>{item.scheduledAt}</td>
              <td><span class={`admin-badge is-${item.status}`}>{item.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)
