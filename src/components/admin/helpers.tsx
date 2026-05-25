import type { Child } from 'hono/jsx'

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export const toneClass = (tone?: string) => tone ? `is-${tone}` : 'is-neutral'

export const iconGlyph = (icon?: string): Child => {
  const map: Record<string, string> = {
    dashboard: '▣',
    article: '✎',
    comment: '💬',
    user: '👤',
    media: '🖼',
    ad: '📢',
    settings: '⚙',
    newsletter: '✉',
    calendar: '🗓',
    ai: '✦',
  }
  return map[icon || ''] || '•'
}
