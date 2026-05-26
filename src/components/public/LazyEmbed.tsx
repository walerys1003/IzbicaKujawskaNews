// SA7.2: LazyEmbed — consent-gated GDPR-safe embed for YouTube/Vimeo/Twitter
export type EmbedType = 'youtube' | 'vimeo' | 'twitter' | 'facebook'

export interface LazyEmbedProps {
  type: EmbedType
  id: string
  title?: string
  thumbnail?: string
}

function embedUrl(type: EmbedType, id: string): string {
  switch (type) {
    case 'youtube': return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
    case 'vimeo': return `https://player.vimeo.com/video/${id}?dnt=1`
    case 'twitter': return `https://platform.twitter.com/embed/Tweet.html?id=${id}`
    case 'facebook': return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(id)}&show_text=true`
  }
}

function thumbUrl(type: EmbedType, id: string, fallback?: string): string | undefined {
  if (fallback) return fallback
  if (type === 'youtube') return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  return undefined
}

export const LazyEmbed = ({ type, id, title, thumbnail }: LazyEmbedProps) => {
  const uid = `embed-${type}-${id.replace(/[^a-zA-Z0-9]/g, '_')}`
  const thumb = thumbUrl(type, id, thumbnail)
  const label = title || (type === 'youtube' ? 'YouTube' : type === 'vimeo' ? 'Vimeo' : type === 'twitter' ? 'Twitter/X' : 'Facebook')

  return (
    <div class={`lazy-embed lazy-embed-${type}`} id={uid} style={`
      position: relative; margin: 28px 0; border-radius: 12px; overflow: hidden;
      background: #0d1b2a; min-height: 400px; box-shadow: 0 2px 16px rgba(0,0,0,0.2);
    `}>
      <div class="lazy-embed-bg" style={`
        position: absolute; inset: 0; cursor: pointer;
        ${thumb ? `background: url(${thumb}) center/cover no-repeat;` : ''}
      `}>
        {thumb && <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.45);" />}
      </div>
      <div style="position: relative; z-index: 1; text-align: center; padding: 40px 20px;">
        {(type === 'youtube' || type === 'vimeo') && (
          <div aria-hidden="true" style="width: 68px; height: 68px; border-radius: 50%; background: rgba(200,169,81,0.92); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #0a2540; font-size: 26px;">▶</span>
          </div>
        )}
        <p style="color: #fff; font-size: 15px; font-weight: 700; margin: 0 0 6px;">{label}</p>
        <p style="color: rgba(255,255,255,0.55); font-size: 12px; margin: 0 0 18px;">
          Kliknij aby załadować treść z {type === 'twitter' ? 'Twitter/X' : type === 'facebook' ? 'Facebook' : type === 'youtube' ? 'YouTube' : 'Vimeo'}
        </p>
        <button
          onclick={`document.getElementById('${uid}').innerHTML='<iframe src="${embedUrl(type, id)}" width="100%" height="400" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border:0;display:block;" title="${label}"></iframe>'`}
          style="padding: 10px 28px; background: #c8a951; color: #0a2540; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;"
        >
          Załaduj treść
        </button>
        <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 10px 0 0;">
          Ładując treść akceptujesz politykę prywatności {type === 'youtube' ? 'YouTube' : type === 'vimeo' ? 'Vimeo' : type === 'twitter' ? 'Twitter/X' : 'Facebook'}
        </p>
      </div>
    </div>
  )
}

export const YouTubeEmbed = (p: { id: string; title?: string }) => <LazyEmbed type="youtube" {...p} />
export const VimeoEmbed = (p: { id: string; title?: string }) => <LazyEmbed type="vimeo" {...p} />
export const TwitterEmbed = (p: { id: string }) => <LazyEmbed type="twitter" {...p} />
export const FacebookEmbed = (p: { id: string }) => <LazyEmbed type="facebook" {...p} />
