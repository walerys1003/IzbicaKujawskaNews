import { createR2Handler, generateKey } from './_base'

/**
 * Infografiki redakcyjne
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './infographics'
 *
 * const key = generateKey('media/infographics', 'example.bin')
 * await upload(env.R2_INFOGRAPHICS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_INFOGRAPHICS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_INFOGRAPHICS',
  prefix: 'media/infographics',
  maxFileSize: 10485760,
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
