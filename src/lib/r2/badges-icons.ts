import { createR2Handler, generateKey } from './_base'

/**
 * Odznaki i ikony
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './badges-icons'
 *
 * const key = generateKey('ui/badges', 'example.bin')
 * await upload(env.R2_BADGES_ICONS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_BADGES_ICONS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_BADGES_ICONS',
  prefix: 'ui/badges',
  maxFileSize: 2097152,
  allowedMimeTypes: ['image/svg+xml','image/png','image/webp'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
