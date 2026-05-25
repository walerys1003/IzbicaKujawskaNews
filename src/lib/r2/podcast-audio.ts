import { createR2Handler, generateKey } from './_base'

/**
 * Audio podcastów
 *
 * Example:
 * ```ts
 * import { upload, get, getSignedUrl } from './podcast-audio'
 *
 * const key = generateKey('podcast/audio', 'example.bin')
 * await upload(env.R2_PODCAST_AUDIO, key, file, { contentType: 'application/octet-stream', filename: 'example.bin' })
 * const object = await get(env.R2_PODCAST_AUDIO, key)
 * const signedUrl = await getSignedUrl(key, 3600, env.JWT_SECRET)
 * ```
 */
export const handler = createR2Handler({
  binding: 'R2_PODCAST_AUDIO',
  prefix: 'podcast/audio',
  maxFileSize: 314572800,
  allowedMimeTypes: ['audio/mpeg','audio/mp4','audio/x-m4a'],
  defaultCacheControl: 'public, max-age=3600',
})

export const upload = handler.upload
export const get = handler.get
const removeObject = handler.delete
export { removeObject as delete }
export const list = handler.list
export const getSignedUrl = handler.getSignedUrl
export { generateKey }
