import { createR2Handler, generateKey } from './_base'

/**
 * Załączniki newslettera
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './email-attachments'
 *
 * const key = generateKey('email/attachments', 'example.bin')
 * await upload(env.R2_EMAIL_ATTACHMENTS, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_EMAIL_ATTACHMENTS, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_EMAIL_ATTACHMENTS',
  prefix: 'email/attachments',
  maxFileSize: 10485760,
  allowedMimeTypes: ['application/pdf','image/jpeg','image/png','application/zip','text/csv'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
