import { createR2Handler, generateKey } from './_base'

/**
 * PDF i dokumenty
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './pdf-archive'
 *
 * const key = generateKey('archive/pdf', 'example.bin')
 * await upload(env.R2_PDF_ARCHIVE, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_PDF_ARCHIVE, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_PDF_ARCHIVE',
  prefix: 'archive/pdf',
  maxFileSize: 52428800,
  allowedMimeTypes: ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
