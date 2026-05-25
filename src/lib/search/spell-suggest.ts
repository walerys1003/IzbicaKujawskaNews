export const levenshtein = (a: string, b: string) => {
  const rows = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1
    rows[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = rows[j]
      rows[j] = Math.min(
        rows[j] + 1,
        rows[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = current
    }
  }
  return rows[b.length]
}

export const suggestSpelling = (query: string, dictionary: string[]) => {
  const normalized = query.toLowerCase().trim()
  const ranked = dictionary
    .map((entry) => ({ entry, distance: levenshtein(normalized, entry.toLowerCase()) }))
    .sort((left, right) => left.distance - right.distance)
  return ranked[0]?.distance !== undefined && ranked[0].distance <= 3 ? ranked[0].entry : null
}
