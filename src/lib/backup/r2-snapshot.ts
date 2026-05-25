import type { Bindings, R2BucketLike } from '../../types/env'

const BUCKET_KEYS: Array<keyof Bindings> = [
  'R2_ARTICLES_IMAGES','R2_ARTICLES_VIDEOS','R2_USER_AVATARS','R2_OGLOSZENIA_PHOTOS','R2_GALERIE_PHOTOS','R2_PDF_ARCHIVE','R2_PODCAST_AUDIO','R2_VIDEO_THUMBNAILS','R2_BACKUPS_DB','R2_SITE_SNAPSHOTS','R2_LOGOS_PARTNERS','R2_INFOGRAPHICS','R2_BADGES_ICONS','R2_FONTS_CUSTOM','R2_AI_GENERATED','R2_SOCIAL_CARDS','R2_EMAIL_ATTACHMENTS','R2_USER_UPLOADS','R2_MODERATION_QUEUE','R2_EXPORTS_CSV',
]

export const snapshotR2 = async (env: Bindings) => {
  const manifest: Record<string, string[]> = {}
  for (const key of BUCKET_KEYS) {
    const bucket = env[key] as R2BucketLike | undefined
    if (!bucket) continue
    const result = await bucket.list({ limit: 100 })
    manifest[String(key)] = result.objects.map((object) => object.key)
  }
  return { createdAt: new Date().toISOString(), manifest }
}
