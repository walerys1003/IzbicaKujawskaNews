export const scrubPII = (text: string): string =>
  text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b\+?\d[\d\s-]{7,}\d\b/g, '[phone]')
    .replace(/\b\d{2,3}[ -]?\d{3}[ -]?\d{3}\b/g, '[phone]')
    .replace(/\b\d{11}\b/g, '[pesel]')

export const containsPII = (text: string): boolean => scrubPII(text) !== text
