export interface ImageResizeOptions {
  width?: number
  height?: number
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  quality?: number
  format?: 'webp' | 'avif' | 'json' | 'jpeg' | 'png'
  sharpen?: number
  gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'face'
}

export const buildImageResizeParams = (options: ImageResizeOptions = {}) => {
  const params = new URLSearchParams()
  if (options.width) params.set('width', String(options.width))
  if (options.height) params.set('height', String(options.height))
  if (options.fit) params.set('fit', options.fit)
  if (options.quality) params.set('quality', String(options.quality))
  if (options.format) params.set('format', options.format)
  if (typeof options.sharpen === 'number') params.set('sharpen', String(options.sharpen))
  if (options.gravity) params.set('gravity', options.gravity)
  return params.toString()
}

export const buildImageResizeUrl = (sourceUrl: string, options: ImageResizeOptions = {}) => {
  const normalized = sourceUrl.startsWith('http') ? sourceUrl : `${sourceUrl.startsWith('/') ? '' : '/'}${sourceUrl}`
  const params = buildImageResizeParams(options)
  return params ? `/cdn-cgi/image/${params}${normalized}` : normalized
}
