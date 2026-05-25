const DIACRITICS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
}

export const stripDiacritics = (value: string): string =>
  value.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => DIACRITICS[char] ?? char)

export const slugify = (value: string): string =>
  stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' i ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

export default slugify
