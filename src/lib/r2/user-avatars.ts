import { createR2Handler, generateKey } from './_base'

/**
 * Avatary użytkowników
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './user-avatars'
 *
 * const key = generateKey('users/avatars', 'example.bin')
 * await upload(env.R2_USER_AVATARS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_USER_AVATARS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_USER_AVATARS',
  prefix: 'users/avatars',
  maxFileSize: 3145728,
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
