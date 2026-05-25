import { createR2Handler, generateKey } from './_base'

/**
 * Backupy baz danych
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './backups-db'
 *
 * const key = generateKey('backups/db', 'example.bin')
 * await upload(env.R2_BACKUPS_DB, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_BACKUPS_DB, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_BACKUPS_DB',
  prefix: 'backups/db',
  maxFileSize: 536870912,
  allowedMimeTypes: ['application/octet-stream','application/x-sqlite3'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
