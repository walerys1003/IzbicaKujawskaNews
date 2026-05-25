export interface DuplicateProbe {
  hash: string
  distance: number
  duplicate: boolean
}

const popCount = (value: number) => value.toString(2).replace(/0/g, '').length

export const createPerceptualHash = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  if (!bytes.length) return '0'.repeat(16)
  const sampleSize = 64
  const sampled = new Uint8Array(sampleSize)
  for (let i = 0; i < sampleSize; i += 1) {
    const index = Math.min(bytes.length - 1, Math.floor((i / sampleSize) * bytes.length))
    sampled[i] = bytes[index]
  }
  const avg = sampled.reduce((sum, value) => sum + value, 0) / sampled.length
  let hash = ''
  for (let i = 0; i < sampled.length; i += 4) {
    let chunk = 0
    for (let bit = 0; bit < 4; bit += 1) chunk = (chunk << 1) | (sampled[i + bit] >= avg ? 1 : 0)
    hash += chunk.toString(16)
  }
  return hash.padEnd(16, '0').slice(0, 16)
}

export const compareHashes = (hashA: string, hashB: string) => {
  const max = Math.min(hashA.length, hashB.length)
  let distance = 0
  for (let i = 0; i < max; i += 1) distance += popCount(parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16))
  return distance
}

export const detectDuplicate = (candidateHash: string, existingHashes: string[], threshold = 8): DuplicateProbe => {
  let closest = Number.POSITIVE_INFINITY
  for (const hash of existingHashes) closest = Math.min(closest, compareHashes(candidateHash, hash))
  return { hash: candidateHash, distance: Number.isFinite(closest) ? closest : 64, duplicate: Number.isFinite(closest) ? closest <= threshold : false }
}
