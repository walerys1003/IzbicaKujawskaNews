import type { Bindings } from '../../types/env'
import { buildImageResizeUrl } from './image-resize'

export const getVideoThumbnailUrl = (videoKey: string) => `/thumb/${videoKey.replace(/^\/+/, '')}.jpg`

export const generateVideoThumbnail = async (_env: Bindings, videoUrl: string, width = 960) => ({
  source: 'cloudflare-stream-placeholder',
  thumbnailUrl: buildImageResizeUrl(videoUrl, { width, height: 540, fit: 'cover', format: 'jpeg', quality: 82 }),
})
