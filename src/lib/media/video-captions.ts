import type { Bindings } from '../../types/env'
import { uploadToR2 } from './r2-upload'

export const uploadCaptions = async (env: Bindings, filename: string, content: string, format: 'vtt' | 'srt' = 'vtt') => {
  const upload = await uploadToR2(env, {
    bucket: 'videos',
    filename: `${filename}.${format}`,
    contentType: format === 'vtt' ? 'text/vtt' : 'application/x-subrip',
    body: content,
    customMetadata: { captionsFormat: format },
  })
  return { key: upload.key, url: `/r2/${upload.binding}/${upload.key}` }
}
