import { Hono } from 'hono'
import type { AppEnv } from '../../types/env'
import { uploadAudio } from '../../lib/media/audio-upload'
import { transcribeAudio } from '../../lib/media/audio-transcribe'

const route = new Hono<AppEnv>()

route.post('/', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.json({ error: 'file_required' }, 400)
  const uploaderId = typeof body.uploaderId === 'string' ? body.uploaderId : 'anonymous'
  const upload = await uploadAudio(c.env, file, uploaderId)
  // Transkrypcja nie jest jeszcze realizowana — patrz naglowek
  // src/lib/media/audio-transcribe.ts. `text` jest wtedy `null`, wiec kolumna
  // `transcript_text` zostaje pusta zamiast przyjac tresc wymyslona z nazwy pliku.
  const transcription = await transcribeAudio(
    c.env,
    file.name,
    typeof body.context === 'string' ? body.context : '',
  )
  const transcript = transcription.text
  const id = crypto.randomUUID()
  const podcastSlug = typeof body.podcastSlug === 'string' ? body.podcastSlug : null
  if (c.env.DB) {
    await c.env.DB.prepare(`INSERT INTO audios (id, asset_key, title, mime, size, duration_seconds, waveform_json, transcript_text, podcast_slug, uploader_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, upload.key, String(body.title || file.name), file.type || 'audio/mpeg', file.size, null, JSON.stringify(upload.waveform), transcript, podcastSlug, uploaderId, new Date().toISOString())
      .run()
  }
  return c.json({
    ok: true,
    id,
    key: upload.key,
    waveform: upload.waveform,
    transcript,
    // Panel musi wiedziec, ze puste pole to brak funkcji, a nie brak mowy
    // w nagraniu — inaczej redaktor czekalby na transkrypcje, ktora nie nadejdzie.
    transcriptStatus: transcription.reason ?? 'gotowa',
    podcastSlug,
  })
})

export default route
