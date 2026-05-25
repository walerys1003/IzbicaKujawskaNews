import { createR2Handler, generateKey } from './_base'

/**
 * Galerie zdjęć
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './galerie-photos'
 *
 * const key = generateKey('galerie/photos', 'example.bin')
 * await upload(env.R2_GALERIE_PHOTOS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_GALERIE_PHOTOS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_GALERIE_PHOTOS',
  prefix: 'galerie/photos',
  maxFileSize: 15728640,
  allowedMimeTypes: ['image/jpeg','image/png','image/webp','image/avif'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
