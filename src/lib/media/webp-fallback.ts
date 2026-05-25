import { buildImageResizeUrl } from './image-resize'
import { createImageSrcSet } from './image-variants'

export interface PictureSourceSet {
  webp: string
  fallback: string
  fallbackType: 'image/jpeg' | 'image/png'
  img: string
}

export const createWebpFallback = (sourceUrl: string, fallbackType: 'image/jpeg' | 'image/png' = 'image/jpeg'): PictureSourceSet => ({
  webp: createImageSrcSet(sourceUrl),
  fallback: [320, 480, 640, 800, 1200].map((width) => `${buildImageResizeUrl(sourceUrl, { width, quality: 82, format: fallbackType === 'image/png' ? 'png' : 'jpeg' })} ${width}w`).join(', '),
  fallbackType,
  img: buildImageResizeUrl(sourceUrl, { width: 800, quality: 82, format: 'jpeg' }),
})
