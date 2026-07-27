/**
 * Rozpoznawanie typu pliku po zawartosci, nie po naglowku Content-Type.
 *
 * Powod: Content-Type w multipart pochodzi od przegladarki, ktora bierze go
 * z rozszerzenia nazwy pliku. Zmiana `wirus.exe` na `zdjecie.jpg` wystarcza,
 * zeby przeslac dowolna zawartosc jako obraz. Sygnatura bajtowa jest jedynym
 * zrodlem, ktorego nadawca nie kontroluje bez faktycznej zmiany danych.
 *
 * Brak `file(1)` w Workers — tabela sygnatur jest wpisana recznie.
 */

export type MediaKind = 'image' | 'video' | 'audio' | 'document'

export interface SniffResult {
  mime: string
  kind: MediaKind
  extension: string
  /** true, gdy sygnatura zgadza sie z deklaracja nadawcy */
  declaredMatches: boolean
  declared: string
}

interface Signature {
  mime: string
  kind: MediaKind
  extension: string
  offset: number
  bytes: number[]
  /** dodatkowy warunek — np. WEBP wymaga 'WEBP' na offsecie 8 */
  also?: { offset: number; bytes: number[] }
}

const ascii = (text: string) => Array.from(text).map((ch) => ch.charCodeAt(0))

const SIGNATURES: Signature[] = [
  // --- obrazy
  { mime: 'image/jpeg', kind: 'image', extension: 'jpg', offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', kind: 'image', extension: 'png', offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', kind: 'image', extension: 'gif', offset: 0, bytes: ascii('GIF87a') },
  { mime: 'image/gif', kind: 'image', extension: 'gif', offset: 0, bytes: ascii('GIF89a') },
  { mime: 'image/webp', kind: 'image', extension: 'webp', offset: 0, bytes: ascii('RIFF'), also: { offset: 8, bytes: ascii('WEBP') } },
  { mime: 'image/avif', kind: 'image', extension: 'avif', offset: 4, bytes: ascii('ftypavif') },
  { mime: 'image/avif', kind: 'image', extension: 'avif', offset: 4, bytes: ascii('ftypavis') },
  { mime: 'image/heic', kind: 'image', extension: 'heic', offset: 4, bytes: ascii('ftypheic') },
  { mime: 'image/heic', kind: 'image', extension: 'heic', offset: 4, bytes: ascii('ftypmif1') },
  { mime: 'image/bmp', kind: 'image', extension: 'bmp', offset: 0, bytes: ascii('BM') },
  { mime: 'image/tiff', kind: 'image', extension: 'tif', offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] },
  { mime: 'image/tiff', kind: 'image', extension: 'tif', offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a] },
  { mime: 'image/x-icon', kind: 'image', extension: 'ico', offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] },

  // --- wideo
  { mime: 'video/mp4', kind: 'video', extension: 'mp4', offset: 4, bytes: ascii('ftypisom') },
  { mime: 'video/mp4', kind: 'video', extension: 'mp4', offset: 4, bytes: ascii('ftypmp42') },
  { mime: 'video/mp4', kind: 'video', extension: 'mp4', offset: 4, bytes: ascii('ftypMSNV') },
  { mime: 'video/mp4', kind: 'video', extension: 'mp4', offset: 4, bytes: ascii('ftypM4V') },
  { mime: 'video/quicktime', kind: 'video', extension: 'mov', offset: 4, bytes: ascii('ftypqt') },
  { mime: 'video/webm', kind: 'video', extension: 'webm', offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { mime: 'video/x-msvideo', kind: 'video', extension: 'avi', offset: 0, bytes: ascii('RIFF'), also: { offset: 8, bytes: ascii('AVI ') } },
  { mime: 'video/mpeg', kind: 'video', extension: 'mpg', offset: 0, bytes: [0x00, 0x00, 0x01, 0xba] },

  // --- audio
  { mime: 'audio/mpeg', kind: 'audio', extension: 'mp3', offset: 0, bytes: ascii('ID3') },
  { mime: 'audio/mpeg', kind: 'audio', extension: 'mp3', offset: 0, bytes: [0xff, 0xfb] },
  { mime: 'audio/mpeg', kind: 'audio', extension: 'mp3', offset: 0, bytes: [0xff, 0xf3] },
  { mime: 'audio/mpeg', kind: 'audio', extension: 'mp3', offset: 0, bytes: [0xff, 0xf2] },
  { mime: 'audio/wav', kind: 'audio', extension: 'wav', offset: 0, bytes: ascii('RIFF'), also: { offset: 8, bytes: ascii('WAVE') } },
  { mime: 'audio/ogg', kind: 'audio', extension: 'ogg', offset: 0, bytes: ascii('OggS') },
  { mime: 'audio/flac', kind: 'audio', extension: 'flac', offset: 0, bytes: ascii('fLaC') },
  { mime: 'audio/mp4', kind: 'audio', extension: 'm4a', offset: 4, bytes: ascii('ftypM4A') },

  // --- dokumenty
  { mime: 'application/pdf', kind: 'document', extension: 'pdf', offset: 0, bytes: ascii('%PDF-') },
]

/**
 * Sygnatury odrzucane bezwarunkowo. Plik wykonywalny przeslany jako "zdjecie"
 * i podany pod publicznym adresem R2 to gotowy kanal dystrybucji zlosliwego
 * kodu z zaufanej domeny.
 */
const FORBIDDEN: Array<{ label: string; offset: number; bytes: number[] }> = [
  { label: 'windows_executable', offset: 0, bytes: ascii('MZ') },
  { label: 'elf_executable', offset: 0, bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { label: 'macho_executable', offset: 0, bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { label: 'macho_executable', offset: 0, bytes: [0xce, 0xfa, 0xed, 0xfe] },
  { label: 'java_class', offset: 0, bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { label: 'shell_script', offset: 0, bytes: ascii('#!') },
  { label: 'zip_archive', offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] },
  { label: 'rar_archive', offset: 0, bytes: ascii('Rar!') },
  { label: 'sevenzip_archive', offset: 0, bytes: [0x37, 0x7a, 0xbc, 0xaf] },
]

const matches = (view: Uint8Array, offset: number, bytes: number[]) => {
  if (offset + bytes.length > view.length) return false
  for (let i = 0; i < bytes.length; i += 1) {
    if (view[offset + i] !== bytes[i]) return false
  }
  return true
}

/**
 * SVG nie ma sygnatury binarnej — to tekst. Wymaga osobnej sciezki, a przy tym
 * jest wektorem XSS (`<script>` wewnatrz SVG wykonuje sie, gdy plik zostanie
 * otwarty bezposrednio). Dopuszczamy tylko SVG bez skryptow i zdarzen.
 */
const sniffSvg = (bytes: ArrayBuffer): { ok: boolean; reason?: string } | null => {
  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 4096)).trim()
  if (!/^(<\?xml|<!DOCTYPE svg|<svg)/i.test(head)) return null
  const whole = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  if (/<script[\s>]/i.test(whole)) return { ok: false, reason: 'svg_contains_script' }
  if (/\son\w+\s*=/i.test(whole)) return { ok: false, reason: 'svg_contains_event_handler' }
  if (/<foreignObject[\s>]/i.test(whole)) return { ok: false, reason: 'svg_contains_foreign_object' }
  if (/javascript:/i.test(whole)) return { ok: false, reason: 'svg_contains_javascript_url' }
  return { ok: true }
}

export class MediaRejected extends Error {
  constructor(public readonly code: string, public readonly detail?: string) {
    super(code)
    this.name = 'MediaRejected'
  }
}

export const sniffMime = (bytes: ArrayBuffer, declared = ''): SniffResult => {
  const view = new Uint8Array(bytes.slice(0, 64))
  const normalizedDeclared = declared.split(';')[0].trim().toLowerCase()

  for (const rule of FORBIDDEN) {
    if (matches(view, rule.offset, rule.bytes)) {
      throw new MediaRejected('forbidden_file_type', rule.label)
    }
  }

  for (const sig of SIGNATURES) {
    if (!matches(view, sig.offset, sig.bytes)) continue
    if (sig.also && !matches(new Uint8Array(bytes.slice(0, 32)), sig.also.offset, sig.also.bytes)) continue
    return {
      mime: sig.mime,
      kind: sig.kind,
      extension: sig.extension,
      declared: normalizedDeclared,
      declaredMatches: normalizedDeclared === sig.mime,
    }
  }

  const svg = sniffSvg(bytes)
  if (svg) {
    if (!svg.ok) throw new MediaRejected('unsafe_svg', svg.reason)
    return { mime: 'image/svg+xml', kind: 'image', extension: 'svg', declared: normalizedDeclared, declaredMatches: normalizedDeclared === 'image/svg+xml' }
  }

  throw new MediaRejected('unrecognized_file_type', normalizedDeclared || 'brak')
}

/** Limity rozmiaru per rodzaj. Powyzej — sciezka wieloczesciowa. */
export const SIZE_LIMITS: Record<MediaKind, number> = {
  image: 25 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
  audio: 500 * 1024 * 1024,
  document: 50 * 1024 * 1024,
}

/** Powyzej tego progu pojedyncze zadanie nie przejdzie — trzeba czesci. */
export const SINGLE_REQUEST_LIMIT = 100 * 1024 * 1024

export const assertSizeAllowed = (kind: MediaKind, size: number) => {
  const limit = SIZE_LIMITS[kind]
  if (size > limit) {
    throw new MediaRejected('file_too_large', `${kind}: ${size} > ${limit}`)
  }
}

/** SHA-256 bajtow — identycznosc tresci, podstawa dedupe. */
export const contentHash = async (bytes: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
