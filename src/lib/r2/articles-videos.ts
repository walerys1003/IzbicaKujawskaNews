import { createR2Handler, generateKey } from './_base'

/**
 * Wideo do artykułów
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './articles-videos'
 *
 * const key = generateKey('articles/videos', 'example.bin')
 * await upload(env.R2_ARTICLES_VIDEOS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_ARTICLES_VIDEOS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_ARTICLES_VIDEOS',
  prefix: 'articles/videos',
  maxFileSize: 2147483648,
  allowedMimeTypes: ['video/mp4','video/webm','video/quicktime'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
