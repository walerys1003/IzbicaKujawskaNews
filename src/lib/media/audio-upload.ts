import type { Bindings } from '../../types/env'
import { uploadToR2 } from './r2-upload'

export const generateWaveform = (buffer: ArrayBuffer, bars = 48) => {
  const samples = new Int8Array(buffer.slice(0, Math.min(buffer.byteLength, bars * 64)))
  const bucket = Math.max(1, Math.floor(samples.length / bars))
  return Array.from({ length: bars }, (_, index) => {
    const segment = samples.slice(index * bucket, index * bucket + bucket)
    const peak = segment.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
    return Number((peak / 128).toFixed(3))
  })
}

export const uploadAudio = async (env: Bindings, file: File, uploaderId: string) => {
  const bytes = await file.arrayBuffer()
  const waveform = generateWaveform(bytes)
  const upload = await uploadToR2(env, { bucket: 'audio', filename: file.name, contentType: file.type || 'audio/mpeg', body: bytes, customMetadata: { uploaderId } })
  return { key: upload.key, bucket: upload.binding, waveform }
}
