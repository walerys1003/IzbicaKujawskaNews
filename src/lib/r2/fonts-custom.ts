import { createR2Handler, generateKey } from './_base'

/**
 * Własne fonty
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './fonts-custom'
 *
 * const key = generateKey('assets/fonts', 'example.bin')
 * await upload(env.R2_FONTS_CUSTOM, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_FONTS_CUSTOM, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_FONTS_CUSTOM',
  prefix: 'assets/fonts',
  maxFileSize: 10485760,
  allowedMimeTypes: ['font/woff2','font/woff','font/ttf','application/font-woff'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
