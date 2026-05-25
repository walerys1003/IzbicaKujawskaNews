import { buildImageResizeUrl, type ImageResizeOptions } from './image-resize'

export type ImageVariantName = 'thumb' | 'small' | 'medium' | 'large' | 'hero'

export interface ImageVariantMap {
  original: string
  thumb: string
  small: string
  medium: string
  large: string
  hero: string
}

const VARIANTS: Record<ImageVariantName, ImageResizeOptions> = {
  thumb: { width: 160, height: 160, fit: 'cover', quality: 75, format: 'webp' },
  small: { width: 480, height: 320, fit: 'cover', quality: 80, format: 'webp' },
  medium: { width: 800, height: 540, fit: 'cover', quality: 82, format: 'webp' },
  large: { width: 1280, height: 720, fit: 'cover', quality: 84, format: 'webp' },
  hero: { width: 1600, height: 900, fit: 'cover', quality: 86, format: 'webp' },
}

export const createImageVariants = (sourceUrl: string): ImageVariantMap => ({
  original: sourceUrl,
  thumb: buildImageResizeUrl(sourceUrl, VARIANTS.thumb),
  small: buildImageResizeUrl(sourceUrl, VARIANTS.small),
  medium: buildImageResizeUrl(sourceUrl, VARIANTS.medium),
  large: buildImageResizeUrl(sourceUrl, VARIANTS.large),
  hero: buildImageResizeUrl(sourceUrl, VARIANTS.hero),
})

export const createImageSrcSet = (sourceUrl: string) => [320, 480, 640, 800, 1200, 1600]
  .map((width) => `${buildImageResizeUrl(sourceUrl, { width, quality: 82, format: 'webp' })} ${width}w`)
  .join(', ')
