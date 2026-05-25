const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const highlightSnippet = (text: string, query: string, radius = 50) => {
  const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanQuery = query.trim()
  if (!cleanText || !cleanQuery) return cleanText.slice(0, radius * 2)

  const matcher = new RegExp(escapeRegExp(cleanQuery), 'i')
  const match = matcher.exec(cleanText)
  if (!match) return cleanText.slice(0, radius * 2)

  const start = Math.max(0, match.index - radius)
  const end = Math.min(cleanText.length, match.index + match[0].length + radius)
  const snippet = cleanText.slice(start, end)
  return snippet.replace(new RegExp(escapeRegExp(match[0]), 'ig'), (value) => `<mark>${value}</mark>`)
}
