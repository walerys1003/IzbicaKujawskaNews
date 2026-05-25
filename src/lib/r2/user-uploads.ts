import { createR2Handler, generateKey } from './_base'

/**
 * Tymczasowe uploady użytkowników
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './user-uploads'
 *
 * const key = generateKey('uploads/pending', 'example.bin')
 * await upload(env.R2_USER_UPLOADS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_USER_UPLOADS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_USER_UPLOADS',
  prefix: 'uploads/pending',
  maxFileSize: 26214400,
  allowedMimeTypes: ['image/jpeg','image/png','image/webp','application/pdf','text/plain'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
