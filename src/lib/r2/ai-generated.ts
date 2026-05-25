import { createR2Handler, generateKey } from './_base'

/**
 * Cache obrazów AI
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './ai-generated'
 *
 * const key = generateKey('ai/generated', 'example.bin')
 * await upload(env.R2_AI_GENERATED, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_AI_GENERATED, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_AI_GENERATED',
  prefix: 'ai/generated',
  maxFileSize: 20971520,
  allowedMimeTypes: ['image/jpeg','image/png','image/webp','image/avif'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
