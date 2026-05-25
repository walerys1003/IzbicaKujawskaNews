const MONTHS_PL = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']

export const parseFlexibleDate = (value: string | Date): Date => {
  if (value instanceof Date) return value
  const native = new Date(value)
  if (!Number.isNaN(native.getTime())) return native

  const match = String(value).match(/^(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/i)
  if (!match) throw new Error(`invalid_date:${value}`)
  const [, dd, monthName, yyyy, hh = '0', mm = '0'] = match
  const monthIndex = MONTHS_PL.findIndex((month) => month === monthName.toLowerCase())
  if (monthIndex === -1) throw new Error(`invalid_month:${monthName}`)
  return new Date(Date.UTC(Number(yyyy), monthIndex, Number(dd), Number(hh), Number(mm)))
}

export const formatIsoDate = (value: string | Date): string => parseFlexibleDate(value).toISOString().slice(0, 10)

export const formatPolishDate = (value: string | Date): string => {
  const date = parseFlexibleDate(value)
  return `${date.getUTCDate()} ${MONTHS_PL[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export const isFreshWithinHours = (value: string | Date, hours: number, now = new Date()): boolean => {
  const timestamp = parseFlexibleDate(value).getTime()
  return now.getTime() - timestamp <= hours * 60 * 60 * 1000
}
