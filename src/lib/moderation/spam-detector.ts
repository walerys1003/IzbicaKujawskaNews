export interface SpamDetectionResult {
  score: number
  reasons: string[]
  isSpam: boolean
}

const SPAM_PATTERNS = [
  /https?:\/\//gi,
  /(?:zarabiaj|pożyczka|krypto|casino|viagra)/gi,
  /(.)\1{6,}/g,
]

export const detectSpam = (text: string): SpamDetectionResult => {
  const reasons: string[] = []
  let score = 0
  const normalized = text.trim()

  for (const pattern of SPAM_PATTERNS) {
    const matches = normalized.match(pattern)
    if (matches?.length) {
      score += matches.length * 2
      reasons.push(`pattern:${pattern.source}`)
    }
  }

  if ((normalized.match(/!/g) || []).length >= 4) {
    score += 2
    reasons.push('too_many_exclamations')
  }

  if (normalized.split(/\s+/).length <= 2 && normalized.length > 25) {
    score += 3
    reasons.push('compressed_keyword_blast')
  }

  return { score, reasons, isSpam: score >= 4 }
}
