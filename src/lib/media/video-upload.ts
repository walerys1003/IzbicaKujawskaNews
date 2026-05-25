import type { Bindings } from '../../types/env'
import { uploadToR2 } from './r2-upload'

export interface ChunkedUploadPart {
  partNumber: number
  key: string
  size: number
}

export const uploadVideoChunk = async (env: Bindings, file: File, uploadId: string, partNumber: number) => {
  const key = `media/videos/chunks/${uploadId}/part-${String(partNumber).padStart(5, '0')}-${file.name}`
  await uploadToR2(env, { bucket: 'videos', key, filename: file.name, contentType: file.type || 'video/mp4', body: await file.arrayBuffer(), customMetadata: { uploadId, partNumber: String(partNumber) } })
  return { partNumber, key, size: file.size } satisfies ChunkedUploadPart
}

export const finalizeChunkedVideoUpload = async (env: Bindings, filename: string, contentType: string, chunks: ChunkedUploadPart[]) => {
  const manifest = JSON.stringify({ filename, contentType, chunks, finalizedAt: new Date().toISOString() }, null, 2)
  const upload = await uploadToR2(env, { bucket: 'videos', filename: `${filename}.manifest.json`, contentType: 'application/json', body: manifest, customMetadata: { kind: 'video-manifest' } })
  return { uploadId: crypto.randomUUID(), manifestKey: upload.key, chunkCount: chunks.length }
}
