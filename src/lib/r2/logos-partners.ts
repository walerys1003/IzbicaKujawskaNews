import { createR2Handler, generateKey } from './_base'

/**
 * Logotypy partnerów
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './logos-partners'
 *
 * const key = generateKey('partners/logos', 'example.bin')
 * await upload(env.R2_LOGOS_PARTNERS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_LOGOS_PARTNERS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_LOGOS_PARTNERS',
  prefix: 'partners/logos',
  maxFileSize: 5242880,
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
