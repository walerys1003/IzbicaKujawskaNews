export interface VideoTranscodeJob {
  provider: 'n8n'
  status: 'queued'
  pipeline: 'hls-dash'
  manifestUrl: string
  callbackPath: string
}

export const orchestrateVideoTranscode = async (videoKey: string): Promise<VideoTranscodeJob> => ({
  provider: 'n8n',
  status: 'queued',
  pipeline: 'hls-dash',
  manifestUrl: `/api/v1/videos/stream/${encodeURIComponent(videoKey)}/manifest.m3u8`,
  callbackPath: '/api/v1/videos/transcode/callback',
})
