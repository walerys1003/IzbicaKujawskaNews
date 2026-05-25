export const anonymizeIp = (ip: string): string => {
  if (ip.includes(':')) {
    const chunks = ip.split(':').filter(Boolean)
    return `${chunks.slice(0, 4).join(':')}::`
  }
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  return '0.0.0.0'
}
