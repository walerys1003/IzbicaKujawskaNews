import { createR2Handler, generateKey } from './_base'

/**
 * Eksporty CSV/XLSX
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './exports-csv'
 *
 * const key = generateKey('exports/csv', 'example.bin')
 * await upload(env.R2_EXPORTS_CSV, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_EXPORTS_CSV, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_EXPORTS_CSV',
  prefix: 'exports/csv',
  maxFileSize: 52428800,
  allowedMimeTypes: ['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/json'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
