import { createR2Handler, generateKey } from './_base'

/**
 * Migawki strony
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './site-snapshots'
 *
 * const key = generateKey('site/snapshots', 'example.bin')
 * await upload(env.R2_SITE_SNAPSHOTS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_SITE_SNAPSHOTS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_SITE_SNAPSHOTS',
  prefix: 'site/snapshots',
  maxFileSize: 52428800,
  allowedMimeTypes: ['text/html','application/gzip','application/octet-stream'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
