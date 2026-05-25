import { createR2Handler, generateKey } from './_base'

/**
 * Pliki w kolejce moderacji
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './moderation-queue'
 *
 * const key = generateKey('moderation/queue', 'example.bin')
 * await upload(env.R2_MODERATION_QUEUE, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_MODERATION_QUEUE, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_MODERATION_QUEUE',
  prefix: 'moderation/queue',
  maxFileSize: 10485760,
  allowedMimeTypes: ['image/jpeg','image/png','image/webp','application/pdf','text/plain'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
