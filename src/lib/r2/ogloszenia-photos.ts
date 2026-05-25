import { createR2Handler, generateKey } from './_base'

/**
 * Zdjęcia ogłoszeń
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './ogloszenia-photos'
 *
 * const key = generateKey('ogloszenia/photos', 'example.bin')
 * await upload(env.R2_OGLOSZENIA_PHOTOS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_OGLOSZENIA_PHOTOS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_OGLOSZENIA_PHOTOS',
  prefix: 'ogloszenia/photos',
  maxFileSize: 10485760,
  allowedMimeTypes: ['image/jpeg','image/png','image/webp'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
