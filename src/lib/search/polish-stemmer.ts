const suffixes = ['ami', 'ach', 'ego', 'owej', 'owie', 'eniu', 'aniu', 'owie', 'cie', 'em', 'ie', 'y', 'a', 'ę', 'ą', 'u']

export const polishStem = (word: string) => {
  const normalized = word.toLowerCase().trim()
  for (const suffix of suffixes) {
    if (normalized.length > suffix.length + 2 && normalized.endsWith(suffix)) {
      return normalized.slice(0, -suffix.length)
    }
  }
  return normalized
}

export const normalizeSearchTerms = (query: string) =>
  query
    .split(/\s+/)
    .map((token) => polishStem(token))
    .filter(Boolean)
