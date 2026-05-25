import type { FC } from 'hono/jsx'
import { toneClass } from './helpers'
import type { DashboardStat } from './types'

export const DashboardCards: FC<{ stats: DashboardStat[] }> = ({ stats }) => (
  <section class="admin-stats-grid">
    {stats.map(stat => (
      <article class={`admin-stat-card ${toneClass(stat.tone)}`}>
        <span class="admin-stat-label">{stat.label}</span>
        <strong class="admin-stat-value">{stat.value}</strong>
        {stat.delta && <span class="admin-stat-delta">{stat.delta}</span>}
      </article>
    ))}
  </section>
)
