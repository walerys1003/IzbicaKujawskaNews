export interface ImageMetadata {
  width: number | null
  height: number | null
  mimeType: string
  hasExif: boolean
  strippedBytes: ArrayBuffer
}

const readUint16 = (view: DataView, offset: number, littleEndian = false) => view.getUint16(offset, littleEndian)
const readUint32 = (view: DataView, offset: number, littleEndian = false) => view.getUint32(offset, littleEndian)

const detectPng = (view: DataView) => {
  if (readUint32(view, 0) !== 0x89504e47) return null
  return { width: readUint32(view, 16), height: readUint32(view, 20) }
}

const detectGif = (view: DataView) => {
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2))
  if (sig !== 'GIF') return null
  return { width: readUint16(view, 6, true), height: readUint16(view, 8, true) }
}

const detectWebp = (view: DataView) => {
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
  const webp = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
  if (riff !== 'RIFF' || webp !== 'WEBP') return null
  const chunk = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))
  if (chunk === 'VP8X') {
    const width = 1 + view.getUint8(24) + (view.getUint8(25) << 8) + (view.getUint8(26) << 16)
    const height = 1 + view.getUint8(27) + (view.getUint8(28) << 8) + (view.getUint8(29) << 16)
    return { width, height }
  }
  return null
}

const detectJpeg = (view: DataView) => {
  if (readUint16(view, 0) !== 0xffd8) return null
  let offset = 2
  while (offset < view.byteLength) {
    const marker = readUint16(view, offset)
    offset += 2
    if (marker === 0xffc0 || marker === 0xffc2) {
      offset += 3
      const height = readUint16(view, offset)
      const width = readUint16(view, offset + 2)
      return { width, height }
    }
    const size = readUint16(view, offset)
    if (!size) break
    offset += size
  }
  return null
}

export const stripExif = async (buffer: ArrayBuffer, mimeType: string) => {
  if (!mimeType.includes('jpeg')) return buffer
  const input = new Uint8Array(buffer)
  const output: number[] = []
  output.push(input[0], input[1])
  let offset = 2
  while (offset < input.length) {
    if (input[offset] !== 0xff) break
    const marker = (input[offset] << 8) | input[offset + 1]
    if (marker === 0xffe1) {
      const size = (input[offset + 2] << 8) | input[offset + 3]
      offset += size + 2
      continue
    }
    const size = (input[offset + 2] << 8) | input[offset + 3]
    output.push(input[offset], input[offset + 1], input[offset + 2], input[offset + 3])
    for (let i = offset + 4; i < offset + size + 2; i += 1) output.push(input[i])
    offset += size + 2
  }
  return new Uint8Array(output).buffer
}

export const detectImageDimensions = (buffer: ArrayBuffer, mimeType: string) => {
  const view = new DataView(buffer)
  return detectPng(view) || detectGif(view) || detectWebp(view) || detectJpeg(view) || { width: null, height: null, mimeType }
}

export const extractImageMetadata = async (buffer: ArrayBuffer, mimeType: string): Promise<ImageMetadata> => {
  const strippedBytes = await stripExif(buffer, mimeType)
  const dimensions = detectImageDimensions(strippedBytes, mimeType)
  const hasExif = strippedBytes.byteLength !== buffer.byteLength
  return { width: dimensions.width ?? null, height: dimensions.height ?? null, mimeType, hasExif, strippedBytes }
}
